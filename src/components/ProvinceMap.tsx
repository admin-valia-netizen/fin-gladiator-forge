import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Users, Trophy, Info, Target, Anchor, Wheat, Building2, List, Map } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { DominicanRepublicMap } from './DominicanRepublicMap';

interface ProvinceData {
  id: string;
  province_code: string;
  province_name: string;
  zone_type: 'costera' | 'agricola' | 'urbana';
  registration_count: number;
  target_count: number;
  cidp_activated: boolean;
}

const ZONE_ICONS = {
  costera: Anchor,
  agricola: Wheat,
  urbana: Building2,
};

const ZONE_LABELS = {
  costera: 'Zona Costera (GESEMA)',
  agricola: 'Zona Agrícola',
  urbana: 'Zona Urbana',
};

const ZONE_DESCRIPTIONS = {
  costera: 'Estaciones de apoyo marítimo y seguridad',
  agricola: 'Centros de logística, cadena de frío y tecnología para el campo',
  urbana: 'Centros de innovación tecnológica y seguridad ciudadana',
};

export const ProvinceMap = () => {
  const [provinces, setProvinces] = useState<ProvinceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProvince, setSelectedProvince] = useState<ProvinceData | null>(null);
  const [showInfoModal, setShowInfoModal] = useState(false);

  useEffect(() => {
    fetchProvinces();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel('province_counters')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'province_counters',
        },
        () => {
          fetchProvinces();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchProvinces = async () => {
    try {
      const { data, error } = await supabase
        .from('province_counters')
        .select('*')
        .order('province_name');

      if (error) throw error;
      setProvinces(data as ProvinceData[]);
    } catch (error) {
      console.error('Error fetching provinces:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProgressColor = (count: number, target: number) => {
    const percentage = (count / target) * 100;
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 75) return 'bg-blue-500';
    if (percentage >= 50) return 'bg-primary';
    if (percentage >= 25) return 'bg-amber-500';
    return 'bg-muted-foreground';
  };

  const totalRegistrations = provinces.reduce((sum, p) => sum + p.registration_count, 0);
  const activatedProvinces = provinces.filter(p => p.cidp_activated).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <motion.div
          className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
            <MapPin className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Mapa de la Integridad Dominicana</h2>
            <p className="text-sm text-muted-foreground">Compromiso 5,000 por Provincia</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowInfoModal(true)}
          className="gap-2"
        >
          <Info className="w-4 h-4" />
          <span className="hidden sm:inline">Información sobre Recompensas</span>
        </Button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card-industrial p-4 rounded-xl text-center">
          <Users className="w-6 h-6 text-primary mx-auto mb-2" />
          <p className="text-2xl font-bold text-foreground">{totalRegistrations.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Registros Totales</p>
        </div>
        <div className="card-industrial p-4 rounded-xl text-center">
          <Target className="w-6 h-6 text-amber-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-foreground">{provinces.length}</p>
          <p className="text-xs text-muted-foreground">Provincias</p>
        </div>
        <div className="card-industrial p-4 rounded-xl text-center">
          <Trophy className="w-6 h-6 text-green-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-foreground">{activatedProvinces}</p>
          <p className="text-xs text-muted-foreground">CIDP Activados</p>
        </div>
      </div>

      {/* Tabs for Map vs List view */}
      <Tabs defaultValue="map" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="map" className="gap-2">
            <Map className="w-4 h-4" />
            Mapa Visual
          </TabsTrigger>
          <TabsTrigger value="list" className="gap-2">
            <List className="w-4 h-4" />
            Lista
          </TabsTrigger>
        </TabsList>

        {/* Map View */}
        <TabsContent value="map">
          <DominicanRepublicMap 
            provinces={provinces} 
            onProvinceClick={setSelectedProvince} 
          />
        </TabsContent>

        {/* List View */}
        <TabsContent value="list">
          <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
            {provinces.map((province, index) => {
              const percentage = Math.min((province.registration_count / province.target_count) * 100, 100);
              const ZoneIcon = ZONE_ICONS[province.zone_type];
              
              return (
                <motion.div
                  key={province.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className={`card-industrial p-4 rounded-xl cursor-pointer transition-all hover:border-primary/50 ${
                    province.cidp_activated ? 'border-green-500/30' : ''
                  }`}
                  onClick={() => setSelectedProvince(province)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        province.cidp_activated ? 'bg-green-500/20' : 'bg-primary/20'
                      }`}>
                        <ZoneIcon className={`w-4 h-4 ${
                          province.cidp_activated ? 'text-green-500' : 'text-primary'
                        }`} />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{province.province_name}</p>
                        <p className="text-xs text-muted-foreground">{ZONE_LABELS[province.zone_type]}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-foreground">
                        {province.registration_count.toLocaleString()}
                        <span className="text-muted-foreground font-normal">/{province.target_count.toLocaleString()}</span>
                      </p>
                      {province.cidp_activated && (
                        <span className="text-xs text-green-500 font-medium">¡CIDP Activado!</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full ${getProgressColor(province.registration_count, province.target_count)}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.8, delay: index * 0.03 }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 text-right">{percentage.toFixed(1)}%</p>
                </motion.div>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Province Detail Modal */}
      <AnimatePresence>
        {selectedProvince && (
          <Dialog open={!!selectedProvince} onOpenChange={() => setSelectedProvince(null)}>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {(() => {
                    const ZoneIcon = ZONE_ICONS[selectedProvince.zone_type];
                    return <ZoneIcon className="w-5 h-5 text-primary" />;
                  })()}
                  {selectedProvince.province_name}
                </DialogTitle>
                <DialogDescription>
                  {ZONE_LABELS[selectedProvince.zone_type]}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="text-center p-6 card-industrial rounded-xl">
                  <p className="text-4xl font-bold text-foreground mb-1">
                    {selectedProvince.registration_count.toLocaleString()}
                  </p>
                  <p className="text-muted-foreground">
                    de {selectedProvince.target_count.toLocaleString()} registros verificados
                  </p>
                  
                  <div className="mt-4">
                    <Progress 
                      value={(selectedProvince.registration_count / selectedProvince.target_count) * 100}
                      className="h-3"
                    />
                    <p className="text-sm text-muted-foreground mt-2">
                      {((selectedProvince.registration_count / selectedProvince.target_count) * 100).toFixed(1)}% completado
                    </p>
                  </div>
                </div>

                <div className="bg-muted/30 p-4 rounded-xl">
                  <h4 className="font-medium text-foreground mb-2">Tipo de CIDP asignado:</h4>
                  <p className="text-sm text-muted-foreground">
                    {ZONE_DESCRIPTIONS[selectedProvince.zone_type]}
                  </p>
                </div>

                {selectedProvince.cidp_activated ? (
                  <div className="bg-green-500/10 p-4 rounded-xl border border-green-500/30">
                    <div className="flex items-center gap-2 text-green-500">
                      <Trophy className="w-5 h-5" />
                      <p className="font-bold">¡Meta Alcanzada!</p>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      El CIDP de esta provincia ha sido activado y la construcción está en proceso.
                    </p>
                  </div>
                ) : (
                  <div className="bg-primary/10 p-4 rounded-xl border border-primary/30">
                    <p className="text-sm text-muted-foreground">
                      Faltan <strong className="text-foreground">
                        {(selectedProvince.target_count - selectedProvince.registration_count).toLocaleString()}
                      </strong> registros para activar el CIDP de esta provincia.
                    </p>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>

      {/* Rewards Info Modal */}
      <Dialog open={showInfoModal} onOpenChange={setShowInfoModal}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Info className="w-5 h-5 text-primary" />
              ¿Cómo funciona la Recompensa Provincial del FIN?
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 text-sm">
            <p className="text-muted-foreground leading-relaxed">
              Para asegurar que cada provincia prospere, nuestro sistema de recompensas se basa en la <strong className="text-foreground">Integridad</strong> y el <strong className="text-foreground">Esfuerzo</strong>:
            </p>

            <div className="space-y-4">
              {/* Step 1 */}
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <span className="text-primary font-bold">1</span>
                </div>
                <div>
                  <h4 className="font-bold text-foreground">El Desafío de la Unión</h4>
                  <p className="text-muted-foreground">
                    La meta son 5,000 registros verificados por provincia. Es la prueba de que la comunidad está organizada.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <span className="text-primary font-bold">2</span>
                </div>
                <div>
                  <h4 className="font-bold text-foreground">Validación Tecnológica</h4>
                  <p className="text-muted-foreground">
                    Cada firma se valida con el escaneo de cédula en esta aplicación. Aquí no hay espacio para el fraude; la transparencia es nuestro primer compromiso.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <span className="text-primary font-bold">3</span>
                </div>
                <div>
                  <h4 className="font-bold text-foreground">Ejecución de la Obra (CIDP)</h4>
                  <p className="text-muted-foreground mb-3">
                    Al alcanzar la meta, se activa la construcción del Centro de Integridad y Desarrollo Provincial (CIDP). El modelo se asignará según la zona:
                  </p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-2 bg-blue-500/10 rounded-lg">
                      <Anchor className="w-4 h-4 text-blue-500" />
                      <div>
                        <p className="font-medium text-foreground text-xs">Zonas Costeras (GESEMA)</p>
                        <p className="text-xs text-muted-foreground">Estaciones de apoyo marítimo y seguridad.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 p-2 bg-green-500/10 rounded-lg">
                      <Wheat className="w-4 h-4 text-green-500" />
                      <div>
                        <p className="font-medium text-foreground text-xs">Zonas Agrícolas</p>
                        <p className="text-xs text-muted-foreground">Centros de logística, cadena de frío y tecnología para el campo.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 p-2 bg-amber-500/10 rounded-lg">
                      <Building2 className="w-4 h-4 text-amber-500" />
                      <div>
                        <p className="font-medium text-foreground text-xs">Zonas Urbanas</p>
                        <p className="text-xs text-muted-foreground">Centros de innovación tecnológica y seguridad ciudadana.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-primary/10 p-4 rounded-xl border border-primary/30 text-center">
              <Trophy className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="font-bold text-foreground">
                ¡La primera provincia en llegar será la primera en ver su obra iniciada!
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
