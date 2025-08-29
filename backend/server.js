const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const { promisify } = require('util');

const app = express();
const execAsync = promisify(exec);
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Global metrics
let serverMetrics = {
    startTime: Date.now(),
    requestCount: 0,
    totalResponseTime: 0,
    responseTimeCount: 0
};

// Track requests
app.use((req, res, next) => {
    const start = Date.now();
    serverMetrics.requestCount++;
    
    res.on('finish', () => {
        const responseTime = Date.now() - start;
        serverMetrics.totalResponseTime += responseTime;
        serverMetrics.responseTimeCount++;
    });
    
    next();
});

// Helper functions
const getUptime = () => {
    const uptime = Date.now() - serverMetrics.startTime;
    const hours = Math.floor(uptime / (1000 * 60 * 60));
    const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
};

const getAverageResponseTime = () => {
    return serverMetrics.responseTimeCount > 0 
        ? Math.round(serverMetrics.totalResponseTime / serverMetrics.responseTimeCount)
        : 0;
};

const checkDockerStatus = async () => {
    try {
        const { stdout } = await execAsync('docker ps --format "table {{.Names}}\\t{{.Status}}"');
        const containers = stdout.split('\n').slice(1).filter(line => line.trim());
        return {
            running: containers.length > 0,
            containerCount: containers.length,
            containers: containers.map(line => {
                const [name, status] = line.split('\t');
                return { name: name?.trim(), status: status?.trim() };
            })
        };
    } catch (error) {
        return { running: false, containerCount: 0, containers: [] };
    }
};

const getSystemHealth = async () => {
    try {
        // Simulate system metrics (replace with real monitoring in production)
        const cpu = Math.floor(Math.random() * 30) + 10; // 10-40%
        const memory = Math.floor(Math.random() * 40) + 30; // 30-70%
        const disk = Math.floor(Math.random() * 20) + 20; // 20-40%
        
        return {
            healthy: cpu < 80 && memory < 85 && disk < 90,
            cpu,
            memory,
            disk,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        return {
            healthy: false,
            error: error.message,
            timestamp: new Date().toISOString()
        };
    }
};

// API Routes matching your frontend expectations

// Health check endpoint (used by frontend health check)
app.get('/health', async (req, res) => {
    const health = await getSystemHealth();
    res.status(health.healthy ? 200 : 503).json({
        status: health.healthy ? 'healthy' : 'unhealthy',
        timestamp: health.timestamp,
        details: health
    });
});

// Main status endpoint for status cards
app.get('/api/status', async (req, res) => {
    const dockerStatus = await checkDockerStatus();
    const health = await getSystemHealth();
    const hoursRunning = (Date.now() - serverMetrics.startTime) / (1000 * 60 * 60);
    const requestsPerHour = hoursRunning > 0 ? Math.round(serverMetrics.requestCount / hoursRunning) : 0;
    
    res.json({
        server: {
            status: 'online',
            version: '1.0.0',
            uptime: getUptime()
        },
        services: {
            webServer: {
                status: 'online',
                responseTime: getAverageResponseTime()
            },
            docker: {
                status: dockerStatus.running ? 'online' : 'offline',
                containers: dockerStatus.containerCount
            },
            healthCheck: {
                status: health.healthy ? 'online' : 'degraded',
                lastCheck: health.timestamp
            },
            ssl: {
                status: 'online',
                certificate: 'valid'
            }
        },
        metrics: {
            uptime: getUptime(),
            responseTime: `${getAverageResponseTime()}ms`,
            requestsPerHour: `${requestsPerHour.toLocaleString()}`
        },
        timestamp: new Date().toISOString()
    });
});

// Detailed metrics endpoint
app.get('/api/metrics', async (req, res) => {
    const health = await getSystemHealth();
    const dockerStatus = await checkDockerStatus();
    const uptimeMs = Date.now() - serverMetrics.startTime;
    const hoursRunning = uptimeMs / (1000 * 60 * 60);
    
    // Calculate uptime percentage (simulated - in production use actual downtime data)
    const uptimePercentage = Math.max(99.0, 100 - (Math.random() * 1));
    
    res.json({
        uptime: {
            percentage: Math.round(uptimePercentage * 10) / 10,
            duration: getUptime(),
            startTime: new Date(serverMetrics.startTime).toISOString()
        },
        performance: {
            averageResponseTime: getAverageResponseTime(),
            requestCount: serverMetrics.requestCount,
            requestsPerHour: Math.round(serverMetrics.requestCount / Math.max(hoursRunning, 0.1))
        },
        system: {
            cpu: health.cpu,
            memory: health.memory,
            disk: health.disk,
            healthy: health.healthy
        },
        docker: {
            status: dockerStatus.running ? 'running' : 'stopped',
            containerCount: dockerStatus.containerCount,
            containers: dockerStatus.containers
        },
        timestamp: new Date().toISOString()
    });
});

// Docker container details
app.get('/api/containers', async (req, res) => {
    try {
        const { stdout } = await execAsync('docker ps -a --format "{{json .}}"');
        const containers = stdout.split('\n')
            .filter(line => line.trim())
            .map(line => JSON.parse(line));
        
        res.json({
            containers,
            total: containers.length,
            running: containers.filter(c => c.State === 'running').length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to fetch containers',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// System information
app.get('/api/system', async (req, res) => {
    try {
        const health = await getSystemHealth();
        
        res.json({
            os: process.platform,
            arch: process.arch,
            nodeVersion: process.version,
            serverUptime: getUptime(),
            resources: {
                cpu: health.cpu,
                memory: health.memory,
                disk: health.disk
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to fetch system information',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong!',
        timestamp: new Date().toISOString()
    });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({
        error: 'API endpoint not found',
        path: req.path,
        timestamp: new Date().toISOString()
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Docker Web Server Backend API running on port ${PORT}`);
    console.log(`📊 Health endpoint: http://localhost:${PORT}/health`);
    console.log(`🔍 Status endpoint: http://localhost:${PORT}/api/status`);
});

module.exports = app;