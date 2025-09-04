# LT Fault Detection & Isolation System

A comprehensive MERN stack prototype demonstrating automated fault detection and isolation in Low Tension (LT) electrical distribution networks.

## 🌟 Features

- **Real-time Fault Detection**: Advanced algorithms using clustering and graph-based localization
- **Automated Isolation Planning**: Multiple strategies including LT switches, upstream RMUs, and meter ring isolation
- **Live Dashboard**: Interactive map visualization with WebSocket updates
- **Device Control**: Remote operation of switches, RMUs, and smart meters
- **Event Processing**: AMI and SCADA data ingestion with intelligent correlation
- **Role-based Access**: Operator, Supervisor, and Engineer roles with appropriate permissions

## 🏗 Architecture

### Backend (Node.js/Express)
- **MongoDB** with Mongoose for data persistence
- **Socket.IO** for real-time WebSocket communications
- **JWT Authentication** with role-based access control
- **Graph-based algorithms** for fault localization
- **RESTful APIs** for all system operations

### Frontend (React/TypeScript)
- **Interactive Map** using Leaflet for network visualization
- **Real-time Updates** via WebSocket connections
- **Responsive Design** with Tailwind CSS
- **Component-based Architecture** for maintainability

### Simulators
- **AMI Simulator**: Generates realistic last-gasp and voltage sag events
- **SCADA Simulator**: Provides transformer telemetry and command responses

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MongoDB 6.0+
- npm or yarn

### Installation

1. **Clone and install dependencies**:
   ```bash
   npm install
   cd backend && npm install
   ```

2. **Set up environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your MongoDB connection string
   ```

3. **Start MongoDB** (if running locally):
   ```bash
   mongod
   ```

4. **Start the development servers**:
   ```bash
   npm run dev
   ```

   This starts both backend (port 8080) and frontend (port 5173)

5. **Access the application**:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8080

### Demo Login
- **Operator**: operator@example.com / demo
- **Supervisor**: supervisor@example.com / demo
- **Engineer**: engineer@example.com / demo

## 🧪 Running Simulators

To see the system in action with realistic fault scenarios:

```bash
# In a separate terminal
node run-simulators.js
```

This starts both AMI and SCADA simulators that will generate fault events every 15-60 seconds.

## 📊 System Flow

1. **Event Ingestion**: AMI meters send last-gasp and voltage events
2. **Detection**: Algorithm clusters events and scores potential fault locations
3. **Localization**: Graph-based analysis identifies the most likely faulty span
4. **Planning**: System determines optimal isolation strategy
5. **Approval**: Operator reviews and approves the isolation plan
6. **Execution**: Commands sent to devices, real-time status updates
7. **Monitoring**: Continuous tracking until fault is resolved

## 🗄 Database Schema

### Key Collections
- **Transformers**: Network distribution transformers with location and capabilities
- **Edges**: LT spans connecting network nodes
- **Meters**: Smart meters with disconnect capabilities
- **Devices**: Controllable switches, RMUs, and breakers
- **Events**: Time-series data from AMI and SCADA systems
- **Cases**: Fault detection results with isolation plans
- **Commands**: Device operation history and audit trail

## 🔧 Configuration

### Detection Parameters
- **Confidence Threshold**: 0.7 (minimum for automatic case creation)
- **Time Window**: 30 seconds for event clustering
- **Evidence Requirements**: Minimum 2 last-gasp events for fault detection

### Isolation Strategies
1. **LT Switch**: Preferred when available (clean isolation)
2. **Upstream RMU**: Secondary option for feeder-level isolation
3. **Meter Ring**: Last resort using smart meter disconnects
4. **Notify Only**: Manual intervention required

## 🛡 Security

- JWT-based authentication with configurable expiration
- Role-based authorization for critical operations
- Input validation and sanitization
- Audit trail for all device operations
- Rate limiting on API endpoints

## 📱 API Endpoints

### Authentication
- `POST /api/auth/login` - User authentication

### Events
- `POST /api/events/ami/last-gasp` - AMI last-gasp events
- `POST /api/events/ami/vsag` - Voltage sag events
- `POST /api/events/scada/telemetry` - SCADA telemetry

### Cases
- `GET /api/cases/active` - Active fault cases
- `POST /api/cases/:id/approve` - Approve isolation plan
- `POST /api/cases/:id/block` - Block case execution

### Devices
- `GET /api/devices` - List controllable devices
- `POST /api/devices/:id/open` - Open device
- `POST /api/devices/:id/close` - Close device

### Graph/Topology
- `GET /api/graph/transformers` - Network transformers
- `POST /api/graph/seed` - Initialize demo network

## 🔮 WebSocket Events

### Server → Client
- `case:new` - New fault case detected
- `case:update` - Case status change
- `device:update` - Device status change
- `event:new` - New system event

### Client → Server
- `case:approve` - Approve case via WebSocket
- `case:block` - Block case execution

## 🧪 Testing Scenarios

### Manual Fault Simulation
1. Start the simulators: `node run-simulators.js`
2. Watch the dashboard for incoming events
3. Observe case creation when sufficient evidence accumulates
4. Review isolation plan and approve/block as needed
5. Monitor device status updates in real-time

### API Testing
Use tools like Postman or curl to test individual endpoints:

```bash
# Login and get token
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"operator@example.com","password":"demo"}'

# Send last-gasp event
curl -X POST http://localhost:8080/api/events/ami/last-gasp \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"meterId":"test-meter-123","ts":"2024-01-01T10:00:00Z"}'
```

## 📈 Performance Considerations

- **Event Processing**: Asynchronous handling prevents blocking
- **Database Indexing**: Optimized queries for time-series data
- **WebSocket Scaling**: Can be clustered with Redis adapter
- **Memory Management**: Event pruning and case cleanup routines

## 🚀 Production Deployment

For production deployment:

1. **Environment Setup**:
   - Set production MongoDB URI
   - Configure strong JWT secrets
   - Enable HTTPS/TLS
   - Set up proper logging

2. **Scaling Considerations**:
   - Use MongoDB replica sets
   - Implement Redis for session storage
   - Configure load balancers
   - Set up monitoring and alerting

3. **Integration Points**:
   - Replace simulators with real AMI/SCADA adapters
   - Implement proper device command protocols
   - Add enterprise authentication (LDAP/SSO)
   - Connect to existing network management systems

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Open an issue on GitHub
- Check the API documentation
- Review the system logs for debugging

---

*This is a prototype system for demonstration purposes. Production deployment requires additional security, monitoring, and integration considerations.*