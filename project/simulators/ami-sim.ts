import axios from 'axios';
import { config } from 'dotenv';

config();

const API_BASE = process.env.VITE_API_BASE || 'http://localhost:8080';
const API_TOKEN = 'demo-token'; // In real system, would use proper auth

interface MeterSim {
  meterId: string;
  serviceNo: string;
  transformerId: string;
}

class AMISimulator {
  private meters: MeterSim[] = [];
  private isRunning = false;

  async start() {
    console.log('🔌 AMI Simulator starting...');
    
    // Get demo credentials
    const loginResponse = await axios.post(`${API_BASE}/api/auth/login`, {
      email: 'operator@example.com',
      password: 'demo'
    });
    
    const token = loginResponse.data.token;
    
    // Get transformers and meters
    const transformersResponse = await axios.get(`${API_BASE}/api/graph/transformers`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log(`📡 Found ${transformersResponse.data.length} transformers`);
    
    // Create mock meters
    this.meters = transformersResponse.data.flatMap((tx: any, txIndex: number) => {
      const meterCount = 8 + Math.floor(Math.random() * 12);
      return Array.from({ length: meterCount }, (_, i) => ({
        meterId: `${tx._id}_meter_${i}`,
        serviceNo: `${tx.name}-M${String(i + 1).padStart(3, '0')}`,
        transformerId: tx._id
      }));
    });
    
    console.log(`🏠 Simulating ${this.meters.length} meters`);
    
    this.isRunning = true;
    this.simulateFaults(token);
  }

  private async simulateFaults(token: string) {
    console.log('⚡ Starting fault simulation...');
    
    while (this.isRunning) {
      try {
        // Wait 15-60 seconds between fault scenarios
        await this.sleep(15000 + Math.random() * 45000);
        
        if (!this.isRunning) break;
        
        // Pick a random transformer and simulate fault
        const transformerGroups = this.groupMetersByTransformer();
        const transformerIds = Object.keys(transformerGroups);
        const selectedTransformerId = transformerIds[Math.floor(Math.random() * transformerIds.length)];
        const transformerMeters = transformerGroups[selectedTransformerId];
        
        console.log(`\n🔥 Simulating fault on transformer ${selectedTransformerId}`);
        console.log(`📊 ${transformerMeters.length} meters affected`);
        
        // Create fault scenario
        await this.simulateFaultScenario(token, transformerMeters);
        
      } catch (error) {
        console.error('❌ Simulation error:', error);
        await this.sleep(5000); // Wait before retrying
      }
    }
  }

  private async simulateFaultScenario(token: string, meters: MeterSim[]) {
    const now = new Date();
    
    // Select 30-70% of meters for last gasp events
    const affectedCount = Math.floor(meters.length * (0.3 + Math.random() * 0.4));
    const affectedMeters = this.shuffleArray([...meters]).slice(0, affectedCount);
    
    console.log(`💀 Generating ${affectedCount} last-gasp events`);
    
    // Send last gasp events in quick succession (within 10 seconds)
    for (let i = 0; i < affectedMeters.length; i++) {
      const meter = affectedMeters[i];
      const delay = Math.random() * 10000; // 0-10 second spread
      
      setTimeout(async () => {
        try {
          await axios.post(`${API_BASE}/api/events/ami/last-gasp`, {
            meterId: meter.meterId,
            ts: new Date(now.getTime() + delay).toISOString()
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          console.log(`📡 Last gasp: ${meter.serviceNo}`);
        } catch (error) {
          console.error(`Failed to send last gasp for ${meter.serviceNo}`);
        }
      }, delay);
    }
    
    // Send some voltage sag events for context
    const sagCount = Math.floor(meters.length * 0.2);
    const sagMeters = this.shuffleArray([...meters]).slice(0, sagCount);
    
    console.log(`📉 Generating ${sagCount} voltage sag events`);
    
    for (let i = 0; i < sagMeters.length; i++) {
      const meter = sagMeters[i];
      const delay = Math.random() * 15000; // 0-15 second spread
      const deltaV = -10 - Math.random() * 30; // -10 to -40V sag
      
      setTimeout(async () => {
        try {
          await axios.post(`${API_BASE}/api/events/ami/vsag`, {
            meterId: meter.meterId,
            ts: new Date(now.getTime() + delay).toISOString(),
            deltaV,
            phase: ['R', 'Y', 'B'][Math.floor(Math.random() * 3)]
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          console.log(`📊 Voltage sag: ${meter.serviceNo} (${deltaV.toFixed(1)}V)`);
        } catch (error) {
          console.error(`Failed to send voltage sag for ${meter.serviceNo}`);
        }
      }, delay);
    }
  }

  private groupMetersByTransformer(): Record<string, MeterSim[]> {
    return this.meters.reduce((groups, meter) => {
      const txId = meter.transformerId;
      if (!groups[txId]) groups[txId] = [];
      groups[txId].push(meter);
      return groups;
    }, {} as Record<string, MeterSim[]>);
  }

  private shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  stop() {
    console.log('🛑 AMI Simulator stopping...');
    this.isRunning = false;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const simulator = new AMISimulator();
  
  process.on('SIGINT', () => {
    simulator.stop();
    process.exit(0);
  });
  
  simulator.start().catch(console.error);
}

export default AMISimulator;