import axios from 'axios';
import { config } from 'dotenv';

config();

const API_BASE = process.env.VITE_API_BASE || 'http://localhost:8080';

interface TransformerSim {
  id: string;
  name: string;
  normalCurrent: number;
  currentCurrent: number;
  status: 'ONLINE' | 'OFFLINE' | 'FAULT';
}

class SCADASimulator {
  private transformers: TransformerSim[] = [];
  private isRunning = false;

  async start() {
    console.log('🏭 SCADA Simulator starting...');
    
    // Get demo credentials
    const loginResponse = await axios.post(`${API_BASE}/api/auth/login`, {
      email: 'operator@example.com',
      password: 'demo'
    });
    
    const token = loginResponse.data.token;
    
    // Get transformers
    const transformersResponse = await axios.get(`${API_BASE}/api/graph/transformers`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    // Initialize transformer simulations
    this.transformers = transformersResponse.data.map((tx: any) => ({
      id: tx._id,
      name: tx.name,
      normalCurrent: 50 + Math.random() * 100, // 50-150A normal load
      currentCurrent: 50 + Math.random() * 100,
      status: 'ONLINE' as const
    }));
    
    console.log(`⚡ Monitoring ${this.transformers.length} transformers`);
    
    this.isRunning = true;
    this.sendTelemetry(token);
  }

  private async sendTelemetry(token: string) {
    console.log('📊 Starting telemetry transmission...');
    
    while (this.isRunning) {
      try {
        // Send telemetry for all transformers every 30 seconds
        for (const transformer of this.transformers) {
          await this.sendTransformerTelemetry(token, transformer);
        }
        
        // Update transformer currents
        this.updateTransformerCurrents();
        
        await this.sleep(30000); // 30 second intervals
        
      } catch (error) {
        console.error('❌ Telemetry error:', error);
        await this.sleep(5000);
      }
    }
  }

  private async sendTransformerTelemetry(token: string, transformer: TransformerSim) {
    try {
      await axios.post(`${API_BASE}/api/events/scada/telemetry`, {
        transformerId: transformer.id,
        ts: new Date().toISOString(),
        Irms: transformer.currentCurrent,
        status: transformer.status
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log(`📡 Telemetry: ${transformer.name} - ${transformer.currentCurrent.toFixed(1)}A`);
    } catch (error) {
      console.error(`Failed to send telemetry for ${transformer.name}`);
    }
  }

  private updateTransformerCurrents() {
    this.transformers.forEach(transformer => {
      if (transformer.status === 'ONLINE') {
        // Add some random variation (±10% of normal)
        const variation = (Math.random() - 0.5) * 0.2 * transformer.normalCurrent;
        transformer.currentCurrent = Math.max(0, transformer.normalCurrent + variation);
        
        // Occasionally simulate load changes
        if (Math.random() < 0.05) { // 5% chance
          transformer.normalCurrent = 30 + Math.random() * 120; // New load pattern
          console.log(`⚡ Load change: ${transformer.name} - new normal: ${transformer.normalCurrent.toFixed(1)}A`);
        }
      } else {
        // Faulty/offline transformers have zero current
        transformer.currentCurrent = 0;
      }
    });
  }

  // Simulate fault response when isolation commands are received
  simulateFaultIsolation(transformerId: string) {
    const transformer = this.transformers.find(tx => tx.id === transformerId);
    if (transformer) {
      console.log(`🔌 Isolation command received for ${transformer.name}`);
      transformer.status = 'OFFLINE';
      transformer.currentCurrent = 0;
      
      // Simulate restoration after some time
      setTimeout(() => {
        if (this.isRunning) {
          console.log(`🔋 Restoring ${transformer.name} after isolation`);
          transformer.status = 'ONLINE';
          transformer.normalCurrent = 40 + Math.random() * 80; // Reduced load after restoration
        }
      }, 120000 + Math.random() * 180000); // 2-5 minutes
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  stop() {
    console.log('🛑 SCADA Simulator stopping...');
    this.isRunning = false;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const simulator = new SCADASimulator();
  
  process.on('SIGINT', () => {
    simulator.stop();
    process.exit(0);
  });
  
  simulator.start().catch(console.error);
}

export default SCADASimulator;