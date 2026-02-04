import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef } from 'react';
import { CreditCard, Phone, ArrowRight, Fingerprint, ScanFace, Check, AlertCircle, Loader2, ShieldCheck, ArrowLeft, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRegistration } from '@/hooks/useRegistration';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const verifySchema = z.object({
  cedula: z.string().regex(/^\d{11}$/, 'La cédula debe tener 11 dígitos'),
  phone: z.string().regex(/^\d{10}$/, 'El teléfono debe tener 10 dígitos'),
});

type VerifyFormData = z.infer<typeof verifySchema>;

export const QuickVerification = () => {
  const [step, setStep] = useState<'credentials' | 'biometric'>('credentials');
  const [isVerifying, setIsVerifying] = useState(false);
  const [biometricStatus, setBiometricStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const [selectedMethod, setSelectedMethod] = useState<'fingerprint' | 'face' | null>(null);
  const submitLockRef = useRef(false);
  const { updateData, setStep: setAppStep } = useRegistration();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VerifyFormData>({
    resolver: zodResolver(verifySchema),
  });

  const onSubmit = async (formData: VerifyFormData) => {
    if (submitLockRef.current) return;
    submitLockRef.current = true;
    setIsVerifying(true);

    try {
      // Check if user exists with this cedula
      const { data: existing, error } = await supabase
        .from('registrations')
        .select('id, full_name, cedula, phone, passport_level, qr_code, referral_code, signature_confirmed')
        .eq('cedula', formData.cedula)
        .maybeSingle();

      if (error) throw error;

      if (!existing) {
        toast.error('No encontramos un registro con esa cédula. ¿Eres nuevo? Regístrate primero.');
        return;
      }

      // Verify phone matches
      if (existing.phone !== formData.phone) {
        toast.error('El teléfono no coincide con el registro.');
        return;
      }

      // Check if registration is complete (has gone through staircase)
      if (!existing.signature_confirmed) {
        toast.info('Tu registro no está completo. Continuando desde donde lo dejaste...');
        
        updateData({
          fullName: existing.full_name,
          cedula: existing.cedula,
          phone: existing.phone,
          registrationId: existing.id,
          qrCode: existing.qr_code ?? undefined,
          referralCode: `FIN-${existing.cedula}`,
          passportLevel: existing.passport_level as any,
        });
        
        setAppStep('staircase');
        return;
      }

      // User has complete registration - store data and proceed to biometric
      updateData({
        fullName: existing.full_name,
        cedula: existing.cedula,
        phone: existing.phone,
        registrationId: existing.id,
        qrCode: existing.qr_code ?? undefined,
        referralCode: `FIN-${existing.cedula}`,
        passportLevel: existing.passport_level as any,
      });

      toast.success('¡Registro encontrado! Verifica tu identidad.');
      setStep('biometric');
    } catch (error) {
      console.error('Verification error:', error);
      toast.error('Error al verificar. Intenta de nuevo.');
    } finally {
      setIsVerifying(false);
      submitLockRef.current = false;
    }
  };

  const startBiometricAuth = async (method: 'fingerprint' | 'face') => {
    setSelectedMethod(method);
    setBiometricStatus('scanning');

    try {
      if (!window.PublicKeyCredential) {
        throw new Error('Tu navegador no soporta autenticación biométrica');
      }

      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      
      if (!available) {
        throw new Error('Tu dispositivo no tiene autenticador biométrico disponible');
      }

      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

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
          { alg: -7, type: 'public-key' },
          { alg: -257, type: 'public-key' },
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'preferred',
        },
        timeout: 60000,
        attestation: 'none',
      };

      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions,
      });

      if (credential) {
        setBiometricStatus('success');
        
        if (navigator.vibrate) {
          navigator.vibrate([100, 50, 100]);
        }

        toast.success('¡Verificación biométrica exitosa!');

        setTimeout(() => {
          setAppStep('passport');
        }, 1500);
      }
    } catch (error: any) {
      console.error('Biometric error:', error);
      setBiometricStatus('error');
      
      if (error.name === 'NotAllowedError') {
        toast.error('Autenticación cancelada. Intenta de nuevo.');
      } else if (error.name === 'NotSupportedError') {
        toast.error('Tu dispositivo no soporta esta función biométrica.');
      } else {
        toast.error(error.message || 'Error en la validación biométrica');
      }

      setTimeout(() => {
        setBiometricStatus('idle');
        setSelectedMethod(null);
      }, 2000);
    }
  };

  const handleBack = () => {
    if (step === 'biometric') {
      setStep('credentials');
      setBiometricStatus('idle');
      setSelectedMethod(null);
    } else {
      setAppStep('registration');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="absolute inset-0 bg-gradient-carbon" />
      
      {/* Header */}
      <motion.header
        className="relative z-10 px-6 py-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {step === 'biometric' ? 'Cambiar credenciales' : 'Volver'}
        </Button>

        <div className="flex items-center gap-3">
          <UserCheck className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-xl font-bold text-foreground">Acceso Rápido</h1>
            <p className="text-sm text-muted-foreground">Para Gladiadores registrados</p>
          </div>
        </div>
      </motion.header>

      {/* Content */}
      <motion.div
        className="relative z-10 flex-1 px-6 pb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <AnimatePresence mode="wait">
          {step === 'credentials' && (
            <motion.div
              key="credentials"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
            >
              <div className="card-industrial p-6 rounded-xl mb-6">
                <p className="text-sm text-muted-foreground text-center">
                  Ingresa tu cédula y teléfono para acceder a tu Pasaporte Digital
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="cedula" className="flex items-center gap-2 text-foreground">
                    <CreditCard className="w-4 h-4 text-bronze" />
                    Cédula de Identidad
                  </Label>
                  <Input
                    id="cedula"
                    placeholder="00112345678"
                    maxLength={11}
                    className="bg-card border-bronze/30 focus:border-primary h-12 font-mono"
                    {...register('cedula')}
                  />
                  {errors.cedula && (
                    <p className="text-sm text-destructive">{errors.cedula.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2 text-foreground">
                    <Phone className="w-4 h-4 text-bronze" />
                    Teléfono
                  </Label>
                  <Input
                    id="phone"
                    placeholder="8091234567"
                    maxLength={10}
                    className="bg-card border-bronze/30 focus:border-primary h-12 font-mono"
                    {...register('phone')}
                  />
                  {errors.phone && (
                    <p className="text-sm text-destructive">{errors.phone.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  variant="gladiator"
                  size="xl"
                  className="w-full"
                  disabled={isVerifying}
                >
                  {isVerifying ? (
                    <motion.div
                      className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                  ) : (
                    <>
                      VERIFICAR MI REGISTRO
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </Button>
              </form>
            </motion.div>
          )}

          {step === 'biometric' && (
            <motion.div
              key="biometric"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-4"
            >
              <div className="step-bronze step-active p-4 rounded-xl">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-foreground">Validación Biométrica</h2>
                    <p className="text-xs text-muted-foreground">Confirma tu identidad de forma segura</p>
                  </div>
                </div>
              </div>

              {biometricStatus === 'idle' && (
                <motion.div
                  className="space-y-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <p className="text-center text-foreground font-medium text-sm">
                    Elige tu método de verificación:
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <motion.button
                      onClick={() => startBiometricAuth('fingerprint')}
                      className="card-industrial p-4 rounded-xl border-2 border-bronze/30 hover:border-primary transition-all flex flex-col items-center gap-2"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                        <Fingerprint className="w-6 h-6 text-primary" />
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-foreground text-sm">Huella Digital</p>
                        <p className="text-xs text-muted-foreground">Touch ID / Lector</p>
                      </div>
                    </motion.button>

                    <motion.button
                      onClick={() => startBiometricAuth('face')}
                      className="card-industrial p-4 rounded-xl border-2 border-bronze/30 hover:border-primary transition-all flex flex-col items-center gap-2"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                        <ScanFace className="w-6 h-6 text-primary" />
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-foreground text-sm">Reconocimiento Facial</p>
                        <p className="text-xs text-muted-foreground">Face ID / Cámara</p>
                      </div>
                    </motion.button>
                  </div>
                </motion.div>
              )}

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
                  </div>
                </motion.div>
              )}

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
                      Accediendo a tu Pasaporte...
                    </p>
                  </div>
                </motion.div>
              )}

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
                      No se pudo completar la validación
                    </p>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-bronze" />
    </div>
  );
};
