import { useMemo, useRef, useState, type MouseEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";

interface ProvinceData {
  id: string;
  province_code: string;
  province_name: string;
  zone_type: "costera" | "agricola" | "urbana";
  registration_count: number;
  target_count: number;
  cidp_activated: boolean;
}

interface DominicanRepublicMapProps {
  provinces: ProvinceData[];
  onProvinceClick: (province: ProvinceData) => void;
}

const GEO_URL = "/rd-provinces.topojson";

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

const getGeoProvinceName = (geo: any): string => {
  const p = geo?.properties ?? {};
  return (
    p.shapeName ||
    p.shapeNAME ||
    p.name ||
    p.NAME_1 ||
    p.province ||
    p.Province ||
    p.NAME ||
    "Provincia"
  );
};

type TooltipState = {
  x: number;
  y: number;
  geoName: string;
  province?: ProvinceData;
};

export const DominicanRepublicMap = ({ provinces, onProvinceClick }: DominicanRepublicMapProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const provinceByName = useMemo(() => {
    const map = new Map<string, ProvinceData>();
    for (const p of provinces) map.set(normalize(p.province_name), p);
    return map;
  }, [provinces]);

  const matchProvince = (geo: any): { geoName: string; province?: ProvinceData } => {
    const geoName = getGeoProvinceName(geo);
    const key = normalize(geoName);

    const direct = provinceByName.get(key);
    if (direct) return { geoName: direct.province_name, province: direct };

    // Búsqueda por inclusión (por diferencias menores en nombres)
    for (const [k, p] of provinceByName.entries()) {
      if (key.includes(k) || k.includes(key)) return { geoName: p.province_name, province: p };
    }

    return { geoName };
  };

  const getFill = (province?: ProvinceData) => {
    if (!province) return "hsl(var(--fin-map-inprogress))";

    const metaCumplida = province.cidp_activated || province.registration_count >= province.target_count;
    return metaCumplida ? "hsl(var(--fin-map-victory))" : "hsl(var(--fin-map-inprogress))";
  };

  const setTooltipFromEvent = (evt: MouseEvent, next: Omit<TooltipState, "x" | "y">) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    setTooltip({
      ...next,
      x: evt.clientX - rect.left,
      y: evt.clientY - rect.top,
    });
  };

  const tooltipMaxLeft = (containerRef.current?.clientWidth ?? 0) - 220;

  return (
    <div ref={containerRef} className="relative w-full overflow-hidden rounded-xl card-industrial">
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ center: [-70.4, 18.9], scale: 12000 }}
        width={800}
        height={520}
        className="w-full h-auto"
        style={{ maxHeight: "60vh" }}
        role="img"
        aria-label="Mapa provincial de la República Dominicana"
      >
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const { geoName, province } = matchProvince(geo);
              const fill = getFill(province);
              const isHovered = hoveredKey === geo.rsmKey;

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  onMouseEnter={(evt) => {
                    setHoveredKey(geo.rsmKey);
                    setTooltipFromEvent(evt, { geoName, province });
                  }}
                  onMouseMove={(evt) => {
                    if (hoveredKey !== geo.rsmKey) return;
                    setTooltipFromEvent(evt, { geoName, province });
                  }}
                  onMouseLeave={() => {
                    setHoveredKey(null);
                    setTooltip(null);
                  }}
                  onClick={() => {
                    if (province) onProvinceClick(province);
                  }}
                  className={
                    (province ? "cursor-pointer" : "cursor-default") +
                    " transition-[filter] duration-150"
                  }
                  style={{
                    default: { fill, outline: "none" },
                    hover: { fill, outline: "none", filter: "brightness(1.12)" },
                    pressed: { fill, outline: "none" },
                  }}
                  stroke="hsl(var(--border))"
                  strokeWidth={isHovered ? 1.5 : 1}
                  opacity={province ? 1 : 0.95}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>

      <AnimatePresence>
        {tooltip && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.15 }}
            className="pointer-events-none absolute z-20 rounded-lg border border-border bg-card px-3 py-2 shadow-lg"
            style={{
              left: Math.min(tooltip.x + 12, Math.max(8, tooltipMaxLeft)),
              top: Math.max(tooltip.y - 12, 8),
            }}
          >
            <p className="text-sm font-bold text-foreground">{tooltip.geoName}</p>
            {tooltip.province && (
              <p className="text-xs text-muted-foreground">
                {tooltip.province.registration_count.toLocaleString()} / {tooltip.province.target_count.toLocaleString()} registros
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
