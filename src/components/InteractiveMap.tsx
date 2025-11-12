import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface VaultLocation {
  country: string;
  coordinates: [number, number];
  vaults: number;
  communities: string;
  focus: string;
  status: 'active' | 'planned' | 'exploration';
  capitalMobilized?: string;
  co2Offset?: string;
}

const vaultLocations: VaultLocation[] = [
  {
    country: "Kenya",
    coordinates: [36.8219, -1.2921],
    vaults: 12,
    communities: "45K+",
    focus: "Urban digital twins, AgTech innovation",
    status: "active",
    capitalMobilized: "$420M",
    co2Offset: "2.1M tons"
  },
  {
    country: "Rwanda",
    coordinates: [30.0619, -1.9403],
    vaults: 8,
    communities: "32K+",
    focus: "Forest restoration, Carbon credits",
    status: "active",
    capitalMobilized: "$280M",
    co2Offset: "3.5M tons"
  },
  {
    country: "Ghana",
    coordinates: [-0.1870, 5.6037],
    vaults: 10,
    communities: "38K+",
    focus: "Coastal resilience, Renewable energy",
    status: "active",
    capitalMobilized: "$350M",
    co2Offset: "2.6M tons"
  },
  {
    country: "Nigeria",
    coordinates: [7.4951, 9.0820],
    vaults: 0,
    communities: "Target: 60K+",
    focus: "Oil transition, Youth innovation hubs",
    status: "planned"
  },
  {
    country: "South Africa",
    coordinates: [28.0473, -26.2041],
    vaults: 0,
    communities: "Target: 50K+",
    focus: "Just transition, Mining rehabilitation",
    status: "planned"
  },
  {
    country: "Ethiopia",
    coordinates: [38.7469, 9.1450],
    vaults: 0,
    communities: "Target: 40K+",
    focus: "Water management, Agricultural resilience",
    status: "exploration"
  }
];

const InteractiveMap = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState('');
  const [tokenSubmitted, setTokenSubmitted] = useState(false);

  const initializeMap = (token: string) => {
    if (!mapContainer.current) return;

    mapboxgl.accessToken = token;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [20, 0],
      zoom: 3,
      pitch: 45,
    });

    // Add navigation controls
    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      'top-right'
    );

    // Add markers and popups for each location
    map.current.on('load', () => {
      vaultLocations.forEach((location) => {
        // Create custom marker element
        const el = document.createElement('div');
        el.className = 'custom-marker';
        el.style.width = '40px';
        el.style.height = '40px';
        el.style.borderRadius = '50%';
        el.style.cursor = 'pointer';
        el.style.border = '3px solid white';
        el.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
        
        // Color based on status
        if (location.status === 'active') {
          el.style.backgroundColor = 'hsl(152, 65%, 35%)';
        } else if (location.status === 'planned') {
          el.style.backgroundColor = 'hsl(210, 75%, 45%)';
        } else {
          el.style.backgroundColor = 'hsl(40, 90%, 55%)';
        }

        // Add pulse animation for active locations
        if (location.status === 'active') {
          el.style.animation = 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite';
        }

        // Create popup content
        const popupContent = `
          <div style="padding: 4px;">
            <h3 style="font-weight: bold; font-size: 18px; margin-bottom: 8px; color: hsl(160, 15%, 15%);">${location.country}</h3>
            <div style="margin-bottom: 8px;">
              <span style="display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; ${
                location.status === 'active' 
                  ? 'background-color: hsl(152, 60%, 92%); color: hsl(152, 65%, 35%);'
                  : location.status === 'planned'
                  ? 'background-color: hsl(210, 70%, 95%); color: hsl(210, 75%, 45%);'
                  : 'background-color: hsl(40, 85%, 95%); color: hsl(40, 90%, 55%);'
              }">${location.status.toUpperCase()}</span>
            </div>
            <div style="font-size: 14px; color: hsl(160, 8%, 45%); margin-bottom: 12px;">
              <div style="margin-bottom: 6px;">
                <strong style="color: hsl(160, 15%, 15%);">Sovereign Vaults:</strong> ${location.vaults || 'Pending'}
              </div>
              <div style="margin-bottom: 6px;">
                <strong style="color: hsl(160, 15%, 15%);">Communities:</strong> ${location.communities}
              </div>
              ${location.capitalMobilized ? `
                <div style="margin-bottom: 6px;">
                  <strong style="color: hsl(160, 15%, 15%);">Capital:</strong> ${location.capitalMobilized}
                </div>
              ` : ''}
              ${location.co2Offset ? `
                <div style="margin-bottom: 6px;">
                  <strong style="color: hsl(160, 15%, 15%);">CO₂ Offset:</strong> ${location.co2Offset}
                </div>
              ` : ''}
            </div>
            <div style="font-size: 13px; padding-top: 8px; border-top: 1px solid hsl(160, 15%, 88%); color: hsl(160, 8%, 45%);">
              <strong style="color: hsl(160, 15%, 15%);">Focus:</strong> ${location.focus}
            </div>
          </div>
        `;

        // Create popup
        const popup = new mapboxgl.Popup({ 
          offset: 25,
          closeButton: false,
          maxWidth: '300px'
        }).setHTML(popupContent);

        // Add marker to map
        new mapboxgl.Marker(el)
          .setLngLat(location.coordinates)
          .setPopup(popup)
          .addTo(map.current!);
      });
    });

    // Add custom CSS for pulse animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0%, 100% {
          opacity: 1;
          transform: scale(1);
        }
        50% {
          opacity: 0.8;
          transform: scale(1.1);
        }
      }
    `;
    document.head.appendChild(style);
  };

  const handleSubmitToken = () => {
    if (mapboxToken.trim()) {
      setTokenSubmitted(true);
      initializeMap(mapboxToken);
    }
  };

  useEffect(() => {
    return () => {
      map.current?.remove();
    };
  }, []);

  if (!tokenSubmitted) {
    return (
      <Card className="p-8 max-w-2xl mx-auto">
        <div className="flex items-start gap-4 mb-6">
          <AlertCircle className="h-6 w-6 text-accent flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Mapbox Access Token Required
            </h3>
            <p className="text-muted-foreground mb-4 leading-relaxed">
              To display the interactive map, please enter your Mapbox public access token. 
              You can get one for free at{' '}
              <a 
                href="https://mapbox.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                mapbox.com
              </a>
              {' '}under the Tokens section in your dashboard.
            </p>
            <div className="space-y-3">
              <Input
                type="text"
                placeholder="pk.eyJ1Ijoi..."
                value={mapboxToken}
                onChange={(e) => setMapboxToken(e.target.value)}
                className="font-mono text-sm"
              />
              <Button 
                onClick={handleSubmitToken}
                disabled={!mapboxToken.trim()}
                className="w-full bg-primary hover:bg-primary/90"
              >
                Load Interactive Map
              </Button>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="relative w-full h-[600px] rounded-lg overflow-hidden shadow-large">
      <div ref={mapContainer} className="absolute inset-0" />
      <div className="absolute top-4 left-4 bg-card/95 backdrop-blur-sm rounded-lg p-4 shadow-medium max-w-xs">
        <h4 className="font-semibold text-foreground mb-2">RDX Vault Network</h4>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary"></div>
            <span className="text-muted-foreground">Active Vaults</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-secondary"></div>
            <span className="text-muted-foreground">Planned</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-accent"></div>
            <span className="text-muted-foreground">Exploration</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
          Click markers for detailed vault information
        </p>
      </div>
    </div>
  );
};

export default InteractiveMap;
