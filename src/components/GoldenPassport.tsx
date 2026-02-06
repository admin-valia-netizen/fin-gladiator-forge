import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { Shield, Gift, Briefcase, Code, Trophy, Wrench, RotateCcw, Crown, LogOut, Sparkles, CheckCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRegistration } from '@/hooks/useRegistration';
import { useAuth } from '@/hooks/useAuth';

const benefits = [
  { id: 1, title: 'Capital Semilla', icon: <Gift className="w-5 h-5" />, desc: 'Hasta RD$500,000' },
  { id: 2, title: 'Becas Tecnológicas', icon: <Code className="w-5 h-5" />, desc: 'Certificaciones internacionales' },
  { id: 3, title: 'Empleos Reales', icon: <Briefcase className="w-5 h-5" />, desc: 'Acceso prioritario' },
  { id: 4, title: 'Mentoría Premium', icon: <Trophy className="w-5 h-5" />, desc: 'Expertos del sector' },
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

export const GoldenPassport = () => {
  const { data, resetDemo, setStep, setForceShowBronze } = useRegistration();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    resetDemo();
  };

  const handleBack = () => {
    setForceShowBronze(true);
    setStep('passport');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col p-6">
      {/* Golden gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-900/20 via-background to-amber-800/10" />
      
      {/* Sparkle effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-amber-400 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1.5, 0],
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 3,
            }}
          />
        ))}
      </div>
      
      {/* Content */}
      <motion.div
        className="relative z-10 flex-1 flex flex-col items-center max-w-md mx-auto w-full pt-4"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Back button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full mb-6"
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="text-muted-foreground hover:text-foreground hover:bg-muted/50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Pasaporte de Bronce
          </Button>
        </motion.div>

        {/* Success message */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/20 rounded-full border border-amber-500/30 mb-4"
            animate={{ 
              boxShadow: [
                '0 0 10px rgba(245, 158, 11, 0.3)',
                '0 0 30px rgba(245, 158, 11, 0.5)',
                '0 0 10px rgba(245, 158, 11, 0.3)'
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Crown className="w-5 h-5 text-amber-500" />
            <span className="text-amber-500 font-bold">PASAPORTE DORADO</span>
          </motion.div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            ¡Felicidades, <span className="text-amber-500">Campeón!</span>
          </h1>
          <p className="text-muted-foreground">Has validado tu voto. Tu Recompensa está lista.</p>
        </motion.div>

        {/* Golden Passport card */}
        <motion.div
          className="w-full rounded-2xl overflow-hidden border-2 border-amber-500/50 shadow-[0_0_40px_rgba(245,158,11,0.3)]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-8 h-8 text-white" />
                <span className="font-bold text-lg text-white">FIN</span>
              </div>
              <div className="text-right">
                <p className="text-xs text-white/80">NIVEL</p>
                <div className="flex items-center gap-1">
                  <Crown className="w-4 h-4 text-white" />
                  <p className="font-bold text-white">CAMPEÓN</p>
                </div>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="bg-card p-6 space-y-6">
            {/* User info */}
            <div className="flex gap-4">
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-1">NOMBRE</p>
                <p className="font-bold text-foreground">{data.fullName}</p>
              </div>
              {data.interestArea && (
                <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 rounded-full border border-amber-500/30">
                  {areaIcons[data.interestArea]}
                  <span className="text-xs font-medium text-amber-500">
                    {areaLabels[data.interestArea]}
                  </span>
                </div>
              )}
            </div>

            {/* QR Code */}
            <div className="flex justify-center">
              <motion.div
                className="p-4 bg-gradient-to-br from-amber-100 to-amber-200 rounded-xl"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: 'spring' }}
              >
                <QRCodeSVG
                  value={data.qrCode || `FIN-GOLD-${data.cedula}`}
                  size={150}
                  level="H"
                  includeMargin={false}
                  fgColor="#78350f"
                  bgColor="transparent"
                />
              </motion.div>
            </div>

            {/* QR Code label */}
            <div className="text-center">
              <p className="text-xs text-amber-500 font-mono font-bold">
                {`FIN-GOLD-${data.cedula}`}
              </p>
            </div>
          </div>

          {/* Golden border decoration */}
          <div className="h-2 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600" />
        </motion.div>

        {/* Unlocked benefits */}
        <motion.div
          className="w-full mt-6 space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <h2 className="text-center font-bold text-foreground flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Tu Recompensa Desbloqueada
          </h2>

          <div className="grid grid-cols-2 gap-3">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.id}
                className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/30 flex items-center gap-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 + index * 0.1 }}
              >
                <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500 flex-shrink-0">
                  {benefit.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground no-underline decoration-transparent" style={{ textDecoration: 'none' }}>{benefit.title}</p>
                  <div className="flex items-center gap-1 text-xs text-amber-500 no-underline decoration-transparent" style={{ textDecoration: 'none' }}>
                    <CheckCircle className="w-3 h-3 flex-shrink-0" />
                    <span style={{ textDecoration: 'none' }}>Listo para reclamar</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Important message */}
        <motion.div
          className="w-full mt-6 card-industrial p-5 rounded-xl border-l-4 border-amber-500"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            ¡Ya estás listo!
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Tu Recompensa de Gladiador está <span className="text-amber-500 font-semibold">desbloqueada y lista para reclamar</span>.
          </p>
          <p className="text-sm text-amber-500 font-semibold mt-3">
            Si ganamos las elecciones, podrás acceder a todos tus beneficios. ¡Gracias por ser parte del cambio!
          </p>
        </motion.div>

        {/* Logout button */}
        <motion.div
          className="w-full mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
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

        {/* Demo reset button */}
        <motion.div
          className="w-full mt-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
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

      {/* Bottom golden accent */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600" />
    </div>
  );
};
