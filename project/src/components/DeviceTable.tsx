import React, { useState, useEffect } from 'react';
import { Power, Zap, Settings, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Device, devices as deviceApi } from '../lib/api';
import socketService from '../lib/socket';

export default function DeviceTable() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadDevices();
    
    // Listen for device updates via websocket
    socketService.on('device:update', (update: { id: string; status: string }) => {
      setDevices(prev => prev.map(device => 
        device._id === update.id 
          ? { ...device, status: update.status as 'OPEN' | 'CLOSED' }
          : device
      ));
    });

    return () => {
      socketService.off('device:update');
    };
  }, []);

  const loadDevices = async () => {
    try {
      const response = await deviceApi.getAll();
      setDevices(response.data);
    } catch (error) {
      console.error('Failed to load devices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeviceAction = async (deviceId: string, action: 'open' | 'close') => {
    setActionLoading(deviceId);
    try {
      if (action === 'open') {
        await deviceApi.open(deviceId);
      } else {
        await deviceApi.close(deviceId);
      }
    } catch (error) {
      console.error(`Failed to ${action} device:`, error);
    } finally {
      setActionLoading(null);
    }
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'LT_SW':
        return <Zap className="w-4 h-4 text-blue-500" />;
      case 'RMU':
        return <Settings className="w-4 h-4 text-purple-500" />;
      case 'BREAKER':
        return <Power className="w-4 h-4 text-red-500" />;
      case 'METER':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <Settings className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    return status === 'CLOSED' 
      ? <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">CLOSED</span>
      : <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">OPEN</span>;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Controllable Devices</h2>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Controllable Devices</h2>
        <p className="text-sm text-gray-600 mt-1">
          {devices.length} devices available for remote operation
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Device
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {devices.map((device) => (
              <tr key={device._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {getDeviceIcon(device.type)}
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">
                        {device.name}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-900">
                    {device.type.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(device.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    {device.capabilities.open && (
                      <button
                        onClick={() => handleDeviceAction(device._id, 'open')}
                        disabled={actionLoading === device._id || device.status === 'OPEN'}
                        className="inline-flex items-center px-3 py-1 border border-red-300 text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {actionLoading === device._id ? (
                          <Clock className="w-3 h-3 mr-1 animate-spin" />
                        ) : (
                          <XCircle className="w-3 h-3 mr-1" />
                        )}
                        Open
                      </button>
                    )}
                    {device.capabilities.close && (
                      <button
                        onClick={() => handleDeviceAction(device._id, 'close')}
                        disabled={actionLoading === device._id || device.status === 'CLOSED'}
                        className="inline-flex items-center px-3 py-1 border border-green-300 text-sm leading-4 font-medium rounded-md text-green-700 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {actionLoading === device._id ? (
                          <Clock className="w-3 h-3 mr-1 animate-spin" />
                        ) : (
                          <CheckCircle className="w-3 h-3 mr-1" />
                        )}
                        Close
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {devices.length === 0 && (
          <div className="p-6 text-center text-gray-500">
            <Power className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>No controllable devices found</p>
            <p className="text-sm">Devices will appear here once the network is seeded</p>
          </div>
        )}
      </div>
    </div>
  );
}