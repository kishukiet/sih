import React, { useState } from 'react';
import { format } from 'date-fns';
import { AlertTriangle, Clock, Zap, Users, CheckCircle, XCircle } from 'lucide-react';
import { Case, cases } from '../lib/api';

interface CasePanelProps {
  activeCase?: Case;
  onCaseUpdate?: () => void;
}

export default function CasePanel({ activeCase, onCaseUpdate }: CasePanelProps) {
  const [loading, setLoading] = useState(false);

  if (!activeCase) {
    return (
      <div className="p-6 text-center">
        <div className="text-gray-400 mb-4">
          <AlertTriangle className="w-12 h-12 mx-auto mb-2" />
          <h3 className="text-lg font-medium">No Active Cases</h3>
          <p className="text-sm">All systems operating normally</p>
        </div>
      </div>
    );
  }

  const handleApprove = async () => {
    setLoading(true);
    try {
      await cases.approve(activeCase._id);
      onCaseUpdate?.();
    } catch (error) {
      console.error('Failed to approve case:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBlock = async () => {
    setLoading(true);
    try {
      await cases.block(activeCase._id, 'Blocked by operator');
      onCaseUpdate?.();
    } catch (error) {
      console.error('Failed to block case:', error);
    } finally {
      setLoading(false);
    }
  };

  const confidenceColor = 
    activeCase.confidence >= 0.8 ? 'text-green-600' :
    activeCase.confidence >= 0.6 ? 'text-yellow-600' : 'text-red-600';

  const stateColor = {
    'NEW': 'bg-blue-100 text-blue-800',
    'PLANNED': 'bg-yellow-100 text-yellow-800',
    'EXECUTED': 'bg-green-100 text-green-800',
    'CLOSED': 'bg-gray-100 text-gray-800'
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <AlertTriangle className="w-6 h-6 text-red-500 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Active Fault Case</h2>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${stateColor[activeCase.state]}`}>
            {activeCase.state}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-500 mb-1">Transformer</p>
            <p className="font-medium text-gray-900">{activeCase.transformerId.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Detection Time</p>
            <p className="font-medium text-gray-900">
              {format(new Date(activeCase.startTs), 'HH:mm:ss')}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Confidence</p>
            <p className={`font-bold text-lg ${confidenceColor}`}>
              {Math.round(activeCase.confidence * 100)}%
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Affected Meters</p>
            <div className="flex items-center">
              <Users className="w-4 h-4 text-gray-400 mr-1" />
              <p className="font-medium text-gray-900">{activeCase.affectedMeters.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Isolation Plan</h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Strategy:</span>
            <span className="text-sm text-gray-900 font-mono">
              {activeCase.plan.kind.replace('_', ' ')}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Target Devices:</span>
            <span className="text-sm text-gray-900">
              {activeCase.plan.targets.length} device(s)
            </span>
          </div>

          {activeCase.plan.kind === 'LT_SWITCH' && (
            <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
              <div className="flex items-center">
                <Zap className="w-4 h-4 text-blue-600 mr-2" />
                <span className="text-sm text-blue-800">
                  LT switch isolation - cleanest option available
                </span>
              </div>
            </div>
          )}

          {activeCase.plan.kind === 'METER_RING' && (
            <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200">
              <div className="flex items-center">
                <Users className="w-4 h-4 text-yellow-600 mr-2" />
                <span className="text-sm text-yellow-800">
                  Meter ring isolation - multiple customer disconnections
                </span>
              </div>
            </div>
          )}

          {activeCase.plan.kind === 'NOTIFY_ONLY' && (
            <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
              <div className="flex items-center">
                <Clock className="w-4 h-4 text-gray-600 mr-2" />
                <span className="text-sm text-gray-800">
                  Manual intervention required - notification only
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {activeCase.state === 'PLANNED' && (
        <div className="p-6">
          <div className="flex space-x-3">
            <button
              onClick={handleApprove}
              disabled={loading}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              {loading ? 'Processing...' : 'Approve Plan'}
            </button>
            
            <button
              onClick={handleBlock}
              disabled={loading}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Block
            </button>
          </div>
          
          <div className="mt-3 text-xs text-gray-500 text-center">
            Plan will execute automatically upon approval
          </div>
        </div>
      )}

      {activeCase.state === 'EXECUTED' && (
        <div className="p-6">
          <div className="bg-green-50 p-4 rounded-md border border-green-200">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-green-800">Plan Executed</p>
                <p className="text-xs text-green-600 mt-1">
                  Isolation commands have been sent to target devices
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}