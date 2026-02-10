import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import {
  Shield, Lock, Unlock, Users, CheckCircle2,
  Trophy, Star, Award, ChevronRight, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useRegistration } from '@/hooks/useRegistration';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

import rewardCelularImg from '@/assets/reward-celular.jpg';
import rewardPatinetaImg from '@/assets/reward-patineta.jpg';
import rewardPasolaImg from '@/assets/reward-pasola.jpg';

const REQUIRED_REFERRALS = 50;

interface Reward {
  id: string;
  name: string;
  cost: number;
  image: string;
  description: string;
}

const REWARDS: Reward[] = [
  {
    id: 'celular',
    name: 'Celular Pro',
    cost: 100,
    image: rewardCelularImg,
    description: 'Smartphone de alta gama',
  },
  {
    id: 'patineta',
    name: 'Patineta Eléctrica',
    cost: 200,
    image: rewardPatinetaImg,
    description: 'Patineta eléctrica de alta autonomía',
  },
  {
    id: 'pasola',
    name: 'Pasola Eléctrica',
    cost: 300,
    image: rewardPasolaImg,
    description: 'Pasola/Scooter eléctrica de última generación',
  },
];

interface LegionSlot {
  index: number;
  referral?: { id: string; full_name: string; passport_level: string | null };
}

export const GladiatorDashboard = () => {
  const { data } = useRegistration();
  const { user } = useAuth();
  const [integrityIndex, setIntegrityIndex] = useState(100);
  const [isCenturion, setIsCenturion] = useState(false);
  const [referrals, setReferrals] = useState<LegionSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'legion' | 'rewards'>('dashboard');
  const [showQR, setShowQR] = useState(false);

  const referralCode = data.referralCode || (data.cedula ? `FIN-${data.cedula}` : '');
  const shareUrl = `${window.location.origin}?ref=${referralCode}`;

  useEffect(() => {
    const fetchData = async () => {
      if (!data.registrationId || !user?.id) {
        setLoading(false);
        return;
      }

      try {
        // Points = number of validated referrals (1 referral = 1 point)
        // We still fetch summary for integrity_index and centurion_status
        const { data: summary } = await supabase
          .from('points_summary')
          .select('integrity_index, centurion_status')
          .eq('registration_id', data.registrationId)
          .maybeSingle();

        if (summary) {
          setIntegrityIndex(summary.integrity_index);
          setIsCenturion(summary.centurion_status);
        }

        // Fetch referrals
        const { data: refs } = await supabase
          .from('registrations')
          .select('id, full_name, passport_level')
          .eq('referred_by', referralCode)
          .order('created_at', { ascending: true });

        const slots: LegionSlot[] = Array.from({ length: REQUIRED_REFERRALS }, (_, i) => ({
          index: i,
          referral: refs?.[i] ? {
            id: refs[i].id,
            full_name: refs[i].full_name,
            passport_level: refs[i].passport_level,
          } : undefined,
        }));

        setReferrals(slots);
      } catch (err) {
        console.error('Error loading dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [data.registrationId, user?.id, referralCode]);

  const completedReferrals = referrals.filter(s => 
    s.referral?.passport_level === 'bronce' || s.referral?.passport_level === 'dorado'
  ).length;

  // 1 valid referral = 1 point
  const totalPoints = completedReferrals;

  // Calculate next reward progress
  const nextReward = REWARDS.find(r => r.cost > totalPoints) || REWARDS[REWARDS.length - 1];
  const prevRewardCost = REWARDS.filter(r => r.cost <= totalPoints).pop()?.cost || 0;
  const progressToNext = nextReward
    ? ((totalPoints - prevRewardCost) / (nextReward.cost - prevRewardCost)) * 100
    : 100;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-1 p-1 bg-muted/30 rounded-xl border border-gold/20">
        {[
          { id: 'dashboard' as const, label: 'Escudo', icon: <Shield className="w-4 h-4" /> },
          { id: 'legion' as const, label: 'Mi Legión', icon: <Users className="w-4 h-4" /> },
          { id: 'rewards' as const, label: 'Recompensas', icon: <Trophy className="w-4 h-4" /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-gold-dark to-gold text-background shadow-lg'
                : 'text-steel-light hover:text-gold'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'dashboard' && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-5"
          >
            {/* Points Wallet */}
            <Card className="border-gold/30 bg-gradient-to-br from-carbon to-carbon-dark overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-gold/5 to-transparent" />
              <CardContent className="relative p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center">
                      <Star className="w-5 h-5 text-background" />
                    </div>
                    <div>
                      <p className="text-xs text-steel-light">Billetera de Puntos</p>
                      <p className="text-xs text-gold/70">Índice de Integridad: {integrityIndex}%</p>
                    </div>
                  </div>
                  {isCenturion && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-gold/20 rounded-full border border-gold/40">
                      <Award className="w-3 h-3 text-gold" />
                      <span className="text-[10px] font-bold text-gold">CENTURIÓN</span>
                    </div>
                  )}
                </div>

                <div className="text-center py-4">
                  <motion.p
                    className="text-5xl font-black bg-gradient-to-r from-gold-light via-gold to-gold-dark bg-clip-text text-transparent"
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                  >
                    {totalPoints.toLocaleString()}
                  </motion.p>
                  <p className="text-sm text-steel-light mt-1">Puntos de Integridad</p>
                </div>

                {/* Motivational motto */}
                <div className="mt-4 pt-4 border-t border-gold/10 text-center">
                  <p className="text-sm font-semibold text-gold italic">
                    🔥 3 referidos diarios te llevan a la meta 🔥
                  </p>
                  <p className="text-[10px] text-steel-light mt-1">1 referido validado = 1 Punto de Integridad</p>
                </div>
              </CardContent>
            </Card>

            {/* Progress to next reward */}
            <Card className="border-steel/20 bg-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-foreground">Próxima Recompensa</p>
                  <span className="text-sm font-bold text-gold">{nextReward.name}</span>
                </div>
                <Progress value={Math.min(progressToNext, 100)} className="h-3 bg-steel/20" />
                <div className="flex justify-between mt-1.5">
                  <span className="text-xs text-steel-light">{totalPoints} pts</span>
                  <span className="text-xs text-gold font-semibold">{nextReward.cost} pts</span>
                </div>

                {/* Reward milestones */}
                <div className="flex justify-between mt-4 px-1">
                  {REWARDS.map((r, i) => (
                    <div key={r.id} className="flex flex-col items-center gap-1">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                        totalPoints >= r.cost
                          ? 'border-gold bg-gold/20 text-gold'
                          : 'border-steel/30 bg-muted/30 text-steel'
                      }`}>
                        {totalPoints >= r.cost ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <span className="text-[10px] font-bold">{i + 1}</span>
                        )}
                      </div>
                      <span className={`text-[9px] font-medium ${
                        totalPoints >= r.cost ? 'text-gold' : 'text-steel'
                      }`}>
                        {r.cost}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Forge New Ally Button */}
            <Button
              onClick={() => setShowQR(true)}
              className="w-full h-14 bg-gradient-to-r from-gold-dark via-gold to-gold-dark text-background font-bold text-lg uppercase tracking-wider shadow-[0_0_25px_hsl(45_90%_50%/0.3)] hover:shadow-[0_0_40px_hsl(45_90%_50%/0.5)] hover:brightness-110 active:scale-95 transition-all"
            >
              <Shield className="w-5 h-5 mr-2" />
              Forjar Nuevo Aliado
            </Button>
          </motion.div>
        )}

        {activeTab === 'legion' && (
          <motion.div
            key="legion"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Legion header */}
            <div className="text-center">
              <h3 className="text-lg font-bold text-foreground">Mi Legión</h3>
              <p className="text-sm text-steel-light">
                <span className="text-gold font-bold">{completedReferrals}</span> de {REQUIRED_REFERRALS} Gladiadores validados
              </p>
              <Progress value={(completedReferrals / REQUIRED_REFERRALS) * 100} className="h-2 mt-3 bg-steel/20" />
            </div>

            {/* Legion Grid */}
            <div className="grid grid-cols-5 gap-2">
              {referrals.map((slot) => (
                <motion.div
                  key={slot.index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: slot.index * 0.01 }}
                  className={`aspect-square rounded-lg flex flex-col items-center justify-center text-center p-1 border transition-all ${
                    slot.referral
                      ? (slot.referral.passport_level === 'bronce' || slot.referral.passport_level === 'dorado')
                        ? 'border-gold/50 bg-gold/10'
                        : 'border-primary/30 bg-primary/5'
                      : 'border-steel/20 bg-muted/20'
                  }`}
                  title={slot.referral?.full_name || `Espacio #${slot.index + 1}`}
                >
                  {slot.referral ? (
                    (slot.referral.passport_level === 'bronce' || slot.referral.passport_level === 'dorado') ? (
                      <CheckCircle2 className="w-5 h-5 text-gold" />
                    ) : (
                      <Loader2 className="w-4 h-4 text-primary animate-spin" />
                    )
                  ) : (
                    <span className="text-[10px] text-steel/50 font-mono">{slot.index + 1}</span>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Forge New Ally */}
            <Button
              onClick={() => setShowQR(true)}
              className="w-full bg-gradient-to-r from-gold-dark to-gold text-background font-bold shadow-[0_0_20px_hsl(45_90%_50%/0.3)]"
            >
              <Shield className="w-5 h-5 mr-2" />
              Forjar Nuevo Aliado
            </Button>
          </motion.div>
        )}

        {activeTab === 'rewards' && (
          <motion.div
            key="rewards"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="text-center mb-2">
              <h3 className="text-lg font-bold text-foreground">RECOMPENSAS POR MÉRITO</h3>
              <p className="text-sm text-steel-light">
                Saldo: <span className="text-gold font-bold">{totalPoints.toLocaleString()} pts</span>
              </p>
            </div>

            {REWARDS.map((reward, i) => {
              const unlocked = totalPoints >= reward.cost && integrityIndex >= 80;
              return (
                <motion.div
                  key={reward.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className={`overflow-hidden transition-all ${
                    unlocked
                      ? 'border-gold/50 shadow-[0_0_20px_hsl(45_90%_50%/0.15)]'
                      : 'border-steel/20 opacity-70'
                  }`}>
                    <CardContent className="p-0 flex items-stretch relative">
                      {!unlocked && (
                        <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] flex items-center justify-center z-10">
                          <div className="flex flex-col items-center gap-1 text-steel">
                            <Lock className="w-6 h-6" />
                            <span className="text-sm font-semibold">
                              {totalPoints < reward.cost
                                ? `Faltan ${(reward.cost - totalPoints)} pts`
                                : 'Índice bajo'}
                            </span>
                          </div>
                        </div>
                      )}
                      {unlocked && (
                        <div className="absolute top-2 right-2 z-10">
                          <Unlock className="w-5 h-5 text-gold" />
                        </div>
                      )}
                      {/* Reward image */}
                      <div className="w-28 h-28 shrink-0">
                        <img
                          src={reward.image}
                          alt={reward.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 p-4 flex flex-col justify-center">
                        <p className="font-bold text-foreground">{reward.name}</p>
                        <p className="text-xs text-steel-light">{reward.description}</p>
                        <div className="flex items-center gap-1 mt-1.5">
                          <Star className="w-3 h-3 text-gold" />
                          <span className="text-sm font-bold text-gold">{reward.cost} pts</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}

            {/* Points rules */}
            <Card className="border-steel/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gold flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  ¿Cómo gano puntos?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between items-center py-1.5 border-b border-border/50">
                  <span className="text-steel-light">1 referido validado</span>
                  <span className="font-bold text-gold">= 1 punto</span>
                </div>
                <div className="py-2 text-center">
                  <p className="text-gold font-semibold italic">🔥 3 referidos diarios te llevan a la meta 🔥</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* QR Modal */}
      <AnimatePresence>
        {showQR && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowQR(false)}
          >
            <motion.div
              className="bg-card border border-gold/30 rounded-2xl p-6 max-w-sm mx-4 text-center shadow-[0_0_40px_hsl(45_90%_50%/0.2)]"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-background" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-1">Forjar Nuevo Aliado</h3>
              <p className="text-sm text-steel-light mb-4">
                Escanea este código para unirse a tu legión
              </p>
              <div className="bg-white p-4 rounded-xl inline-block mb-4">
                <QRCodeSVG
                  value={shareUrl}
                  size={180}
                  level="H"
                  fgColor="#0a0a0a"
                  bgColor="#ffffff"
                />
              </div>
              <p className="text-xs text-steel font-mono mb-4">{referralCode}</p>
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(shareUrl);
                  toast.success('¡Enlace copiado!');
                }}
                variant="outline"
                className="w-full border-gold/30 text-gold hover:bg-gold/10"
              >
                Copiar Enlace
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
