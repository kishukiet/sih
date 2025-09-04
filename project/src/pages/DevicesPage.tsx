import React from 'react';
import DeviceTable from '../components/DeviceTable';
import { useAuth } from '../components/LoginGuard';

export default function DevicesPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Device Management</h1>
              <p className="text-sm text-gray-600">
                Monitor and control network switching devices
              </p>
            </div>
            <div className="text-sm text-gray-600">
              Logged in as: <span className="font-medium">{user?.email}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <DeviceTable />
      </div>
    </div>
  );
}