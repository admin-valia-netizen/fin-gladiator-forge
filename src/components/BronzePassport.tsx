import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { Shield, Lock, Gift, Briefcase, Code, Trophy, Wrench, RotateCcw, MapPin, LogOut, Vote, ArrowLeft, Crown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRegistration } from '@/hooks/useRegistration';
import { useAuth } from '@/hooks/useAuth';
import { ReferralSystem } from '@/components/ReferralSystem';
import { FinTablesMapCard } from '@/components/FinTablesMapCard';
import { DonationModule } from '@/components/DonationModule';
import { supabase } from '@/integrations/supabase/client';

const REQUIRED_REFERRALS = 50;

const benefits = [
  { id: 1, title: 'Capital Semilla', icon: <Gift className="w-5 h-5" />, locked: true },
  { id: 2, title: 'Becas Tecnológicas', icon: <Code className="w-5 h-5" />, locked: true },
  { id: 3, title: 'Empleos Reales', icon: <Briefcase className="w-5 h-5" />, locked: true },
  { id: 4, title: 'Mentoría Premium', icon: <Trophy className="w-5 h-5" />, locked: true },
];

const areaIcons = {
  emprendimiento: <Briefcase className="w-5 h-5" />,
  tecnologia: <Code className="w-5 h-5" />,
  deporte: <Trophy className="w-5 h-5" />,
  empleo_tecnico: <Wrench className="w-5 h-5" />,
};

const areaLabels = {
  emprendimiento: 'Emprendimiento',
  tecnologia: 'Tecnología',
  deporte: 'Deporte',
  empleo_tecnico: 'Empleo Técnico',
};

export const BronzePassport = () => {
  const { data, resetDemo, setStep, updateData, forceShowBronze, setForceShowBronze } = useRegistration();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  
  // Lógica de Blindaje: QR que cambia cada 60 segundos
  const [timeSeed, setTimeSeed] = useState(Math.floor(Date.now() / 60000));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeSeed(Math.floor(Date.now() / 60000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const [showDonationModal, setShowDonationModal] = useState(false);
  const [syncingFromDb, setSyncingFromDb] = useState(true);
  const [completedReferrals, setCompletedReferrals] = useState(0);

  // Sync passport level from database on mount
  useEffect(() => {
    const syncPassportLevel = async () => {
      console.log('[BronzePassport] Syncing - registrationId:', data.registrationId, 'cedula:', data.cedula);
      
      let query = supabase
        .from('registrations')
        .select('id, passport_level, donation_status, user_level');
      
      if (data.registrationId) {
        query = query.eq('id', data.registrationId);
      } else if (data.cedula) {
        query = query.eq('cedula', data.cedula);
      } else {
        console.log('[BronzePassport] No registrationId or cedula, skipping sync');
        setSyncingFromDb(false);
        return;
      }

      try {
        const { data: registration, error } = await query.single();

        console.log('[BronzePassport] DB result:', registration, 'error:', error);

        if (error) throw error;

        if (registration) {
          if (!data.registrationId && registration.id) {
            updateData({ registrationId: registration.id });
          }

          updateData({
            passportLevel: registration.passport_level as any,
            userLevel: registration.user_level as any,
          });

          if (registration.passport_level === 'dorado' && !forceShowBronze) {
            setStep('golden-passport');
            return;
          }

          if (registration.donation_status === 'approved' && !forceShowBronze) {
            updateData({ passportLevel: 'dorado' });
            setStep('golden-passport');
            return;
          }

          if (registration.donation_status === 'pending') {
            updateData({ passportLevel: 'pending_donation' });
          }
        }
      } catch (err) {
        console.error('[BronzePassport] Error syncing passport level:', err);
      } finally {
        setSyncingFromDb(false);
      }
    };

    syncPassportLevel();
  }, [data.registrationId, data.cedula, updateData, setStep, forceShowBronze]);

  // Fetch referral count
  useEffect(() => {
    const fetchReferralCount = async () => {
      const referralCode = data.referralCode || (data.cedula ? `FIN-${data.cedula}` : null);
      if (!referralCode) return;

      try {
        const { data: refs, error } = await supabase
          .from('registrations')
          .select('id, passport_level')
          .eq('referred_by', referralCode);

        if (!error && refs) {
          const completed = refs.filter(r => r.passport_level === 'bronce' || r.passport_level === 'dorado').length;
          setCompletedReferrals(completed);
        }
      } catch (err) {
        console.error('[BronzePassport] Error fetching referrals:', err);
      }
    };

    fetchReferralCount();
  }, [data.referralCode, data.cedula]);

  const handleLogout = async () => {
    await signOut();
    resetDemo();
    localStorage.clear();
    sessionStorage.clear();
    navigate('/session-closed', { replace: true });
  };

  const handleValidateVote = () => {
    setForceShowBronze(false);
    setStep('vote-validation');
  };

  const handleBack = () => {
    setForceShowBronze(false);
    setStep('staircase');
  };

  const isDonationPending = data.passportLevel === 'pending_donation';
  const hasEnoughReferrals = completedReferrals >= REQUIRED_REFERRALS;
  const isGoldenPassport = data.passportLevel === 'dorado';
  const canValidateVote = hasEnoughReferrals || isGoldenPassport || isDonationPending;

  if (syncingFromDb) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-carbon" />
        <motion.div
          className="relative z-10 flex flex-col items-center gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Verificando estado del pasaporte...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col p-3 pb-6">
      <div className="absolute inset-0 bg-gradient-carbon" />
      
      <motion.div
        className="relative z-10 flex-1 flex flex-col items-center max-w-md mx-auto w-full pt-2"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="self-start mb-3"
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a la Escalera
          </Button>
        </motion.div>

        <motion.div
          className="text-center mb-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="text-2xl font-bold text-foreground mb-2">
            ¡Felicidades, <span className="text-bronze-metallic">Gladiador!</span>
          </h1>
          <p className="text-muted-foreground">Tu Pasaporte de Bronce está listo</p>
        </motion.div>

        <motion.div
          className="w-full card-industrial rounded-xl overflow-hidden border border-bronze/30"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="bg-gradient-bronze p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-6 h-6 text-foreground" />
                <span className="font-bold text-foreground">FIN</span>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-foreground/70">NIVEL</p>
                <p className="font-bold text-sm text-foreground uppercase">{data.userLevel}</p>
              </div>
            </div>
          </div>

          <div className="p-4 space-y-4">
            <div className="flex gap-3 items-center">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-muted-foreground mb-0.5">NOMBRE</p>
                <p className="font-bold text-sm text-foreground truncate">{data.fullName}</p>
              </div>
              {data.interestArea && (
                <div className="flex items-center gap-1.5 px-2 py-1 bg-primary/10 rounded-full border border-primary/30 shrink-0">
                  {areaIcons[data.interestArea]}
                  <span className="text-[10px] font-medium text-primary">
                    {areaLabels[data.interestArea]}
                  </span>
                </div>
              )}
            </div>

            <div className="flex justify-center">
              <motion.div
                className="p-3 bg-foreground rounded-lg"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: 'spring' }}
              >
                <QRCodeSVG
                  value={'FIN-' + (data.registrationId || data.cedula) + '-' + timeSeed}
                  size={120}
                  level="H"
                  includeMargin={false}
                  fgColor="#0a0a0a"
                  bgColor="#ffffff"
                />
              </motion.div>
            </div>
          
            <div className="text-center mt-2">
              <p className="text-[10px] text-muted-foreground font-mono">
                {(data.registrationId || data.id || '').substring(0, 8).toUpperCase()}-DYN
              </p>
            </div>

            <div className="h-2 bg-gradient-to-r from-amber-700 via-amber-500 to-amber-700 mt-4 rounded-full opacity-50 w-full" />
          </div>
        </motion.div>

        <motion.div
          className="w-full mt-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <Button
            variant="gladiator"
            size="xl"
            onClick={handleValidateVote}
            disabled={!canValidateVote}
            className={`w-full ${
              canValidateVote 
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-[0_0_20px_rgba(245,158,11,0.3)]' 
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            }`}
          >
            <Vote className="w-5 h-5 mr-2" />
            YA VOTÉ - VALIDAR MI VOTO
          </Button>
        </motion.div>

        {!canValidateVote && (
          <motion.div
            className="w-full mt-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p className="text-xs text-center text-muted-foreground">
              Para validar tu voto necesitas <span className="text-amber-500 font-semibold">50 referidos activos</span> o haber <span className="text-amber-500 font-semibold">donado RD$5,000</span>
            </p>
            <p className="text-xs text-center text-muted-foreground mt-1">
              Actualmente tienes <span className="text-primary font-semibold">{completedReferrals}/{REQUIRED_REFERRALS}</span> referidos completados
            </p>
          </motion.div>
        )}

        <motion.div
          className="w-full mt-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.47 }}
        >
          {isDonationPending ? (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center">
              <div className="flex items-center justify-center gap-2 text-amber-500 font-medium">
                <Crown className="w-5 h-5" />
                Validación de Pago Pendiente
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Tu donación está siendo revisada. Te notificaremos cuando sea aprobada.
              </p>
            </div>
          ) : (
            <Button
              variant="outline"
              size="lg"
              onClick={() => setShowDonationModal(true)}
              className="w-full border-amber-500/50 text-amber-500 hover:bg-amber-500/10"
            >
              <Crown className="w-5 h-5 mr-2" />
              Obtener Pasaporte Dorado por Donación (RD$5,000)
            </Button>
          )}
        </motion.div>

        <motion.div
          className="w-full mt-6 card-industrial p-5 rounded-xl border-l-4 border-primary"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            ¿Qué sigue ahora?
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            1. Ve a la <span className="text-primary font-semibold">Mesa de FIN más cercana</span> para firmar físicamente.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed mt-2">
            2. El día de las elecciones, vota por <span className="text-primary font-semibold">"FIN" Frente de Integridad Nacional</span>.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed mt-2">
            3. Después de votar, regresa aquí y presiona <span className="text-amber-500 font-semibold">"YA VOTÉ"</span> para subir tu selfie con el dedo entintado.
          </p>
          <p className="text-sm text-amber-500 font-semibold mt-3">
            ¡Desbloquea tu Pasaporte Dorado y accede a la Recompensa si ganamos!
          </p>
          <p className="text-xs text-muted-foreground mt-2 italic">
            También puedes obtener el Pasaporte Dorado realizando una donación de RD$5,000.
          </p>
        </motion.div>

        <motion.div
          className="w-full mt-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.52 }}
        >
          <FinTablesMapCard />
        </motion.div>

        <motion.div
          className="w-full mt-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.53 }}
        >
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate('/mapa-integridad')}
            className="w-full border-primary/50 text-primary hover:bg-primary/10"
          >
            <MapPin className="w-5 h-5 mr-2" />
            Ver Mapa de la Integridad Dominicana
          </Button>
        </motion.div>

        <motion.div
          className="w-full mt-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
        >
          <ReferralSystem 
            referralCode={data.referralCode} 
            registrationId={data.registrationId} 
          />
        </motion.div>

        <motion.div
          className="w-full mt-6 space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <h2 className="text-center font-bold text-foreground flex items-center justify-center gap-2">
            <Lock className="w-4 h-4 text-muted-foreground" />
            Tu Recompensa (Bloqueada)
          </h2>

          <div className="grid grid-cols-2 gap-3">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.id}
                className="p-4 rounded-xl bg-muted/50 border border-muted flex items-center gap-3 opacity-60"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 0.6, x: 0 }}
                transition={{ delay: 0.8 + index * 0.1 }}
              >
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                  {benefit.icon}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{benefit.title}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Lock className="w-3 h-3" />
                    Bloqueado
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          className="w-full mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <Button variant="outline" size="lg" onClick={handleLogout} className="w-full">
            <LogOut className="w-5 h-5 mr-2" />
            Cerrar Sesión
          </Button>
        </motion.div>

        <motion.div
          className="w-full mt-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
        >
          <Button variant="ghost" size="lg" onClick={resetDemo} className="w-full text-muted-foreground">
            <RotateCcw className="w-4 h-4 mr-2" />
            Ver Demo Completa (Reiniciar)
          </Button>
        </motion.div>
      </motion.div>

      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-700 via-amber-500 to-amber-700" />

      {showDonationModal && (
        <DonationModule
          onClose={() => setShowDonationModal(false)}
          registrationId={data.registrationId}
        />
      )}
    </div>
  );
};

export default BronzePassport;
