import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  ComposableMap, 
  Geographies, 
  Geography 
} from 'react-simple-maps';
import { Star, Trophy } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';

interface ProvinceData {
  id: string;
  province_code: string;
  province_name: string;
  zone_type: 'costera' | 'agricola' | 'urbana';
  registration_count: number;
  target_count: number;
  cidp_activated: boolean;
}

interface DominicanRepublicMapProps {
  provinces: ProvinceData[];
  onProvinceClick: (province: ProvinceData) => void;
}

// GeoJSON URL for Dominican Republic provinces (32 provinces)
const GEO_URL = "https://raw.githubusercontent.com/jeasoft/provinces_geojson/master/provinces_municipality_summary.geojson";

// Map province names from GeoJSON to normalized names for matching with database
const normalizeProvinceName = (name: string): string => {
  return name
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, ' ')
    .trim();
};

// Color scale based on registration count thresholds - exactly as specified
const getProvinceColor = (count: number, target: number, cidpActivated: boolean): string => {
  // Meta cumplida (5,000 firmas): Azul Victoria (Azul marino profundo) #000080
  if (cidpActivated || count >= target) {
    return '#000080';
  }
  // 2,501 - 4,999 registros: Azul medio institucional
  if (count >= target / 2) {
    return '#1E40AF';
  }
  // 1 - 2,500 registros: Azul celeste
  if (count >= 1) {
    return '#60A5FA';
  }
  // 0 registros: Gris claro #E0E0E0
  return '#E0E0E0';
};

const ZONE_LABELS = {
  costera: 'Marítima (GESEMA)',
  agricola: 'Agro-Tecnológica',
  urbana: 'Urbana',
};

export const DominicanRepublicMap = ({ provinces, onProvinceClick }: DominicanRepublicMapProps) => {
  const [hoveredProvince, setHoveredProvince] = useState<string | null>(null);
  const [geoData, setGeoData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGeoData = async () => {
      try {
        const response = await fetch(GEO_URL);
        if (!response.ok) throw new Error('Error al cargar el mapa');
        const data = await response.json();
        setGeoData(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching geo data:', err);
        setError('No se pudo cargar el mapa geográfico');
      } finally {
        setLoading(false);
      }
    };

    fetchGeoData();
  }, []);

  // Create a map for quick province lookup by normalized name
  const provinceMap = useMemo(() => {
    const map = new Map<string, ProvinceData>();
    provinces.forEach(p => {
      map.set(normalizeProvinceName(p.province_name), p);
    });
    return map;
  }, [provinces]);

  const findProvinceData = (geoName: string): ProvinceData | undefined => {
    const normalizedGeoName = normalizeProvinceName(geoName);
    
    // Direct match
    if (provinceMap.has(normalizedGeoName)) {
      return provinceMap.get(normalizedGeoName);
    }
    
    // Partial match - look for province containing the geo name or vice versa
    for (const [key, value] of provinceMap.entries()) {
      if (normalizedGeoName.includes(key) || key.includes(normalizedGeoName)) {
        return value;
      }
    }
    
    return undefined;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 bg-muted/20 rounded-xl min-h-[400px]">
        <motion.div
          className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
        <span className="ml-3 text-muted-foreground">Cargando mapa...</span>
      </div>
    );
  }

  if (error || !geoData) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-muted/20 rounded-xl min-h-[400px] gap-4">
        <p className="text-muted-foreground text-center">
          {error || 'Error al cargar el mapa'}
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <motion.div 
        className="relative bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 rounded-xl p-4 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Legend */}
        <div className="absolute top-4 left-4 z-10 bg-card/95 backdrop-blur-sm p-3 rounded-lg border border-border shadow-lg">
          <p className="text-xs font-bold text-foreground mb-2">Leyenda - Desafío 5,000</p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border border-border" style={{ backgroundColor: '#E0E0E0' }} />
              <span className="text-xs text-muted-foreground">0 firmas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border border-border" style={{ backgroundColor: '#60A5FA' }} />
              <span className="text-xs text-muted-foreground">1 - 2,500</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border border-border" style={{ backgroundColor: '#1E40AF' }} />
              <span className="text-xs text-muted-foreground">2,501 - 4,999</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border border-border" style={{ backgroundColor: '#000080' }} />
              <Star className="w-3 h-3 text-amber-500 fill-amber-500 -ml-1" />
              <span className="text-xs text-muted-foreground">5,000+ (Meta)</span>
            </div>
          </div>
        </div>

        {/* Map Container */}
        <div className="relative">
          <ComposableMap
            projection="geoMercator"
            projectionConfig={{
              center: [-70.1, 18.85],
              scale: 7500
            }}
            style={{
              width: '100%',
              height: 'auto',
            }}
            viewBox="0 0 800 450"
          >
            <Geographies geography={geoData}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const geoName = geo.properties.province_name || geo.properties.name || geo.properties.NAME || '';
                  const provinceData = findProvinceData(geoName);
                  const isHovered = hoveredProvince === geoName;
                  
                  const fillColor = provinceData 
                    ? getProvinceColor(provinceData.registration_count, provinceData.target_count, provinceData.cidp_activated)
                    : '#E0E0E0';
                  
                  const isActivated = provinceData?.cidp_activated || (provinceData?.registration_count ?? 0) >= (provinceData?.target_count ?? 5000);

                  const geographyElement = (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      onMouseEnter={() => setHoveredProvince(geoName)}
                      onMouseLeave={() => setHoveredProvince(null)}
                      onClick={() => provinceData && onProvinceClick(provinceData)}
                      style={{
                        default: {
                          fill: fillColor,
                          stroke: '#FFFFFF',
                          strokeWidth: 0.5,
                          outline: 'none',
                          transition: 'all 0.3s ease',
                        },
                        hover: {
                          fill: isActivated ? '#000066' : '#3B82F6',
                          stroke: '#FFFFFF',
                          strokeWidth: 1.5,
                          outline: 'none',
                          cursor: provinceData ? 'pointer' : 'default',
                        },
                        pressed: {
                          fill: '#1E3A8A',
                          stroke: '#FFFFFF',
                          strokeWidth: 1.5,
                          outline: 'none',
                        },
                      }}
                    />
                  );

                  if (!provinceData) return geographyElement;

                  const percentage = Math.min((provinceData.registration_count / provinceData.target_count) * 100, 100);

                  return (
                    <Tooltip key={geo.rsmKey}>
                      <TooltipTrigger asChild>
                        {geographyElement}
                      </TooltipTrigger>
                      <TooltipContent 
                        side="top" 
                        className="bg-card border-border p-3 max-w-[220px] shadow-xl"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-bold text-foreground text-sm">{provinceData.province_name}</p>
                            {isActivated && (
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Zona: {ZONE_LABELS[provinceData.zone_type]}
                          </p>
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">Progreso:</span>
                              <span className="font-medium text-foreground">
                                {provinceData.registration_count.toLocaleString()}/{provinceData.target_count.toLocaleString()}
                              </span>
                            </div>
                            <Progress value={percentage} className="h-2" />
                            <p className="text-xs text-right text-muted-foreground">{percentage.toFixed(1)}%</p>
                          </div>
                          {isActivated && (
                            <div className="flex items-center gap-1.5 text-green-500 text-xs font-medium pt-1">
                              <Trophy className="w-3 h-3" />
                              ¡CIDP Activado!
                            </div>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  );
                })
              }
            </Geographies>
          </ComposableMap>
        </div>

        {/* Title overlay */}
        <div className="absolute bottom-4 right-4 bg-card/95 backdrop-blur-sm px-4 py-2 rounded-lg border border-border shadow-lg">
          <p className="text-sm font-bold text-foreground">República Dominicana</p>
          <p className="text-xs text-muted-foreground">32 Provincias - Datos Geográficos Oficiales</p>
        </div>

        {/* Interaction hint */}
        <p className="text-center text-xs text-muted-foreground mt-2">
          Toca o pasa el cursor sobre una provincia para ver los detalles
        </p>
      </motion.div>
    </TooltipProvider>
  );
};
