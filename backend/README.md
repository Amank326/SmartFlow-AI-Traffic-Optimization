# 🚦 SmartFlow Backend API

Simple Node.js Express server for the SmartFlow Traffic System.

## Installation

```bash
cd backend
npm install
```

## Running

```bash
npm start
```

Server will run on `http://localhost:3000`

## API Endpoints

### Health Check
```
GET /health
```

Response:
```json
{
  "status": "Server running"
}
```

### Traffic Data
```
GET /traffic
```

Returns random traffic data for all directions:

Response:
```json
{
  "northCars": 10,
  "southCars": 5,
  "eastCars": 8,
  "westCars": 3,
  "timestamp": "2026-03-27T10:30:45.123Z"
}
```

## Usage Examples

### cURL
```bash
curl http://localhost:3000/traffic
```

### JavaScript/Fetch
```javascript
fetch('http://localhost:3000/traffic')
  .then(res => res.json())
  .then(data => console.log(data));
```

### Browser
Open: `http://localhost:3000/traffic`

## Features

- ✅ CORS enabled (works with frontend)
- ✅ Random traffic data (1-15 cars per direction)
- ✅ Timestamp included with each response
- ✅ Simple and minimal (~30 lines of code)
- ✅ Ready to integrate with frontend
