import { motion } from 'framer-motion';
import { useState } from 'react';
import { Fingerprint, ScanFace, Check, AlertCircle, Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface BiometricStepProps {
  onComplete: () => void;
}

export const BiometricStep = ({ onComplete }: BiometricStepProps) => {
  const [biometricStatus, setBiometricStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const [selectedMethod, setSelectedMethod] = useState<'fingerprint' | 'face' | null>(null);
  const [isWebAuthnSupported, setIsWebAuthnSupported] = useState<boolean | null>(null);

  // Check WebAuthn support on mount
  useState(() => {
    const checkSupport = async () => {
      try {
        const available = 
          window.PublicKeyCredential !== undefined &&
          (await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable());
        setIsWebAuthnSupported(available);
      } catch {
        setIsWebAuthnSupported(false);
      }
    };
    checkSupport();
  });

  const startBiometricAuth = async (method: 'fingerprint' | 'face') => {
    setSelectedMethod(method);
    setBiometricStatus('scanning');

    try {
      // Check if WebAuthn is available
      if (!window.PublicKeyCredential) {
        throw new Error('Tu navegador no soporta autenticación biométrica');
      }

      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      
      if (!available) {
        throw new Error('Tu dispositivo no tiene autenticador biométrico disponible');
      }

      // Create a challenge for WebAuthn
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      // Create credential options
      const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
        challenge,
        rp: {
          name: 'FIN - Frente de Integridad Nacional',
          id: window.location.hostname,
        },
        user: {
          id: new Uint8Array(16),
          name: 'gladiador@fin.do',
          displayName: 'Gladiador FIN',
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' },  // ES256
          { alg: -257, type: 'public-key' }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'preferred',
        },
        timeout: 60000,
        attestation: 'none',
      };

      // Request biometric authentication
      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions,
      });

      if (credential) {
        setBiometricStatus('success');
        
        // Vibrate on success
        if (navigator.vibrate) {
          navigator.vibrate([100, 50, 100]);
        }

        toast.success('¡Validación biométrica exitosa!');

        // Move to next step after animation
        setTimeout(() => {
          onComplete();
        }, 1500);
      }
    } catch (error: any) {
      console.error('Biometric error:', error);
      setBiometricStatus('error');
      
      // Handle specific error cases
      if (error.name === 'NotAllowedError') {
        toast.error('Autenticación cancelada. Intenta de nuevo.');
      } else if (error.name === 'NotSupportedError') {
        toast.error('Tu dispositivo no soporta esta función biométrica.');
      } else {
        toast.error(error.message || 'Error en la validación biométrica');
      }

      // Reset after error
      setTimeout(() => {
        setBiometricStatus('idle');
        setSelectedMethod(null);
      }, 2000);
    }
  };

  const skipBiometric = () => {
    toast.info('Validación biométrica omitida');
    onComplete();
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="space-y-6"
    >
      {/* Step indicator */}
      <div className="step-bronze step-active p-6 rounded-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Validación Biométrica</h2>
            <p className="text-sm text-muted-foreground">Confirma tu identidad de forma segura</p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          Para garantizar la seguridad de tu registro, necesitamos verificar tu identidad 
          usando la biometría de tu dispositivo.
        </p>
      </div>

      {/* Biometric options */}
      {biometricStatus === 'idle' && (
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-center text-foreground font-medium">
            Elige tu método de verificación:
          </p>

          <div className="grid grid-cols-2 gap-4">
            {/* Fingerprint option */}
            <motion.button
              onClick={() => startBiometricAuth('fingerprint')}
              className="card-industrial p-6 rounded-xl border-2 border-bronze/30 hover:border-primary transition-all flex flex-col items-center gap-4"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                <Fingerprint className="w-8 h-8 text-primary" />
              </div>
              <div className="text-center">
                <p className="font-bold text-foreground">Huella Digital</p>
                <p className="text-xs text-muted-foreground mt-1">Touch ID / Lector de huellas</p>
              </div>
            </motion.button>

            {/* Face recognition option */}
            <motion.button
              onClick={() => startBiometricAuth('face')}
              className="card-industrial p-6 rounded-xl border-2 border-bronze/30 hover:border-primary transition-all flex flex-col items-center gap-4"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                <ScanFace className="w-8 h-8 text-primary" />
              </div>
              <div className="text-center">
                <p className="font-bold text-foreground">Reconocimiento Facial</p>
                <p className="text-xs text-muted-foreground mt-1">Face ID / Cámara frontal</p>
              </div>
            </motion.button>
          </div>

          {/* Skip option for devices without biometric support */}
          {isWebAuthnSupported === false && (
            <div className="card-industrial p-4 rounded-xl border-l-4 border-amber-500">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-foreground font-medium">
                    Biometría no disponible
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Tu dispositivo no soporta autenticación biométrica. 
                    Puedes continuar sin esta validación.
                  </p>
                </div>
              </div>
            </div>
          )}

          <Button
            variant="ghost"
            size="lg"
            onClick={skipBiometric}
            className="w-full text-muted-foreground hover:text-foreground"
          >
            Omitir este paso
          </Button>
        </motion.div>
      )}

      {/* Scanning state */}
      {biometricStatus === 'scanning' && (
        <motion.div
          className="flex flex-col items-center py-12 space-y-6"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <motion.div
            className="relative w-32 h-32"
            animate={{ 
              boxShadow: [
                '0 0 0 0 rgba(var(--primary), 0.4)',
                '0 0 0 20px rgba(var(--primary), 0)',
              ]
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <div className="absolute inset-0 rounded-full bg-primary/20 flex items-center justify-center">
              {selectedMethod === 'fingerprint' ? (
                <Fingerprint className="w-16 h-16 text-primary" />
              ) : (
                <ScanFace className="w-16 h-16 text-primary" />
              )}
            </div>
            
            {/* Scanning animation ring */}
            <motion.div
              className="absolute inset-0 rounded-full border-4 border-primary"
              animate={{ scale: [1, 1.2], opacity: [1, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </motion.div>

          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <p className="font-bold text-foreground">
                {selectedMethod === 'fingerprint' 
                  ? 'Coloca tu huella en el sensor...' 
                  : 'Mira a la cámara...'}
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              Sigue las instrucciones de tu dispositivo
            </p>
          </div>
        </motion.div>
      )}

      {/* Success state */}
      {biometricStatus === 'success' && (
        <motion.div
          className="flex flex-col items-center py-12 space-y-6"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <motion.div
            className="w-32 h-32 rounded-full bg-green-500/20 flex items-center justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          >
            <Check className="w-16 h-16 text-green-500" />
          </motion.div>

          <div className="text-center space-y-2">
            <p className="font-bold text-foreground text-lg">¡Verificación Exitosa!</p>
            <p className="text-sm text-muted-foreground">
              Tu identidad ha sido confirmada
            </p>
          </div>
        </motion.div>
      )}

      {/* Error state */}
      {biometricStatus === 'error' && (
        <motion.div
          className="flex flex-col items-center py-12 space-y-6"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <motion.div
            className="w-32 h-32 rounded-full bg-destructive/20 flex items-center justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          >
            <AlertCircle className="w-16 h-16 text-destructive" />
          </motion.div>

          <div className="text-center space-y-2">
            <p className="font-bold text-foreground text-lg">Error de Verificación</p>
            <p className="text-sm text-muted-foreground">
              No se pudo completar la validación biométrica
            </p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};
