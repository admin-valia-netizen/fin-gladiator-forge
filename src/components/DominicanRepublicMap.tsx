import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Trophy } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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

// Real SVG paths for Dominican Republic provinces (GeoJSON converted to SVG paths)
// These paths are accurate representations of the 32 provinces
const PROVINCE_PATHS: Record<string, { path: string; labelX: number; labelY: number }> = {
  'Monte Cristi': {
    path: 'M42,58 L58,52 L72,48 L88,52 L95,62 L88,75 L75,82 L58,85 L42,78 L35,68 Z',
    labelX: 62, labelY: 68
  },
  'Dajabón': {
    path: 'M88,52 L102,48 L115,55 L118,70 L108,82 L95,85 L88,75 L95,62 Z',
    labelX: 103, labelY: 68
  },
  'Valverde': {
    path: 'M75,82 L88,75 L95,85 L108,82 L105,98 L92,108 L78,105 L70,95 Z',
    labelX: 88, labelY: 95
  },
  'Santiago Rodríguez': {
    path: 'M108,82 L118,70 L132,68 L140,80 L135,95 L120,102 L105,98 Z',
    labelX: 122, labelY: 88
  },
  'Puerto Plata': {
    path: 'M92,108 L105,98 L120,102 L138,95 L155,88 L172,82 L188,78 L195,88 L185,102 L168,112 L150,115 L132,118 L115,120 L100,118 Z',
    labelX: 145, labelY: 100
  },
  'Espaillat': {
    path: 'M168,112 L185,102 L195,88 L208,85 L218,95 L212,112 L198,122 L182,125 L168,120 Z',
    labelX: 192, labelY: 108
  },
  'Santiago': {
    path: 'M120,102 L135,95 L140,80 L155,75 L168,82 L172,82 L155,88 L138,95 L132,118 L115,120 L100,118 L92,108 L105,98 Z',
    labelX: 132, labelY: 100
  },
  'La Vega': {
    path: 'M132,118 L150,115 L168,120 L182,125 L188,140 L178,158 L162,165 L145,162 L132,152 L125,138 Z',
    labelX: 155, labelY: 140
  },
  'María Trinidad Sánchez': {
    path: 'M212,112 L218,95 L235,88 L255,85 L272,92 L278,108 L268,122 L250,128 L232,125 L218,120 Z',
    labelX: 248, labelY: 108
  },
  'Duarte': {
    path: 'M182,125 L198,122 L212,112 L218,120 L232,125 L238,142 L228,158 L212,165 L195,162 L188,148 L188,140 Z',
    labelX: 210, labelY: 142
  },
  'Hermanas Mirabal': {
    path: 'M198,122 L212,112 L218,120 L212,130 L202,135 L195,128 Z',
    labelX: 208, labelY: 125
  },
  'Samaná': {
    path: 'M268,122 L278,108 L295,102 L318,98 L338,105 L348,118 L342,135 L322,145 L298,148 L280,142 L272,132 Z',
    labelX: 308, labelY: 125
  },
  'Sánchez Ramírez': {
    path: 'M188,140 L195,162 L212,165 L205,182 L188,188 L175,178 L178,158 Z',
    labelX: 192, labelY: 172
  },
  'Monseñor Nouel': {
    path: 'M162,165 L178,158 L175,178 L188,188 L182,202 L165,208 L152,198 L145,182 L145,162 Z',
    labelX: 165, labelY: 185
  },
  'Monte Plata': {
    path: 'M228,158 L238,142 L255,138 L272,145 L285,158 L282,178 L268,192 L250,195 L235,188 L225,175 Z',
    labelX: 255, labelY: 172
  },
  'Hato Mayor': {
    path: 'M280,142 L298,148 L315,155 L328,168 L325,188 L308,202 L288,205 L272,195 L268,178 L272,158 L285,158 L282,178 Z',
    labelX: 298, labelY: 178
  },
  'El Seibo': {
    path: 'M315,155 L328,148 L345,142 L365,148 L378,162 L382,182 L375,202 L358,215 L338,218 L320,208 L308,195 L308,202 L325,188 L328,168 Z',
    labelX: 348, labelY: 182
  },
  'La Altagracia': {
    path: 'M358,215 L375,202 L382,182 L392,175 L408,182 L418,198 L422,222 L415,245 L398,262 L375,268 L355,258 L342,242 L338,225 L338,218 Z',
    labelX: 382, labelY: 225
  },
  'La Romana': {
    path: 'M308,202 L320,208 L338,218 L338,225 L328,238 L310,245 L292,242 L280,228 L282,212 L288,205 Z',
    labelX: 308, labelY: 225
  },
  'San Pedro de Macorís': {
    path: 'M268,192 L282,212 L280,228 L268,242 L250,248 L235,242 L228,225 L232,208 L250,195 Z',
    labelX: 255, labelY: 222
  },
  'Santo Domingo': {
    path: 'M225,175 L235,188 L250,195 L232,208 L228,225 L218,238 L202,245 L188,238 L178,225 L182,208 L195,195 L212,188 Z',
    labelX: 212, labelY: 215
  },
  'Distrito Nacional': {
    path: 'M212,188 L218,195 L222,208 L218,218 L208,222 L198,218 L195,208 L198,198 Z',
    labelX: 208, labelY: 208
  },
  'San Cristóbal': {
    path: 'M182,202 L188,188 L205,182 L212,188 L195,195 L182,208 L178,225 L165,232 L152,225 L148,212 L152,198 L165,208 Z',
    labelX: 175, labelY: 212
  },
  'Peravia': {
    path: 'M148,212 L152,225 L148,242 L135,252 L120,248 L112,235 L118,218 L132,208 Z',
    labelX: 132, labelY: 232
  },
  'San José de Ocoa': {
    path: 'M145,182 L152,198 L148,212 L132,208 L118,218 L108,205 L112,188 L125,178 L145,162 Z',
    labelX: 128, labelY: 195
  },
  'Azua': {
    path: 'M108,205 L118,218 L112,235 L120,248 L108,265 L88,272 L72,268 L62,252 L68,232 L82,218 L98,212 Z',
    labelX: 92, labelY: 242
  },
  'San Juan': {
    path: 'M68,135 L88,128 L108,125 L125,138 L132,152 L125,178 L112,188 L98,212 L82,218 L68,232 L52,225 L42,208 L45,188 L52,168 L58,148 Z',
    labelX: 85, labelY: 175
  },
  'Elías Piña': {
    path: 'M42,115 L58,108 L75,112 L88,128 L68,135 L58,148 L45,142 L38,128 Z',
    labelX: 62, labelY: 128
  },
  'Independencia': {
    path: 'M42,208 L52,225 L45,245 L32,258 L18,252 L12,235 L18,218 L28,205 L38,198 Z',
    labelX: 32, labelY: 232
  },
  'Baoruco': {
    path: 'M52,225 L68,232 L62,252 L52,265 L38,272 L25,268 L18,252 L32,258 L45,245 Z',
    labelX: 45, labelY: 255
  },
  'Barahona': {
    path: 'M62,252 L72,268 L68,288 L55,305 L38,312 L22,305 L15,288 L22,272 L38,272 L52,265 Z',
    labelX: 45, labelY: 285
  },
  'Pedernales': {
    path: 'M22,272 L15,288 L8,308 L12,328 L28,342 L48,345 L65,335 L72,318 L68,302 L55,305 L68,288 L72,268 L62,252 L52,265 L38,272 Z',
    labelX: 38, labelY: 315
  },
};

// Zone type icons and colors
const ZONE_CONFIG = {
  costera: { label: 'Zona Marítima (GESEMA)', color: 'hsl(205, 85%, 55%)' },
  agricola: { label: 'Zona Agro-Tecnológica', color: 'hsl(142, 70%, 45%)' },
  urbana: { label: 'Zona Urbana', color: 'hsl(45, 90%, 50%)' },
};

export const DominicanRepublicMap = ({ provinces, onProvinceClick }: DominicanRepublicMapProps) => {
  const [hoveredProvince, setHoveredProvince] = useState<string | null>(null);

  // Choropleth color logic based on registration count
  const getProvinceColor = (province: ProvinceData | undefined) => {
    if (!province) return 'hsl(220, 15%, 90%)'; // Gris claro / blanco hueso
    
    const count = province.registration_count;
    
    // Meta cumplida - Azul Victoria (marino profundo)
    if (province.cidp_activated || count >= 5000) {
      return 'hsl(217, 85%, 25%)';
    }
    // 2,501 - 4,999: Azul medio institucional
    if (count >= 2501) {
      return 'hsl(217, 80%, 45%)';
    }
    // 1 - 2,500: Azul celeste
    if (count >= 1) {
      return 'hsl(205, 85%, 65%)';
    }
    // 0 registros: Gris claro
    return 'hsl(220, 15%, 90%)';
  };

  const getHoverColor = (province: ProvinceData | undefined) => {
    if (!province) return 'hsl(220, 15%, 85%)';
    
    const count = province.registration_count;
    
    if (province.cidp_activated || count >= 5000) {
      return 'hsl(217, 85%, 35%)';
    }
    if (count >= 2501) {
      return 'hsl(217, 80%, 55%)';
    }
    if (count >= 1) {
      return 'hsl(205, 85%, 75%)';
    }
    return 'hsl(220, 15%, 85%)';
  };

  const findProvince = (name: string) => {
    return provinces.find(p => p.province_name === name);
  };

  const getProgressText = (province: ProvinceData) => {
    const percentage = Math.round((province.registration_count / province.target_count) * 100);
    return `${province.registration_count.toLocaleString()} / ${province.target_count.toLocaleString()} (${percentage}%)`;
  };

  return (
    <TooltipProvider delayDuration={100}>
      <div className="relative w-full bg-gradient-to-b from-blue-950/80 to-blue-900/60 rounded-xl border border-border overflow-hidden p-4">
        {/* Title */}
        <div className="text-center mb-3">
          <h3 className="text-lg font-bold text-foreground">Mapa de la Integridad Dominicana</h3>
          <p className="text-xs text-muted-foreground">Compromiso 5,000 por Provincia</p>
        </div>

        {/* SVG Map */}
        <svg
          viewBox="0 380 430"
          className="w-full h-auto"
          style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.4))' }}
        >
          {/* Ocean background with gradient */}
          <defs>
            <linearGradient id="oceanGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="hsl(217, 90%, 20%)" />
              <stop offset="100%" stopColor="hsl(217, 85%, 15%)" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(45, 100%, 60%)" />
              <stop offset="100%" stopColor="hsl(35, 100%, 45%)" />
            </linearGradient>
          </defs>
          
          <rect x="0" y="0" width="430" height="380" fill="url(#oceanGradient)" />
          
          {/* Province shapes with tooltips */}
          {Object.entries(PROVINCE_PATHS).map(([name, { path, labelX, labelY }]) => {
            const province = findProvince(name);
            const isHovered = hoveredProvince === name;
            const isActivated = province?.cidp_activated || (province?.registration_count ?? 0) >= 5000;
            
            return (
              <Tooltip key={name}>
                <TooltipTrigger asChild>
                  <motion.g
                    onClick={() => province && onProvinceClick(province)}
                    onMouseEnter={() => setHoveredProvince(name)}
                    onMouseLeave={() => setHoveredProvince(null)}
                    style={{ cursor: province ? 'pointer' : 'default' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <motion.path
                      d={path}
                      fill={isHovered ? getHoverColor(province) : getProvinceColor(province)}
                      stroke="hsl(217, 50%, 30%)"
                      strokeWidth={isHovered ? "1.5" : "0.8"}
                      animate={{
                        scale: isHovered ? 1.02 : 1,
                      }}
                      transition={{ duration: 0.2 }}
                      style={{
                        transformOrigin: `${labelX}px ${labelY}px`,
                        filter: isActivated ? 'url(#glow)' : 'none',
                      }}
                    />
                    
                    {/* Golden star for activated provinces */}
                    {isActivated && (
                      <motion.g
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.3, type: 'spring' }}
                      >
                        <circle
                          cx={labelX}
                          cy={labelY}
                          r="8"
                          fill="url(#goldGradient)"
                          filter="url(#glow)"
                        />
                        <text
                          x={labelX}
                          y={labelY + 1}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fontSize="8"
                          fill="hsl(217, 85%, 15%)"
                        >
                          ★
                        </text>
                      </motion.g>
                    )}
                  </motion.g>
                </TooltipTrigger>
                <TooltipContent 
                  side="top" 
                  className="bg-card border-primary/30 shadow-xl max-w-xs"
                >
                  <div className="space-y-1.5 p-1">
                    <p className="font-bold text-foreground text-sm">{name}</p>
                    {province ? (
                      <>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <motion.div
                              className="h-full bg-primary"
                              initial={{ width: 0 }}
                              animate={{ 
                                width: `${Math.min((province.registration_count / province.target_count) * 100, 100)}%` 
                              }}
                              transition={{ duration: 0.5 }}
                            />
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          <span className="font-semibold text-foreground">
                            {province.registration_count.toLocaleString()}
                          </span>
                          {' / '}
                          {province.target_count.toLocaleString()} registros
                        </p>
                        <p className="text-xs" style={{ color: ZONE_CONFIG[province.zone_type].color }}>
                          {ZONE_CONFIG[province.zone_type].label}
                        </p>
                        {isActivated && (
                          <div className="flex items-center gap-1 text-amber-500 text-xs font-medium">
                            <Trophy className="w-3 h-3" />
                            ¡CIDP Activado!
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-xs text-muted-foreground">Sin datos disponibles</p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </svg>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap justify-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(220, 15%, 90%)' }} />
            <span className="text-muted-foreground">0 registros</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(205, 85%, 65%)' }} />
            <span className="text-muted-foreground">1 - 2,500</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(217, 80%, 45%)' }} />
            <span className="text-muted-foreground">2,501 - 4,999</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(217, 85%, 25%)' }} />
            <Star className="w-3 h-3 text-amber-500" />
            <span className="text-muted-foreground">Meta Cumplida (5,000)</span>
          </div>
        </div>

        {/* Interaction hint */}
        <p className="text-center text-xs text-muted-foreground mt-3">
          Toca o pasa el cursor sobre una provincia para ver los detalles
        </p>
      </div>
    </TooltipProvider>
  );
};
