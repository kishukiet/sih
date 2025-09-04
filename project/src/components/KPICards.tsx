import React, { useState, useEffect } from 'react';
import { Activity, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { cases } from '../lib/api';

interface KPIData {
  activeCases: number;
  avgDetectionTime: string;
  systemAvailability: string;
  mttr: string;
}

export default function KPICards() {
  const [kpiData, setKpiData] = useState<KPIData>({
    activeCases: 0,
    avgDetectionTime: '0.0s',
    systemAvailability: '99.9%',
    mttr: '12.5min'
  });

  useEffect(() => {
    loadKPIData();
  }, []);

  const loadKPIData = async () => {
    try {
      const activeCasesResponse = await cases.getActive();
      setKpiData(prev => ({
        ...prev,
        activeCases: activeCasesResponse.data.length
      }));
    } catch (error) {
      console.error('Failed to load KPI data:', error);
    }
  };

  const kpiCards = [
    {
      title: 'Active Cases',
      value: kpiData.activeCases,
      icon: AlertTriangle,
      color: kpiData.activeCases > 0 ? 'text-red-600' : 'text-gray-600',
      bgColor: kpiData.activeCases > 0 ? 'bg-red-100' : 'bg-gray-100',
      change: kpiData.activeCases > 0 ? '+1 from last hour' : 'No active faults'
    },
    {
      title: 'Avg Detection Time',
      value: kpiData.avgDetectionTime,
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      change: '85% faster than manual'
    },
    {
      title: 'System Availability',
      value: kpiData.systemAvailability,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      change: 'Target: 99.5%'
    },
    {
      title: 'Mean Time to Repair',
      value: kpiData.mttr,
      icon: Activity,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      change: 'Industry avg: 45min'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {kpiCards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={index}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 transition-all hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">
                  {card.title}
                </p>
                <p className={`text-2xl font-bold ${card.color}`}>
                  {card.value}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {card.change}
                </p>
              </div>
              <div className={`p-3 rounded-full ${card.bgColor}`}>
                <Icon className={`w-6 h-6 ${card.color}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}