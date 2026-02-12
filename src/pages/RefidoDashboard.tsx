import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Shield, Users, PenTool, DollarSign, UserPlus,
  MapPin, Pause, Play, Plus, X, Award,
  Dumbbell, Palette, Brain, UtensilsCrossed, Sprout, Mountain,
  ChevronRight, Star, Lock, Unlock, Trophy, BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { useRegistration } from '@/hooks/useRegistration';
import { supabase } from '@/integrations/supabase/client';
import refidoLogo from '@/assets/refido-logo.png';

// ── Mesa Data (mock locations for Dominican Republic) ──
interface Mesa {
  id: string;
  name: string;
  lat: number;
  lng: number;
  status: 'activa' | 'pausa';
  firmas: number;
  donaciones: number;
  aspirantes: number;
}

const INITIAL_MESAS: Mesa[] = [
  { id: 'M-001', name: 'Plaza de la Bandera', lat: 18.4861, lng: -69.9312, status: 'activa', firmas: 127, donaciones: 45, aspirantes: 89 },
  { id: 'M-002', name: 'Parque Colón', lat: 18.4735, lng: -69.8830, status: 'activa', firmas: 203, donaciones: 78, aspirantes: 156 },
  { id: 'M-003', name: 'Malecón de Santo Domingo', lat: 18.4600, lng: -69.9100, status: 'pausa', firmas: 95, donaciones: 32, aspirantes: 67 },
  { id: 'M-004', name: 'Parque Duarte, Santiago', lat: 19.4517, lng: -70.6970, status: 'activa', firmas: 312, donaciones: 112, aspirantes: 245 },
  { id: 'M-005', name: 'Plaza Central, La Vega', lat: 19.2244, lng: -70.5295, status: 'activa', firmas: 88, donaciones: 29, aspirantes: 61 },
  { id: 'M-006', name: 'Monumento de Santiago', lat: 19.4500, lng: -70.7000, status: 'activa', firmas: 175, donaciones: 63, aspirantes: 134 },
  { id: 'M-007', name: 'Parque Central, San Cristóbal', lat: 18.4167, lng: -70.1000, status: 'pausa', firmas: 54, donaciones: 18, aspirantes: 39 },
  { id: 'M-008', name: 'Plaza 19 de Marzo, Azua', lat: 18.4533, lng: -70.7292, status: 'activa', firmas: 41, donaciones: 12, aspirantes: 28 },
];

// ── Verticals ──
const VERTICALS = [
  { key: 'fisico', label: 'Físico', icon: Dumbbell, level: 3 },
  { key: 'arte', label: 'Arte', icon: Palette, level: 1 },
  { key: 'intelecto', label: 'Intelecto', icon: Brain, level: 5 },
  { key: 'gastronomia', label: 'Gastronomía', icon: UtensilsCrossed, level: 2 },
  { key: 'agrario', label: 'Agrario', icon: Sprout, level: 0 },
  { key: 'aventura', label: 'Aventura', icon: Mountain, level: 4 },
];

type ActivePanel = 'mapa' | 'mesas' | 'perfil';

const RefidoDashboard = () => {
  const { user } = useAuth();
  const { data } = useRegistration();
  const [mesas, setMesas] = useState<Mesa[]>(INITIAL_MESAS);
  const [activePanel, setActivePanel] = useState<ActivePanel>('mapa');
  const [selectedMesa, setSelectedMesa] = useState<Mesa | null>(null);

  // Mock profile data
  const meritoLevel = 4;
  const popularidadVotes = 237;
  const meritoMax = 12;

  // Totals
  const totalFirmas = mesas.reduce((s, m) => s + m.firmas, 0);
  const totalDonaciones = mesas.reduce((s, m) => s + m.donaciones, 0);
  const totalAspirantes = mesas.reduce((s, m) => s + m.aspirantes, 0);
  const mesasActivas = mesas.filter(m => m.status === 'activa').length;

  const toggleMesaStatus = (id: string) => {
    setMesas(prev => prev.map(m =>
      m.id === id ? { ...m, status: m.status === 'activa' ? 'pausa' : 'activa' } : m
    ));
  };

  return (
    <div className="min-h-screen bg-[#000000] text-[hsl(45,85%,65%)]">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b border-[#D4AF37]/20 bg-[#000000]/95 backdrop-blur-md">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <img src={refidoLogo} alt="REFIDO" className="w-10 h-10 rounded-full object-cover" />
            <div>
              <h1 className="text-lg font-bold tracking-wide" style={{ color: '#D4AF37' }}>REFIDO</h1>
              <p className="text-[10px] tracking-[0.2em] text-[#D4AF37]/60">RECLUTAR · FIRMAR · DONAR</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="text-xs text-[#D4AF37]/70">{data.fullName || 'Gladiador'}</p>
              <p className="text-[10px] text-[#D4AF37]/40">Panel de Mando</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#B8960C] flex items-center justify-center">
              <Shield className="w-4 h-4 text-black" />
            </div>
          </div>
        </div>
      </header>

      {/* ── Global Stats Banner ── */}
      <div className="grid grid-cols-4 gap-2 px-4 py-3 border-b border-[#D4AF37]/10">
        {[
          { label: 'Mesas Activas', value: mesasActivas, icon: MapPin },
          { label: 'Firmas', value: totalFirmas, icon: PenTool },
          { label: 'Donaciones', value: totalDonaciones, icon: DollarSign },
          { label: 'Aspirantes', value: totalAspirantes, icon: UserPlus },
        ].map(stat => (
          <div key={stat.label} className="text-center p-2 rounded-xl bg-[#0a0a0a] border border-[#D4AF37]/10 backdrop-blur-sm">
            <stat.icon className="w-4 h-4 mx-auto mb-1 text-[#D4AF37]" />
            <p className="text-lg font-bold text-[#D4AF37]">{stat.value.toLocaleString()}</p>
            <p className="text-[9px] text-[#D4AF37]/50 leading-tight">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ── Navigation Tabs ── */}
      <div className="flex gap-1 px-4 py-2 border-b border-[#D4AF37]/10 bg-[#050505]">
        {[
          { id: 'mapa' as const, label: 'Mapa Operativo', icon: MapPin },
          { id: 'mesas' as const, label: 'Gestión de Mesas', icon: BarChart3 },
          { id: 'perfil' as const, label: 'Mi Pasaporte', icon: Shield },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActivePanel(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${
              activePanel === tab.id
                ? 'bg-gradient-to-r from-[#D4AF37] to-[#B8960C] text-black shadow-[0_0_20px_rgba(212,175,55,0.3)]'
                : 'text-[#D4AF37]/50 hover:text-[#D4AF37]/80 hover:bg-[#D4AF37]/5'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <main className="px-4 py-4">
        <AnimatePresence mode="wait">
          {/* ═══ MAP PANEL ═══ */}
          {activePanel === 'mapa' && (
            <motion.div
              key="mapa"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Map */}
              <div className="rounded-xl overflow-hidden border border-[#D4AF37]/20 shadow-[0_0_30px_rgba(212,175,55,0.1)]">
                <div className="h-[50vh] min-h-[300px]">
                  <MapContainer
                    center={[18.9, -70.0]}
                    zoom={8}
                    className="h-full w-full"
                    style={{ background: '#0a0a0a' }}
                    zoomControl={false}
                  >
                    <TileLayer
                      url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                      attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                    />
                    {mesas.map(mesa => (
                      <CircleMarker
                        key={mesa.id}
                        center={[mesa.lat, mesa.lng]}
                        radius={mesa.status === 'activa' ? 10 : 6}
                        pathOptions={{
                          color: mesa.status === 'activa' ? '#D4AF37' : '#666',
                          fillColor: mesa.status === 'activa' ? '#D4AF37' : '#444',
                          fillOpacity: mesa.status === 'activa' ? 0.7 : 0.3,
                          weight: 2,
                        }}
                        eventHandlers={{
                          click: () => setSelectedMesa(mesa),
                        }}
                      >
                        <Popup>
                          <div className="text-black text-sm">
                            <p className="font-bold">{mesa.name}</p>
                            <p className="text-xs">{mesa.id} · {mesa.status === 'activa' ? '🟢 Activa' : '⏸ Pausa'}</p>
                          </div>
                        </Popup>
                      </CircleMarker>
                    ))}
                  </MapContainer>
                </div>
              </div>

              {/* Mesa Sidebar List */}
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-[#D4AF37] flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Mesas de Firmas Registradas
                </h3>
                <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
                  {mesas.map(mesa => (
                    <div
                      key={mesa.id}
                      onClick={() => setSelectedMesa(mesa)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        selectedMesa?.id === mesa.id
                          ? 'border-[#D4AF37]/50 bg-[#D4AF37]/10 shadow-[0_0_15px_rgba(212,175,55,0.15)]'
                          : 'border-[#D4AF37]/10 bg-[#0a0a0a] hover:border-[#D4AF37]/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${mesa.status === 'activa' ? 'bg-[#D4AF37] shadow-[0_0_6px_#D4AF37]' : 'bg-gray-500'}`} />
                          <div>
                            <p className="text-sm font-semibold text-[#D4AF37]/90">{mesa.id}</p>
                            <p className="text-xs text-[#D4AF37]/50">{mesa.name}</p>
                          </div>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                          mesa.status === 'activa' ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'bg-gray-800 text-gray-400'
                        }`}>
                          {mesa.status === 'activa' ? 'Activa' : 'Pausa'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ═══ MESA MANAGEMENT PANEL ═══ */}
          {activePanel === 'mesas' && (
            <motion.div
              key="mesas"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#D4AF37]">Gestión de Mesas</h3>
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-[#D4AF37] to-[#B8960C] text-black font-semibold text-xs hover:brightness-110"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Abrir Nueva Mesa
                </Button>
              </div>

              {/* Mesa Cards */}
              <div className="space-y-3">
                {mesas.map(mesa => (
                  <div
                    key={mesa.id}
                    className="p-4 rounded-xl border border-[#D4AF37]/15 bg-[#0a0a0a]/80 backdrop-blur-sm"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${mesa.status === 'activa' ? 'bg-[#D4AF37] shadow-[0_0_8px_#D4AF37]' : 'bg-gray-600'}`} />
                        <div>
                          <p className="text-sm font-bold text-[#D4AF37]/90">{mesa.id}</p>
                          <p className="text-[11px] text-[#D4AF37]/40">{mesa.name}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleMesaStatus(mesa.id)}
                        className={`text-xs border-[#D4AF37]/30 ${
                          mesa.status === 'activa'
                            ? 'text-yellow-500 hover:bg-yellow-500/10'
                            : 'text-green-500 hover:bg-green-500/10'
                        }`}
                      >
                        {mesa.status === 'activa' ? (
                          <><Pause className="w-3 h-3 mr-1" /> Cerrar Turno</>
                        ) : (
                          <><Play className="w-3 h-3 mr-1" /> Reactivar</>
                        )}
                      </Button>
                    </div>

                    {/* Counters */}
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: 'Firmas Captadas', value: mesa.firmas, icon: PenTool },
                        { label: 'Donaciones', value: mesa.donaciones, icon: DollarSign },
                        { label: 'Nuevos Aspirantes', value: mesa.aspirantes, icon: UserPlus },
                      ].map(c => (
                        <div key={c.label} className="text-center p-2 rounded-lg bg-black/50 border border-[#D4AF37]/10">
                          <c.icon className="w-3.5 h-3.5 mx-auto mb-1 text-[#D4AF37]/60" />
                          <p className="text-base font-bold text-[#D4AF37]">{c.value}</p>
                          <p className="text-[8px] text-[#D4AF37]/40 leading-tight">{c.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ═══ GLADIATOR PROFILE ═══ */}
          {activePanel === 'perfil' && (
            <motion.div
              key="perfil"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-5"
            >
              {/* Passport Card */}
              <div className="rounded-xl overflow-hidden border border-[#D4AF37]/30 bg-gradient-to-br from-[#0a0a0a] to-[#111]">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#D4AF37] to-[#B8960C] p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-black/30 flex items-center justify-center border-2 border-black/20">
                        <Shield className="w-6 h-6 text-black" />
                      </div>
                      <div>
                        <p className="text-black font-bold text-lg">Pasaporte de Gladiador</p>
                        <p className="text-black/60 text-xs">Legión de Élite</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* User Info */}
                <div className="p-4 space-y-4">
                  <div>
                    <p className="text-[10px] text-[#D4AF37]/40 uppercase tracking-wider">Nombre</p>
                    <p className="text-base font-bold text-[#D4AF37]">{data.fullName || 'Gladiador Anónimo'}</p>
                  </div>

                  {/* Honor Quote */}
                  <div className="py-3 px-4 rounded-lg bg-[#D4AF37]/5 border border-[#D4AF37]/20 text-center">
                    <p className="text-xs italic text-[#D4AF37]/80">
                      "El honor se gana con mérito; la fama con el voto del público"
                    </p>
                  </div>

                  {/* ── DUAL PROGRESS BARS ── */}
                  {/* Mérito (Gold) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-[#D4AF37]" />
                        <span className="text-xs font-bold text-[#D4AF37]">Escala de Mérito</span>
                      </div>
                      <span className="text-xs font-bold text-[#D4AF37]">Nivel {meritoLevel}/{meritoMax}</span>
                    </div>
                    <div className="relative h-4 rounded-full overflow-hidden bg-[#1a1a1a] border border-[#D4AF37]/20">
                      <motion.div
                        className="absolute inset-y-0 left-0 rounded-full"
                        style={{
                          background: 'linear-gradient(90deg, #B8960C, #D4AF37, #F0D060)',
                        }}
                        initial={{ width: 0 }}
                        animate={{ width: `${(meritoLevel / meritoMax) * 100}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-black drop-shadow-sm">
                          {meritoLevel} / {meritoMax}
                        </span>
                      </div>
                    </div>
                    <p className="text-[10px] text-[#D4AF37]/40">Avanza superando retos en las 6 verticales</p>
                  </div>

                  {/* Popularidad (Silver) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-[#C0C0C0]" />
                        <span className="text-xs font-bold text-[#C0C0C0]">Rango de Popularidad</span>
                      </div>
                      <span className="text-xs font-bold text-[#C0C0C0]">{popularidadVotes} votos</span>
                    </div>
                    <div className="relative h-4 rounded-full overflow-hidden bg-[#1a1a1a] border border-[#C0C0C0]/20">
                      <motion.div
                        className="absolute inset-y-0 left-0 rounded-full"
                        style={{
                          background: 'linear-gradient(90deg, #808080, #C0C0C0, #E8E8E8)',
                        }}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((popularidadVotes / 500) * 100, 100)}%` }}
                        transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-black drop-shadow-sm">
                          {popularidadVotes} votos
                        </span>
                      </div>
                    </div>
                    <p className="text-[10px] text-[#C0C0C0]/40">VIP ×2 · Mecenas ×10</p>
                  </div>

                  {/* ── 6 VERTICALS ── */}
                  <div>
                    <p className="text-xs font-bold text-[#D4AF37]/60 mb-3 uppercase tracking-wider">Verticales de Reto</p>
                    <div className="grid grid-cols-3 gap-2">
                      {VERTICALS.map(v => (
                        <div
                          key={v.key}
                          className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-black/50 border border-[#D4AF37]/10 hover:border-[#D4AF37]/30 transition-all"
                        >
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                            v.level > 0 ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'bg-gray-800 text-gray-500'
                          }`}>
                            <v.icon className="w-4 h-4" />
                          </div>
                          <span className="text-[10px] font-semibold text-[#D4AF37]/70">{v.label}</span>
                          <span className={`text-[9px] font-bold ${v.level > 0 ? 'text-[#D4AF37]' : 'text-gray-600'}`}>
                            Nv. {v.level}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom accent */}
      <div className="h-0.5 bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent" />
    </div>
  );
};

export default RefidoDashboard;
