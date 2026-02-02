import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { Shield, Lock, Gift, Briefcase, Code, Trophy, Wrench, RotateCcw, MapPin, LogOut, Vote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRegistration } from '@/hooks/useRegistration';
import { useAuth } from '@/hooks/useAuth';
import { BotinExplanation } from '@/components/BotinExplanation';
import { ReferralSystem } from '@/components/ReferralSystem';
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
  const { data, resetDemo, setStep } = useRegistration();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    resetDemo();
  };

  const handleValidateVote = () => {
    setStep('vote-validation');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col p-6">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-carbon" />
      
      {/* Content */}
      <motion.div
        className="relative z-10 flex-1 flex flex-col items-center justify-center max-w-md mx-auto"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Success message */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="text-2xl font-bold text-foreground mb-2">
            ¡Felicidades, <span className="text-bronze-metallic">Gladiador!</span>
          </h1>
          <p className="text-muted-foreground">Tu Pasaporte de Bronce está listo</p>
        </motion.div>

        {/* Passport card */}
        <motion.div
          className="w-full card-industrial rounded-2xl overflow-hidden border border-bronze/30"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {/* Header */}
          <div className="bg-gradient-bronze p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-8 h-8 text-foreground" />
                <span className="font-bold text-lg text-foreground">FIN</span>
              </div>
              <div className="text-right">
                <p className="text-xs text-foreground/70">NIVEL</p>
                <p className="font-bold text-foreground uppercase">{data.userLevel}</p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">
            {/* User info */}
            <div className="flex gap-4">
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-1">NOMBRE</p>
                <p className="font-bold text-foreground">{data.fullName}</p>
              </div>
              {data.interestArea && (
                <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/30">
                  {areaIcons[data.interestArea]}
                  <span className="text-xs font-medium text-primary">
                    {areaLabels[data.interestArea]}
                  </span>
                </div>
              )}
            </div>

            {/* QR Code */}
            <div className="flex justify-center">
              <motion.div
                className="p-4 bg-foreground rounded-xl"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: 'spring' }}
              >
                <QRCodeSVG
                  value={data.qrCode || `FIN-${data.cedula}`}
                  size={150}
                  level="H"
                  includeMargin={false}
                  fgColor="#0a0a0a"
                  bgColor="#ffffff"
                />
              </motion.div>
            </div>

            {/* QR Code label */}
            <div className="text-center">
              <p className="text-xs text-muted-foreground font-mono">
                {data.qrCode || `FIN-${data.cedula}`}
              </p>
            </div>
          </div>

          {/* Bronze border decoration */}
          <div className="h-2 bg-gradient-bronze" />
        </motion.div>

        {/* Vote validation CTA */}
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
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-[0_0_20px_rgba(245,158,11,0.3)]"
          >
            <Vote className="w-5 h-5 mr-2" />
            YA VOTÉ - VALIDAR MI VOTO
          </Button>
        </motion.div>

        {/* Important next steps message */}
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
            ¡Desbloquea tu Pasaporte Dorado y accede al Botín si ganamos!
          </p>
        </motion.div>

        {/* Referral System */}
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

        {/* Botin explanation button */}
        <motion.div
          className="w-full mt-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <BotinExplanation />
        </motion.div>

        {/* Locked benefits */}
        <motion.div
          className="w-full mt-6 space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <h2 className="text-center font-bold text-foreground flex items-center justify-center gap-2">
            <Lock className="w-4 h-4 text-muted-foreground" />
            Tu Botín (Bloqueado)
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

        {/* Logout button */}
        <motion.div
          className="w-full mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <Button
            variant="outline"
            size="lg"
            onClick={handleLogout}
            className="w-full"
          >
            <LogOut className="w-5 h-5 mr-2" />
            Cerrar Sesión
          </Button>
        </motion.div>

        {/* Demo reset button - visible for testing */}
        <motion.div
          className="w-full mt-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
        >
          <Button
            variant="ghost"
            size="lg"
            onClick={resetDemo}
            className="w-full text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Ver Demo Completa (Reiniciar)
          </Button>
        </motion.div>
      </motion.div>

      {/* Bottom bronze accent */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-bronze" />
    </div>
  );
};
