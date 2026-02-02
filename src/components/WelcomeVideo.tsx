import { motion } from 'framer-motion';
import { useState, useRef } from 'react';
import { Zap } from 'lucide-react';
import { useRegistration } from '@/hooks/useRegistration';
import gladiatorVideo from '@/assets/gladiator-intro.mp4';

export const WelcomeVideo = () => {
  const [videoEnded, setVideoEnded] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { setStep } = useRegistration();

  const handleVideoEnd = () => {
    setVideoEnded(true);
  };

  const handleSkip = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    setVideoEnded(true);
  };

  const toggleSound = async () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);

    const video = videoRef.current;
    if (!video) return;

    video.muted = nextMuted;
    if (!nextMuted) {
      try {
        await video.play();
      } catch {
        // Si el navegador bloquea, el usuario puede intentar de nuevo.
      }
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center overflow-hidden relative">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-carbon" />
      
      {/* Video container */}
      {!videoEnded && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background">
          <video
            ref={videoRef}
            src={gladiatorVideo}
            autoPlay
            playsInline
            muted={isMuted}
            onEnded={handleVideoEnd}
            className="max-w-full max-h-full w-auto h-auto object-contain"
          />
          
          {/* Skip button */}
          <motion.button
            onClick={handleSkip}
            className="absolute bottom-8 right-8 px-4 py-2 bg-card/80 backdrop-blur-sm rounded-lg text-muted-foreground hover:text-foreground transition-colors border border-bronze/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            Saltar
          </motion.button>

          {/* Sound toggle (autoplay con sonido suele estar bloqueado en móviles) */}
          <motion.button
            onClick={toggleSound}
            className="absolute bottom-8 left-8 px-4 py-2 bg-card/80 backdrop-blur-sm rounded-lg text-muted-foreground hover:text-foreground transition-colors border border-bronze/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            {isMuted ? 'Activar sonido' : 'Silenciar'}
          </motion.button>
        </div>
      )}

      {/* Content after video */}
      {videoEnded && (
        <motion.div
          className="relative z-10 text-center space-y-8 px-6"
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
            onClick={() => setStep('onboarding')}
            className="group relative px-10 py-4 bg-gradient-neon rounded-xl font-bold text-lg uppercase tracking-widest text-primary-foreground shadow-neon-strong overflow-hidden"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 shimmer-bronze opacity-30" />
            
            <span className="relative flex items-center gap-3">
              <Zap className="w-5 h-5" />
              CONTINUAR
            </span>
          </motion.button>

          {/* Bronze accent line */}
          <div className="w-32 h-1 mx-auto bg-gradient-bronze rounded-full" />
        </motion.div>
      )}
    </div>
  );
};
