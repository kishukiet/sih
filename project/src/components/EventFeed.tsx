import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { AlertCircle, Zap, TrendingDown, Wifi } from 'lucide-react';
import { Event, events } from '../lib/api';
import socketService from '../lib/socket';

export default function EventFeed() {
  const [recentEvents, setRecentEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
    
    // Listen for new events via websocket
    socketService.on('event:new', (event: Event) => {
      setRecentEvents(prev => [event, ...prev.slice(0, 49)]); // Keep last 50
    });

    return () => {
      socketService.off('event:new');
    };
  }, []);

  const loadEvents = async () => {
    try {
      const response = await events.getRecent(50);
      setRecentEvents(response.data);
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'LAST_GASP':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'V_SAG':
        return <TrendingDown className="w-4 h-4 text-yellow-500" />;
      case 'PHASE_LOSS':
        return <Zap className="w-4 h-4 text-orange-500" />;
      case 'SCADA_TELEMETRY':
        return <Wifi className="w-4 h-4 text-blue-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'LAST_GASP':
        return 'border-l-red-500 bg-red-50';
      case 'V_SAG':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'PHASE_LOSS':
        return 'border-l-orange-500 bg-orange-50';
      case 'SCADA_TELEMETRY':
        return 'border-l-blue-500 bg-blue-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Live Event Feed</h2>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Live Event Feed</h2>
          <div className="flex items-center text-sm text-gray-500">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            Live
          </div>
        </div>
      </div>

      <div className="max-h-80 overflow-y-auto">
        {recentEvents.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <p>No recent events</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {recentEvents.slice(0, 20).map((event, index) => (
              <div
                key={event._id}
                className={`p-4 border-l-4 transition-all duration-300 ${getEventColor(event.type)} ${
                  index === 0 ? 'animate-pulse' : ''
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    {getEventIcon(event.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">
                        {event.type.replace('_', ' ')}
                      </p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(event.ts), 'HH:mm:ss')}
                      </p>
                    </div>
                    
                    {event.payload && (
                      <div className="mt-1 text-xs text-gray-600">
                        {event.type === 'V_SAG' && event.payload.deltaV && (
                          <span>ΔV: {event.payload.deltaV}V</span>
                        )}
                        {event.type === 'SCADA_TELEMETRY' && event.payload.Irms && (
                          <span>Current: {event.payload.Irms}A</span>
                        )}
                        {event.payload.source && (
                          <span className="ml-2 px-1 py-0.5 bg-gray-200 rounded text-xs">
                            {event.payload.source}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}