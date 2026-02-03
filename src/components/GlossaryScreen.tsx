import { motion } from 'framer-motion';
import { useState } from 'react';
import { useRegistration } from '@/hooks/useRegistration';
import { Sword, Flame, ChevronRight } from 'lucide-react';

const glossaryItems = [
  {
    term: '¿Qué es un Gladiador?',
    definition: 'Es el dominicano que decide ser dueño de su destino a través del mérito y la integridad.',
    icon: Sword,
  },
  {
    term: '¿Qué es una Mesa de Forja?',
    definition: 'Es el punto físico donde sellamos legalmente nuestro compromiso. "Donde forjamos nuestro futuro con trabajo, sudor y esfuerzo."',
    icon: Flame,
  },
];

export const GlossaryScreen = () => {
  const { setStep } = useRegistration();
  const [currentItem, setCurrentItem] = useState(0);
  const [allRevealed, setAllRevealed] = useState(false);

  const handleNext = () => {
    if (currentItem < glossaryItems.length - 1) {
      setCurrentItem(currentItem + 1);
    } else {
      setAllRevealed(true);
    }
  };

  const handleContinue = () => {
    setStep('onboarding');
  };

  return (
    <div className="fixed inset-0 bg-background flex flex-col overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-carbon pointer-events-none" />
      
      {/* Header */}
      <motion.div
        className="relative z-10 pt-12 pb-6 px-6 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-2xl md:text-3xl font-bold text-bronze-metallic tracking-wide">
          ENTIENDE TU PODER
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Conoce los términos que definen nuestra lucha
        </p>
      </motion.div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pb-24">
        <div className="w-full max-w-md space-y-6">
          {glossaryItems.map((item, index) => {
            const Icon = item.icon;
            const isVisible = index <= currentItem || allRevealed;
            const isActive = index === currentItem && !allRevealed;

            return (
              <motion.div
                key={item.term}
                className={`card-industrial rounded-xl p-6 ${
                  isActive ? 'ring-2 ring-primary/50' : ''
                }`}
                initial={{ opacity: 0, x: -30 }}
                animate={{ 
                  opacity: isVisible ? 1 : 0.3,
                  x: isVisible ? 0 : -30,
                }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="flex items-start gap-4">
                  <motion.div
                    className={`p-3 rounded-lg ${
                      isActive ? 'bg-primary/20' : 'bg-bronze/20'
                    }`}
                    animate={isActive ? {
                      boxShadow: [
                        '0 0 0 0 hsl(25 100% 50% / 0)',
                        '0 0 20px 5px hsl(25 100% 50% / 0.3)',
                        '0 0 0 0 hsl(25 100% 50% / 0)',
                      ],
                    } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Icon className={`w-6 h-6 ${
                      isActive ? 'text-primary' : 'text-bronze'
                    }`} />
                  </motion.div>
                  
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {item.term}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {item.definition}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Bottom button */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 z-20 p-6 bg-gradient-to-t from-background via-background to-transparent"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        {!allRevealed ? (
          <motion.button
            onClick={handleNext}
            className="w-full py-4 bg-gradient-neon rounded-xl font-bold text-lg uppercase tracking-wider text-primary-foreground shadow-neon-strong flex items-center justify-center gap-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Siguiente
            <ChevronRight className="w-5 h-5" />
          </motion.button>
        ) : (
          <motion.button
            onClick={handleContinue}
            className="w-full py-4 bg-gradient-neon rounded-xl font-bold text-lg uppercase tracking-wider text-primary-foreground shadow-neon-strong flex items-center justify-center gap-2 glow-pulse"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            ¡Estoy Listo!
            <Sword className="w-5 h-5" />
          </motion.button>
        )}
      </motion.div>

      {/* Progress indicator */}
      <div className="absolute bottom-24 left-0 right-0 z-20 flex justify-center gap-2 pointer-events-none">
        {glossaryItems.map((_, index) => (
          <motion.div
            key={index}
            className={`w-2 h-2 rounded-full ${
              index <= currentItem || allRevealed ? 'bg-primary' : 'bg-muted'
            }`}
            animate={index === currentItem && !allRevealed ? {
              scale: [1, 1.3, 1],
            } : {}}
            transition={{ duration: 1, repeat: Infinity }}
          />
        ))}
      </div>
    </div>
  );
};
