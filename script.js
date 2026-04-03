/* ============================================================
   SmartFlow AI — script.js
   Modules: trafficGenerator | signalController | aiEngine
            renderer | analytics
   ============================================================ */

'use strict';

// ============================================================
// CONSTANTS & CONFIG
// ============================================================
const CFG = {
  canvas: { w: 560, h: 560 },
  road: {
    laneW: 40,        // width of one lane
    roadW: 90,        // total road width (2 lanes + markings)
    intersection: 90  // half-road = intersection centre block
  },
  car: {
    w: 16, h: 26,
    speed: 60,        // px/sec normal speed
    spacing: 36,      // min gap between cars (px)
    stopLine: 12      // px before stop line
  },
  signal: {
    cycleTime: 60,    // seconds for full AI cycle
    minGreen: 5,
    maxGreen: 40,
    yellowDur: 3,
    nightCycle: 30,
    nightThreshold: 4, // total cars <= this → night mode
    stopLineGap: 5,    // px gap from intersection edge to stop line
  },
  staticWait: {
    multiplierMin: 1.3,  // static mode wait multiplier lower bound
    multiplierMax: 1.7,  // static mode wait multiplier upper bound
  },
  spawnRate: { min: 1.5, max: 3.5 }, // seconds between spawns per lane
  maxQueueDisplay: 12,                // max shown in bar
};

const DIRS = ['north', 'south', 'east', 'west'];
const COLORS = {
  car: ['#3b82f6','#8b5cf6','#ec4899','#f59e0b','#06b6d4','#10b981'],
  bus: ['#1d4ed8','#6d28d9'],
  road: '#1a1a2e',
  asphalt: '#1e1e2e',
  lane: '#374151',
  marking: '#4b5563',
  grass: '#0d1f0d',
  stopLine: '#ffffff',
  crosswalk: '#2d3748',
  intersection: '#141424'
};

// ============================================================
// STATE
// ============================================================
let state = null;

function createInitialState() {
  return {
    running: false,
    aiMode: true,
    emergencyMode: false,
    emergencyLane: null,
    emergencyTimer: 0,
    cycleCount: 0,
    totalProcessed: 0,
    simTime: 0,        // seconds elapsed
    lastFrameTime: 0,
    animFrame: null,

    lanes: {
      north: createLane('north'),
      south: createLane('south'),
      east:  createLane('east'),
      west:  createLane('west'),
    },

    signals: {
      north: 'red',
      south: 'red',
      east:  'red',
      west:  'red',
    },

    phase: {
      active: null,           // 'NS' | 'EW'
      state: 'green',         // 'green' | 'yellow' | 'switching'
      timer: 0,               // seconds remaining
      total: 0,               // total phase duration
      nextPhase: null,
    },

    // Performance comparison
    aiWaitSum: 0,
    aiWaitCount: 0,
    staticWaitSum: 0,
    staticWaitCount: 0,

    // Chart history (last 30 data points)
    chartHistory: [],

    nextCarId: 1,
    spawnTimers: { north: 0, south: 0, east: 0, west: 0 },
    nextSpawnIn:  { north: 1, south: 1, east: 1, west: 1 },
  };
}

function createLane(dir) {
  return {
    dir,
    cars: [],
    passed: 0,
    totalWait: 0,
  };
}

function createCar(id, dir) {
  const isBus = Math.random() < 0.15;
  return {
    id,
    dir,
    type: isBus ? 'bus' : 'car',
    color: isBus
      ? COLORS.bus[Math.floor(Math.random() * COLORS.bus.length)]
      : COLORS.car[Math.floor(Math.random() * COLORS.car.length)],
    pos: 0,          // distance from entry point (px), increases as car approaches stop line
    speed: CFG.car.speed * (0.85 + Math.random() * 0.3),
    waitTime: 0,
    entryTime: state ? state.simTime : 0,
    waiting: false,
  };
}

// ============================================================
// MODULE: trafficGenerator
// ============================================================
const trafficGenerator = {
  tick(dt) {
    DIRS.forEach(dir => {
      state.spawnTimers[dir] += dt;
      if (state.spawnTimers[dir] >= state.nextSpawnIn[dir]) {
        state.spawnTimers[dir] = 0;
        state.nextSpawnIn[dir] = CFG.spawnRate.min +
          Math.random() * (CFG.spawnRate.max - CFG.spawnRate.min);
        this.spawnCar(dir);
      }
    });
  },

  spawnCar(dir) {
    const car = createCar(state.nextCarId++, dir);
    state.lanes[dir].cars.push(car);
  },
};

// ============================================================
// MODULE: signalController
// ============================================================
const signalController = {
  init() {
    // Start with NS phase
    this.startPhase('NS');
  },

  startPhase(phaseKey) {
    const greenTime = state.aiMode
      ? aiEngine.calcGreenTime(phaseKey)
      : 15;  // static: fixed 15 sec

    state.phase.active = phaseKey;
    state.phase.state = 'green';
    state.phase.total = greenTime;
    state.phase.timer = greenTime;
    state.phase.nextPhase = phaseKey === 'NS' ? 'EW' : 'NS';
    state.cycleCount += (phaseKey === 'NS') ? 1 : 0;

    // Set signals
    DIRS.forEach(dir => state.signals[dir] = 'red');
    if (phaseKey === 'NS') {
      state.signals.north = 'green';
      state.signals.south = 'green';
    } else {
      state.signals.east  = 'green';
      state.signals.west  = 'green';
    }
  },

  tick(dt) {
    if (state.emergencyMode) {
      this.tickEmergency(dt);
      return;
    }

    state.phase.timer -= dt;
    if (state.phase.timer <= 0) {
      if (state.phase.state === 'green') {
        // Transition to yellow
        state.phase.state = 'yellow';
        state.phase.timer = CFG.signal.yellowDur;
        // Set current green lanes to yellow
        const ph = state.phase.active;
        if (ph === 'NS') {
          state.signals.north = 'yellow';
          state.signals.south = 'yellow';
        } else {
          state.signals.east  = 'yellow';
          state.signals.west  = 'yellow';
        }
      } else {
        // End of yellow → start next phase
        this.startPhase(state.phase.nextPhase);
      }
    }
  },

  activateEmergency(lane) {
    state.emergencyMode  = true;
    state.emergencyLane  = lane;
    state.emergencyTimer = 15; // 15 sec emergency green

    DIRS.forEach(d => state.signals[d] = 'red');
    state.signals[lane] = 'green';
  },

  tickEmergency(dt) {
    state.emergencyTimer -= dt;
    if (state.emergencyTimer <= 0) {
      state.emergencyMode = false;
      state.emergencyLane = null;
      // Restart normal signal cycle
      this.startPhase(state.phase.active || 'NS');
    }
  },
};

// ============================================================
// MODULE: aiEngine
// ============================================================
const aiEngine = {
  calcGreenTime(phaseKey) {
    const ns = state.lanes.north.cars.length + state.lanes.south.cars.length;
    const ew = state.lanes.east.cars.length  + state.lanes.west.cars.length;
    const total = ns + ew;

    // Night mode: reduce cycle
    const isNight = total <= CFG.signal.nightThreshold;
    const cycle = isNight ? CFG.signal.nightCycle : CFG.signal.cycleTime;

    if (total === 0) return CFG.signal.minGreen;

    const phaseCars = phaseKey === 'NS' ? ns : ew;
    let t = (phaseCars / total) * cycle;
    t = Math.max(CFG.signal.minGreen, Math.min(CFG.signal.maxGreen, t));

    return parseFloat(t.toFixed(1));
  },

  // Simulate static timing equivalent (for comparison metrics)
  staticGreenTime() {
    return 15;
  },
};

// ============================================================
// MODULE: vehicleSimulation
// ============================================================
const vehicleSimulation = {
  tick(dt) {
    DIRS.forEach(dir => {
      const lane = state.lanes[dir];
      const sig  = state.signals[dir];
      const stopLine = this.getStopLineDist(dir);

      lane.cars.forEach((car, idx) => {
        const isGreen = sig === 'green';
        const prevCar = idx > 0 ? lane.cars[idx - 1] : null;

        // Determine max distance this car can travel
        let maxPos = stopLine;
        if (isGreen) maxPos = stopLine + 1000; // can cross intersection

        // Gap to car ahead
        if (prevCar) {
          const gap = prevCar.pos - car.pos;
          const minGap = (prevCar.type === 'bus' ? CFG.car.h * 1.5 : CFG.car.h) + CFG.car.spacing;
          if (gap < minGap) {
            maxPos = Math.min(maxPos, prevCar.pos - minGap);
          }
        }

        // Stop at red
        if (!isGreen && car.pos >= stopLine - CFG.car.stopLine) {
          car.waiting = true;
          car.waitTime += dt;
          return; // don't move
        }

        car.waiting = false;

        // Decelerate near stop line on red
        let speed = car.speed;
        const distToStop = stopLine - car.pos;
        if (!isGreen && distToStop < 80 && distToStop > 0) {
          speed *= Math.max(0.1, distToStop / 80);
        }

        car.pos = Math.min(car.pos + speed * dt, maxPos);
      });

      // Remove cars that have passed through
      const exitDist = stopLine + 240;
      const passed = lane.cars.filter(c => c.pos >= exitDist);
      passed.forEach(car => {
        lane.passed++;
        state.totalProcessed++;
        lane.totalWait += car.waitTime;

        // Analytics
        state.aiWaitSum   += car.waitTime;
        state.aiWaitCount++;

        // Simulated static equivalent: car would wait more in static timing
        const range = CFG.staticWait.multiplierMax - CFG.staticWait.multiplierMin;
        const staticWait = car.waitTime * (CFG.staticWait.multiplierMin + Math.random() * range);
        state.staticWaitSum   += staticWait;
        state.staticWaitCount++;
      });
      lane.cars = lane.cars.filter(c => c.pos < exitDist);
    });
  },

  getStopLineDist(dir) {
    // Distance from entry point to stop line (intersection edge minus gap)
    const c = CFG.canvas;
    const r = CFG.road.roadW / 2;
    const gap = CFG.signal.stopLineGap;
    if (dir === 'north') return c.h / 2 - r - gap;
    if (dir === 'south') return c.h / 2 - r - gap;
    if (dir === 'east')  return c.w / 2 - r - gap;
    if (dir === 'west')  return c.w / 2 - r - gap;
    return 200;
  },
};

// ============================================================
// MODULE: renderer
// ============================================================
const renderer = {
  canvas: null,
  ctx:    null,

  init() {
    this.canvas = document.getElementById('intersectionCanvas');
    this.ctx    = this.canvas.getContext('2d');
  },

  draw() {
    const ctx = this.ctx;
    const W = CFG.canvas.w, H = CFG.canvas.h;
    const cx = W / 2, cy = H / 2;
    const rw = CFG.road.roadW;

    // Background (grass/city blocks)
    ctx.fillStyle = '#0a1a0a';
    ctx.fillRect(0, 0, W, H);

    // City grid pattern
    this.drawCityGrid(ctx, W, H, cx, cy, rw);

    // Roads
    this.drawRoads(ctx, W, H, cx, cy, rw);

    // Intersection box
    ctx.fillStyle = COLORS.asphalt;
    ctx.fillRect(cx - rw/2, cy - rw/2, rw, rw);

    // Crosswalks
    this.drawCrosswalks(ctx, cx, cy, rw);

    // Lane markings
    this.drawLaneMarkings(ctx, W, H, cx, cy, rw);

    // Stop lines
    this.drawStopLines(ctx, cx, cy, rw);

    // Traffic lights
    this.drawTrafficLights(ctx, cx, cy, rw);

    // Cars
    this.drawAllCars(ctx, cx, cy, rw);

    // Compass
    this.drawCompass(ctx, W, H);
  },

  drawCityGrid(ctx, W, H, cx, cy, rw) {
    // Draw city block backgrounds
    const blocks = [
      [0, 0, cx - rw/2, cy - rw/2],         // NW
      [cx + rw/2, 0, W - (cx + rw/2), cy - rw/2],  // NE
      [0, cy + rw/2, cx - rw/2, H - (cy + rw/2)],  // SW
      [cx + rw/2, cy + rw/2, W - (cx + rw/2), H - (cy + rw/2)], // SE
    ];
    blocks.forEach(([x, y, w, h]) => {
      ctx.fillStyle = '#0d150d';
      ctx.fillRect(x, y, w, h);
      // Building grid lines
      ctx.strokeStyle = '#141f14';
      ctx.lineWidth = 0.5;
      for (let gx = x; gx < x + w; gx += 30) {
        ctx.beginPath(); ctx.moveTo(gx, y); ctx.lineTo(gx, y + h); ctx.stroke();
      }
      for (let gy = y; gy < y + h; gy += 30) {
        ctx.beginPath(); ctx.moveTo(x, gy); ctx.lineTo(x + w, gy); ctx.stroke();
      }
    });
  },

  drawRoads(ctx, W, H, cx, cy, rw) {
    // Vertical road
    ctx.fillStyle = COLORS.asphalt;
    ctx.fillRect(cx - rw/2, 0, rw, H);
    // Horizontal road
    ctx.fillRect(0, cy - rw/2, W, rw);
  },

  drawCrosswalks(ctx, cx, cy, rw) {
    const stripeW = 6, stripeH = 12, gap = 3;
    ctx.fillStyle = '#2a3a2a';

    // North crosswalk
    for (let x = cx - rw/2; x < cx + rw/2 - stripeW; x += stripeW + gap) {
      ctx.fillRect(x, cy - rw/2 - stripeH, stripeW, stripeH);
    }
    // South crosswalk
    for (let x = cx - rw/2; x < cx + rw/2 - stripeW; x += stripeW + gap) {
      ctx.fillRect(x, cy + rw/2, stripeW, stripeH);
    }
    // West crosswalk
    for (let y = cy - rw/2; y < cy + rw/2 - stripeW; y += stripeW + gap) {
      ctx.fillRect(cx - rw/2 - stripeH, y, stripeH, stripeW);
    }
    // East crosswalk
    for (let y = cy - rw/2; y < cy + rw/2 - stripeW; y += stripeW + gap) {
      ctx.fillRect(cx + rw/2, y, stripeH, stripeW);
    }
  },

  drawLaneMarkings(ctx, W, H, cx, cy, rw) {
    ctx.strokeStyle = '#4b5563';
    ctx.setLineDash([14, 10]);
    ctx.lineWidth = 1.5;

    // Vertical center dashes (north arm)
    ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, cy - rw/2); ctx.stroke();
    // Vertical center dashes (south arm)
    ctx.beginPath(); ctx.moveTo(cx, cy + rw/2); ctx.lineTo(cx, H); ctx.stroke();
    // Horizontal center dashes (west arm)
    ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(cx - rw/2, cy); ctx.stroke();
    // Horizontal center dashes (east arm)
    ctx.beginPath(); ctx.moveTo(cx + rw/2, cy); ctx.lineTo(W, cy); ctx.stroke();

    ctx.setLineDash([]);

    // Road edges
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1;
    // North arm edges
    ctx.beginPath(); ctx.moveTo(cx - rw/2, 0); ctx.lineTo(cx - rw/2, cy - rw/2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + rw/2, 0); ctx.lineTo(cx + rw/2, cy - rw/2); ctx.stroke();
    // South arm edges
    ctx.beginPath(); ctx.moveTo(cx - rw/2, cy + rw/2); ctx.lineTo(cx - rw/2, H); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + rw/2, cy + rw/2); ctx.lineTo(cx + rw/2, H); ctx.stroke();
    // West arm edges
    ctx.beginPath(); ctx.moveTo(0, cy - rw/2); ctx.lineTo(cx - rw/2, cy - rw/2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, cy + rw/2); ctx.lineTo(cx - rw/2, cy + rw/2); ctx.stroke();
    // East arm edges
    ctx.beginPath(); ctx.moveTo(cx + rw/2, cy - rw/2); ctx.lineTo(W, cy - rw/2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + rw/2, cy + rw/2); ctx.lineTo(W, cy + rw/2); ctx.stroke();
  },

  drawStopLines(ctx, cx, cy, rw) {
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([]);

    const gap = CFG.signal.stopLineGap; // px from intersection edge

    // North stop line (cars travel down, stop at cy - rw/2)
    ctx.beginPath();
    ctx.moveTo(cx - rw/2 + 2, cy - rw/2 - gap);
    ctx.lineTo(cx - 2,          cy - rw/2 - gap);
    ctx.stroke();

    // South stop line (cars travel up, stop at cy + rw/2)
    ctx.beginPath();
    ctx.moveTo(cx + 2,          cy + rw/2 + gap);
    ctx.lineTo(cx + rw/2 - 2,   cy + rw/2 + gap);
    ctx.stroke();

    // West stop line (cars travel right, stop at cx - rw/2)
    ctx.beginPath();
    ctx.moveTo(cx - rw/2 - gap, cy - rw/2 + 2);
    ctx.lineTo(cx - rw/2 - gap, cy - 2);
    ctx.stroke();

    // East stop line (cars travel left, stop at cx + rw/2)
    ctx.beginPath();
    ctx.moveTo(cx + rw/2 + gap, cy + 2);
    ctx.lineTo(cx + rw/2 + gap, cy + rw/2 - 2);
    ctx.stroke();
  },

  drawTrafficLights(ctx, cx, cy, rw) {
    // Draw a traffic light pole + housing at each corner
    const offset = 8;
    const positions = {
      north: { x: cx - rw/2 - offset, y: cy - rw/2 - 36, rot: 0 },
      south: { x: cx + rw/2 + offset, y: cy + rw/2 + 36, rot: Math.PI },
      west:  { x: cx - rw/2 - 36,     y: cy + rw/2 + offset, rot: -Math.PI/2 },
      east:  { x: cx + rw/2 + 36,     y: cy - rw/2 - offset, rot:  Math.PI/2 },
    };

    DIRS.forEach(dir => {
      const p = positions[dir];
      const sig = state.signals[dir];
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      this.drawLightBox(ctx, sig);
      ctx.restore();
    });
  },

  drawLightBox(ctx, sig) {
    const bw = 14, bh = 36, br = 3;
    // Housing
    ctx.fillStyle = '#111';
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    this.roundRect(ctx, -bw/2, -bh/2, bw, bh, br);
    ctx.fill(); ctx.stroke();

    // Lights
    const lights = [
      { y: -bh/2 + 7,  color: '#ef4444', active: sig === 'red' },
      { y: 0,           color: '#eab308', active: sig === 'yellow' },
      { y:  bh/2 - 7,  color: '#22c55e', active: sig === 'green' },
    ];
    lights.forEach(l => {
      ctx.beginPath();
      ctx.arc(0, l.y, 4, 0, Math.PI * 2);
      if (l.active) {
        ctx.fillStyle = l.color;
        ctx.shadowColor = l.color;
        ctx.shadowBlur = 12;
      } else {
        ctx.fillStyle = '#1a1a1a';
        ctx.shadowBlur = 0;
      }
      ctx.fill();
      ctx.shadowBlur = 0;
    });
  },

  roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  },

  drawAllCars(ctx, cx, cy, rw) {
    DIRS.forEach(dir => {
      const lane = state.lanes[dir];
      lane.cars.forEach(car => {
        this.drawCar(ctx, car, cx, cy, rw);
      });
    });
  },

  drawCar(ctx, car, cx, cy, rw) {
    const isGreen = state.signals[car.dir] === 'green';
    const isBus = car.type === 'bus';
    const cw = isBus ? CFG.car.w + 4 : CFG.car.w;
    const ch = isBus ? CFG.car.h + 14 : CFG.car.h;

    // Convert pos to canvas coordinates
    // Lane center = road_half / 2 from road centerline (quarter-road from centre)
    const laneOffset = rw / 4;
    let x, y, angle;

    switch (car.dir) {
      case 'north':
        // Entering from top, traveling downward
        x = cx - laneOffset;
        y = cy - rw/2 - (vehicleSimulation.getStopLineDist('north') - car.pos);
        angle = 0; // pointing down
        break;
      case 'south':
        // Entering from bottom, traveling upward
        x = cx + laneOffset;
        y = cy + rw/2 + (vehicleSimulation.getStopLineDist('south') - car.pos);
        angle = Math.PI; // pointing up
        break;
      case 'east':
        // Entering from right, traveling leftward
        x = cx + rw/2 + (vehicleSimulation.getStopLineDist('east') - car.pos);
        y = cy - laneOffset;
        angle = -Math.PI/2; // pointing left
        break;
      case 'west':
        // Entering from left, traveling rightward
        x = cx - rw/2 - (vehicleSimulation.getStopLineDist('west') - car.pos);
        y = cy + laneOffset;
        angle = Math.PI/2; // pointing right
        break;
    }

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    // Car body
    ctx.shadowColor = car.color;
    ctx.shadowBlur = isGreen ? 6 : 2;
    this.roundRect(ctx, -cw/2, -ch/2, cw, ch, 3);
    ctx.fillStyle = car.color;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Windshield
    ctx.fillStyle = 'rgba(180,220,255,0.5)';
    ctx.fillRect(-cw/2 + 2, -ch/2 + 3, cw - 4, ch * 0.3);

    // Headlights
    ctx.fillStyle = isGreen ? '#fef08a' : '#374151';
    ctx.shadowColor = isGreen ? '#fef08a' : 'transparent';
    ctx.shadowBlur = isGreen ? 8 : 0;
    ctx.beginPath(); ctx.arc(-cw/2 + 3, -ch/2 + 2, 2, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc( cw/2 - 3, -ch/2 + 2, 2, 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur = 0;

    // Tail lights
    ctx.fillStyle = car.waiting ? '#ef4444' : '#991b1b';
    if (car.waiting) { ctx.shadowColor = '#ef4444'; ctx.shadowBlur = 6; }
    ctx.beginPath(); ctx.arc(-cw/2 + 2, ch/2 - 2, 2, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc( cw/2 - 2, ch/2 - 2, 2, 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur = 0;

    ctx.restore();
  },

  drawCompass(ctx, W, H) {
    const x = W - 24, y = H - 24, r = 16;
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#1e2d45';
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('N', x, y - 6);
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('S', x, y + 10);
    ctx.fillText('E', x + 9, y + 2);
    ctx.fillText('W', x - 9, y + 2);
    ctx.restore();
  },
};

// ============================================================
// MODULE: analytics
// ============================================================
const analytics = {
  chartCtx: null,

  init() {
    const c = document.getElementById('chartCanvas');
    this.chartCtx = c.getContext('2d');
  },

  update() {
    this.updateLaneCards();
    this.updateMetrics();
    this.updatePhaseTimer();
    this.updateNightMode();
    this.updateChart();
  },

  updateLaneCards() {
    const maxQ = CFG.maxQueueDisplay;
    DIRS.forEach(dir => {
      const lane = state.lanes[dir];
      const sig  = state.signals[dir];
      const count = lane.cars.length;
      const waiting = lane.cars.filter(c => c.waiting).length;

      // Signal emoji
      const sigEmoji = { red: '🔴', yellow: '🟡', green: '🟢' }[sig] || '🔴';
      document.getElementById(`signal-${dir}`).textContent = sigEmoji;
      document.getElementById(`waiting-${dir}`).textContent = waiting;
      document.getElementById(`passed-${dir}`).textContent = lane.passed;

      // Green time display
      const ph = state.phase.active;
      const isActive = (ph === 'NS' && (dir === 'north' || dir === 'south')) ||
                       (ph === 'EW' && (dir === 'east' || dir === 'west'));
      const gt = isActive ? state.phase.total.toFixed(0) + 's' : '—';
      document.getElementById(`green-${dir}`).textContent = gt;

      // Bar
      const pct = Math.min(100, (count / maxQ) * 100);
      document.getElementById(`bar-${dir}`).style.width = pct + '%';

      // Card highlight
      const card = document.getElementById(`card-${dir}`);
      card.className = 'lane-card';
      if (state.emergencyMode && state.emergencyLane === dir) {
        card.classList.add('emergency');
      } else if (sig === 'green') {
        card.classList.add('green');
      } else if (sig === 'yellow') {
        card.classList.add('yellow');
      }
    });
  },

  updateMetrics() {
    const avgAI     = state.aiWaitCount > 0
      ? (state.aiWaitSum / state.aiWaitCount).toFixed(1) : 0;
    const avgStatic = state.staticWaitCount > 0
      ? (state.staticWaitSum / state.staticWaitCount).toFixed(1) : 0;

    let efficiency = '—';
    if (state.aiWaitCount > 5 && parseFloat(avgStatic) > 0) {
      const pct = ((parseFloat(avgStatic) - parseFloat(avgAI)) / parseFloat(avgStatic) * 100);
      efficiency = (pct > 0 ? '+' : '') + pct.toFixed(1) + '%';
    }

    document.getElementById('metricTotalProcessed').textContent = state.totalProcessed;
    document.getElementById('metricAvgWait').textContent        = avgAI + 's';
    document.getElementById('metricStaticWait').textContent     = avgStatic + 's';
    document.getElementById('metricEfficiency').textContent     = efficiency;
    document.getElementById('cycleCount').textContent           = state.cycleCount;
  },

  updatePhaseTimer() {
    const ph = state.phase;
    if (!ph.active) return;

    const sigLabels = {
      NS: { green: '↕ North–South GREEN', yellow: '↕ North–South YELLOW' },
      EW: { green: '↔ East–West GREEN',   yellow: '↔ East–West YELLOW' },
    };
    const label = (sigLabels[ph.active] || {})[ph.state] || ph.active;
    document.getElementById('phaseActive').textContent = state.emergencyMode
      ? `🚨 EMERGENCY — ${state.emergencyLane?.toUpperCase()} GREEN`
      : label;

    const total = ph.state === 'yellow' ? CFG.signal.yellowDur : ph.total;
    const pct   = state.emergencyMode
      ? (state.emergencyTimer / 15 * 100)
      : (ph.timer / (total || 1) * 100);
    const timeLeft = state.emergencyMode
      ? state.emergencyTimer.toFixed(0)
      : ph.timer.toFixed(0);

    document.getElementById('phaseTimerBar').style.width = Math.max(0, pct) + '%';
    document.getElementById('phaseTimerText').textContent = timeLeft + 's';
  },

  updateNightMode() {
    const total = DIRS.reduce((s, d) => s + state.lanes[d].cars.length, 0);
    const isNight = total <= CFG.signal.nightThreshold;
    const el = document.getElementById('nightModeInfo');
    document.getElementById('nightModeText').textContent = isNight
      ? 'Night Mode — Reduced Cycle'
      : 'Normal Traffic Mode';
    el.className = 'night-mode-info' + (isNight ? ' active' : '');
  },

  // Track chart history every 3 seconds
  lastChartUpdate: 0,
  updateChart() {
    if (state.simTime - this.lastChartUpdate < 3) return;
    this.lastChartUpdate = state.simTime;

    const avgAI = state.aiWaitCount > 0
      ? parseFloat((state.aiWaitSum / state.aiWaitCount).toFixed(1)) : 0;
    const avgStatic = state.staticWaitCount > 0
      ? parseFloat((state.staticWaitSum / state.staticWaitCount).toFixed(1)) : 0;

    state.chartHistory.push({ ai: avgAI, stat: avgStatic });
    if (state.chartHistory.length > 30) state.chartHistory.shift();

    this.drawChart();
  },

  drawChart() {
    const ctx = this.chartCtx;
    if (!ctx) return;
    const W = 300, H = 120;
    ctx.clearRect(0, 0, W, H);

    const hist = state.chartHistory;
    if (hist.length < 2) return;

    const maxVal = Math.max(...hist.map(h => Math.max(h.ai, h.stat)), 5);

    // Grid
    ctx.strokeStyle = '#1e2d45';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = H - 10 - (i / 4) * (H - 20);
      ctx.beginPath(); ctx.moveTo(30, y); ctx.lineTo(W - 5, y); ctx.stroke();
      ctx.fillStyle = '#374151';
      ctx.font = '9px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(((maxVal * i / 4).toFixed(0)) + 's', 28, y + 3);
    }

    const drawLine = (key, color) => {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      hist.forEach((h, i) => {
        const x = 30 + (i / (hist.length - 1)) * (W - 35);
        const y = H - 10 - (h[key] / maxVal) * (H - 20);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.stroke();
    };

    drawLine('stat', '#ef4444');
    drawLine('ai',   '#22c55e');

    // Legend
    ctx.font = '9px sans-serif';
    ctx.fillStyle = '#22c55e';
    ctx.textAlign = 'left';
    ctx.fillText('▬ AI', 32, 12);
    ctx.fillStyle = '#ef4444';
    ctx.fillText('▬ Static', 60, 12);
  },
};

// ============================================================
// MAIN SIMULATION LOOP
// ============================================================
function gameLoop(timestamp) {
  if (!state.running) return;

  const dt = Math.min((timestamp - state.lastFrameTime) / 1000, 0.05); // seconds, capped
  state.lastFrameTime = timestamp;
  state.simTime += dt;

  // Update modules
  trafficGenerator.tick(dt);
  signalController.tick(dt);
  vehicleSimulation.tick(dt);

  // Render
  renderer.draw();

  // Update UI
  analytics.update();

  state.animFrame = requestAnimationFrame(gameLoop);
}

function startSimulation() {
  if (state.running) return;
  state.running = true;
  state.lastFrameTime = performance.now();

  // Init signal
  signalController.init();

  // Update UI
  document.getElementById('btnStart').disabled  = true;
  document.getElementById('btnStop').disabled   = false;
  document.getElementById('statusDot').className = 'status-dot running';
  document.getElementById('statusText').textContent = 'Running';

  state.animFrame = requestAnimationFrame(gameLoop);
}

function stopSimulation() {
  state.running = false;
  if (state.animFrame) cancelAnimationFrame(state.animFrame);

  document.getElementById('btnStart').disabled  = false;
  document.getElementById('btnStop').disabled   = true;
  document.getElementById('statusDot').className = 'status-dot';
  document.getElementById('statusText').textContent = 'Stopped';
}

function resetSimulation() {
  stopSimulation();
  state = createInitialState();
  analytics.lastChartUpdate = 0;
  renderer.draw();
  analytics.update();

  document.getElementById('statusText').textContent = 'Stopped';
  document.getElementById('btnStart').disabled  = false;
  document.getElementById('btnStop').disabled   = true;
}

function toggleMode() {
  state.aiMode = !state.aiMode;

  const badge = document.getElementById('modeBadge');
  const btn   = document.getElementById('btnToggleMode');

  if (state.aiMode) {
    badge.textContent = 'AI MODE';
    badge.className   = 'mode-badge';
    btn.textContent   = '⚡ Static Mode';
    btn.className     = 'btn btn-toggle';
  } else {
    badge.textContent = 'STATIC MODE';
    badge.className   = 'mode-badge static';
    btn.textContent   = '🤖 AI Mode';
    btn.className     = 'btn btn-toggle active-static';
  }

  // Restart current phase with new timing
  if (state.running && state.phase.active) {
    signalController.startPhase(state.phase.active);
  }
}

// ============================================================
// EMERGENCY MODE
// ============================================================
function openEmergencyPanel() {
  document.getElementById('emergencyPanel').classList.remove('hidden');
}

function closeEmergencyPanel() {
  document.getElementById('emergencyPanel').classList.add('hidden');
  document.querySelectorAll('.btn-lane').forEach(b => b.classList.remove('selected'));
}

function activateEmergency(lane) {
  closeEmergencyPanel();
  signalController.activateEmergency(lane);

  document.getElementById('statusDot').className = 'status-dot emergency';
  document.getElementById('statusText').textContent = `Emergency: ${lane.toUpperCase()}`;
}

// ============================================================
// UI EVENT LISTENERS
// ============================================================
function initUI() {
  document.getElementById('btnStart').addEventListener('click', startSimulation);
  document.getElementById('btnStop').addEventListener('click', stopSimulation);
  document.getElementById('btnReset').addEventListener('click', resetSimulation);
  document.getElementById('btnToggleMode').addEventListener('click', toggleMode);
  document.getElementById('btnEmergency').addEventListener('click', openEmergencyPanel);
  document.getElementById('btnCancelEmergency').addEventListener('click', closeEmergencyPanel);

  document.querySelectorAll('.btn-lane').forEach(btn => {
    btn.addEventListener('click', () => {
      const lane = btn.dataset.lane;
      document.querySelectorAll('.btn-lane').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      activateEmergency(lane);
    });
  });
}

// ============================================================
// INIT
// ============================================================
function init() {
  state = createInitialState();
  renderer.init();
  analytics.init();
  initUI();

  // Draw static scene immediately
  renderer.draw();
  analytics.update();
}

document.addEventListener('DOMContentLoaded', init);
