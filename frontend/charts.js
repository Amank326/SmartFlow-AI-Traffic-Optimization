// ==================== SmartFlow — Chart.js Real-Time Analytics ==================== //

(function () {
    'use strict';

    // Chart.js global config for dark theme
    if (typeof Chart !== 'undefined') {
        Chart.defaults.color = '#94a3b8';
        Chart.defaults.borderColor = 'rgba(148, 163, 184, 0.1)';
        Chart.defaults.font.family = "'Inter', sans-serif";
        Chart.defaults.font.size = 12;
        Chart.defaults.plugins.legend.labels.usePointStyle = true;
        Chart.defaults.plugins.legend.labels.pointStyleWidth = 10;
        Chart.defaults.animation.duration = 800;
        Chart.defaults.animation.easing = 'easeOutQuart';
    }

    const MAX_DATA_POINTS = 15;
    const chartData = {
        labels: [],
        north: [],
        south: [],
        east: [],
        west: [],
        waitTimes: [],
        readingCount: 0
    };

    let lineChart, doughnutChart, barChart, waitTimeChart;

    // ========== Initialize Charts ==========
    function initCharts() {
        if (typeof Chart === 'undefined') {
            console.warn('⚠️ Chart.js not loaded. Skipping chart initialization.');
            return;
        }

        // 1. Traffic Flow Line Chart
        const lineCtx = document.getElementById('trafficLineChart');
        if (lineCtx) {
            lineChart = new Chart(lineCtx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [
                        { label: 'North', data: [], borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderWidth: 2, tension: 0.4, fill: true, pointRadius: 3, pointHoverRadius: 6 },
                        { label: 'South', data: [], borderColor: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.1)', borderWidth: 2, tension: 0.4, fill: true, pointRadius: 3, pointHoverRadius: 6 },
                        { label: 'East', data: [], borderColor: '#06b6d4', backgroundColor: 'rgba(6, 182, 212, 0.1)', borderWidth: 2, tension: 0.4, fill: true, pointRadius: 3, pointHoverRadius: 6 },
                        { label: 'West', data: [], borderColor: '#a855f7', backgroundColor: 'rgba(168, 85, 247, 0.1)', borderWidth: 2, tension: 0.4, fill: true, pointRadius: 3, pointHoverRadius: 6 }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: { intersect: false, mode: 'index' },
                    scales: {
                        y: { beginAtZero: true, grid: { color: 'rgba(148, 163, 184, 0.06)' }, ticks: { stepSize: 5 } },
                        x: { grid: { display: false }, ticks: { maxTicksLimit: 8 } }
                    },
                    plugins: { legend: { position: 'top' } }
                }
            });
        }

        // 2. Traffic Distribution Doughnut
        const doughnutCtx = document.getElementById('trafficDoughnutChart');
        if (doughnutCtx) {
            doughnutChart = new Chart(doughnutCtx, {
                type: 'doughnut',
                data: {
                    labels: ['North', 'South', 'East', 'West'],
                    datasets: [{
                        data: [1, 1, 1, 1],
                        backgroundColor: [
                            'rgba(16, 185, 129, 0.8)',
                            'rgba(245, 158, 11, 0.8)',
                            'rgba(6, 182, 212, 0.8)',
                            'rgba(168, 85, 247, 0.8)'
                        ],
                        borderColor: 'rgba(3, 7, 18, 0.8)',
                        borderWidth: 3,
                        hoverBorderWidth: 0,
                        hoverOffset: 8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '65%',
                    plugins: {
                        legend: { position: 'bottom', labels: { padding: 15 } }
                    }
                }
            });
        }

        // 3. Bar Chart — Vehicles per Direction
        const barCtx = document.getElementById('trafficBarChart');
        if (barCtx) {
            barChart = new Chart(barCtx, {
                type: 'bar',
                data: {
                    labels: ['North', 'South', 'East', 'West'],
                    datasets: [{
                        label: 'Current Vehicles',
                        data: [0, 0, 0, 0],
                        backgroundColor: [
                            'rgba(16, 185, 129, 0.7)',
                            'rgba(245, 158, 11, 0.7)',
                            'rgba(6, 182, 212, 0.7)',
                            'rgba(168, 85, 247, 0.7)'
                        ],
                        borderColor: [
                            '#10b981', '#f59e0b', '#06b6d4', '#a855f7'
                        ],
                        borderWidth: 2,
                        borderRadius: 8,
                        borderSkipped: false
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: { beginAtZero: true, grid: { color: 'rgba(148, 163, 184, 0.06)' } },
                        x: { grid: { display: false } }
                    },
                    plugins: { legend: { display: false } }
                }
            });
        }

        // 4. Wait Time Trend
        const waitCtx = document.getElementById('waitTimeChart');
        if (waitCtx) {
            waitTimeChart = new Chart(waitCtx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Avg Wait (s)',
                        data: [],
                        borderColor: '#ef4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        borderWidth: 2,
                        tension: 0.4,
                        fill: true,
                        pointRadius: 3,
                        pointHoverRadius: 6,
                        pointBackgroundColor: '#ef4444'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: { beginAtZero: true, grid: { color: 'rgba(148, 163, 184, 0.06)' }, title: { display: true, text: 'Seconds', color: '#64748b' } },
                        x: { grid: { display: false }, ticks: { maxTicksLimit: 8 } }
                    },
                    plugins: { legend: { display: false } }
                }
            });
        }

        console.log('📊 Chart.js Analytics initialized');
    }

    // ========== Update Charts with New Data ==========
    function updateCharts(north, south, east, west, avgWait) {
        chartData.readingCount++;
        const timeLabel = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

        // Manage data window
        chartData.labels.push(timeLabel);
        chartData.north.push(north || 0);
        chartData.south.push(south || 0);
        chartData.east.push(east || 0);
        chartData.west.push(west || 0);
        chartData.waitTimes.push(avgWait || 0);

        if (chartData.labels.length > MAX_DATA_POINTS) {
            chartData.labels.shift();
            chartData.north.shift();
            chartData.south.shift();
            chartData.east.shift();
            chartData.west.shift();
            chartData.waitTimes.shift();
        }

        // Update Line Chart
        if (lineChart) {
            lineChart.data.labels = [...chartData.labels];
            lineChart.data.datasets[0].data = [...chartData.north];
            lineChart.data.datasets[1].data = [...chartData.south];
            lineChart.data.datasets[2].data = [...chartData.east];
            lineChart.data.datasets[3].data = [...chartData.west];
            lineChart.update('none');
        }

        // Update Doughnut
        if (doughnutChart) {
            doughnutChart.data.datasets[0].data = [north || 1, south || 1, east || 1, west || 1];
            doughnutChart.update('none');
        }

        // Update Bar Chart
        if (barChart) {
            barChart.data.datasets[0].data = [north || 0, south || 0, east || 0, west || 0];
            barChart.update('none');
        }

        // Update Wait Time Chart
        if (waitTimeChart) {
            waitTimeChart.data.labels = [...chartData.labels];
            waitTimeChart.data.datasets[0].data = [...chartData.waitTimes];
            waitTimeChart.update('none');
        }
    }

    // ========== AI Decision Log ==========
    let logCount = 0;

    function addDecisionLog(message, type) {
        const logBody = document.getElementById('decisionLogBody');
        const logCountEl = document.getElementById('logCount');
        if (!logBody) return;

        logCount++;
        const time = new Date().toLocaleTimeString('en-US', { hour12: false });
        const typeClass = type === 'warn' ? 'log-warn' : type === 'success' ? 'log-success' : 'log-info';

        const entry = document.createElement('div');
        entry.className = `log-entry ${typeClass}`;
        entry.innerHTML = `<span class="log-time">${time}</span><span class="log-msg">${message}</span>`;

        logBody.insertBefore(entry, logBody.firstChild);

        // Keep only last 20 entries
        while (logBody.children.length > 20) {
            logBody.removeChild(logBody.lastChild);
        }

        if (logCountEl) logCountEl.textContent = `${logCount} decisions`;
    }

    // ========== Integration with TrafficSystem ==========
    // Poll the traffic system state every 3 seconds
    let chartUpdateInterval = null;

    function startChartUpdates() {
        chartUpdateInterval = setInterval(() => {
            const sys = window.trafficSystem;
            if (!sys || !sys.isRunning) return;

            const n = sys.northCars || 0;
            const s = sys.southCars || 0;
            const e = sys.eastCars || 0;
            const w = sys.westCars || 0;
            const total = n + s + e + w;

            // Calculate avg wait from analytics
            let avgWait = 0;
            if (sys.analytics) {
                avgWait = sys.analytics.getAverageWaitTime();
            }

            updateCharts(n, s, e, w, avgWait);

            // Generate AI Decision Log entries
            if (total > 0) {
                const maxDir = [
                    { name: 'North', val: n },
                    { name: 'South', val: s },
                    { name: 'East', val: e },
                    { name: 'West', val: w }
                ].sort((a, b) => b.val - a.val)[0];

                const congestion = sys.congestionLevel || 'Low';

                if (congestion === 'High') {
                    addDecisionLog(`⚠️ High congestion detected! Total: ${total} vehicles. Prioritizing ${maxDir.name} (${maxDir.val} cars)`, 'warn');
                } else if (total > 20) {
                    addDecisionLog(`🔄 Moderate traffic — ${maxDir.name} has highest load (${maxDir.val}). Allocating proportional green time.`, 'info');
                } else {
                    addDecisionLog(`✅ Traffic flowing smoothly. ${total} vehicles across all directions. Efficiency optimal.`, 'success');
                }

                // Log adaptive timing decisions
                if (sys.directionalTimings) {
                    const dt = sys.directionalTimings;
                    if (dt.north || dt.south || dt.east || dt.west) {
                        addDecisionLog(`🤖 Adaptive: N=${dt.north || 0}s S=${dt.south || 0}s E=${dt.east || 0}s W=${dt.west || 0}s`, 'info');
                    }
                }
            }

        }, 3000);
    }

    // ========== Init on DOM Ready ==========
    document.addEventListener('DOMContentLoaded', () => {
        initCharts();
        startChartUpdates();
        console.log('📊 SmartFlow Charts Module — Loaded');
    });

    // Expose for external use if needed
    window.SmartFlowCharts = {
        updateCharts,
        addDecisionLog
    };

})();
