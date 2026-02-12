import { motion } from 'framer-motion';
import { Shield, Heart, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WelcomeMessageProps {
  onContinue: () => void;
}

export const WelcomeMessage = ({ onContinue }: WelcomeMessageProps) => {
  return (
    <div className="fixed inset-0 bg-background flex flex-col items-center justify-center overflow-hidden px-6">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-carbon" />
      
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-primary/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1.5, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 3,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <motion.div
        className="relative z-10 text-center max-w-md"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        {/* Icon trio */}
        <motion.div 
          className="flex items-center justify-center gap-4 mb-8"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0 }}
          >
            <Heart className="w-8 h-8 text-destructive" />
          </motion.div>
          <motion.div
            className="relative"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
          >
            <div className="absolute inset-0 bg-primary/30 blur-xl rounded-full" />
            <Shield className="w-12 h-12 text-primary relative z-10" />
          </motion.div>
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
          >
            <Flag className="w-8 h-8 text-blue-500" />
          </motion.div>
        </motion.div>

        {/* Main message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-6 leading-relaxed">
            Tu participación es la mayor{' '}
            <span className="text-primary">recompensa</span>{' '}
            para el futuro de nuestra patria.
          </h1>
          
          <motion.div
            className="h-px w-24 bg-gradient-to-r from-transparent via-bronze to-transparent mx-auto mb-6"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
          />
          
          <p className="text-lg text-muted-foreground mb-8">
            Bienvenido a{' '}
            <span className="font-bold text-foreground">REFIDO</span>
            {' '} · Reclutar · Firmar · Donar
          </p>
        </motion.div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.5 }}
        >
          <Button
            variant="gladiator"
            size="xl"
            onClick={onContinue}
            className="w-full"
          >
            Comenzar mi Registro
          </Button>
        </motion.div>
      </motion.div>

      {/* Bottom accent */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-bronze" />
    </div>
  );
};
