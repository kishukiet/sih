import AMISimulator from './simulators/ami-sim.js';
import SCADASimulator from './simulators/scada-sim.js';

console.log('🚀 Starting LT Grid Simulators...');

const amiSim = new AMISimulator();
const scadaSim = new SCADASimulator();

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down simulators...');
  amiSim.stop();
  scadaSim.stop();
  process.exit(0);
});

// Start both simulators
Promise.all([
  amiSim.start(),
  scadaSim.start()
]).then(() => {
  console.log('✅ Both simulators are running');
  console.log('Press Ctrl+C to stop');
}).catch(error => {
  console.error('❌ Failed to start simulators:', error);
  process.exit(1);
});