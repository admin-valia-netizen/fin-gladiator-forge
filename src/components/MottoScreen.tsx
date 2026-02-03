import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useRegistration } from '@/hooks/useRegistration';

const mottoWords = ['ORDEN', 'MORALIDAD', 'CONFIANZA'];

export const MottoScreen = () => {
  const { setStep } = useRegistration();
  const [currentWord, setCurrentWord] = useState(0);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    // Show words one by one
    const wordTimers = mottoWords.map((_, index) => {
      return setTimeout(() => {
        setCurrentWord(index + 1);
      }, 800 * (index + 1));
    });

    // After all words shown, wait and show all together with glow
    const showAllTimer = setTimeout(() => {
      setShowAll(true);
    }, 800 * mottoWords.length + 500);

    // Transition to next screen
    const transitionTimer = setTimeout(() => {
      setStep('glossary');
    }, 800 * mottoWords.length + 3000);

    return () => {
      wordTimers.forEach(clearTimeout);
      clearTimeout(showAllTimer);
      clearTimeout(transitionTimer);
    };
  }, [setStep]);

  return (
    <div className="fixed inset-0 bg-background flex flex-col items-center justify-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-carbon" />
      
      {/* Subtle ambient particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-bronze/40 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0, 0.6, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Motto container */}
      <div className="relative z-10 flex flex-col items-center gap-6 px-8">
        {mottoWords.map((word, index) => (
          <motion.div
            key={word}
            className="relative"
            initial={{ opacity: 0, y: 20 }}
            animate={{ 
              opacity: currentWord > index ? 1 : 0,
              y: currentWord > index ? 0 : 20,
            }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            {/* Glow effect behind text when all are shown */}
            {showAll && (
              <motion.div
                className="absolute inset-0 blur-2xl bg-primary/30"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
            
            <motion.span
              className={`text-4xl md:text-6xl font-bold tracking-[0.3em] text-bronze-metallic ${
                showAll ? 'text-neon-glow' : ''
              }`}
              animate={showAll ? {
                textShadow: [
                  '0 0 10px hsl(35 60% 45% / 0.5)',
                  '0 0 30px hsl(35 60% 45% / 0.8)',
                  '0 0 10px hsl(35 60% 45% / 0.5)',
                ],
              } : {}}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              {word}
            </motion.span>
            
            {/* Decorative dot after each word except last */}
            {index < mottoWords.length - 1 && currentWord > index && (
              <motion.span
                className="absolute -right-6 top-1/2 -translate-y-1/2 w-2 h-2 bg-primary rounded-full"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.3 }}
              />
            )}
          </motion.div>
        ))}
      </div>

      {/* Shimmer line at bottom */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-1 shimmer-bronze"
        initial={{ opacity: 0 }}
        animate={{ opacity: showAll ? 1 : 0 }}
        transition={{ duration: 0.5 }}
      />

      {/* Skip button */}
      <motion.button
        onClick={() => setStep('glossary')}
        className="absolute bottom-8 right-8 px-4 py-2 bg-card/80 backdrop-blur-sm rounded-lg text-muted-foreground hover:text-foreground transition-colors border border-bronze/30"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
      >
        Continuar
      </motion.button>
    </div>
  );
};
