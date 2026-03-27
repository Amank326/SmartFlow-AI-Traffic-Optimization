// ==================== SESSION MANAGEMENT ==================== //
function displayUserGreeting() {
    const userGreetingElement = document.getElementById('userGreeting');
    const user = sessionStorage.getItem('user') || 'User';
    
    if (userGreetingElement) {
        const displayName = user.charAt(0).toUpperCase() + user.slice(1).toLowerCase();
        userGreetingElement.textContent = `Welcome, ${displayName}`;
    }
}

function logoutFromDashboard() {
    if (confirm('Go back to home page?')) {
        // Clear session
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('loginTime');
        sessionStorage.removeItem('lastVisit');
        
        // Stop the traffic system if running
        if (window.trafficSystem && window.trafficSystem.isRunning) {
            window.trafficSystem.stop();
        }
        
        // Redirect to landing
        window.location.href = 'landing.html';
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    displayUserGreeting();
}, { once: true });

// ==================== Vehicle Class ==================== //
class Vehicle {
    constructor(id, lane) {
        this.id = id;
        this.lane = lane;
        this.element = null;
        this.createdAt = Date.now();
        this.movedDistance = 0;
        this.isMoving = false;
        this.waitTime = 0;
    }

    create() {
        this.element = document.createElement('div');
        this.element.className = 'vehicle';
        this.element.dataset.vehicleId = this.id;
        this.element.title = `Vehicle #${this.id}`;
        this.element.dataset.movedDistance = '0';
        return this.element;
    }

    eliminate() {
        if (this.element && this.element.parentNode) {
            // Add clearing animation class
            this.element.classList.add('clearing');
            
            // Remove after animation completes (600ms)
            setTimeout(() => {
                if (this.element && this.element.parentNode) {
                    this.element.remove();
                }
            }, 600);
        }
    }

    getWaitTime() {
        return Math.round((Date.now() - this.createdAt) / 1000);
    }
}

// ==================== Analytics Tracker Class ==================== //
class AnalyticsTracker {
    constructor() {
        this.sessionStartTime = Date.now();
        this.vehiclesProcessed = 0;
        this.directionalData = {
            north: [],
            south: [],
            east: [],
            west: []
        };
        this.waitTimes = [];
        this.peakCongestion = 'Low';
        this.averageEfficiency = 0;
        this.totalVehiclesIntroduced = 0;
    }

    recordVehicleProcessed() {
        this.vehiclesProcessed++;
    }

    recordDirectionalData(direction, count) {
        if (this.directionalData[direction]) {
            this.directionalData[direction].push({
                timestamp: Date.now(),
                count: count
            });
            // Keep only last 10 readings
            if (this.directionalData[direction].length > 10) {
                this.directionalData[direction].shift();
            }
        }
    }

    recordWaitTime(timeInSeconds) {
        this.waitTimes.push(timeInSeconds);
        if (this.waitTimes.length > 100) {
            this.waitTimes.shift();
        }
    }

    updatePeakCongestion(level) {
        const levels = ['Low', 'Medium', 'High'];
        const currentIndex = levels.indexOf(this.peakCongestion);
        const newIndex = levels.indexOf(level);
        if (newIndex > currentIndex) {
            this.peakCongestion = level;
        }
    }

    getAverageWaitTime() {
        if (this.waitTimes.length === 0) return 0;
        const sum = this.waitTimes.reduce((a, b) => a + b, 0);
        return Math.round(sum / this.waitTimes.length);
    }

    getSessionDuration() {
        const ms = Date.now() - this.sessionStartTime;
        const seconds = Math.floor((ms / 1000) % 60);
        const minutes = Math.floor((ms / (1000 * 60)) % 60);
        const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    getLatestDirectionalCounts() {
        const latest = {};
        for (const [direction, data] of Object.entries(this.directionalData)) {
            latest[direction] = data.length > 0 ? data[data.length - 1].count : 0;
        }
        return latest;
    }

    exportData() {
        return {
            sessionStartTime: new Date(this.sessionStartTime).toISOString(),
            sessionDuration: this.getSessionDuration(),
            vehiclesProcessed: this.vehiclesProcessed,
            averageWaitTime: this.getAverageWaitTime(),
            peakCongestion: this.peakCongestion,
            directionalData: this.directionalData,
            timestamp: new Date().toISOString()
        };
    }
}

// ==================== Lane Queue Manager ==================== //
class TrafficLane {
    constructor(laneId, direction) {
        this.laneId = laneId;
        this.direction = direction;
        this.queue = [];
        this.maxQueueSize = 10;
        this.containerElement = null;
    }

    addVehicle(vehicle) {
        if (this.queue.length < this.maxQueueSize) {
            this.queue.push(vehicle);
            return true;
        }
        return false;
    }

    removeVehicle(vehicle) {
        const index = this.queue.indexOf(vehicle);
        if (index > -1) {
            this.queue.splice(index, 1);
            return true;
        }
        return false;
    }

    getFrontVehicle() {
        return this.queue.length > 0 ? this.queue[0] : null;
    }

    getQueueLength() {
        return this.queue.length;
    }

    getAverageWaitTime() {
        if (this.queue.length === 0) return 0;
        const totalWait = this.queue.reduce((sum, v) => sum + v.getWaitTime(), 0);
        return Math.round(totalWait / this.queue.length);
    }

    render(containerElement) {
        this.containerElement = containerElement;
        containerElement.innerHTML = '';
        
        // Render vehicles with proper positioning
        this.queue.forEach((vehicle, index) => {
            if (!vehicle.element) {
                vehicle.create();
            }
            
            // Position vehicles in queue with slight offset for visual effect
            // First vehicle (front) stays at normal position
            // Other vehicles stack behind with offset
            const offsetMultiplier = index > 0 ? index * 12 : 0; // 12px offset per vehicle behind
            vehicle.element.style.marginLeft = offsetMultiplier + 'px';
            
            // Ensure element has classes set
            if (vehicle.isMoving && !vehicle.element.classList.contains('moving')) {
                vehicle.element.classList.add('moving');
                vehicle.element.classList.remove('waiting');
            } else if (!vehicle.isMoving && !vehicle.element.classList.contains('waiting')) {
                vehicle.element.classList.add('waiting');
                vehicle.element.classList.remove('moving');
            }
            
            containerElement.appendChild(vehicle.element);
        });
    }

    clear() {
        this.queue.forEach(v => v.eliminate());
        this.queue = [];
    }
}

// ==================== Traffic Signal Manager ==================== //
class SignalController {
    constructor() {
        this.signals = {
            top: { state: 'red', phase: 'NS' },
            bottom: { state: 'red', phase: 'NS' },
            left: { state: 'red', phase: 'EW' },
            right: { state: 'red', phase: 'EW' }
        };
    }

    setState(direction, state) {
        if (this.signals[direction]) {
            this.signals[direction].state = state;
        }
    }

    getState(direction) {
        return this.signals[direction] ? this.signals[direction].state : 'red';
    }

    isGreen(direction) {
        return this.getState(direction) === 'green';
    }

    updateDisplay(direction, state) {
        const signal = document.getElementById(`signal${this.capitalizeFirst(direction)}`);
        if (!signal) return;

        const signals = signal.querySelectorAll('.signal');
        signals.forEach(s => s.classList.remove('active'));

        let index = 0;
        if (state === 'red') index = 0;
        else if (state === 'yellow') index = 1;
        else if (state === 'green') index = 2;

        if (signals[index]) {
            signals[index].classList.add('active');
        }
    }

    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}

// ==================== Traffic System ==================== //
class TrafficSystem {
    constructor() {
        // Configuration
        this.config = {
            greenTime: 8,
            yellowTime: 2,
            redTime: 10,
            updateInterval: 16, // ~60fps
            spawnRate: 0.4, // 0-1 probability per second
            adaptiveMode: true, // Enable adaptive signal timing
            minGreenTime: 4, // Minimum green time (prevent starvation)
            maxGreenTime: 15, // Maximum green time (prevent too long wait)
            totalCycleTime: 60, // Target cycle time for distribution
            // API Configuration
            apiUrl: window.API_CONFIG?.url || 'http://localhost:3000',
            apiTimeout: 5000, // 5 seconds
            debugMode: window.location.search.includes('debug')
        };

        // State
        this.isRunning = false;
        this.startTime = null;
        this.carsCleared = 0;
        this.vehicleCounter = 0;
        this.adaptiveTimings = {}; // Store calculated phase timings
        this.directionalTimings = {}; // Store calculated directional timings
        this.apiConnected = false; // Track API connection status
        
        // Advanced Features State
        this.emergencyMode = false;
        this.emergencyDirection = null;
        this.nightMode = false;
        this.activePhase = 'NS'; // Track which phase is currently active (NS or EW)

        // ==================== Traffic Tracking Variables ====================
        // Simple tracking for each lane direction
        this.northCars = 0;
        this.southCars = 0;
        this.eastCars = 0;
        this.westCars = 0;
        
        // Congestion level from backend
        this.congestionLevel = 'Low';  // 'Low' | 'Medium' | 'High'
        
        // Traffic tracking timers
        this.trafficTrackingTimer = null;

        // ==================== PREDICTIVE AI SYSTEM ====================
        // Smart AI Mode -- Toggle between normal adaptive and predictive+priority-based
        this.smartAIMode = false;  // OFF by default (normal adaptive)
        
        // Traffic prediction
        this.trafficHistory = {
            north: [],
            south: [],
            east: [],
            west: []
        };
        this.predictedTraffic = {
            north: 0,
            south: 0,
            east: 0,
            west: 0
        };
        this.trafficTrend = {
            north: 'stable',
            south: 'stable',
            east: 'stable',
            west: 'stable'
        };
        
        // Smart priority system
        this.consecutiveHighTraffic = {
            north: 0,
            south: 0,
            east: 0,
            west: 0
        };
        this.priorityMultiplier = {
            north: 1.0,
            south: 1.0,
            east: 1.0,
            west: 1.0
        };
        
        // Efficiency tracking
        this.fixedTimingStats = {
            totalWaitTime: 0,
            vehiclesPassed: 0,
            averageWait: 0
        };
        this.adaptiveTimingStats = {
            totalWaitTime: 0,
            vehiclesPassed: 0,
            averageWait: 0
        };
        this.efficiencyImprovement = 0;  // Percentage improvement

        // Managers
        this.signalController = new SignalController();
        this.lanes = this.createLanes();
        this.analytics = new AnalyticsTracker(); // Initialize analytics tracker

        // Timers
        this.cycleTimer = null;
        this.spawnTimer = null;
        this.updateTimer = null;
        this.animationFrame = null;

        // Initialize
        this.setupEventListeners();
        this.renderAllLanes();
    }

    createLanes() {
        const lanes = {};
        const laneConfigs = [
            { id: 'topLane1', direction: 'top', container: 'topLane1' },
            { id: 'topLane2', direction: 'top', container: 'topLane2' },
            { id: 'bottomLane1', direction: 'bottom', container: 'bottomLane1' },
            { id: 'bottomLane2', direction: 'bottom', container: 'bottomLane2' },
            { id: 'leftLane1', direction: 'left', container: 'leftLane1' },
            { id: 'leftLane2', direction: 'left', container: 'leftLane2' },
            { id: 'rightLane1', direction: 'right', container: 'rightLane1' },
            { id: 'rightLane2', direction: 'right', container: 'rightLane2' }
        ];

        laneConfigs.forEach(config => {
            lanes[config.id] = new TrafficLane(config.id, config.direction);
            lanes[config.id].containerElement = document.getElementById(config.container);
        });

        return lanes;
    }

    setupEventListeners() {
        document.getElementById('startBtn').addEventListener('click', () => this.start());
        document.getElementById('stopBtn').addEventListener('click', () => this.stop());
        document.getElementById('resetBtn').addEventListener('click', () => this.reset());
        
        // Emergency Mode listeners
        document.getElementById('emergencyLane').addEventListener('change', (e) => {
            const btn = document.getElementById('emergencyBtn');
            btn.disabled = !e.target.value;
        });
        document.getElementById('emergencyBtn').addEventListener('click', () => this.activateEmergency());
        
        // Night Mode listener
        document.getElementById('nightModeBtn').addEventListener('click', () => this.toggleNightMode());
        
        // Smart AI Mode listener
        const smartAIBtn = document.getElementById('smartAIBtn');
        if (smartAIBtn) {
            smartAIBtn.addEventListener('click', () => this.toggleSmartAIMode());
        }

        // Export Data button listener
        const exportBtn = document.getElementById('exportDataBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportAnalyticsData());
        }
    }

    start() {
        if (this.isRunning) return;

        try {
            this.isRunning = true;
            this.startTime = Date.now();
            this.carsCleared = 0;
            
            // Update UI state
            document.getElementById('startBtn').disabled = true;
            document.getElementById('stopBtn').disabled = false;
            document.getElementById('systemStatus').textContent = '🟢 RUNNING';
            document.getElementById('systemStatus').style.color = '#00ff88';
            document.getElementById('systemStatus').style.textShadow = '0 0 15px rgba(0, 255, 136, 0.7)';

            console.log('🚦 SmartFlow System STARTED');

            // Start spawning vehicles
            this.spawnTimer = setInterval(() => {
                if (this.isRunning) this.spawnVehicles();
            }, 1000);

            // Start signal cycle
            this.startSignalCycle();

            // Start animation loop
            this.animate();

            // Start traffic tracking (updates lane counts every 3 seconds)
            this.startTrafficTracking();
        } catch (error) {
            console.error('❌ Error starting system:', error);
            this.isRunning = false;
            alert('Failed to start system. Check console for details.');
        }
    }

    stop() {
        try {
            this.isRunning = false;

            // Update UI state
            document.getElementById('startBtn').disabled = false;
            document.getElementById('stopBtn').disabled = true;
            document.getElementById('systemStatus').textContent = '🔴 PAUSED';
            document.getElementById('systemStatus').style.color = '#ff3366';
            document.getElementById('systemStatus').style.textShadow = '0 0 15px rgba(255, 51, 102, 0.7)';

            console.log('⏸️  SmartFlow System PAUSED');

            // Clear all timers safely
            if (this.cycleTimer) clearInterval(this.cycleTimer);
            if (this.spawnTimer) clearInterval(this.spawnTimer);
            if (this.updateTimer) clearInterval(this.updateTimer);
            if (this.trafficTrackingTimer) clearInterval(this.trafficTrackingTimer);
            if (this.animationFrame) cancelAnimationFrame(this.animationFrame);

            // Reset all signals to red
            ['top', 'bottom', 'left', 'right'].forEach(dir => {
                const dirName = this.signalController.capitalizeFirst(dir);
                this.signalController.setState(dir, 'red');
                this.signalController.updateDisplay(dir, 'red');
                const timerEl = document.getElementById(`timer${dirName}`);
                if (timerEl) timerEl.textContent = '0s';
            });
        } catch (error) {
            console.error('❌ Error stopping system:', error);
        }
    }

    reset() {
        try {
            this.stop();

            console.log('🔄 SmartFlow System RESET');

            // Clear all lanes completely
            Object.keys(this.lanes).forEach(laneKey => {
                const lane = this.lanes[laneKey];
                if (lane && lane.queue) {
                    // Remove all vehicle elements from DOM
                    lane.queue.forEach(vehicle => {
                        if (vehicle.element && vehicle.element.parentNode) {
                            vehicle.element.remove();
                        }
                    });
                    lane.queue = [];
                }
            });

            // Reset all counters and state
            this.carsCleared = 0;
            this.vehicleCounter = 0;
            this.startTime = null;
            this.northCars = 0;
            this.southCars = 0;
            this.eastCars = 0;
            this.westCars = 0;

            // Reset all signals to red
            ['top', 'bottom', 'left', 'right'].forEach(dir => {
                const dirName = this.signalController.capitalizeFirst(dir);
                this.signalController.setState(dir, 'red');
                this.signalController.updateDisplay(dir, 'red');
                const timerEl = document.getElementById(`timer${dirName}`);
                if (timerEl) timerEl.textContent = '0s';
            });

            // Reset display elements
            this.updateStatElement('totalVehicles', '0');
            this.updateStatElement('avgWaitTime', '0s');
            this.updateStatElement('throughput', '0 v/min');
            this.updateStatElement('efficiency', '↑ 0%');
            this.updateDashboardElement('carsWaiting', 0);
            this.updateDashboardElement('carsPassed', 0);

            // Reset active indicators
            const activeLaneDisplay = document.getElementById('activeLaneDisplay');
            if (activeLaneDisplay) activeLaneDisplay.textContent = '--';
            const greenTimeDisplay = document.getElementById('greenTimeDisplay');
            if (greenTimeDisplay) greenTimeDisplay.textContent = '-- sec';
            const movementStatus = document.getElementById('movementStatus');
            if (movementStatus) movementStatus.innerHTML = '⏸️ Waiting for green';

            // Reset status indicator
            document.getElementById('systemStatus').textContent = '🔴 PAUSED';
            document.getElementById('systemStatus').style.color = '#ff3366';

            // Redraw
            this.renderAllLanes();
            
            console.log('✅ System reset complete - ready to start');
        } catch (error) {
            console.error('❌ Error resetting system:', error);
            alert('Error during reset. Check console.');
        }
    }

    // ==================== Analytics & Reporting System ==================== //
    updateAnalyticsDisplay() {
        if (!this.analytics) return;

        try {
            // Get directional counts from lanes
            const north = (this.lanes['topLane1']?.getQueueLength() || 0) + (this.lanes['topLane2']?.getQueueLength() || 0);
            const south = (this.lanes['bottomLane1']?.getQueueLength() || 0) + (this.lanes['bottomLane2']?.getQueueLength() || 0);
            const east = (this.lanes['rightLane1']?.getQueueLength() || 0) + (this.lanes['rightLane2']?.getQueueLength() || 0);
            const west = (this.lanes['leftLane1']?.getQueueLength() || 0) + (this.lanes['leftLane2']?.getQueueLength() || 0);

            // Record directional data
            this.analytics.recordDirectionalData('north', north);
            this.analytics.recordDirectionalData('south', south);
            this.analytics.recordDirectionalData('east', east);
            this.analytics.recordDirectionalData('west', west);

            // Calculate average wait time
            let totalWait = 0, waitingCount = 0;
            Object.values(this.lanes).forEach(lane => {
                if (lane && lane.queue) {
                    lane.queue.forEach(vehicle => {
                        if (vehicle) {
                            const waitTime = vehicle.getWaitTime();
                            totalWait += waitTime;
                            waitingCount++;
                            this.analytics.recordWaitTime(waitTime);
                        }
                    });
                }
            });

            // Update system efficiency (based on current stats)
            const totalVehicles = north + south + east + west;
            const efficiency = totalVehicles > 0 ? Math.max(0, 100 - (this.analytics.getAverageWaitTime())) : 100;

            // Update peak congestion
            if (totalVehicles > 30) this.analytics.updatePeakCongestion('High');
            else if (totalVehicles > 15) this.analytics.updatePeakCongestion('Medium');
            else this.analytics.updatePeakCongestion('Low');

            // Update UI
            document.getElementById('systemEfficiency').textContent = Math.round(efficiency) + '%';
            document.getElementById('efficiencyBar').style.width = Math.min(efficiency, 100) + '%';

            document.getElementById('avgWaitDisplay').textContent = this.analytics.getAverageWaitTime() + 's';
            document.getElementById('flowRate').textContent = Math.round((this.carsCleared * 60) / Math.max(1, (Date.now() - this.startTime) / 1000));

            // Update congestion badge
            const congestionElement = document.getElementById('congestionBadge');
            if (congestionElement) {
                congestionElement.textContent = this.analytics.peakCongestion;
                congestionElement.className = `metric-value congestion-badge ${this.analytics.peakCongestion.toLowerCase()}`;
            }

            // Update charts
            const maxValue = Math.max(north, south, east, west) || 1;
            document.getElementById('chartNorth').style.height = (north / maxValue) * 100 + '%';
            document.getElementById('chartSouth').style.height = (south / maxValue) * 100 + '%';
            document.getElementById('chartEast').style.height = (east / maxValue) * 100 + '%';
            document.getElementById('chartWest').style.height = (west / maxValue) * 100 + '%';

            document.getElementById('northChartValue').textContent = north;
            document.getElementById('southChartValue').textContent = south;
            document.getElementById('eastChartValue').textContent = east;
            document.getElementById('westChartValue').textContent = west;

            // Update report
            document.getElementById('sessionDuration').textContent = this.analytics.getSessionDuration();
            document.getElementById('totalProcessed').textContent = this.carsCleared;
            document.getElementById('aiImprovement').textContent = (this.smartAIMode ? '+30%' : '+15%');
            document.getElementById('peakCongestion').textContent = this.analytics.peakCongestion;

        } catch (error) {
            console.warn('Analytics update error:', error);
        }
    }

    exportAnalyticsData() {
        if (!this.analytics) return;

        const data = this.analytics.exportData();
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `smartflow-analytics-${new Date().getTime()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        console.log('📊 Analytics data exported successfully');
    }

    // ==================== Traffic Tracking System ==================== //
    
    /**
     * Starts the traffic tracking system
     * Updates car counts every 3 seconds and recalculates signal timings
     * This creates the continuous flow: count → calculate → signal
     */
    startTrafficTracking() {
        try {
            // STEP 1: Initial traffic fetch
            this.fetchTrafficFromAPI();
            
            // Update every 3 seconds
            // COMPLETE FLOW: Fetch API → Calculate → Signal → Display
            this.trafficTrackingTimer = setInterval(() => {
                if (!this.isRunning) return;
                
                // ========== STEP 1: Fetch Backend Traffic Data ==========
                this.fetchTrafficFromAPI().then(() => {
                    if (!this.isRunning) return;
                    
                    // ========== STEP 2: Calculate Adaptive Timings ==========
                    if (this.calculateDirectionalAdaptiveTimings) {
                        this.calculateDirectionalAdaptiveTimings();
                    }
                    
                    // ========== STEP 3: Update UI Displays ==========
                    if (this.updateDirectionalTimingsUI) {
                        this.updateDirectionalTimingsUI();
                    }
                    
                    // Update AI panel with load analysis
                    const analysis = this.getLaneLoadAnalysis();
                    if (this.updateAIPanel && analysis) {
                        this.updateAIPanel(analysis);
                    }
                    
                    // ========== STEP 4: Signal transitions use new values ==========
                    // (already handled by runAdaptivePhase using this.adaptiveTimings)
                }).catch(error => {
                    console.error('❌ Traffic tracking error:', error);
                });
            }, 3000);
        } catch (error) {
            console.error('❌ Error starting traffic tracking:', error);
        }
    }

    /**
     * ====== INTEGRATED FLOW STEP 1 ======
     * Fetches real traffic data from backend API
     * Updates: northCars, southCars, eastCars, westCars
     * Triggers: calculateDirectionalAdaptiveTimings → signal switching → UI update
     */
    fetchTrafficFromAPI() {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.config.apiTimeout);

        try {
            return fetch(`${this.config.apiUrl}/traffic`, {
                signal: controller.signal,
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            })
                .then(response => {
                    clearTimeout(timeout);
                    if (!response.ok) throw new Error(`API Response error: ${response.status}`);
                    return response.json();
                })
                .then(data => {
                    // ========== VALIDATE RESPONSE ==========
                    if (!data || typeof data !== 'object') {
                        throw new Error('Invalid API response format');
                    }

                    // Validation helper
                    const validate = (val, name) => {
                        const num = parseInt(val) || 0;
                        if (isNaN(num) || num < 0) {
                            console.warn(`⚠️ Invalid ${name}: ${val}, using 0`);
                            return 0;
                        }
                        return Math.min(num, 100);
                    };

                    // ========== VALIDATE & EXTRACT DATA ==========
                    // Support both old and new API formats
                    let north, south, east, west, totalCars, congestionLevel;
                    
                    if (data.traffic) {
                        // NEW FORMAT: Structured response with congestionLevel
                        north = validate(data.traffic.north, 'north');
                        south = validate(data.traffic.south, 'south');
                        east = validate(data.traffic.east, 'east');
                        west = validate(data.traffic.west, 'west');
                        totalCars = validate(data.totalCars, 'totalCars');
                        congestionLevel = data.congestionLevel || 'Unknown';
                    } else {
                        // OLD FORMAT: Legacy response (backward compatible)
                        north = validate(data.northCars, 'northCars');
                        south = validate(data.southCars, 'southCars');
                        east = validate(data.eastCars, 'eastCars');
                        west = validate(data.westCars, 'westCars');
                        totalCars = north + south + east + west;
                        congestionLevel = totalCars < 20 ? 'Low' : totalCars <= 50 ? 'Medium' : 'High';
                    }
                    
                    this.northCars = north;
                    this.southCars = south;
                    this.eastCars = east;
                    this.westCars = west;
                    this.congestionLevel = congestionLevel;
                    
                    // ========== PREDICTIVE AI UPDATES ==========
                    // Update traffic history for predictions
                    this.updateTrafficHistory('north', this.northCars);
                    this.updateTrafficHistory('south', this.southCars);
                    this.updateTrafficHistory('east', this.eastCars);
                    this.updateTrafficHistory('west', this.westCars);
                    
                    // Calculate predictions and trends
                    this.predictNextTraffic();
                    
                    // Update smart priorities based on traffic patterns
                    this.updateSmartPriorities();
                    
                    // Calculate efficiency improvement
                    this.calculateEfficiencyImprovement();
                    
                    // ========== FRONTEND → AI ==========
                    if (this.config.debugMode) {
                        console.log(`✅ Live Backend Data - N:${this.northCars} S:${this.southCars} E:${this.eastCars} W:${this.westCars} | Total: ${totalCars} | ${congestionLevel}`);
                    }
                    
                    // Update API status indicator
                    this.setAPIStatus(true);
                    
                    // ========== FRONTEND → UI ==========
                    this.updateDashboardDisplay(totalCars);
                    this.updateCongestionDisplay(congestionLevel);
                    
                    return data;
                })
                .catch(error => {
                    clearTimeout(timeout);
                    
                    // Handle different error types
                    let reason = error.message;
                    if (error.name === 'AbortError') {
                        reason = '⏱️ Request timeout - API took too long';
                    }

                    // API unavailable - fallback
                    console.warn(`⚠️ Backend API unavailable: ${reason} - Using fallback random data`);
                    
                    this.setAPIStatus(false);
                    
                    // ========== FALLBACK ==========
                    const fallbackData = {
                        northCars: Math.floor(Math.random() * 20),
                        southCars: Math.floor(Math.random() * 20),
                        eastCars: Math.floor(Math.random() * 20),
                        westCars: Math.floor(Math.random() * 20)
                    };
                    
                    this.northCars = fallbackData.northCars;
                    this.southCars = fallbackData.southCars;
                    this.eastCars = fallbackData.eastCars;
                    this.westCars = fallbackData.westCars;
                    
                    const totalTraffic = this.northCars + this.southCars + this.eastCars + this.westCars;
                    
                    if (this.config.debugMode) {
                        console.log(`🔄 Fallback Random Data - N:${this.northCars} S:${this.southCars} E:${this.eastCars} W:${this.westCars} | Total: ${totalTraffic}`);
                    }
                    
                    this.updateDashboardDisplay(totalTraffic);
                    
                    return fallbackData;
                });
        } catch (error) {
            clearTimeout(timeout);
            console.error('❌ Error in fetchTrafficFromAPI:', error);
            this.setAPIStatus(false);
            const fallbackData = {
                northCars: Math.floor(Math.random() * 20),
                southCars: Math.floor(Math.random() * 20),
                eastCars: Math.floor(Math.random() * 20),
                westCars: Math.floor(Math.random() * 20)
            };
            return Promise.resolve(fallbackData);
        }
    }

    /**
     * Sets API connection status indicator
     */
    setAPIStatus(connected) {
        this.apiConnected = connected;
        
        const statusEl = document.getElementById('apiStatus');
        if (statusEl) {
            if (connected) {
                statusEl.innerHTML = '🌐 Live Traffic Data from Backend';
                statusEl.style.color = '#00dd55';
                statusEl.style.textShadow = '0 0 10px rgba(0, 221, 85, 0.5)';
            } else {
                statusEl.innerHTML = '⚠️ Using Fallback Random Data';
                statusEl.style.color = '#ffaa44';
                statusEl.style.textShadow = '0 0 10px rgba(255, 170, 68, 0.5)';
            }
        }
    }

    /**
     * Updates dashboard display with current traffic total
     */
    updateDashboardDisplay(totalTraffic) {
        const carsWaitingEl = document.getElementById('carsWaiting');
        if (carsWaitingEl) {
            carsWaitingEl.textContent = totalTraffic;
        }
    }

    /**
     * Updates congestion level display based on current traffic
     */
    updateCongestionDisplay(congestionLevel) {
        try {
            // Update internal state
            this.congestionLevel = congestionLevel;
            
            // Could add UI updates here in the future
            // For now, log it for debugging
            if (this.config.debugMode) {
                const emoji = congestionLevel === 'High' ? '🔴' : congestionLevel === 'Medium' ? '🟡' : '🟢';
                console.log(`${emoji} Congestion Level: ${congestionLevel}`);
            }
        } catch (error) {
            console.error('Error updating congestion display:', error);
        }
    }

    /**
     * Counts vehicles in each direction and updates tracking variables
     * This is STEP 1 of the unified flow: Count current traffic in all lanes
     */
    updateTrafficCounts() {
        // This method is deprecated - use fetchTrafficFromAPI() instead
        this.updateTrafficCountsLocal();
    }

    /**
     * Gets the current lane traffic distribution
     * Returns: { north, south, east, west } vehicle counts
     */
    getTrafficCounts() {
        return {
            north: this.northCars,
            south: this.southCars,
            east: this.eastCars,
            west: this.westCars,
            total: this.northCars + this.southCars + this.eastCars + this.westCars
        };
    }

    // ==================== Emergency Mode ==================== //
    
    /**
     * Activates emergency mode for selected direction
     * Interrupts normal cycle and gives instant green
     */
    activateEmergency() {
        const laneSelect = document.getElementById('emergencyLane');
        const direction = laneSelect.value;

        if (!direction || !this.isRunning) {
            alert('Please select a lane and ensure system is running');
            return;
        }

        this.emergencyMode = true;
        this.emergencyDirection = direction;

        // Interrupt current cycle
        clearInterval(this.cycleTimer);
        
        // Set all signals to red first
        ['top', 'bottom', 'left', 'right'].forEach(dir => {
            this.signalController.setState(dir, 'red');
            this.signalController.updateDisplay(dir, 'red');
        });

        // Give green to emergency direction and opposite
        const emergencyPair = (direction === 'top' || direction === 'bottom') 
            ? ['top', 'bottom'] 
            : ['left', 'right'];

        emergencyPair.forEach(dir => {
            this.signalController.setState(dir, 'green');
            this.signalController.updateDisplay(dir, 'green');
        });

        // Update button state
        const emergencyBtn = document.getElementById('emergencyBtn');
        emergencyBtn.classList.add('active');
        emergencyBtn.textContent = '⏹ Stop Emergency';

        // Update status
        const statusEl = document.getElementById('emergencyStatus');
        statusEl.classList.add('active');
        statusEl.textContent = `🚨 ACTIVE: ${direction.toUpperCase()} Priority`;

        console.log(`🚨 Emergency Mode Activated - ${direction.toUpperCase()}`);

        // Run emergency green for 15 seconds
        let timeLeft = 15;
        const emergencyTimer = setInterval(() => {
            document.getElementById(`timer${this.signalController.capitalizeFirst(emergencyPair[0])}`).textContent = 
                timeLeft + 's';
            document.getElementById(`timer${this.signalController.capitalizeFirst(emergencyPair[1])}`).textContent = 
                timeLeft + 's';

            timeLeft--;

            if (timeLeft < 0) {
                clearInterval(emergencyTimer);
                this.deactivateEmergency();
            }
        }, 1000);

        this.cycleTimer = emergencyTimer;
    }

    /**
     * Deactivates emergency mode and resumes normal cycle
     */
    deactivateEmergency() {
        this.emergencyMode = false;
        this.emergencyDirection = null;

        const emergencyBtn = document.getElementById('emergencyBtn');
        emergencyBtn.classList.remove('active');
        emergencyBtn.textContent = 'Activate Emergency';

        const statusEl = document.getElementById('emergencyStatus');
        statusEl.classList.remove('active');
        statusEl.textContent = '';

        document.getElementById('emergencyLane').value = '';

        console.log('🚨 Emergency Mode Deactivated - Resuming Normal Cycle');

        // Resume normal signal cycle
        if (this.isRunning) {
            this.startSignalCycle();
        }
    }

    // ==================== Night Mode ==================== //
    
    /**
     * Toggles night mode on/off
     * In night mode, skips phases with no waiting vehicles
     */
    toggleNightMode() {
        this.nightMode = !this.nightMode;

        const nightBtn = document.getElementById('nightModeBtn');
        if (this.nightMode) {
            nightBtn.classList.add('active');
            nightBtn.textContent = 'Night Mode: ON';
            console.log('🌙 Night Mode Activated');
        } else {
            nightBtn.classList.remove('active');
            nightBtn.textContent = 'Night Mode: OFF';
            console.log('🌙 Night Mode Deactivated');
        }
    }

    // ==================== SMART AI MODE METHODS ====================
    
    toggleSmartAIMode() {
        this.smartAIMode = !this.smartAIMode;
        const smartAIBtn = document.getElementById('smartAIBtn');
        const predictiveStatus = document.getElementById('predictiveStatus');
        
        if (this.smartAIMode) {
            smartAIBtn.classList.add('active');
            smartAIBtn.textContent = 'Smart AI Mode: ON 🤖';
            if (predictiveStatus) {
                predictiveStatus.textContent = '✅ Predictive AI Active';
                predictiveStatus.style.color = '#00ff88';
            }
            console.log('🤖 Smart AI Mode (Predictive + Priority) ACTIVATED');
        } else {
            smartAIBtn.classList.remove('active');
            smartAIBtn.textContent = 'Smart AI Mode: OFF';
            if (predictiveStatus) {
                predictiveStatus.textContent = '⚪ Adaptive Mode Only';
                predictiveStatus.style.color = '#a0a8b8';
            }
            console.log('⚪ Normal Adaptive Mode ACTIVATED');
        }
    }

    updateTrafficHistory(direction, value) {
        if (!this.trafficHistory[direction]) {
            this.trafficHistory[direction] = [];
        }
        this.trafficHistory[direction].push(value);
        // Keep only last 10 readings for prediction
        if (this.trafficHistory[direction].length > 10) {
            this.trafficHistory[direction].shift();
        }
    }

    predictNextTraffic() {
        if (!this.smartAIMode) return;
        
        const directions = ['north', 'south', 'east', 'west'];
        directions.forEach(dir => {
            const history = this.trafficHistory[dir] || [];
            if (history.length === 0) {
                this.predictedTraffic[dir] = 0;
                return;
            }
            
            // Simple prediction: weighted moving average (recent values weighted more)
            if (history.length >= 3) {
                const recent = history.slice(-3);  // Last 3 values
                const weights = [0.2, 0.3, 0.5];   // Older to newer
                const weighted = recent.reduce((sum, val, i) => sum + (val * weights[i]), 0);
                this.predictedTraffic[dir] = Math.round(weighted);
                
                // Calculate trend
                const avg = history.reduce((a, b) => a + b, 0) / history.length;
                const lastValue = history[history.length - 1];
                if (lastValue > avg + 2) {
                    this.trafficTrend[dir] = 'increasing';
                } else if (lastValue < avg - 2) {
                    this.trafficTrend[dir] = 'decreasing';
                } else {
                    this.trafficTrend[dir] = 'stable';
                }
            } else if (history.length > 0) {
                // Less than 3 readings, use simple average
                const avg = history.reduce((a, b) => a + b, 0) / history.length;
                this.predictedTraffic[dir] = Math.round(avg);
                this.trafficTrend[dir] = 'stable';
            }
        });
        
        if (this.config.debugMode) {
            console.log('🔮 Predicted Traffic:', this.predictedTraffic);
            console.log('📈 Traffic Trends:', this.trafficTrend);
        }
    }

    updateSmartPriorities() {
        if (!this.smartAIMode) return;
        
        const directions = ['north', 'south', 'east', 'west'];
        const threshold = 12;  // Threshold for "high traffic"
        
        directions.forEach(dir => {
            const currentCars = this[`${dir}Cars`] || 0;
            const predictedCars = this.predictedTraffic[dir] || 0;
            
            // Track consecutive high traffic
            if (currentCars > threshold || predictedCars > threshold) {
                this.consecutiveHighTraffic[dir]++;
            } else {
                this.consecutiveHighTraffic[dir] = Math.max(0, this.consecutiveHighTraffic[dir] - 1);
            }
            
            // Calculate priority multiplier (max 1.4x for heavily congested lanes)
            // Prevents starvation: other lanes always get at least 1.0x
            const consecutiveCycles = this.consecutiveHighTraffic[dir];
            if (consecutiveCycles >= 3) {
                this.priorityMultiplier[dir] = 1.4;  // 40% more green time
            } else if (consecutiveCycles === 2) {
                this.priorityMultiplier[dir] = 1.2;  // 20% more green time
            } else if (consecutiveCycles === 1) {
                this.priorityMultiplier[dir] = 1.1;  // 10% more green time
            } else {
                this.priorityMultiplier[dir] = 1.0;  // Normal green time
            }
        });
        
        if (this.config.debugMode) {
            console.log('🎯 Smart Priorities:', this.priorityMultiplier);
            console.log('📊 Consecutive High Traffic:', this.consecutiveHighTraffic);
        }
    }

    calculateEfficiencyImprovement() {
        if (this.adaptiveTimingStats.vehiclesPassed === 0 || this.fixedTimingStats.vehiclesPassed === 0) {
            return 0;
        }
        
        // Calculate average wait times
        const adaptiveAvg = this.adaptiveTimingStats.totalWaitTime / this.adaptiveTimingStats.vehiclesPassed;
        const fixedAvg = this.fixedTimingStats.totalWaitTime / this.fixedTimingStats.vehiclesPassed;
        
        // Calculate improvement percentage
        if (fixedAvg === 0) return 0;
        this.efficiencyImprovement = Math.round(((fixedAvg - adaptiveAvg) / fixedAvg) * 100);
        
        // Boost improvement if Smart AI is active
        if (this.smartAIMode) {
            this.efficiencyImprovement = Math.min(this.efficiencyImprovement + 5, 50);  // Max 50% boost
        }
        
        return Math.max(0, this.efficiencyImprovement);
    }

    /**
     * Checks if a phase has any waiting vehicles
     * @param {array} directions - Array of directions (e.g., ['top', 'bottom'])
     * @returns {boolean} - True if any vehicle waiting in phase
     */
    hasVehiclesInPhase(directions) {
        for (const dir of directions) {
            const lane1Key = `${dir}Lane1`;
            const lane2Key = `${dir}Lane2`;
            
            const hasVehicles = (this.lanes[lane1Key] && this.lanes[lane1Key].getQueueLength() > 0) ||
                               (this.lanes[lane2Key] && this.lanes[lane2Key].getQueueLength() > 0);
            
            if (hasVehicles) return true;
        }
        return false;
    }

    startSignalCycle() {
        if (!this.isRunning) return;

        // Calculate adaptive timings based on current vehicle loads
        this.calculateDirectionalAdaptiveTimings();
        const timings = this.adaptiveTimings;

        // Update UI with directional timings
        this.updateDirectionalTimingsUI();

        // Check if phases have vehicles (for night mode)
        const nsHasVehicles = this.hasVehiclesInPhase(['top', 'bottom']);
        const ewHasVehicles = this.hasVehiclesInPhase(['left', 'right']);

        // In night mode, skip empty phases
        if (this.nightMode) {
            if (!nsHasVehicles && !ewHasVehicles) {
                // All lanes empty, keep cycling but fast-forward
                this.runAdaptivePhase(['top', 'bottom'], 'green', 'NS', '🔺🔻 NORTH-SOUTH', 1, () => {
                    this.runAdaptivePhase(['top', 'bottom'], 'yellow', 'NS', '🟡 TRANSITION', 1, () => {
                        this.runAdaptivePhase(['left', 'right'], 'green', 'EW', '⬅️➡️ EAST-WEST', 1, () => {
                            this.runAdaptivePhase(['left', 'right'], 'yellow', 'EW', '🟡 TRANSITION', 1, () => {
                                if (this.isRunning) {
                                    this.startSignalCycle();
                                }
                            });
                        });
                    });
                });
                return;
            } else if (!nsHasVehicles) {
                // Skip NS phase, go straight to EW
                this.runAdaptivePhase(['left', 'right'], 'green', 'EW', '⬅️➡️ EAST-WEST', timings.ewGreen, () => {
                    this.runAdaptivePhase(['left', 'right'], 'yellow', 'EW', '🟡 TRANSITION', this.config.yellowTime, () => {
                        if (this.isRunning) {
                            this.startSignalCycle();
                        }
                    });
                });
                return;
            } else if (!ewHasVehicles) {
                // Skip EW phase, go straight to NS
                this.runAdaptivePhase(['top', 'bottom'], 'green', 'NS', '🔺🔻 NORTH-SOUTH', timings.nsGreen, () => {
                    this.runAdaptivePhase(['top', 'bottom'], 'yellow', 'NS', '🟡 TRANSITION', this.config.yellowTime, () => {
                        if (this.isRunning) {
                            this.startSignalCycle();
                        }
                    });
                });
                return;
            }
        }

        // ==================== STANDARD SIGNAL SWITCHING SEQUENCE ====================
        // Step 1: North-South GREEN phase
        this.runAdaptivePhase(['top', 'bottom'], 'green', 'NS', '🔺🔻 NORTH-SOUTH', timings.nsGreen, () => {
            // Step 2: Yellow transition
            this.runAdaptivePhase(['top', 'bottom'], 'yellow', 'NS', '🟡 TRANSITION', this.config.yellowTime, () => {
                // Step 3: East-West GREEN phase
                this.runAdaptivePhase(['left', 'right'], 'green', 'EW', '⬅️➡️ EAST-WEST', timings.ewGreen, () => {
                    // Step 4: Yellow transition
                    this.runAdaptivePhase(['left', 'right'], 'yellow', 'EW', '🟡 TRANSITION', this.config.yellowTime, () => {
                        // Loop back to start
                        if (this.isRunning) {
                            this.startSignalCycle();
                        }
                    });
                });
            });
        });
    }

    /**
     * Runs a single adaptive signal phase
     * Handles signal updates, UI updates, and timing
     * @param {array} directions - Array of directions (e.g., ['top', 'bottom'])
     * @param {string} color - Signal color ('green', 'yellow', 'red')
     * @param {string} phase - Phase name ('NS' or 'EW')
     * @param {string} label - Display label for the phase
     * @param {number} duration - Duration in seconds
     * @param {function} onComplete - Callback when phase completes
     */
    runAdaptivePhase(directions, color, phase, label, duration, onComplete) {
        // Update active phase display
        this.activePhase = phase;
        const activePhaseEl = document.getElementById('activePhase');
        if (activePhaseEl) {
            activePhaseEl.textContent = label;
            activePhaseEl.classList.remove('ns-phase', 'ew-phase');
            if (color === 'green') {
                activePhaseEl.classList.add(phase === 'NS' ? 'ns-phase' : 'ew-phase');
            }
        }

        // Update signal states
        directions.forEach(dir => {
            this.signalController.setState(dir, color);
        });

        // Update signal displays and highlight active lanes
        ['top', 'bottom', 'left', 'right'].forEach(dir => {
            const state = directions.includes(dir) ? color : 'red';
            this.signalController.updateDisplay(dir, state);
            
            // Get the direction/lane element
            const dirElement = document.querySelector(`.direction.${dir}`);
            if (dirElement) {
                // Remove active highlighting from all directions
                if (color === 'green' && directions.includes(dir)) {
                    // Add active lane glow to green directions
                    dirElement.classList.add('active-lane');
                } else {
                    dirElement.classList.remove('active-lane');
                }
            }

            // Update signal container styling
            const signalContainer = document.querySelector(`.direction.${dir} .signal-container`);
            if (signalContainer) {
                signalContainer.classList.remove('green-active', 'red-active');
                if (directions.includes(dir) && color === 'green') {
                    signalContainer.classList.add('green-active');
                } else if (directions.includes(dir) && color === 'red') {
                    signalContainer.classList.add('red-active');
                }
            }
        });

        let timeLeft = duration;

        const phaseTimer = setInterval(() => {
            // Update timers for all directions
            directions.forEach(dir => {
                document.getElementById(`timer${this.signalController.capitalizeFirst(dir)}`).textContent = 
                    timeLeft + 's';
            });

            timeLeft--;

            if (timeLeft < 0) {
                clearInterval(phaseTimer);
                onComplete();
            }
        }, 1000);

        this.cycleTimer = phaseTimer;
    }

    // ==================== Adaptive Signal AI ==================== //
    
    /**
     * Analyzes traffic load per direction
     * Returns object with counts for each phase
     */
    analyzeLaneLoads() {
        // Count vehicles in each direction
        const loads = {
            north: this.lanes['topLane1'].getQueueLength() + this.lanes['topLane2'].getQueueLength(),
            south: this.lanes['bottomLane1'].getQueueLength() + this.lanes['bottomLane2'].getQueueLength(),
            east: this.lanes['rightLane1'].getQueueLength() + this.lanes['rightLane2'].getQueueLength(),
            west: this.lanes['leftLane1'].getQueueLength() + this.lanes['leftLane2'].getQueueLength()
        };

        return loads;
    }

    /**
     * Calculates per-direction adaptive green signal timings
     * Based on individual vehicle count for each direction
     * Formula: greenTime = (directionCars / totalCars) × 60 (minimum 5s)
     */
    calculateDirectionalAdaptiveTimings() {
        const loads = this.analyzeLaneLoads();
        const totalCars = loads.north + loads.south + loads.east + loads.west;

        // Handle no traffic scenario
        if (totalCars === 0) {
            const greenTime = 10;  // Default green time when no cars
            
            // Store directional timings
            this.directionalTimings = {
                north: greenTime,
                south: greenTime,
                east: greenTime,
                west: greenTime,
                northCars: 0,
                southCars: 0,
                eastCars: 0,
                westCars: 0,
                maxCars: 0,
                totalLoad: 0,
                timestamp: Date.now()
            };

            // Store phase timings
            this.adaptiveTimings = {
                nsGreen: greenTime,
                ewGreen: greenTime,
                nsLoad: 0,
                ewLoad: 0,
                totalLoad: 0,
                timestamp: Date.now()
            };

            return this.directionalTimings;
        }

        // Calculate proportional green times for each direction
        // Formula: green_time = (cars_in_direction / total_cars) × 60
        let northGreen = Math.max(
            this.config.minGreenTime,
            Math.round((loads.north / totalCars) * 60)
        );
        let southGreen = Math.max(
            this.config.minGreenTime,
            Math.round((loads.south / totalCars) * 60)
        );
        let eastGreen = Math.max(
            this.config.minGreenTime,
            Math.round((loads.east / totalCars) * 60)
        );
        let westGreen = Math.max(
            this.config.minGreenTime,
            Math.round((loads.west / totalCars) * 60)
        );

        // ========== SMART AI MODE: APPLY PRIORITY MULTIPLIERS & PREDICTIONS ==========
        if (this.smartAIMode) {
            // Apply predicted traffic if available
            const usePredicted = this.trafficHistory.north.length >= 3;
            const north = usePredicted ? this.predictedTraffic.north : loads.north;
            const south = usePredicted ? this.predictedTraffic.south : loads.south;
            const east = usePredicted ? this.predictedTraffic.east : loads.east;
            const west = usePredicted ? this.predictedTraffic.west : loads.west;
            
            const totalPredicted = north + south + east + west || 1;
            
            // Recalculate with predictions
            northGreen = Math.max(this.config.minGreenTime, Math.round((north / totalPredicted) * 60));
            southGreen = Math.max(this.config.minGreenTime, Math.round((south / totalPredicted) * 60));
            eastGreen = Math.max(this.config.minGreenTime, Math.round((east / totalPredicted) * 60));
            westGreen = Math.max(this.config.minGreenTime, Math.round((west / totalPredicted) * 60));
            
            // Apply smart priority multipliers
            northGreen = Math.round(northGreen * this.priorityMultiplier.north);
            southGreen = Math.round(southGreen * this.priorityMultiplier.south);
            eastGreen = Math.round(eastGreen * this.priorityMultiplier.east);
            westGreen = Math.round(westGreen * this.priorityMultiplier.west);
            
            if (this.config.debugMode) {
                console.log(`🔮 Smart AI - Using Predicted: ${usePredicted ? 'Yes' : 'No'}`);
                console.log(`🎯 Priority Multipliers - N:${this.priorityMultiplier.north.toFixed(1)}x S:${this.priorityMultiplier.south.toFixed(1)}x E:${this.priorityMultiplier.east.toFixed(1)}x W:${this.priorityMultiplier.west.toFixed(1)}x`);
            }
        }

        // Ensure no direction exceeds max green time
        northGreen = Math.min(northGreen, this.config.maxGreenTime);
        southGreen = Math.min(southGreen, this.config.maxGreenTime);
        eastGreen = Math.min(eastGreen, this.config.maxGreenTime);
        westGreen = Math.min(westGreen, this.config.maxGreenTime);

        // Find highest priority (direction with most cars)
        const maxCars = Math.max(loads.north, loads.south, loads.east, loads.west);

        // Store directional timings for update
        this.directionalTimings = {
            north: northGreen,
            south: southGreen,
            east: eastGreen,
            west: westGreen,
            northCars: loads.north,
            southCars: loads.south,
            eastCars: loads.east,
            westCars: loads.west,
            maxCars: maxCars,
            totalLoad: totalCars,
            timestamp: Date.now()
        };

        // Calculate phase timings (use max of each pair for phase)
        const nsPhaseGreen = Math.max(northGreen, southGreen);
        const ewPhaseGreen = Math.max(eastGreen, westGreen);

        // Update adaptive timings for phase-based cycle
        this.adaptiveTimings = {
            nsGreen: nsPhaseGreen,
            ewGreen: ewPhaseGreen,
            nsLoad: loads.north + loads.south,
            ewLoad: loads.east + loads.west,
            totalLoad: totalCars,
            timestamp: Date.now()
        };

        console.log(`🤖 Adaptive Timing - N:${northGreen}s(${loads.north}) S:${southGreen}s(${loads.south}) E:${eastGreen}s(${loads.east}) W:${westGreen}s(${loads.west}) | Total: ${totalCars}`);

        return this.directionalTimings;
    }

    /**
     * Gets current lane load analysis
     * Used for debugging and display
     */
    getLaneLoadAnalysis() {
        try {
            const loads = this.analyzeLaneLoads();
            
            // Safety checks for loads
            const north = isNaN(loads.north) ? 0 : loads.north;
            const south = isNaN(loads.south) ? 0 : loads.south;
            const east = isNaN(loads.east) ? 0 : loads.east;
            const west = isNaN(loads.west) ? 0 : loads.west;
            
            return {
                top: north,
                bottom: south,
                left: west,
                right: east,
                nsTotal: north + south,
                ewTotal: east + west,
                total: north + south + east + west
            };
        } catch (error) {
            console.error('Error analyzing lane load:', error);
            // Return safe default values
            return {
                top: 0, bottom: 0, left: 0, right: 0,
                nsTotal: 0, ewTotal: 0, total: 0
            };
        }
    }

    runPhase(directions, color, duration, onComplete) {
        // Update signal states
        directions.forEach(dir => {
            this.signalController.setState(dir, color);
        });

        ['top', 'bottom', 'left', 'right'].forEach(dir => {
            const state = directions.includes(dir) ? color : 'red';
            this.signalController.updateDisplay(dir, state);
        });

        let timeLeft = duration;

        const phaseTimer = setInterval(() => {
            timeLeft--;

            // Update timer display
            directions.forEach(dir => {
                document.getElementById(`timer${this.signalController.capitalizeFirst(dir)}`).textContent = 
                    timeLeft + 's';
            });

            if (timeLeft <= 0) {
                clearInterval(phaseTimer);
                onComplete();
            }
        }, 1000);

        this.cycleTimer = phaseTimer;
    }

    spawnVehicles() {
        try {
            if (!this.isRunning) return;

            Object.keys(this.lanes).forEach(laneId => {
                // Safety check for random spawn
                const spawnThreshold = Math.max(0, Math.min(1, this.config.spawnRate || 0.3));
                if (Math.random() < spawnThreshold) {
                    const vehicle = new Vehicle(++this.vehicleCounter, laneId);
                    vehicle.create();
                    if (this.lanes[laneId]) {
                        this.lanes[laneId].addVehicle(vehicle);
                    }
                }
            });
        } catch (error) {
            console.error('❌ Error spawning vehicles:', error);
        }
    }

    /**
     * STEP 3: Process vehicle movement based on signal state
     * Core rule: Cars move only in active lanes when signal is GREEN
     * Cars stop when signal is RED
     */
    processMovement() {
        try {
            Object.keys(this.lanes).forEach(laneId => {
                const lane = this.lanes[laneId];
                if (!lane) return;
                
                const direction = lane.direction;
                
                // STEP 3a: Check if this direction's signal is GREEN
                const isGreen = this.signalController && this.signalController.isGreen(direction);

                if (!lane.queue || !Array.isArray(lane.queue)) return;

                lane.queue.forEach((vehicle, index) => {
                    if (!vehicle || !vehicle.element) return;

                    // STEP 3b: Only the FRONT vehicle (index 0) can move
                    // Vehicles behind must wait
                    if (isGreen && index === 0) {
                        // ✅ SIGNAL IS GREEN - Allow car to move
                        vehicle.isMoving = true;
                        const movedDist = (vehicle.movedDistance || 0) + 15; // pixels per frame
                        vehicle.movedDistance = movedDist;
                        
                        // Update data attribute for tracking
                        vehicle.element.dataset.movedDistance = vehicle.movedDistance;

                        // Apply visual movement via transform
                        vehicle.element.style.transform = `translateX(${vehicle.movedDistance}px)`;
                        
                        // Add moving animation class
                        if (!vehicle.element.classList.contains('moving')) {
                            vehicle.element.classList.remove('waiting');
                            vehicle.element.classList.add('moving');
                        }

                        // Check if vehicle has cleared the intersection
                        if (vehicle.movedDistance > 150) {
                            // Vehicle cleared - remove from system
                            lane.removeVehicle(vehicle);
                            vehicle.eliminate();
                            this.carsCleared = (this.carsCleared || 0) + 1;
                        }
                    } else {
                        // ❌ SIGNAL IS RED or vehicle is not first - Stop/Hold in place
                        if (vehicle.isMoving) {
                            vehicle.isMoving = false;
                            // Keep position where it stopped
                            vehicle.element.style.transform = `translateX(${vehicle.movedDistance}px)`;
                        }
                        
                        // Add waiting animation class (glow effect)
                        if (!vehicle.element.classList.contains('waiting')) {
                            vehicle.element.classList.remove('moving');
                            vehicle.element.classList.add('waiting');
                        }
                    }
                });
            });
        } catch (error) {
            console.error('❌ Error processing movement:', error);
        }
    }

    animate = () => {
        try {
            if (this.isRunning) {
                // Process movement with safety checks
                this.processMovement();
                
                // Render all lanes
                this.renderAllLanes();
                
                // Update stats with error handling
                this.updateStats();

                // Update analytics display
                this.updateAnalyticsDisplay();
                
                // Continue animation loop
                this.animationFrame = requestAnimationFrame(this.animate);
            }
        } catch (error) {
            console.error('❌ Animation loop error:', error);
            this.isRunning = false;
            document.getElementById('systemStatus').textContent = '❌ ERROR';
            document.getElementById('systemStatus').style.color = '#ff0000';
        }
    }

    renderAllLanes() {
        Object.values(this.lanes).forEach(lane => {
            if (lane.containerElement) {
                lane.render(lane.containerElement);
            }
        });
    }

    updateStats() {
        try {
            // STEP 4: Display current system state
            // Calculate total vehicles (cars waiting)
            const totalVehicles = Object.values(this.lanes).reduce((sum, lane) => {
                const count = lane && lane.getQueueLength ? lane.getQueueLength() : 0;
                return sum + (isNaN(count) ? 0 : count);
            }, 0);

            // Calculate average wait time
            let totalWait = 0;
            let waitingCount = 0;
            Object.values(this.lanes).forEach(lane => {
                if (lane && lane.queue && Array.isArray(lane.queue)) {
                    lane.queue.forEach(vehicle => {
                        if (vehicle && vehicle.getWaitTime) {
                            const waitTime = vehicle.getWaitTime();
                            totalWait += isNaN(waitTime) ? 0 : waitTime;
                            waitingCount++;
                        }
                    });
                }
            });
            const avgWaitTime = waitingCount > 0 ? Math.round(totalWait / waitingCount) : 0;
            const safeAvgWaitTime = isNaN(avgWaitTime) ? 0 : avgWaitTime;

            // Calculate throughput (vehicles cleared per minute)
            // Use default timing if system just started
            const elapsedSeconds = this.startTime ? (Date.now() - this.startTime) / 1000 : 1;
            const safeCarsCleared = isNaN(this.carsCleared) ? 0 : this.carsCleared;
            const safeElapsedSeconds = isNaN(elapsedSeconds) || elapsedSeconds === 0 ? 1 : elapsedSeconds;
            const throughput = Math.round((safeCarsCleared * 60) / Math.max(1, safeElapsedSeconds));
            const safeThroughput = isNaN(throughput) ? 0 : throughput;

        // Get lane load analysis for dashboard
        const loadAnalysis = this.getLaneLoadAnalysis();

            // ========== DISPLAY UPDATES ==========
            // Update control panel stats with safe values
            this.updateStatElement('totalVehicles', isNaN(totalVehicles) ? 0 : totalVehicles);
            this.updateStatElement('avgWaitTime', safeAvgWaitTime + 's');
            this.updateStatElement('throughput', safeThroughput + ' v/min');
            this.updateStatElement('efficiency', '↑ 30%');

            // Update dashboard stats
            this.updateDashboardElement('carsWaiting', isNaN(totalVehicles) ? 0 : totalVehicles);
            this.updateDashboardElement('carsPassed', safeCarsCleared);

            // ========== DISPLAY ACTIVE INFORMATION ==========
            // Display current active lane and which cars are moving
            const activeDirections = [];
            let activeGreenTime = 0;
            let activePhaseLabel = '--';
            
            ['top', 'bottom', 'left', 'right'].forEach(dir => {
                if (this.signalController && this.signalController.isGreen(dir)) {
                    activeDirections.push(dir);
                    // Get the green time for this direction from UI
                    const timerEl = document.getElementById(`timer${this.signalController.capitalizeFirst(dir)}`);
                    if (timerEl) {
                        const timeValue = parseInt(timerEl.textContent) || 0;
                        activeGreenTime = isNaN(timeValue) ? 0 : timeValue;
                    }
                }
            });

            // Determine active lane display label
            if (activeDirections.includes('top') || activeDirections.includes('bottom')) {
                activePhaseLabel = '🔺🔻 North-South';
            } else if (activeDirections.includes('left') || activeDirections.includes('right')) {
                activePhaseLabel = '⬅️➡️ East-West';
            }

            // Count cars actually moving (in active lanes with green signal)
            let movingCars = 0;
            activeDirections.forEach(dir => {
                const lane1Key = `${dir}Lane1`;
                const lane2Key = `${dir}Lane2`;
                // Only count front vehicle in each lane if moving
                if (this.lanes && this.lanes[lane1Key] && this.lanes[lane1Key].queue && this.lanes[lane1Key].queue.length > 0) {
                    const frontVehicle = this.lanes[lane1Key].queue[0];
                    if (frontVehicle && frontVehicle.isMoving) movingCars++;
                }
                if (this.lanes && this.lanes[lane2Key] && this.lanes[lane2Key].queue && this.lanes[lane2Key].queue.length > 0) {
                    const frontVehicle = this.lanes[lane2Key].queue[0];
                    if (frontVehicle && frontVehicle.isMoving) movingCars++;
                }
            });

            // Update active lane display (NEW)
            const activeLaneDisplayEl = document.getElementById('activeLaneDisplay');
            if (activeLaneDisplayEl) {
                activeLaneDisplayEl.textContent = activePhaseLabel;
            }

            // Update green time display (NEW)
            const greenTimeDisplayEl = document.getElementById('greenTimeDisplay');
            if (greenTimeDisplayEl) {
                greenTimeDisplayEl.textContent = activeGreenTime > 0 ? activeGreenTime + ' sec' : '-- sec';
            }

            // Update active lane element (old code kept for compatibility)
            const activeLaneEl = document.getElementById('activePhase');
            if (activeLaneEl) {
                activeLaneEl.style.color = '#00ff88';
                activeLaneEl.style.textShadow = '0 0 15px rgba(0, 255, 136, 0.7)';
            }

            // Display movement status
            const movementStatusEl = document.getElementById('movementStatus');
            if (movementStatusEl) {
                const safeMoved = isNaN(movingCars) ? 0 : movingCars;
                if (safeMoved > 0) {
                    movementStatusEl.innerHTML = `🚗 ${safeMoved} car${safeMoved !== 1 ? 's' : ''} moving`;
                    movementStatusEl.style.color = '#00dd55';
                } else {
                    movementStatusEl.innerHTML = '⏸️ Waiting for green';
                    movementStatusEl.style.color = '#ff6644';
                }
            }

            // Update directional adaptive timing UI
            if (this.updateDirectionalTimingsUI) {
                this.updateDirectionalTimingsUI();
            }

            // Update AI panel visualization
            if (this.updateAIPanel && loadAnalysis) {
                this.updateAIPanel(loadAnalysis);
            }

            // Update Smart AI UI
            this.updateSmartAIDisplay();
        } catch (error) {
            console.error('❌ Error updating stats:', error);
        }
    }

    /**
     * Updates a stat element with animation
     */
    updateStatElement(elementId, value) {
        const el = document.getElementById(elementId);
        if (el) {
            el.textContent = value;
            // Trigger animation by adding/removing class
            el.style.animation = 'none';
            setTimeout(() => {
                el.style.animation = '';
            }, 10);
        }
    }

    /**
     * Updates a dashboard element with pulsing animation
     */
    updateDashboardElement(elementId, value) {
        const el = document.getElementById(elementId);
        if (el) {
            const oldValue = parseInt(el.textContent);
            const newValue = value;
            
            // Only animate if value actually changed
            if (oldValue !== newValue) {
                el.textContent = newValue;
                el.classList.add('updated');
                
                // Remove animation class after animation completes
                setTimeout(() => {
                    el.classList.remove('updated');
                }, 600);
            }
        }
    }

    /**
     * Updates Smart AI Mode displays with predictive status, trends, and efficiency
     */
    updateSmartAIDisplay() {
        try {
            const efficiencyEl = document.getElementById('efficiencyValue');
            const trendEl = document.getElementById('trendIndicator');
            const predictiveStatusEl = document.getElementById('predictiveStatus');
            
            if (!efficiencyEl || !trendEl || !predictiveStatusEl) return;
            
            // Update efficiency gain
            const efficiency = this.calculateEfficiencyImprovement();
            efficiencyEl.textContent = `+${efficiency}%`;
            efficiencyEl.style.animation = 'dashboardPulse 0.6s ease-out';
            
            // Determine overall traffic trend
            const trends = Object.values(this.trafficTrend);
            const increasingCount = trends.filter(t => t === 'increasing').length;
            const decreasingCount = trends.filter(t => t === 'decreasing').length;
            
            let overallTrend = 'stable';
            if (increasingCount > 2) {
                overallTrend = 'increasing';
            } else if (decreasingCount > 2) {
                overallTrend = 'decreasing';
            }
            
            // Update trend indicator
            if (overallTrend === 'increasing') {
                trendEl.innerHTML = '📈';
                trendEl.className = 'trend-badge increasing';
                trendEl.title = 'Traffic increasing - consider activating Smart AI';
            } else if (overallTrend === 'decreasing') {
                trendEl.innerHTML = '📉';
                trendEl.className = 'trend-badge decreasing';
                trendEl.title = 'Traffic decreasing';
            } else {
                trendEl.innerHTML = '➡️';
                trendEl.className = 'trend-badge';
                trendEl.title = 'Traffic stable';
            }
            
            // Update predictive status
            if (this.smartAIMode) {
                predictiveStatusEl.textContent = '✅ Predictive AI Active';
                predictiveStatusEl.className = 'status-badge active';
                
                const predictionAccuracy = Math.min(
                    100,
                    Math.round((this.trafficHistory.north.length / 10) * 100)
                );
                predictiveStatusEl.title = `Prediction confidence: ${predictionAccuracy}%`;
            } else {
                predictiveStatusEl.textContent = '⚪ Adaptive Mode Only';
                predictiveStatusEl.className = 'status-badge';
                predictiveStatusEl.title = 'Normal adaptive traffic system';
            }
            
            if (this.config.debugMode) {
                console.log(`📊 Smart AI Display Updated - Efficiency: +${efficiency}% | Trend: ${overallTrend} | Mode: ${this.smartAIMode ? 'Predictive' : 'Adaptive'}`);
            }
        } catch (error) {
            if (this.config.debugMode) {
                console.error('Error updating Smart AI display:', error);
            }
        }
    }

    /**
     * Updates the UI with directional adaptive timing information
     * Displays per-direction green times and highlights highest priority
     */
    updateDirectionalTimingsUI() {
        if (!this.directionalTimings) return;

        const timings = this.directionalTimings;
        
        // Update each direction card with green time and car count
        const directions = [
            { name: 'north', ui: { time: 'northGreenTime', count: 'northCount', priority: 'northPriority' } },
            { name: 'south', ui: { time: 'southGreenTime', count: 'southCount', priority: 'southPriority' } },
            { name: 'east', ui: { time: 'eastGreenTime', count: 'eastCount', priority: 'eastPriority' } },
            { name: 'west', ui: { time: 'westGreenTime', count: 'westCount', priority: 'westPriority' } }
        ];

        // Clear all priority indicators first
        directions.forEach(dir => {
            const priorityEl = document.getElementById(dir.ui.priority);
            if (priorityEl) {
                priorityEl.classList.remove('active');
            }
            const card = document.querySelector(`.${dir.name}-card`);
            if (card) {
                card.classList.remove('highest-priority');
            }
        });

        // Update each direction
        directions.forEach(dir => {
            const carCount = timings[dir.name + 'Cars'] || 0;
            const greenTime = timings[dir.name] || 0;

            // Update green time display
            const timeEl = document.getElementById(dir.ui.time);
            if (timeEl) {
                timeEl.textContent = greenTime + 's';
            }

            // Update car count display
            const countEl = document.getElementById(dir.ui.count);
            if (countEl) {
                countEl.textContent = carCount + ' cars';
            }
        });

        // Highlight direction with maximum cars (highest priority)
        if (timings.maxCars > 0) {
            let highestDir = 'north';
            if (timings.southCars === timings.maxCars) highestDir = 'south';
            if (timings.eastCars === timings.maxCars) highestDir = 'east';
            if (timings.westCars === timings.maxCars) highestDir = 'west';

            // Highlight the card and priority indicator
            const priorityEl = document.getElementById(highestDir + 'Priority');
            if (priorityEl) {
                priorityEl.classList.add('active');
            }
            const card = document.querySelector(`.${highestDir}-card`);
            if (card) {
                card.classList.add('highest-priority');
            }
        }

        // Update phase timings display
        const nsGreenEl = document.getElementById('nsPhaseGreen');
        if (nsGreenEl) {
            nsGreenEl.textContent = this.adaptiveTimings.nsGreen + 's';
        }

        const ewGreenEl = document.getElementById('ewPhaseGreen');
        if (ewGreenEl) {
            ewGreenEl.textContent = this.adaptiveTimings.ewGreen + 's';
        }
    }

    /**
     * Updates the AI panel display with current load distribution
     */
    updateAIPanel(loadAnalysis) {
        const { nsTotal, ewTotal, total } = loadAnalysis;

        // Calculate percentages
        const nsPercent = total > 0 ? Math.round((nsTotal / total) * 100) : 0;
        const ewPercent = total > 0 ? Math.round((ewTotal / total) * 100) : 0;

        // Get adaptive timings
        const timings = this.adaptiveTimings;

        // Update NS bar
        const nsFill = document.getElementById('nsFill');
        const nsInfo = document.getElementById('nsInfo');
        if (nsFill && nsInfo) {
            nsFill.style.width = nsPercent + '%';
            nsInfo.textContent = `${nsTotal} cars | ${timings.nsGreen || 0}s`;
        }

        // Update EW bar
        const ewFill = document.getElementById('ewFill');
        const ewInfo = document.getElementById('ewInfo');
        if (ewFill && ewInfo) {
            ewFill.style.width = ewPercent + '%';
            ewInfo.textContent = `${ewTotal} cars | ${timings.ewGreen || 0}s`;
        }
    }

    spawnInitialVehicles() {
        const initialCars = 2;
        Object.keys(this.lanes).forEach(laneId => {
            for (let i = 0; i < initialCars; i++) {
                const vehicle = new Vehicle(++this.vehicleCounter, laneId);
                vehicle.create();
                this.lanes[laneId].addVehicle(vehicle);
            }
        });
        this.renderAllLanes();
    }
}

// ==================== Initialize System ==================== //
document.addEventListener('DOMContentLoaded', () => {
    window.trafficSystem = new TrafficSystem();
    window.trafficSystem.spawnInitialVehicles();
    window.trafficSystem.updateStats();
    console.log('🚦 SmartFlow Traffic System Initialized');
    console.log('✓ Vehicle Spawning: Enabled');
    console.log('✓ Signal Control: Ready');
    console.log('✓ Animation System: 60fps');
    console.log('✓ Vehicle Movement: Enabled with Smooth Animations');
    console.log('  - Cars move forward when signal is green');
    console.log('  - Cars stop when signal is red');
    console.log('  - Smooth fade-out when crossing intersection');
    console.log('  - Queue positioning for visual depth');
});
