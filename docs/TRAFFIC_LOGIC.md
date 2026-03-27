# SmartFlow Traffic Simulation Logic

## Architecture Overview

The traffic simulation system is built with a modular, class-based architecture that separates concerns into distinct components:

```
┌─────────────────────────────────────────────────────┐
│         TrafficSystem (Main Controller)              │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────────────┐  ┌──────────────────┐        │
│  │ SignalController │  │  TrafficLane x8  │        │
│  │  (Red/Yel/Grn)  │  │  (Queue Manager) │        │
│  └──────────────────┘  └──────────────────┘        │
│                                │                    │
│                          ┌─────▼─────┐             │
│                          │  Vehicle   │             │
│                          │  (Car obj) │             │
│                          └────────────┘             │
└─────────────────────────────────────────────────────┘
```

## Core Classes

### 1. **Vehicle Class**
Represents individual cars in the traffic system.

**Properties:**
- `id` - Unique identifier
- `lane` - Current lane (e.g., 'topLane1')
- `element` - DOM element (div)
- `createdAt` - Timestamp when vehicle was created
- `movedDistance` - Distance traveled (pixels)
- `isMoving` - Boolean flag for movement state
- `waitTime` - Time spent waiting

**Methods:**
```javascript
create()           // Creates DOM element
eliminate()        // Removes from DOM
getWaitTime()      // Returns seconds waited
```

**Example:**
```javascript
const car = new Vehicle(1, 'topLane1');
car.create();
car.eliminate();
```

### 2. **TrafficLane Class**
Manages vehicle queues in each lane.

**Properties:**
- `laneId` - Lane identifier
- `direction` - Traffic direction (top/bottom/left/right)
- `queue` - Array of vehicles
- `maxQueueSize` - Maximum vehicles per lane (10)

**Key Methods:**
```javascript
addVehicle(vehicle)        // Add car to queue (returns bool)
removeVehicle(vehicle)     // Remove car from queue
getFrontVehicle()          // Get first car
getQueueLength()           // Current queue size
getAverageWaitTime()       // Avg wait of all cars in lane
render(containerElement)   // Draw vehicles in DOM
clear()                    // Clear all vehicles
```

**Queue Behavior:**
- FIFO (First In, First Out)
- Max 10 vehicles per lane
- Only front vehicle can move
- Others wait in queue

### 3. **SignalController Class**
Controls traffic signal states for all directions.

**Properties:**
```javascript
signals = {
    top: { state: 'red', phase: 'NS' },
    bottom: { state: 'red', phase: 'NS' },
    left: { state: 'red', phase: 'EW' },
    right: { state: 'red', phase: 'EW' }
}
```

**State Values:** `'red'`, `'yellow'`, `'green'`

**Methods:**
```javascript
setState(direction, state)    // Update signal state
getState(direction)           // Get current state
isGreen(direction)            // Check if green
updateDisplay(direction, state) // Update UI
```

**Example:**
```javascript
signalController.setState('top', 'green');
if (signalController.isGreen('top')) {
    // Allow movement
}
```

### 4. **TrafficSystem Class** (Main Controller)
Orchestrates the entire traffic simulation.

**Configuration:**
```javascript
config = {
    greenTime: 8,      // Seconds
    yellowTime: 2,     // Seconds
    redTime: 10,       // (not actively used, calculated)
    updateInterval: 16, // ms (~60fps)
    spawnRate: 0.4     // 0-1 probability
}
```

**State:**
```javascript
isRunning: boolean
startTime: timestamp
carsCleared: number
vehicleCounter: number
signalController: SignalController
lanes: { [laneId]: TrafficLane }
```

**Methods:**
```javascript
start()                    // Begin simulation
stop()                     // Pause simulation
reset()                    // Reset all + clear vehicles
startSignalCycle()         // Begin 4-phase signal pattern
runPhase(dirs, color, dur) // Execute single phase
spawnVehicles()            // Randomly spawn cars
processMovement()          // Update vehicle positions
animate()                  // Main animation loop
```

## Signal Cycle Pattern

The system uses a **coordinated 4-phase signal cycle**:

```
Phase 1: North-South GREEN  (8 seconds)
         ├─ Top lane:    GREEN ✓
         ├─ Bottom lane: GREEN ✓
         ├─ Left lane:   RED   ✗
         └─ Right lane:  RED   ✗

Phase 2: North-South YELLOW (2 seconds)
         ├─ Top lane:    YELLOW ⚠
         ├─ Bottom lane: YELLOW ⚠
         ├─ Left lane:   RED    ✗
         └─ Right lane:  RED    ✗

Phase 3: East-West GREEN    (8 seconds)
         ├─ Top lane:    RED   ✗
         ├─ Bottom lane: RED   ✗
         ├─ Left lane:   GREEN ✓
         └─ Right lane:  GREEN ✓

Phase 4: East-West YELLOW   (2 seconds)
         ├─ Top lane:    RED    ✗
         ├─ Bottom lane: RED    ✗
         ├─ Left lane:   YELLOW ⚠
         └─ Right lane:  YELLOW ⚠

Total Cycle Time: 20 seconds
Then repeat...
```

## Vehicle Movement Logic

### Movement Processing (60 fps)

Each frame, the system:

1. **Check Signal State** → Is the direction GREEN?
2. **Check Vehicle Position** → Is it the front vehicle?
3. **Calculate Movement**
   - Front vehicle: Move 15 pixels/frame
   - Other vehicles: Stay in place (waiting)
4. **Check Clearance**
   - If moved > 150 pixels → Vehicle cleared intersection
   - Remove from queue
   - Increment `carsCleared` counter

### Queue Behavior

**Queue Visualization:**
```
Lane Container (topLane1)
├─ Vehicle 1 [████]  ← FRONT (Moves when green)
├─ Vehicle 2 [████]  ← WAITING (Stopped)
├─ Vehicle 3 [████]  ← WAITING (Stopped)
├─ Vehicle 4 [████]  ← WAITING (Stopped)
└─ ...
```

**Movement Rules:**
```
RED Signal:     ALL vehicles STOP (waiting animation)
YELLOW Signal:  Front vehicle clears, others wait
GREEN Signal:   Front vehicle moves, others wait
```

## Spawning Logic

**Random Vehicle Generation:**

```javascript
// Every 1 second
for each lane:
    if (Math.random() < 0.4)  // 40% chance
        create new vehicle
        add to lane queue
```

**Initial Spawn:**
- 2 vehicles per lane at start
- Total: 2 × 8 lanes = 16 vehicles

**Spawn Rate:** 40% probability per second per lane
**Maximum Queue Size:** 10 vehicles per lane

## Animation System

**Rendering Pipeline:**

```
1. processMovement()  → Update vehicle positions
2. renderAllLanes()   → Redraw all lanes
3. updateStats()      → Calculate metrics
4. requestAnimationFrame → Loop at 60fps
```

**Performance:**
- 60fps target (16ms per frame)
- Uses requestAnimationFrame for smooth motion
- Efficient DOM updates (batch per lane)

## Statistics Tracking

### Real-time Metrics:

**Total Vehicles**
```javascript
= sum of queue lengths in all lanes
```

**Average Wait Time**
```javascript
= sum(vehicle.getWaitTime() for all vehicles) 
  / number of vehicles
```

**Throughput (vehicles/minute)**
```javascript
= (carsCleared × 60) / elapsedSeconds
```

**Example Metrics After 1 Minute:**
- Total Vehicles: 8
- Avg Wait Time: 15s
- Throughput: 24 v/min

## Event Flow

### System Start:
```
User clicks START
  ↓
start() called
  ↓
spawnTimer → spawn vehicles every 1s
signalCycle → execute 4-phase pattern
animate → requestAnimationFrame loop
  ↓
System RUNNING ✓
```

### Vehicle Movement Cycle:
```
Phase: GREEN (8s)
  ↓
animate() Loop (60fps)
  ├─ processMovement()
  │   ├─ isGreen('top') → true
  │   ├─ front vehicle → movedDistance += 15
  │   ├─ if movedDistance > 150 → carsCleared++
  │   └─ other vehicles → waiting
  ├─ renderAllLanes()
  └─ updateStats()
  ↓
Phase: YELLOW (2s)
  ↓
Phase: GREEN (8s)
  ↓
... (repeats)
```

## Code Simplicity & Modularity

### Key Design Principles:

1. **Single Responsibility**
   - `Vehicle` → Car data & lifecycle
   - `TrafficLane` → Queue management
   - `SignalController` → Signal state
   - `TrafficSystem` → Orchestration

2. **Clean API**
   ```javascript
   system.start()           // User action
   lane.addVehicle(car)     // Queue operation
   signal.isGreen(dir)      // State check
   car.getWaitTime()        // Data retrieval
   ```

3. **No Dependencies**
   - Pure JavaScript (no libraries)
   - Direct DOM manipulation
   - Clear control flow

4. **Easy to Extend**
   ```javascript
   // Add new metrics
   class TrafficSystem {
       getEmissionLevel() { ... }
   }
   
   // Add smart scheduling
   runPhaseAdaptive(directions) { ... }
   
   // Add emergency vehicle priority
   addEmergencyVehicle(vehicle) { ... }
   ```

## Performance Characteristics

| Metric | Value |
|--------|-------|
| Animation FPS | 60 |
| Frame Time | ~16ms |
| Vehicles/Lane | Max 10 |
| Total Vehicles Max | 80 |
| Signal Update | 1Hz (1s) |
| Spawn Check | 1Hz (1s) |
| Queue Lookups | O(1) |
| Rendering | O(n) where n=total vehicles |

## Future Enhancements

1. **Adaptive Timing** - Adjust phase durations based on queue length
2. **Prediction** - ML model to forecast traffic patterns
3. **Emergency Vehicles** - Priority movement for ambulances/fire
4. **Multiple Intersections** - Coordinate across network
5. **Weather Impact** - Reduced speed during rain/snow
6. **AI Optimization** - Reinforcement learning for signal timing

## Debugging

**Console Output:**
```
🚦 SmartFlow Traffic System Initialized
✓ Vehicle Spawning: Enabled
✓ Signal Control: Ready
✓ Animation System: 60fps
```

**Check Vehicle States:**
```javascript
window.trafficSystem.lanes.topLane1.queue  // Array of vehicles
window.trafficSystem.carsCleared           // Total cleared
window.trafficSystem.isRunning             // Current state
```

**Monitor Performance:**
```javascript
console.log(`FPS: ${1000/16}`);     // Should be ~60
console.log(`Vehicles: ${totalVehicles}`);
```
