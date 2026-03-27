const express = require('express');
const cors = require('cors');

const app = express();

// ========== PRODUCTION-LIKE STORAGE ==========

// Store last N traffic readings for predictive AI
const trafficHistory = {
    north: [],
    south: [],
    east: [],
    west: [],
    maxHistory: 10  // Keep last 10 readings
};

// Store last 5 API responses for history/analytics
const apiResponseHistory = [];
const maxResponseHistory = 5;

// Server state
const serverState = {
    mode: 'Predictive',  // 'AI' or 'Predictive'
    startTime: new Date(),
    totalRequests: 0
};

function updateTrafficHistory(direction, value) {
    if (!trafficHistory[direction]) trafficHistory[direction] = [];
    trafficHistory[direction].push(value);
    if (trafficHistory[direction].length > trafficHistory.maxHistory) {
        trafficHistory[direction].shift();
    }
}

function getTrafficHistory() {
    return {
        north: [...trafficHistory.north],
        south: [...trafficHistory.south],
        east: [...trafficHistory.east],
        west: [...trafficHistory.west]
    };
}

/**
 * Calculate congestion level based on total cars
 * Low: < 20
 * Medium: 20-50
 * High: > 50
 */
function calculateCongestionLevel(totalCars) {
    if (totalCars < 20) return 'Low';
    if (totalCars <= 50) return 'Medium';
    return 'High';
}

/**
 * Store response in history (last 5)
 */
function storeResponseHistory(response) {
    apiResponseHistory.push({
        ...response,
        storedAt: new Date().toISOString()
    });
    
    if (apiResponseHistory.length > maxResponseHistory) {
        apiResponseHistory.shift();
    }
}

// ========== SECURITY & MIDDLEWARE ==========

// Restrict CORS to specific origins
app.use(cors({
    origin: process.env.CORS_ORIGIN || ['http://localhost:3000', 'http://localhost:8000', 'http://127.0.0.1:3000', 'http://127.0.0.1:8000'],
    methods: ['GET', 'POST'],
    credentials: true,
    maxAge: 3600
}));

// Logging middleware
app.use((req, res, next) => {
    console.log(`📡 ${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// ========== ENHANCED TRAFFIC API WITH PRODUCTION STRUCTURE ==========

/**
 * GET /traffic
 * Returns structured traffic data with congestion levels and history
 */
app.get('/traffic', (req, res) => {
    try {
        serverState.totalRequests++;
        
        // Validate query parameters
        const { min = 0, max = 20, includeHistory = 'true' } = req.query;
        const minVal = Math.max(0, parseInt(min) || 0);
        const maxVal = Math.min(100, parseInt(max) || 20);
        const shouldIncludeHistory = includeHistory === 'true';
        
        if (minVal > maxVal) {
            return res.status(400).json({ 
                error: 'Invalid parameters: min must be <= max',
                timestamp: new Date().toISOString()
            });
        }
        
        // Generate realistic traffic data
        const generateCars = () => Math.floor(Math.random() * (maxVal - minVal + 1)) + minVal;
        
        const north = generateCars();
        const south = generateCars();
        const east = generateCars();
        const west = generateCars();
        const totalCars = north + south + east + west;
        
        // Update history for predictions
        updateTrafficHistory('north', north);
        updateTrafficHistory('south', south);
        updateTrafficHistory('east', east);
        updateTrafficHistory('west', west);
        
        // Calculate congestion level
        const congestionLevel = calculateCongestionLevel(totalCars);
        
        // Build structured response
        const timestamp = new Date().toISOString();
        const response = {
            timestamp,
            traffic: {
                north,
                south,
                east,
                west
            },
            totalCars,
            congestionLevel,
            // Additional metadata for frontend
            ...(shouldIncludeHistory && { 
                history: getTrafficHistory(),
                sequenceNumber: Math.floor(Date.now() / 1000)
            })
        };
        
        // Store in history for analytics
        storeResponseHistory({
            timestamp,
            traffic: response.traffic,
            totalCars,
            congestionLevel
        });
        
        // Enhanced logging
        const logLevel = congestionLevel === 'High' ? '🔴' : congestionLevel === 'Medium' ? '🟡' : '🟢';
        console.log(`${logLevel} [${timestamp}] Traffic API called (Request #${serverState.totalRequests})`);
        console.log(`   ├─ N:${north} S:${south} E:${east} W:${west} | Total:${totalCars} | ${congestionLevel}`);
        console.log(`   └─ History: ${shouldIncludeHistory ? 'Included' : 'Excluded'}`);
        
        res.json(response);
        
    } catch (error) {
        console.error('❌ Error in /traffic endpoint:', error.message);
        res.status(500).json({ 
            error: 'Failed to generate traffic data',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * GET /status
 * Returns server status and mode information
 */
app.get('/status', (req, res) => {
    try {
        console.log(`📊 [${new Date().toISOString()}] Status API called`);
        
        const uptime = process.uptime();
        const uptimeMinutes = Math.floor(uptime / 60);
        const uptimeSeconds = Math.floor(uptime % 60);
        
        const statusResponse = {
            system: 'running',
            mode: serverState.mode,
            lastUpdated: new Date().toISOString(),
            server: {
                uptime: `${uptimeMinutes}m ${uptimeSeconds}s`,
                totalRequests: serverState.totalRequests,
                startTime: serverState.startTime.toISOString(),
                responseHistorySize: apiResponseHistory.length,
                memoryUsage: {
                    rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB`,
                    heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`
                }
            },
            recentTraffic: apiResponseHistory.slice(-3)  // Last 3 responses
        };
        
        console.log(`   ✅ Status returned - Uptime: ${uptimeMinutes}m, Requests: ${serverState.totalRequests}`);
        
        res.json(statusResponse);
        
    } catch (error) {
        console.error('❌ Error in /status endpoint:', error.message);
        res.status(500).json({ 
            error: 'Failed to get server status',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * GET /health
 * Simple health check endpoint
 */
app.get('/health', (req, res) => {
    try {
        const healthCheck = {
            status: 'OK',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            mode: serverState.mode,
            memory: {
                heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
                heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
            }
        };
        
        res.json(healthCheck);
    } catch (error) {
        console.error('❌ Error in /health endpoint:', error.message);
        res.status(500).json({ 
            status: 'ERROR',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// ========== ERROR HANDLING & LOGGING ==========

// 404 handler - must be after all routes
app.use((req, res) => {
    console.warn(`⚠️ [${new Date().toISOString()}] 404 Not found: ${req.method} ${req.path}`);
    res.status(404).json({ 
        error: 'Not found',
        path: req.path,
        availableEndpoints: ['/traffic', '/status', '/health'],
        timestamp: new Date().toISOString()
    });
});

// Global error handler - must be last
app.use((err, req, res, next) => {
    console.error(`❌ [${new Date().toISOString()}] Global error:`, err.message);
    res.status(err.status || 500).json({ 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred',
        timestamp: new Date().toISOString()
    });
});

// ========== SERVER START ==========

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
    console.log('\n' + '='.repeat(60));
    console.log('🚦 SmartFlow AI Traffic Server - PRODUCTION MODE');
    console.log('='.repeat(60));
    console.log(`✅ Server started at: ${new Date().toISOString()}`);
    console.log(`📍 Running on: http://localhost:${PORT}`);
    console.log(`🔧 Mode: ${serverState.mode}`);
    console.log('\n📋 Available Endpoints:');
    console.log(`   1️⃣  GET  /traffic          - Real-time traffic data with congestion`);
    console.log(`   2️⃣  GET  /status           - Server status and analytics`);
    console.log(`   3️⃣  GET  /health           - Health check`);
    console.log('\n💡 Usage Examples:');
    console.log(`   curl http://localhost:${PORT}/traffic`);
    console.log(`   curl http://localhost:${PORT}/status`);
    console.log('\n📊 Storage Info:');
    console.log(`   - Traffic History: Last 10 readings per direction`);
    console.log(`   - Response History: Last 5 API responses`);
    console.log('\n⚡ Server ready for traffic simulation!');
    console.log('='.repeat(60) + '\n');
}).on('error', (err) => {
    console.error('\n' + '❌'.repeat(30));
    console.error('Failed to start server:', err.message);
    console.error('❌'.repeat(30) + '\n');
    if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use!`);
        console.error(`Try: PORT=3001 node server.js`);
    }
    process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('✅ HTTP server closed');
        process.exit(0);
    });
});

module.exports = app;

