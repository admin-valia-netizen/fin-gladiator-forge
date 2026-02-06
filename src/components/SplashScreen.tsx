import { motion } from 'framer-motion';
import { useEffect } from 'react';
import finLogo from '@/assets/fin-logo.png';
import { TotalRegisteredCounter } from './TotalRegisteredCounter';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 8000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-background flex flex-col items-center justify-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-carbon" />
      
      {/* Animated light rays */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute top-1/2 left-1/2 w-2 h-[200%] bg-gradient-to-t from-transparent via-primary/20 to-transparent origin-bottom"
            style={{
              rotate: `${i * 45}deg`,
              translateX: '-50%',
            }}
            animate={{
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </div>

      {/* Animated sparks */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-bronze rounded-full"
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
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Logo container */}
      <motion.div
        className="relative z-10 flex flex-col items-center"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        {/* Logo */}
        <motion.div
          className="w-64 h-64 md:w-80 md:h-80 relative"
          animate={{
            y: [0, -10, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {/* Glow effect behind logo */}
          <motion.div
            className="absolute inset-0 rounded-full bg-primary/30 blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          
          <img 
            src={finLogo} 
            alt="FIN - Frente de Integridad Nacional" 
            className="w-full h-full object-contain relative z-10"
          />
        </motion.div>

        {/* Total Registered Counter */}
        <div className="mt-8">
          <TotalRegisteredCounter />
        </div>

        {/* Welcome message */}
        <motion.p
          className="mt-6 text-center text-sm text-muted-foreground max-w-xs px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
        >
          Tu participación es la mayor{' '}
          <span className="text-primary font-semibold">recompensa</span>{' '}
          para el futuro de nuestra patria
        </motion.p>

        {/* Loading indicator */}
        <motion.div
          className="mt-6 flex gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-3 h-3 rounded-full bg-bronze"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </motion.div>
      </motion.div>

      {/* Bottom bronze accent */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-bronze" />
    </div>
  );
};
