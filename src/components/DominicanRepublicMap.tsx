import { useMemo, useRef, useState, type MouseEvent, type TouchEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import { geoCentroid } from "d3-geo";

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

    for (const [k, p] of provinceByName.entries()) {
      if (key.includes(k) || k.includes(key)) return { geoName: p.province_name, province: p };
    }

    return { geoName };
  };

  const getFill = (province?: ProvinceData) => {
    if (!province) return "hsl(var(--fin-map-steel))";

    const metaCumplida = province.cidp_activated || province.registration_count >= province.target_count;
    return metaCumplida ? "hsl(var(--fin-map-victory))" : "hsl(var(--fin-map-steel))";
  };

  const getClientPoint = (evt: MouseEvent | TouchEvent) => {
    if ("touches" in evt) {
      const t = evt.touches[0] ?? evt.changedTouches[0];
      return t ? { clientX: t.clientX, clientY: t.clientY } : null;
    }

    return { clientX: evt.clientX, clientY: evt.clientY };
  };

  const setTooltipFromEvent = (evt: MouseEvent | TouchEvent, next: Omit<TooltipState, "x" | "y">) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const pt = getClientPoint(evt);
    if (!pt) return;

    setTooltip({
      ...next,
      x: pt.clientX - rect.left,
      y: pt.clientY - rect.top,
    });
  };

  const tooltipMaxLeft = (containerRef.current?.clientWidth ?? 0) - 220;

  return (
    <div ref={containerRef} className="relative w-full overflow-hidden rounded-xl bg-[hsl(220,50%,8%)] border border-white/10">
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ center: [-70.4, 18.9], scale: 12000 }}
        width={800}
        height={520}
        className="w-full h-auto"
        style={{ maxHeight: "60vh", background: "linear-gradient(180deg, hsl(220 50% 6%) 0%, hsl(220 60% 4%) 100%)" }}
        role="img"
        aria-label="Mapa provincial de la República Dominicana"
      >
        <Geographies geography={GEO_URL}>
          {({ geographies }) => (
            <>
              {geographies.map((geo) => {
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
                    onTouchStart={(evt) => {
                      setHoveredKey(geo.rsmKey);
                      setTooltipFromEvent(evt, { geoName, province });
                    }}
                    onTouchMove={(evt) => {
                      if (hoveredKey !== geo.rsmKey) return;
                      setTooltipFromEvent(evt, { geoName, province });
                    }}
                    onClick={(evt) => {
                      setTooltipFromEvent(evt, { geoName, province });
                      if (province) onProvinceClick(province);
                    }}
                    className={
                      (province ? "cursor-pointer" : "cursor-default") +
                      " transition-[filter] duration-150"
                    }
                    style={{
                      default: { fill, outline: "none" },
                      hover: { fill, outline: "none", filter: "brightness(1.25) drop-shadow(0 0 8px rgba(255,255,255,0.3))" },
                      pressed: { fill, outline: "none" },
                    }}
                    stroke="rgba(255,255,255,0.5)"
                    strokeWidth={isHovered ? 1.2 : 0.6}
                    opacity={province ? 1 : 0.95}
                  />
                );
              })}
              {/* Province labels - only shown on hover via tooltip */}
            </>
          )}
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
