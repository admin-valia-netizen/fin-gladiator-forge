import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Shield, Zap } from 'lucide-react';
import { useRegistration } from '@/hooks/useRegistration';

export const WelcomeVideo = () => {
  const [showContent, setShowContent] = useState(false);
  const [strikeCount, setStrikeCount] = useState(0);
  const { setStep } = useRegistration();

  useEffect(() => {
    // Simulate shield strike animation
    const strikeInterval = setInterval(() => {
      setStrikeCount(prev => {
        if (prev >= 3) {
          clearInterval(strikeInterval);
          setTimeout(() => setShowContent(true), 500);
          return prev;
        }
        // Play hammer sound effect
        const audio = new Audio('/hammer-strike.mp3');
        audio.volume = 0.3;
        audio.play().catch(() => {}); // Ignore if audio fails
        return prev + 1;
      });
    }, 400);

    return () => clearInterval(strikeInterval);
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-carbon" />
      
      {/* Animated sparks */}
      {strikeCount > 0 && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(30 * strikeCount)].map((_, i) => (
            <motion.div
              key={`spark-${strikeCount}-${i}`}
              className="absolute w-1 h-1 bg-primary rounded-full"
              style={{
                left: '50%',
                top: '40%',
              }}
              initial={{ 
                scale: 0, 
                x: 0, 
                y: 0,
                opacity: 1 
              }}
              animate={{ 
                scale: [0, 1, 0],
                x: (Math.random() - 0.5) * 400,
                y: (Math.random() - 0.5) * 400,
                opacity: [1, 1, 0]
              }}
              transition={{ 
                duration: 0.8,
                delay: Math.random() * 0.2
              }}
            />
          ))}
        </div>
      )}

      {/* Shield animation */}
      <motion.div
        className="relative z-10"
        animate={strikeCount > 0 ? {
          scale: [1, 0.95, 1.05, 1],
        } : {}}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          className="relative"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ 
            type: "spring",
            stiffness: 200,
            damping: 15,
            duration: 1
          }}
        >
          {/* Glow effect */}
          <div className="absolute inset-0 blur-3xl bg-primary/30 rounded-full scale-150" />
          
          {/* Shield icon */}
          <div className="relative w-40 h-40 flex items-center justify-center">
            <Shield className="w-32 h-32 text-bronze fill-carbon stroke-bronze" strokeWidth={1} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl font-bold text-primary text-neon-glow">FIN</span>
            </div>
          </div>
          
          {/* Strike effect */}
          {strikeCount > 0 && (
            <motion.div
              className="absolute -inset-4 rounded-full"
              style={{
                background: 'radial-gradient(circle, hsl(25 100% 50% / 0.4) 0%, transparent 70%)',
              }}
              initial={{ scale: 0.5, opacity: 1 }}
              animate={{ scale: 2, opacity: 0 }}
              transition={{ duration: 0.5 }}
            />
          )}
        </motion.div>
      </motion.div>

      {/* Content after animation */}
      {showContent && (
        <motion.div
          className="relative z-10 mt-12 text-center space-y-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              Bienvenido, <span className="text-bronze-metallic">Gladiador</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Es hora de forjar tu destino
            </p>
          </div>

          <motion.button
            onClick={() => setStep('registration')}
            className="group relative px-10 py-4 bg-gradient-neon rounded-xl font-bold text-lg uppercase tracking-widest text-primary-foreground shadow-neon-strong overflow-hidden"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 shimmer-bronze opacity-30" />
            
            <span className="relative flex items-center gap-3">
              <Zap className="w-5 h-5" />
              COMENZAR REGISTRO
            </span>
          </motion.button>

          {/* Bronze accent line */}
          <div className="w-32 h-1 mx-auto bg-gradient-bronze rounded-full" />
        </motion.div>
      )}

      {/* Loading indicator */}
      {!showContent && (
        <motion.div
          className="absolute bottom-20 flex items-center gap-2 text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <motion.div
            className="w-2 h-2 bg-primary rounded-full"
            animate={{ scale: [1, 1.5, 1] }}
            transition={{ duration: 0.6, repeat: Infinity }}
          />
          <span className="text-sm">Forjando tu escudo...</span>
        </motion.div>
      )}
    </div>
  );
};
