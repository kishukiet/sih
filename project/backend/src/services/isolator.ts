import Case, { ICase } from '../models/Case.js';
import Device from '../models/Device.js';
import Transformer from '../models/Transformer.js';
import Command from '../models/Command.js';
import { Logger } from '../utils/logger.js';
import { io } from '../index.js';

export async function planIsolation(caseDoc: ICase) {
  Logger.info('Planning isolation strategy', { caseId: caseDoc._id });
  
  const transformer = await Transformer.findById(caseDoc.transformerId);
  if (!transformer) {
    Logger.error('Transformer not found', { transformerId: caseDoc.transformerId });
    return;
  }
  
  let plan;
  
  // Strategy 1: LT Switch
  if (transformer.hasLTSwitch && transformer.ltSwitchDeviceId) {
    plan = {
      kind: 'LT_SWITCH' as const,
      targets: [transformer.ltSwitchDeviceId]
    };
  }
  // Strategy 2: Upstream RMU (simplified check)
  else if (await hasUpstreamRMU(transformer._id)) {
    const rmu = await findUpstreamRMU(transformer._id);
    plan = {
      kind: 'UPSTREAM' as const,
      targets: rmu ? [rmu._id] : []
    };
  }
  // Strategy 3: Meter Ring
  else {
    const meterDevices = await findMeterDevices(caseDoc.affectedMeters);
    plan = {
      kind: 'METER_RING' as const,
      targets: meterDevices.slice(0, 5).map(d => d._id) // Limit to 5 devices
    };
  }
  
  // Update case with plan
  await Case.findByIdAndUpdate(caseDoc._id, { 
    plan, 
    state: 'PLANNED' 
  });
  
  Logger.info('Isolation plan created', { 
    caseId: caseDoc._id, 
    strategy: plan.kind,
    targetCount: plan.targets.length 
  });
  
  // Emit update
  const updatedCase = await Case.findById(caseDoc._id);
  io.emit('case:update', updatedCase);
}

export async function executePlan(caseDoc: ICase) {
  Logger.info('Executing isolation plan', { caseId: caseDoc._id });
  
  const commands = [];
  
  for (const deviceId of caseDoc.plan.targets) {
    const command = await Command.create({
      ts: new Date(),
      type: 'OPEN',
      targetDeviceId: deviceId,
      caseId: caseDoc._id,
      actor: 'OPERATOR',
      status: 'SENT'
    });
    
    commands.push(command);
    
    // Simulate command execution with delay
    setTimeout(async () => {
      try {
        await Device.findByIdAndUpdate(deviceId, { status: 'OPEN' });
        await Command.findByIdAndUpdate(command._id, { 
          status: 'ACK',
          response: 'Device opened successfully'
        });
        
        Logger.info('Device opened', { deviceId, commandId: command._id });
        io.emit('device:update', { id: deviceId, status: 'OPEN' });
      } catch (error) {
        Logger.error('Failed to open device', { deviceId, error });
        await Command.findByIdAndUpdate(command._id, { 
          status: 'FAIL',
          response: 'Device operation failed'
        });
      }
    }, 1000 + Math.random() * 2000); // 1-3 second delay
  }
  
  // Update case state
  await Case.findByIdAndUpdate(caseDoc._id, { state: 'EXECUTED' });
  
  const updatedCase = await Case.findById(caseDoc._id);
  io.emit('case:update', updatedCase);
  
  Logger.info('Isolation plan executed', { 
    caseId: caseDoc._id, 
    commandCount: commands.length 
  });
}

async function hasUpstreamRMU(transformerId: any): Promise<boolean> {
  const rmuCount = await Device.countDocuments({ 
    type: 'RMU',
    ref: transformerId 
  });
  return rmuCount > 0;
}

async function findUpstreamRMU(transformerId: any) {
  return await Device.findOne({ 
    type: 'RMU',
    ref: transformerId 
  });
}

async function findMeterDevices(meterIds: any[]) {
  return await Device.find({
    type: 'METER',
    ref: { $in: meterIds },
    'capabilities.open': true
  });
}

export default { planIsolation, executePlan };