import { motion, AnimatePresence } from 'framer-motion';
import { useState, useCallback } from 'react';
import { ChevronRight, ChevronLeft, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRegistration } from '@/hooks/useRegistration';
import onboarding1 from '@/assets/onboarding-1.jpg';
import onboarding2 from '@/assets/onboarding-2.jpg';
import onboarding3 from '@/assets/onboarding-3.jpg';

interface Slide {
  id: number;
  title: string;
  subtitle: string;
  image: string;
}

const slides: Slide[] = [
  {
    id: 1,
    title: "REFIDO: RECLUTAR · FIRMAR · DONAR",
    subtitle: "Bienvenido a la Legión de Élite. REFIDO es el movimiento donde el mérito reemplaza al favoritismo. Aquí no se piden favores: se forja el destino con esfuerzo, integridad y honor. Únete y sé parte de algo más grande.",
    image: onboarding1,
  },
  {
    id: 2,
    title: "MESAS DE FORJA OPERATIVAS",
    subtitle: "Nuestro mapa operativo muestra cada Mesa de Forja activa en el territorio. Ubica la más cercana, firma presencialmente y sella tu compromiso. Cada mesa es un bastión de integridad donde los Gladiadores validan su identidad.",
    image: onboarding2,
  },
  {
    id: 3,
    title: "TU PASAPORTE DE GLADIADOR",
    subtitle: "Tu perfil de élite con doble escala de progreso: Rango de Mérito (Oro) basado en retos superados, y Rango de Popularidad (Plata) basado en los votos del público. El honor se gana con mérito; la fama con el voto del público.",
    image: onboarding3,
  },
];

export const OnboardingSlides = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0);
  const { setStep } = useRegistration();

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? '100%' : '-100%',
      opacity: 0,
    }),
  };

  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
  };

  const paginate = useCallback((newDirection: number) => {
    const nextSlide = currentSlide + newDirection;
    if (nextSlide >= 0 && nextSlide < slides.length) {
      setDirection(newDirection);
      setCurrentSlide(nextSlide);
    }
  }, [currentSlide]);

  const handleContinue = () => {
    if (currentSlide < slides.length - 1) {
      paginate(1);
    } else {
      setStep('registration');
    }
  };

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-carbon" />
      
      {/* Animated sparks background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-primary rounded-full"
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

      {/* Slides */}
      <div className="relative h-screen flex flex-col">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentSlide}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={1}
            onDragEnd={(_, { offset, velocity }) => {
              const swipe = swipePower(offset.x, velocity.x);

              if (swipe < -swipeConfidenceThreshold) {
                paginate(1);
              } else if (swipe > swipeConfidenceThreshold) {
                paginate(-1);
              }
            }}
            className="absolute inset-0 flex flex-col"
          >
            {/* Image section */}
            <div className="relative h-[55%] overflow-hidden">
              <div 
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${slides[currentSlide].image})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
              
              {/* Bronze corner accent */}
              <div className="absolute top-0 left-0 w-32 h-32">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-bronze to-transparent" />
                <div className="absolute top-0 left-0 h-full w-1 bg-gradient-to-b from-bronze to-transparent" />
              </div>
              <div className="absolute top-0 right-0 w-32 h-32">
                <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-l from-bronze to-transparent" />
                <div className="absolute top-0 right-0 h-full w-1 bg-gradient-to-b from-bronze to-transparent" />
              </div>
            </div>

            {/* Content section */}
            <div className="flex-1 px-6 py-8 flex flex-col justify-between">
              <div className="space-y-4">
                <motion.h1 
                  className="text-2xl md:text-3xl font-bold text-foreground leading-tight"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  {slides[currentSlide].title}
                </motion.h1>
                <motion.p 
                  className="text-lg text-muted-foreground leading-relaxed"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  {slides[currentSlide].subtitle}
                </motion.p>
              </div>

              {/* Navigation */}
              <div className="space-y-6">
                {/* Dots */}
                <div className="flex justify-center gap-2">
                  {slides.map((_, index) => (
                    <motion.button
                      key={index}
                      onClick={() => {
                        setDirection(index > currentSlide ? 1 : -1);
                        setCurrentSlide(index);
                      }}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        index === currentSlide 
                          ? 'w-8 bg-primary shadow-neon' 
                          : 'w-2 bg-bronze/50 hover:bg-bronze'
                      }`}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                    />
                  ))}
                </div>

                {/* Buttons */}
                <div className="flex gap-4">
                  {currentSlide > 0 && (
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => paginate(-1)}
                      className="flex-1"
                    >
                      <ChevronLeft className="w-5 h-5" />
                      Atrás
                    </Button>
                  )}
                  <Button
                    variant={currentSlide === slides.length - 1 ? 'gladiator' : 'neon'}
                    size="lg"
                    onClick={handleContinue}
                    className="flex-1"
                  >
                    {currentSlide === slides.length - 1 ? (
                      <>
                        <Shield className="w-5 h-5" />
                        ¡ÚNETE A REFIDO!
                      </>
                    ) : (
                      <>
                        Siguiente
                        <ChevronRight className="w-5 h-5" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
