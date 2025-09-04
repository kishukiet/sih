import React, { useState, useEffect } from 'react';
import MapView from '../components/MapView';
import CasePanel from '../components/CasePanel';
import EventFeed from '../components/EventFeed';
import KPICards from '../components/KPICards';
import { Transformer, Case, cases, graph } from '../lib/api';
import { useAuth } from '../components/LoginGuard';
import socketService from '../lib/socket';

export default function Dashboard() {
  const { user } = useAuth();
  const [transformers, setTransformers] = useState<Transformer[]>([]);
  const [activeCase, setActiveCase] = useState<Case | undefined>();
  const [selectedTransformer, setSelectedTransformer] = useState<Transformer | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    
    // Listen for case updates via websocket
    socketService.on('case:new', (newCase: Case) => {
      setActiveCase(newCase);
    });

    socketService.on('case:update', (updatedCase: Case) => {
      setActiveCase(updatedCase);
    });

    return () => {
      socketService.off('case:new');
      socketService.off('case:update');
    };
  }, []);

  const loadData = async () => {
    try {
      const [transformersResponse, activeCasesResponse] = await Promise.all([
        graph.getTransformers(),
        cases.getActive()
      ]);

      setTransformers(transformersResponse.data);
      setActiveCase(activeCasesResponse.data[0]); // Get the first active case
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCaseUpdate = () => {
    loadData(); // Reload data when case is updated
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">LT Fault Detection & Isolation</h1>
              <p className="text-sm text-gray-600">
                Real-time monitoring and automated fault management
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Logged in as: <span className="font-medium">{user?.email}</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span className="text-sm text-gray-600">System Online</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="p-6">
        <KPICards />
      </div>

      {/* Main Content */}
      <div className="px-6 pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map View - Takes 2 columns */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-[600px]">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Network Overview</h2>
                <p className="text-sm text-gray-600">
                  {transformers.length} transformers • Live monitoring
                </p>
              </div>
              <div className="h-[calc(100%-80px)]">
                <MapView
                  transformers={transformers}
                  activeCase={activeCase}
                  onTransformerClick={setSelectedTransformer}
                />
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div className="space-y-6">
            {/* Active Case Panel */}
            <CasePanel 
              activeCase={activeCase} 
              onCaseUpdate={handleCaseUpdate}
            />

            {/* Event Feed */}
            <EventFeed />
          </div>
        </div>
      </div>
    </div>
  );
}