import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Transformer, Case } from '../lib/api';
import { Zap, AlertCircle, CheckCircle } from 'lucide-react';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const transformerIcon = new L.DivIcon({
  html: `<div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
    <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
    </svg>
  </div>`,
  className: 'custom-transformer-icon',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const faultyTransformerIcon = new L.DivIcon({
  html: `<div class="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center border-2 border-white shadow-lg animate-pulse">
    <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
    </svg>
  </div>`,
  className: 'custom-transformer-icon',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

interface MapViewProps {
  transformers: Transformer[];
  activeCase?: Case;
  onTransformerClick?: (transformer: Transformer) => void;
}

function MapUpdater({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);
  
  return null;
}

export default function MapView({ 
  transformers, 
  activeCase, 
  onTransformerClick 
}: MapViewProps) {
  const mapRef = useRef<any>(null);
  
  // Calculate center point from transformers
  const center: [number, number] = transformers.length > 0
    ? [
        transformers.reduce((sum, t) => sum + t.geo.lat, 0) / transformers.length,
        transformers.reduce((sum, t) => sum + t.geo.lng, 0) / transformers.length
      ]
    : [28.6139, 77.2090]; // Delhi

  // Create mock edges for visualization
  const edges = transformers.flatMap((transformer, i) => {
    const connections: Array<[number, number][]> = [];
    
    // Connect to nearby transformers (simplified grid pattern)
    for (let j = i + 1; j < Math.min(i + 3, transformers.length); j++) {
      const target = transformers[j];
      const distance = Math.sqrt(
        Math.pow(transformer.geo.lat - target.geo.lat, 2) +
        Math.pow(transformer.geo.lng - target.geo.lng, 2)
      );
      
      if (distance < 0.02) { // Only connect nearby transformers
        connections.push([
          [transformer.geo.lat, transformer.geo.lng],
          [target.geo.lat, target.geo.lng]
        ]);
      }
    }
    
    return connections;
  });

  return (
    <div className="h-full w-full relative">
      <MapContainer
        ref={mapRef}
        center={center}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
        className="rounded-lg"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapUpdater center={center} zoom={12} />
        
        {/* Draw network edges */}
        {edges.map((edge, i) => (
          <Polyline
            key={`edge-${i}`}
            positions={edge}
            color="#64748b"
            weight={2}
            opacity={0.6}
          />
        ))}
        
        {/* Draw candidate fault edge */}
        {activeCase && transformers.length > 0 && (
          <Polyline
            positions={[
              [transformers[0].geo.lat, transformers[0].geo.lng],
              [transformers[Math.min(1, transformers.length - 1)].geo.lat, transformers[Math.min(1, transformers.length - 1)].geo.lng]
            ]}
            color="#ef4444"
            weight={4}
            opacity={0.8}
            dashArray="10, 5"
            className="animate-pulse"
          />
        )}
        
        {/* Draw transformers */}
        {transformers.map((transformer) => {
          const isActive = activeCase?.transformerId._id === transformer._id;
          const icon = isActive ? faultyTransformerIcon : transformerIcon;
          
          return (
            <Marker
              key={transformer._id}
              position={[transformer.geo.lat, transformer.geo.lng]}
              icon={icon}
              eventHandlers={{
                click: () => onTransformerClick?.(transformer)
              }}
            >
              <Popup>
                <div className="text-sm">
                  <h3 className="font-semibold text-gray-900">{transformer.name}</h3>
                  <p className="text-gray-600">Feeder: {transformer.feederId}</p>
                  <p className="text-gray-600">
                    Status: 
                    <span className={`ml-1 font-medium ${
                      transformer.status === 'ONLINE' ? 'text-green-600' :
                      transformer.status === 'OFFLINE' ? 'text-red-600' :
                      'text-yellow-600'
                    }`}>
                      {transformer.status}
                    </span>
                  </p>
                  {transformer.hasLTSwitch && (
                    <div className="flex items-center mt-1 text-blue-600">
                      <Zap className="w-3 h-3 mr-1" />
                      <span className="text-xs">Has LT Switch</span>
                    </div>
                  )}
                  {isActive && (
                    <div className="flex items-center mt-1 text-red-600">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      <span className="text-xs font-medium">Active Fault</span>
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      
      {/* Map Legend */}
      <div className="absolute top-4 right-4 bg-white p-4 rounded-lg shadow-lg border border-gray-200 text-sm">
        <h4 className="font-semibold text-gray-900 mb-2">Legend</h4>
        <div className="space-y-1">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-500 rounded-full mr-2"></div>
            <span>Online Transformer</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-500 rounded-full mr-2 animate-pulse"></div>
            <span>Fault Location</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-1 bg-gray-500 mr-2"></div>
            <span>LT Network</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-1 bg-red-500 mr-2"></div>
            <span>Candidate Fault</span>
          </div>
        </div>
      </div>
    </div>
  );
}