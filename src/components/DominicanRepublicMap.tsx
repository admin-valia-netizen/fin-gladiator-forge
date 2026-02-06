import { motion } from 'framer-motion';

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

// Simplified SVG paths for Dominican Republic provinces
// These are approximate representations for visualization
const PROVINCE_PATHS: Record<string, { path: string; cx: number; cy: number }> = {
  'Distrito Nacional': { path: 'M195,145 L205,140 L215,145 L210,155 L200,155 Z', cx: 205, cy: 148 },
  'Santo Domingo': { path: 'M180,135 L195,130 L220,135 L225,150 L220,165 L195,170 L175,160 L170,145 Z', cx: 197, cy: 150 },
  'Azua': { path: 'M120,160 L150,150 L165,160 L160,185 L130,195 L110,180 Z', cx: 138, cy: 172 },
  'Baoruco': { path: 'M80,175 L100,165 L115,175 L110,195 L85,200 L70,190 Z', cx: 93, cy: 183 },
  'Barahona': { path: 'M85,200 L110,195 L120,215 L100,240 L75,235 L70,210 Z', cx: 95, cy: 218 },
  'Dajabón': { path: 'M55,70 L80,60 L95,75 L90,95 L65,100 L50,85 Z', cx: 73, cy: 80 },
  'Duarte': { path: 'M155,85 L185,75 L200,90 L195,115 L165,120 L150,105 Z', cx: 173, cy: 98 },
  'Elías Piña': { path: 'M45,120 L70,110 L85,125 L80,150 L55,155 L40,140 Z', cx: 63, cy: 133 },
  'El Seibo': { path: 'M260,115 L295,105 L315,120 L310,145 L275,150 L255,135 Z', cx: 285, cy: 128 },
  'Espaillat': { path: 'M170,60 L195,50 L210,65 L205,85 L180,90 L165,75 Z', cx: 188, cy: 70 },
  'Hato Mayor': { path: 'M245,130 L270,120 L285,135 L280,160 L255,165 L240,150 Z', cx: 263, cy: 143 },
  'Hermanas Mirabal': { path: 'M185,55 L205,48 L218,60 L215,78 L195,82 L182,70 Z', cx: 200, cy: 65 },
  'Independencia': { path: 'M35,155 L60,145 L75,160 L70,190 L45,195 L30,175 Z', cx: 53, cy: 170 },
  'La Altagracia': { path: 'M305,120 L340,110 L365,130 L360,165 L320,175 L300,150 Z', cx: 333, cy: 143 },
  'La Romana': { path: 'M285,150 L310,145 L325,160 L320,180 L295,185 L280,170 Z', cx: 303, cy: 165 },
  'La Vega': { path: 'M135,85 L160,75 L175,90 L170,115 L145,120 L130,105 Z', cx: 153, cy: 98 },
  'María Trinidad Sánchez': { path: 'M220,50 L250,40 L270,55 L265,80 L235,85 L215,70 Z', cx: 243, cy: 63 },
  'Monseñor Nouel': { path: 'M150,105 L170,100 L180,115 L175,135 L155,140 L145,125 Z', cx: 163, cy: 120 },
  'Monte Cristi': { path: 'M20,55 L55,45 L75,60 L70,85 L35,90 L15,75 Z', cx: 45, cy: 68 },
  'Monte Plata': { path: 'M205,115 L235,105 L250,120 L245,145 L215,150 L200,135 Z', cx: 225, cy: 128 },
  'Pedernales': { path: 'M30,200 L55,190 L70,210 L60,245 L35,250 L20,225 Z', cx: 45, cy: 220 },
  'Peravia': { path: 'M160,160 L185,155 L195,170 L188,190 L165,195 L155,178 Z', cx: 175, cy: 175 },
  'Puerto Plata': { path: 'M100,40 L140,30 L165,45 L160,70 L125,78 L95,60 Z', cx: 130, cy: 53 },
  'Samaná': { path: 'M260,55 L295,45 L320,65 L310,90 L275,95 L255,75 Z', cx: 288, cy: 70 },
  'Sánchez Ramírez': { path: 'M175,100 L195,95 L208,108 L205,125 L185,130 L172,118 Z', cx: 190, cy: 113 },
  'San Cristóbal': { path: 'M165,145 L190,140 L200,155 L195,175 L170,180 L160,165 Z', cx: 180, cy: 160 },
  'San José de Ocoa': { path: 'M140,140 L160,135 L170,150 L165,170 L145,175 L135,160 Z', cx: 153, cy: 155 },
  'San Juan': { path: 'M70,130 L105,120 L120,140 L115,170 L80,180 L60,155 Z', cx: 92, cy: 150 },
  'San Pedro de Macorís': { path: 'M240,155 L265,150 L280,165 L275,185 L250,190 L235,175 Z', cx: 258, cy: 170 },
  'Santiago': { path: 'M105,70 L140,60 L158,78 L152,100 L120,108 L100,90 Z', cx: 128, cy: 85 },
  'Santiago Rodríguez': { path: 'M65,85 L90,75 L105,90 L100,115 L75,120 L60,105 Z', cx: 83, cy: 98 },
  'Valverde': { path: 'M70,60 L95,52 L110,68 L105,88 L80,93 L65,78 Z', cx: 88, cy: 73 },
};

export const DominicanRepublicMap = ({ provinces, onProvinceClick }: DominicanRepublicMapProps) => {
  const getProvinceColor = (province: ProvinceData | undefined) => {
    if (!province) return 'hsl(var(--muted))';
    
    const percentage = (province.registration_count / province.target_count) * 100;
    
    if (province.cidp_activated || percentage >= 100) {
      return 'hsl(142, 76%, 36%)'; // Green - activated
    }
    if (percentage >= 75) {
      return 'hsl(217, 91%, 60%)'; // Blue Victory
    }
    if (percentage >= 50) {
      return 'hsl(var(--primary))'; // Primary orange
    }
    if (percentage >= 25) {
      return 'hsl(45, 93%, 47%)'; // Amber
    }
    if (percentage > 0) {
      return 'hsl(var(--primary) / 0.5)'; // Light primary
    }
    return 'hsl(var(--muted))'; // Default gray
  };

  const findProvince = (name: string) => {
    return provinces.find(p => p.province_name === name);
  };

  return (
    <div className="relative w-full aspect-[1.6/1] bg-card/50 rounded-xl border border-border overflow-hidden">
      <svg
        viewBox="0 0 380 280"
        className="w-full h-full"
        style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))' }}
      >
        {/* Ocean background */}
        <rect x="0" y="0" width="380" height="280" fill="hsl(217, 91%, 15%)" />
        
        {/* Island base shape */}
        <path
          d="M15,75 Q25,35 80,30 Q150,20 220,35 Q280,25 340,50 Q375,80 365,130 Q370,180 340,200 Q310,190 280,185 Q240,195 200,175 Q160,195 120,195 Q80,210 50,245 Q20,260 15,220 Q25,180 30,155 Q20,120 15,75"
          fill="hsl(var(--card))"
          stroke="hsl(var(--border))"
          strokeWidth="1"
        />
        
        {/* Province shapes */}
        {Object.entries(PROVINCE_PATHS).map(([name, { path, cx, cy }]) => {
          const province = findProvince(name);
          const color = getProvinceColor(province);
          const percentage = province 
            ? Math.round((province.registration_count / province.target_count) * 100) 
            : 0;
          
          return (
            <motion.g
              key={name}
              onClick={() => province && onProvinceClick(province)}
              style={{ cursor: province ? 'pointer' : 'default' }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              <motion.path
                d={path}
                fill={color}
                stroke="hsl(var(--border))"
                strokeWidth="0.5"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              />
              {/* Province label (only show for provinces with progress or on hover) */}
              {percentage > 0 && (
                <text
                  x={cx}
                  y={cy}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-[6px] font-bold fill-foreground pointer-events-none"
                  style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
                >
                  {percentage}%
                </text>
              )}
            </motion.g>
          );
        })}
        
        {/* Legend */}
        <g transform="translate(10, 250)">
          <rect x="0" y="0" width="8" height="8" fill="hsl(var(--muted))" rx="1" />
          <text x="12" y="7" className="text-[5px] fill-muted-foreground">0%</text>
          
          <rect x="35" y="0" width="8" height="8" fill="hsl(var(--primary) / 0.5)" rx="1" />
          <text x="47" y="7" className="text-[5px] fill-muted-foreground">1-24%</text>
          
          <rect x="75" y="0" width="8" height="8" fill="hsl(45, 93%, 47%)" rx="1" />
          <text x="87" y="7" className="text-[5px] fill-muted-foreground">25-49%</text>
          
          <rect x="120" y="0" width="8" height="8" fill="hsl(var(--primary))" rx="1" />
          <text x="132" y="7" className="text-[5px] fill-muted-foreground">50-74%</text>
          
          <rect x="165" y="0" width="8" height="8" fill="hsl(217, 91%, 60%)" rx="1" />
          <text x="177" y="7" className="text-[5px] fill-muted-foreground">75-99%</text>
          
          <rect x="210" y="0" width="8" height="8" fill="hsl(142, 76%, 36%)" rx="1" />
          <text x="222" y="7" className="text-[5px] fill-muted-foreground">CIDP</text>
        </g>
      </svg>
      
      {/* Overlay text */}
      <div className="absolute bottom-2 right-2 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
        Toca una provincia para ver detalles
      </div>
    </div>
  );
};
