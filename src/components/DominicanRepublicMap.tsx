import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
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

// SVG paths for Dominican Republic provinces - accurate representation
const PROVINCE_PATHS: Record<string, { 
  path: string; 
  labelX: number; 
  labelY: number;
  labelSize?: number;
}> = {
  // Northwest Region
  'Monte Cristi': {
    path: 'M45,95 L60,88 L75,85 L90,88 L100,95 L105,108 L100,120 L88,128 L70,132 L52,128 L42,118 L40,105 Z',
    labelX: 70, labelY: 108
  },
  'Dajabón': {
    path: 'M100,95 L115,90 L128,95 L135,108 L130,122 L118,130 L105,128 L100,120 L105,108 Z',
    labelX: 116, labelY: 110
  },
  'Santiago Rodríguez': {
    path: 'M118,130 L130,122 L145,118 L158,125 L155,142 L142,152 L128,148 L118,140 Z',
    labelX: 136, labelY: 136
  },
  'Valverde': {
    path: 'M88,128 L100,120 L105,128 L118,130 L118,140 L108,152 L92,155 L80,148 L78,138 Z',
    labelX: 96, labelY: 140
  },
  // North Region
  'Puerto Plata': {
    path: 'M108,152 L118,140 L128,148 L142,152 L160,148 L178,142 L198,138 L218,135 L238,138 L248,148 L242,162 L225,172 L205,178 L182,180 L158,178 L135,175 L118,172 L108,162 Z',
    labelX: 175, labelY: 158
  },
  'Espaillat': {
    path: 'M225,172 L242,162 L258,158 L275,165 L280,182 L272,198 L255,205 L238,202 L225,192 L222,182 Z',
    labelX: 252, labelY: 182
  },
  'María Trinidad Sánchez': {
    path: 'M272,198 L280,182 L298,175 L318,172 L340,178 L355,192 L352,210 L335,222 L312,225 L290,220 L278,210 Z',
    labelX: 318, labelY: 198, labelSize: 7
  },
  'Samaná': {
    path: 'M335,222 L352,210 L372,205 L395,210 L418,222 L428,242 L418,262 L395,272 L368,275 L345,268 L332,252 L330,235 Z',
    labelX: 378, labelY: 242
  },
  // Cibao Central
  'Santiago': {
    path: 'M142,152 L155,142 L170,138 L188,142 L205,148 L205,168 L195,185 L175,195 L155,192 L140,182 L135,168 Z',
    labelX: 170, labelY: 168
  },
  'La Vega': {
    path: 'M195,185 L205,168 L222,165 L238,172 L252,185 L255,205 L248,225 L230,238 L208,242 L188,235 L178,218 L180,198 Z',
    labelX: 218, labelY: 208
  },
  'Hermanas Mirabal': {
    path: 'M255,205 L272,198 L278,210 L275,225 L262,232 L250,228 L248,218 Z',
    labelX: 262, labelY: 215, labelSize: 6
  },
  'Duarte': {
    path: 'M275,225 L290,220 L312,225 L320,245 L312,268 L292,278 L270,275 L255,262 L252,242 L258,228 Z',
    labelX: 285, labelY: 250
  },
  // Central Region
  'Sánchez Ramírez': {
    path: 'M230,238 L248,225 L258,228 L255,262 L240,278 L220,282 L205,272 L208,252 Z',
    labelX: 232, labelY: 258, labelSize: 7
  },
  'Monseñor Nouel': {
    path: 'M188,235 L208,242 L208,252 L205,272 L188,285 L170,288 L155,278 L155,258 L168,245 Z',
    labelX: 180, labelY: 265, labelSize: 7
  },
  'La Estrelleta': {
    path: 'M128,148 L135,168 L140,182 L130,198 L115,205 L100,198 L95,182 L100,165 L112,155 Z',
    labelX: 116, labelY: 178, labelSize: 7
  },
  'Elías Piña': {
    path: 'M95,182 L100,198 L92,215 L78,225 L62,222 L52,208 L55,192 L68,180 L82,178 Z',
    labelX: 75, labelY: 202
  },
  'San Juan': {
    path: 'M115,205 L130,198 L140,215 L145,235 L138,258 L120,275 L98,282 L78,275 L65,258 L68,235 L78,218 L92,215 L100,198 Z',
    labelX: 108, labelY: 245
  },
  // Southwest Region
  'Azua': {
    path: 'M145,235 L155,258 L155,278 L148,298 L128,312 L105,318 L85,312 L75,295 L80,275 L98,282 L120,275 L138,258 Z',
    labelX: 118, labelY: 292
  },
  'San José de Ocoa': {
    path: 'M155,278 L170,288 L175,305 L168,322 L152,328 L138,322 L135,305 L148,298 Z',
    labelX: 155, labelY: 308, labelSize: 6
  },
  'Peravia': {
    path: 'M175,305 L188,298 L205,305 L210,322 L202,340 L182,348 L165,342 L158,325 L168,322 Z',
    labelX: 185, labelY: 325
  },
  'San Cristóbal': {
    path: 'M188,285 L205,272 L225,278 L238,292 L235,312 L222,328 L202,335 L188,328 L182,312 L188,298 Z',
    labelX: 212, labelY: 305
  },
  // South Central
  'Distrito Nacional': {
    path: 'M250,305 L262,298 L275,305 L278,318 L272,330 L258,335 L248,328 L245,315 Z',
    labelX: 262, labelY: 318, labelSize: 6
  },
  'Santo Domingo': {
    path: 'M235,312 L250,305 L262,298 L280,295 L298,302 L310,318 L305,340 L288,355 L265,360 L245,355 L232,340 L230,322 Z',
    labelX: 268, labelY: 332
  },
  // East Region
  'Monte Plata': {
    path: 'M292,278 L312,268 L332,275 L348,290 L345,312 L328,328 L308,332 L290,325 L285,308 L288,292 Z',
    labelX: 318, labelY: 302
  },
  'Hato Mayor': {
    path: 'M328,328 L345,312 L365,308 L385,318 L392,338 L385,358 L368,368 L348,365 L332,352 L328,338 Z',
    labelX: 358, labelY: 340
  },
  'El Seibo': {
    path: 'M368,368 L385,358 L405,352 L428,360 L445,378 L442,402 L425,418 L402,422 L380,415 L365,398 L362,380 Z',
    labelX: 405, labelY: 388
  },
  'La Altagracia': {
    path: 'M425,418 L442,402 L462,395 L485,405 L502,425 L505,452 L495,478 L472,495 L445,498 L422,488 L408,468 L405,445 L410,428 Z',
    labelX: 455, labelY: 450
  },
  'La Romana': {
    path: 'M380,415 L402,422 L408,445 L398,468 L375,478 L352,472 L340,455 L345,435 L362,425 Z',
    labelX: 375, labelY: 450
  },
  'San Pedro de Macorís': {
    path: 'M305,340 L328,338 L348,352 L355,372 L345,392 L322,402 L298,398 L285,378 L288,358 Z',
    labelX: 320, labelY: 372, labelSize: 6
  },
  // Far Southwest
  'Baoruco': {
    path: 'M65,258 L78,275 L72,295 L58,308 L42,305 L32,290 L38,272 L52,262 Z',
    labelX: 52, labelY: 285
  },
  'Independencia': {
    path: 'M32,290 L42,305 L35,325 L22,338 L8,332 L2,315 L8,298 L20,288 Z',
    labelX: 22, labelY: 315
  },
  'Barahona': {
    path: 'M58,308 L72,295 L85,312 L88,335 L78,358 L58,375 L38,378 L22,368 L18,348 L28,330 L35,325 L42,305 Z',
    labelX: 55, labelY: 345
  },
  'Pedernales': {
    path: 'M18,348 L28,365 L25,388 L32,412 L48,432 L72,442 L95,438 L112,422 L108,398 L92,378 L78,358 L58,375 L38,378 L22,368 Z',
    labelX: 62, labelY: 405
  },
};

const normalizeProvinceName = (name: string): string => {
  return name
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, ' ')
    .trim();
};

export const DominicanRepublicMap = ({ provinces, onProvinceClick }: DominicanRepublicMapProps) => {
  const [hoveredProvince, setHoveredProvince] = useState<string | null>(null);

  // Create a map for quick province lookup
  const provinceMap = useMemo(() => {
    const map = new Map<string, ProvinceData>();
    provinces.forEach(p => {
      map.set(normalizeProvinceName(p.province_name), p);
    });
    return map;
  }, [provinces]);

  const findProvince = (name: string): ProvinceData | undefined => {
    const normalized = normalizeProvinceName(name);
    if (provinceMap.has(normalized)) {
      return provinceMap.get(normalized);
    }
    // Partial match
    for (const [key, value] of provinceMap.entries()) {
      if (normalized.includes(key) || key.includes(normalized)) {
        return value;
      }
    }
    return undefined;
  };

  // Colors based on specification
  const getProvinceColor = (province: ProvinceData | undefined) => {
    if (!province) return '#B8C4CE'; // Gris base
    
    const { registration_count, target_count, cidp_activated } = province;
    
    // Meta cumplida - Azul Victoria
    if (cidp_activated || registration_count >= target_count) {
      return '#1a365d'; // Navy blue
    }
    
    // En progreso - Gris azulado
    return '#B8C4CE';
  };

  const isActivated = (province: ProvinceData | undefined) => {
    if (!province) return false;
    return province.cidp_activated || province.registration_count >= province.target_count;
  };

  // Calculate totals
  const totalRegistrations = provinces.reduce((sum, p) => sum + p.registration_count, 0);
  const totalTarget = provinces.reduce((sum, p) => sum + p.target_count, 0);
  const totalPercentage = totalTarget > 0 ? (totalRegistrations / totalTarget) * 100 : 0;

  return (
    <div className="relative bg-[#4a6b8a] rounded-xl overflow-hidden">
      {/* Title */}
      <div className="text-center py-4">
        <h2 className="text-xl md:text-2xl font-bold text-white tracking-wide">
          MAPA DE LA INTEGRIDAD DOMINICANA
        </h2>
      </div>

      {/* SVG Map */}
      <div className="relative px-2 pb-2">
        <svg
          viewBox="0 0 520 520"
          className="w-full h-auto"
          style={{ maxHeight: '60vh' }}
        >
          {/* Background ocean */}
          <rect x="0" y="0" width="520" height="520" fill="#4a6b8a" />
          
          {/* Definitions for gradients and effects */}
          <defs>
            <linearGradient id="goldBadgeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
            <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="1" dy="1" stdDeviation="2" floodOpacity="0.3"/>
            </filter>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Province shapes */}
          {Object.entries(PROVINCE_PATHS).map(([name, { path, labelX, labelY, labelSize = 8 }]) => {
            const province = findProvince(name);
            const color = getProvinceColor(province);
            const activated = isActivated(province);
            const isHovered = hoveredProvince === name;
            
            return (
              <g 
                key={name}
                onClick={() => province && onProvinceClick(province)}
                onMouseEnter={() => setHoveredProvince(name)}
                onMouseLeave={() => setHoveredProvince(null)}
                style={{ cursor: province ? 'pointer' : 'default' }}
              >
                {/* Province shape */}
                <motion.path
                  d={path}
                  fill={color}
                  stroke="#2d4a5e"
                  strokeWidth={isHovered ? "2" : "1"}
                  filter={activated ? "url(#dropShadow)" : undefined}
                  initial={{ opacity: 0 }}
                  animate={{ 
                    opacity: 1,
                    scale: isHovered ? 1.02 : 1,
                  }}
                  transition={{ duration: 0.3 }}
                  style={{ transformOrigin: `${labelX}px ${labelY}px` }}
                />
                
                {/* Province label */}
                <text
                  x={labelX}
                  y={labelY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={labelSize}
                  fontWeight="500"
                  fill={activated ? "#ffffff" : "#2d4a5e"}
                  style={{ 
                    pointerEvents: 'none',
                    textShadow: activated ? '0 1px 2px rgba(0,0,0,0.5)' : 'none'
                  }}
                >
                  {name}
                </text>
                
                {/* Gold badge for activated provinces */}
                {activated && (
                  <g filter="url(#glow)">
                    {/* Badge circle */}
                    <circle
                      cx={labelX}
                      cy={labelY - 18}
                      r="10"
                      fill="url(#goldBadgeGradient)"
                      stroke="#854d0e"
                      strokeWidth="1"
                    />
                    {/* Checkmark inside badge */}
                    <path
                      d={`M${labelX - 4},${labelY - 18} L${labelX - 1},${labelY - 15} L${labelX + 5},${labelY - 22}`}
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {/* Ribbon tails */}
                    <path
                      d={`M${labelX - 8},${labelY - 10} Q${labelX - 10},${labelY - 5} ${labelX - 12},${labelY}`}
                      fill="none"
                      stroke="#dc2626"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    <path
                      d={`M${labelX + 8},${labelY - 10} Q${labelX + 10},${labelY - 5} ${labelX + 12},${labelY}`}
                      fill="none"
                      stroke="#dc2626"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Total National Counter */}
      <div className="bg-white/10 backdrop-blur-sm mx-4 mb-4 p-4 rounded-lg">
        <div className="text-center mb-2">
          <span className="text-white font-bold text-lg">TOTAL NACIONAL: </span>
          <span className="text-white font-bold text-xl">{totalRegistrations.toLocaleString()}</span>
          <span className="text-white/70 text-lg"> / {totalTarget.toLocaleString()} Firmas</span>
        </div>
        <div className="relative h-3 bg-white/20 rounded-full overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 bg-red-600 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(totalPercentage, 100)}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 pb-4">
        <p className="text-white/80 text-xs text-center">
          <span className="inline-flex items-center gap-1 mr-3">
            <span className="w-3 h-3 rounded bg-[#B8C4CE] border border-white/30"></span>
            <span className="font-medium text-white">Gris:</span> En Progreso
          </span>
          <span className="mx-2 text-white/50">|</span>
          <span className="inline-flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-[#1a365d] border border-white/30"></span>
            <span className="font-medium text-white">Azul Victoria:</span> Meta 5,000 Cumplida (Recompensa Activada)
          </span>
        </p>
      </div>

      {/* Hover tooltip */}
      {hoveredProvince && (() => {
        const province = findProvince(hoveredProvince);
        if (!province) return null;
        const percentage = (province.registration_count / province.target_count) * 100;
        
        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-card border border-border rounded-lg shadow-xl p-3 min-w-[200px] z-20"
          >
            <p className="font-bold text-foreground text-sm mb-1">{province.province_name}</p>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Progreso:</span>
                <span className="font-medium text-foreground">
                  {province.registration_count.toLocaleString()} / {province.target_count.toLocaleString()}
                </span>
              </div>
              <Progress value={percentage} className="h-2" />
              <p className="text-xs text-right text-muted-foreground">{percentage.toFixed(1)}%</p>
            </div>
            {isActivated(province) && (
              <p className="text-xs text-green-500 font-medium mt-1">¡CIDP Activado!</p>
            )}
          </motion.div>
        );
      })()}
    </div>
  );
};
