# SmartFlow - AI Traffic Signal Optimization System

A modern, intelligent traffic signal optimization system that uses AI algorithms to dynamically adjust signal timings based on real-time traffic conditions. This system reduces congestion, minimizes waiting times, and improves overall traffic flow at 4-way intersections.

## 📋 Project Overview

SmartFlow is an AI-powered traffic management solution designed to:
- **Minimize Wait Times**: Adaptive signal timing based on real-time traffic volume
- **Reduce Congestion**: Intelligent vehicle flow optimization
- **Improve Efficiency**: Maximize intersection throughput
- **Real-time Visualization**: Modern web-based interface for traffic monitoring

## 🏗️ Project Structure

```
SmartFlow-AI-Traffic-Optimization/
├── frontend/                    # Web UI for traffic visualization
│   ├── index.html              # Main intersection interface
│   ├── styles.css              # Modern responsive styling
│   └── script.js               # Traffic signal logic & vehicle simulation
├── backend/                    # AI/ML Backend (Future)
│   └── [API & ML Models]
├── docs/                       # Documentation
│   └── [Architecture, Design Docs]
└── README.md                   # This file
```

## ✨ Features

### Current Implementation (Frontend)
- **4-Way Intersection Visualization**: Clear, intuitive layout showing all traffic directions
- **Real-time Signal Control**: 
  - Red, Yellow, Green signal states
  - Adaptive timing (8s Green, 2s Yellow, 10s Red)
  - Coordinated North-South and East-West phases
- **Vehicle Simulation**: 
  - Random vehicle spawning (0.3 probability per second)
  - Vehicle movement through intersection
  - Waiting queue visualization
- **Control Panel**:
  - Start/Stop/Reset buttons
  - Real-time statistics (vehicles, wait time, throughput)
  - System status indicator
- **Responsive Design**: Works on desktop, tablet, and mobile devices

### Planned Features (Backend)
- Python/FastAPI backend with ML models
- Real traffic data integration
- Predictive traffic flow analysis
- REST API for signal optimization
- Database for logging and analytics

## 🚀 Getting Started

### Prerequisites
- Any modern web browser (Chrome, Firefox, Safari, Edge)
- No server required for frontend-only demo

### Quick Start

#### Option 1: Open Locally
1. Navigate to the `frontend` folder
2. Open `index.html` in your web browser
3. Use the Start/Stop/Reset buttons to control the traffic system

#### Option 2: Run a Local Server
```bash
# Using Python 3
cd frontend
python -m http.server 8000

# Using Node.js (http-server)
npx http-server frontend -p 8000

# Using Live Server (VS Code)
# Install "Live Server" extension and right-click index.html > "Open with Live Server"
```

Then visit: `http://localhost:8000`

## 🎮 How to Use

### Control Panel
- **▶ Start Button**: Begins the traffic signal cycle
- **⏹ Stop Button**: Pauses the system
- **↻ Reset Button**: Clears all vehicles and resets statistics

### Monitoring
The system displays:
- **Total Vehicles**: Current vehicles in the system
- **Avg Wait Time**: Average wait time across all vehicles
- **Throughput**: Vehicles processed per minute
- **System Status**: Running/Stopped indicator

### Signal Timing
- **Green Phase**: 8 seconds (vehicles can cross)
- **Yellow Phase**: 2 seconds (warning phase)
- **Red Phase**: 10 seconds (vehicles must wait)

Cycle sequence:
1. North-South Green → Yellow
2. East-West Green → Yellow
3. Repeat

## 🔧 Technology Stack

### Frontend
- **HTML5**: Semantic structure
- **CSS3**: Modern styling with gradients, animations, flexbox/grid
- **JavaScript (Vanilla)**: No frameworks, pure ES6+

### Backend (Future)
- **Python 3.10+**
- **FastAPI**: REST API framework
- **TensorFlow/PyTorch**: ML model training
- **PostgreSQL**: Data persistence
- **Docker**: Containerization

## 📊 Architecture

```
┌─────────────────────────────────────┐
│   Web Interface (HTML/CSS/JS)       │
│   ├─ 4-way Intersection Display     │
│   ├─ Traffic Signal Visualization   │
│   └─ Control Panel & Statistics     │
└─────────────────┬───────────────────┘
                  │
        ┌─────────▼─────────┐
        │  Local JavaScript │
        │ Signal Controller │
        └─────────┬─────────┘
                  │
        ┌─────────▼──────────────┐
        │ Backend API (Future)   │
        │ ├─ ML Model Service   │
        │ ├─ Data Analytics      │
        │ └─ Traffic Prediction  │
        └────────────────────────┘
```

## 💡 Algorithm Overview

### Current Phase (Frontend Demo)
- **Fixed-Time Control**: Predefined cycle times for each direction
- **Coordinated Phases**: North-South and East-West alternation
- **Vehicle Simulation**: Random arrivals with queue management

### Future Phase (Backend AI)
- **Adaptive Signal Timing**: ML-based optimization
- **Real-time Traffic Analysis**: CNN/LSTM models for prediction
- **Congestion Detection**: Dynamic green time allocation
- **Vehicle Counting**: Computer Vision integration
- **Optimization Algorithm**: RL (Reinforcement Learning) agents

## 📈 Performance Metrics

The system tracks:
- **Total Vehicles Processed**: Cars that crossed the intersection
- **Average Wait Time**: Mean waiting time per vehicle
- **System Throughput**: Vehicles per minute
- **Queue Length**: Number of vehicles waiting

## 🤝 Contributing

This project is part of **HACKSPRINT**. To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### MIT License Summary
- ✅ Use for personal, commercial, or private projects
- ✅ Modify the code
- ✅ Distribute the software
- ❌ Use as-is with no warranty
- ❌ Hold the author liable

## 📧 Contact & Support

**Project Lead**: Aman Kumar Gupta ([@Amank326](https://github.com/Amank326))

For questions or suggestions:
- Open an issue on GitHub
- Create a discussion in the repository

## 🗺️ Roadmap

### Phase 1 (Current) ✅
- [x] Frontend UI with 4-way intersection
- [x] Signal visualization and control
- [x] Vehicle simulation and movement
- [x] Statistics tracking

### Phase 2 (Q2 2026)
- [ ] Backend API with FastAPI
- [ ] Database integration
- [ ] Historical data logging
- [ ] REST API documentation

### Phase 3 (Q3 2026)
- [ ] ML model training
- [ ] Predictive traffic analysis
- [ ] Real traffic data integration
- [ ] Advanced optimization algorithms

### Phase 4 (Q4 2026)
- [ ] Mobile app
- [ ] Multi-intersection coordination
- [ ] Emergency vehicle detection
- [ ] Weather-based optimization

## 🎓 Learning Resources

- [Traffic Signal Timing](https://en.wikipedia.org/wiki/Traffic_light)
- [Reinforcement Learning for Traffic Control](https://paperswithcode.com/task/traffic-control)
- [SUMO Simulation](https://sumo.dlr.de/)

---

**Made with ❤️ during HACKSPRINT**
