import { motion } from 'framer-motion';
import { Shield, X } from 'lucide-react';
import finLogo from '@/assets/fin-logo.png';

const SessionClosed = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-carbon" />
      
      {/* Content */}
      <motion.div
        className="relative z-10 flex flex-col items-center text-center max-w-sm"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Logo */}
        <motion.img 
          src={finLogo} 
          alt="FIN" 
          className="w-24 h-24 object-contain mb-6 opacity-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
        />

        {/* Closed icon */}
        <motion.div
          className="w-20 h-20 rounded-full bg-muted/50 border border-muted flex items-center justify-center mb-6"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
        >
          <X className="w-10 h-10 text-muted-foreground" />
        </motion.div>

        {/* Message */}
        <motion.h1
          className="text-2xl font-bold text-foreground mb-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          Sesión Cerrada
        </motion.h1>

        <motion.p
          className="text-muted-foreground mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          Tu sesión ha sido cerrada correctamente.
        </motion.p>

        {/* Instruction to close */}
        <motion.div
          className="p-4 rounded-xl bg-card border border-bronze/30"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-sm text-foreground font-medium mb-2">
            Para cerrar la aplicación:
          </p>
          <ul className="text-xs text-muted-foreground space-y-1 text-left">
            <li>• <strong>iPhone:</strong> Desliza hacia arriba desde el borde inferior</li>
            <li>• <strong>Android:</strong> Usa el botón de apps recientes</li>
            <li>• <strong>Navegador:</strong> Cierra esta pestaña</li>
          </ul>
        </motion.div>

        {/* Shield decoration */}
        <motion.div
          className="mt-8 opacity-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.2 }}
          transition={{ delay: 0.6 }}
        >
          <Shield className="w-12 h-12 text-bronze" />
        </motion.div>
      </motion.div>

      {/* Bottom bronze accent */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-bronze" />
    </div>
  );
};

export default SessionClosed;
