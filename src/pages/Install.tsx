import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Download, Share, MoreVertical, Check, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import finLogo from '@/assets/fin-logo.png';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));

    // Listen for install prompt (Android/Chrome)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Listen for successful install
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-carbon" />
      
      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Logo */}
        <motion.img
          src={finLogo}
          alt="FIN"
          className="w-32 h-32 mb-8"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
        />

        {isInstalled ? (
          <motion.div
            className="text-center space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">¡App Instalada!</h1>
            <p className="text-muted-foreground">
              Ya tienes FIN en tu pantalla de inicio.
            </p>
            <Button
              variant="gladiator"
              size="lg"
              onClick={() => window.location.href = '/'}
            >
              Abrir FIN
            </Button>
          </motion.div>
        ) : (
          <motion.div
            className="text-center space-y-6 max-w-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">Instalar FIN</h1>
              <p className="text-muted-foreground">
                Agrega FIN a tu pantalla de inicio para acceso rápido
              </p>
            </div>

            {/* Android/Chrome - Direct install */}
            {deferredPrompt && (
              <Button
                variant="gladiator"
                size="xl"
                className="w-full"
                onClick={handleInstall}
              >
                <Download className="w-5 h-5" />
                INSTALAR AHORA
              </Button>
            )}

            {/* iOS Instructions */}
            {isIOS && !deferredPrompt && (
              <div className="card-industrial p-6 rounded-xl space-y-4 text-left">
                <h3 className="font-bold text-foreground flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-bronze" />
                  Instrucciones para iPhone
                </h3>
                <ol className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">1</span>
                    <span>Toca el ícono de <Share className="w-4 h-4 inline text-bronze" /> <strong>Compartir</strong> en la barra del navegador</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">2</span>
                    <span>Desliza hacia abajo y toca <strong>"Agregar a Inicio"</strong></span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">3</span>
                    <span>Confirma tocando <strong>"Agregar"</strong></span>
                  </li>
                </ol>
              </div>
            )}

            {/* Android fallback instructions */}
            {!isIOS && !deferredPrompt && (
              <div className="card-industrial p-6 rounded-xl space-y-4 text-left">
                <h3 className="font-bold text-foreground flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-bronze" />
                  Instrucciones para Android
                </h3>
                <ol className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">1</span>
                    <span>Toca el menú <MoreVertical className="w-4 h-4 inline text-bronze" /> del navegador (tres puntos)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">2</span>
                    <span>Selecciona <strong>"Instalar aplicación"</strong> o <strong>"Agregar a pantalla de inicio"</strong></span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">3</span>
                    <span>Confirma la instalación</span>
                  </li>
                </ol>
              </div>
            )}

            {/* Back link */}
            <Button
              variant="outline"
              size="lg"
              className="w-full"
              onClick={() => window.location.href = '/'}
            >
              Volver a FIN
            </Button>
          </motion.div>
        )}
      </div>

      {/* Bottom accent */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-bronze" />
    </div>
  );
};

export default Install;
