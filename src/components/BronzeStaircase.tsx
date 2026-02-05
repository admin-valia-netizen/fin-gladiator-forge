import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useCallback, useEffect } from 'react';
import { Shield, Hand, Camera, MapPin, Check, Loader2, ShieldCheck, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRegistration } from '@/hooks/useRegistration';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { BiometricStep } from './BiometricStep';
import { BotinExplanation } from './BotinExplanation';

interface Step {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const steps: Step[] = [
  {
    id: 1,
    title: 'El Juramento',
    description: 'Código Gladiador: Mi Palabra Vale',
    icon: <Hand className="w-6 h-6" />,
  },
  {
    id: 2,
    title: 'Evidencia de Identidad',
    description: 'Captura tu cédula y selfie',
    icon: <Camera className="w-6 h-6" />,
  },
  {
    id: 3,
    title: 'Validación Biométrica',
    description: 'Huella o reconocimiento facial',
    icon: <ShieldCheck className="w-6 h-6" />,
  },
  {
    id: 4,
    title: 'La Recompensa y el Anclaje',
    description: 'Elige tu área y confirma',
    icon: <MapPin className="w-6 h-6" />,
  },
];

export const BronzeStaircase = () => {
  const { staircaseStep, setStaircaseStep, data, updateData, setStep } = useRegistration();
  const [isCheckingPhotos, setIsCheckingPhotos] = useState(true);

  // Check if user already has photos on mount - skip to biometric if so
  useEffect(() => {
    const checkExistingPhotos = async () => {
      if (!data.registrationId) {
        setIsCheckingPhotos(false);
        return;
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsCheckingPhotos(false);
          return;
        }

        // Check if user already has photos uploaded
        const { data: urls } = await supabase.rpc('get_own_document_urls', {
          p_registration_id: data.registrationId
        });

        if (urls && urls.length > 0) {
          const { cedula_front_url, cedula_back_url, selfie_url } = urls[0];
          
          // If all photos exist, skip directly to biometric step (step 3)
          if (cedula_front_url && cedula_back_url && selfie_url) {
            // Also check if oath was already accepted
            if (data.oathAccepted) {
              setStaircaseStep(3); // Go to biometric
            } else {
              // Need to take oath first, then skip photos
              setStaircaseStep(1);
            }
          }
        }
      } catch (error) {
        console.error('Error checking photos:', error);
      } finally {
        setIsCheckingPhotos(false);
      }
    };

    checkExistingPhotos();
  }, [data.registrationId, data.oathAccepted, setStaircaseStep]);

  const handleBack = () => {
    if (staircaseStep > 1) {
      setStaircaseStep(staircaseStep - 1);
    } else {
      setStep('registration');
    }
  };

  // Handler for oath completion - skip photos if they already exist
  const handleOathComplete = async () => {
    if (!data.registrationId) {
      setStaircaseStep(2);
      return;
    }

    try {
      const { data: urls } = await supabase.rpc('get_own_document_urls', {
        p_registration_id: data.registrationId
      });

      if (urls && urls.length > 0) {
        const { cedula_front_url, cedula_back_url, selfie_url } = urls[0];
        
        // If all photos exist, skip to biometric
        if (cedula_front_url && cedula_back_url && selfie_url) {
          toast.success('¡Fotos ya registradas! Pasando a verificación biométrica.');
          setStaircaseStep(3);
          return;
        }
      }
    } catch (error) {
      console.error('Error checking photos:', error);
    }

    // Default: go to photos step
    setStaircaseStep(2);
  };
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-carbon" />
      
      {/* Loading state while checking photos */}
      {isCheckingPhotos && (
        <div className="absolute inset-0 z-50 bg-background flex items-center justify-center">
          <motion.div
            className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
        </div>
      )}

      {/* Header */}
      <motion.header
        className="relative z-10 px-6 py-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {staircaseStep > 1 ? 'Paso anterior' : 'Volver al registro'}
        </Button>

        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-xl font-bold text-foreground">La Escalera de Bronce</h1>
            <p className="text-sm text-muted-foreground">Fase de Registro</p>
          </div>
        </div>

        {/* Progress steps */}
        <div className="flex gap-2">
          {steps.map((step) => (
            <div
              key={step.id}
              className={`flex-1 h-2 rounded-full transition-all duration-500 ${
                step.id < staircaseStep
                  ? 'bg-bronze'
                  : step.id === staircaseStep
                  ? 'bg-primary shadow-neon'
                  : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </motion.header>

      {/* Content */}
      <div className="relative z-10 flex-1 px-6 pb-8">
        <AnimatePresence mode="wait">
          {staircaseStep === 1 && (
            <OathStep key="oath" onComplete={handleOathComplete} />
          )}
          {staircaseStep === 2 && (
            <EvidenceStep key="evidence" onComplete={() => setStaircaseStep(3)} />
          )}
          {staircaseStep === 3 && (
            <BiometricStep key="biometric" onComplete={() => setStaircaseStep(4)} />
          )}
          {staircaseStep === 4 && (
            <ChoiceStep key="choice" onComplete={() => setStep('passport')} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// Peldaño 1: El Juramento
const OathStep = ({ onComplete }: { onComplete: () => void }) => {
  const [isHolding, setIsHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [showSparks, setShowSparks] = useState(false);
  const holdTimer = useRef<NodeJS.Timeout | null>(null);
  const progressTimer = useRef<NodeJS.Timeout | null>(null);
  const { updateData } = useRegistration();

  const startHold = useCallback(() => {
    setIsHolding(true);
    setHoldProgress(0);
    
    const startTime = Date.now();
    const duration = 2000; // 2 seconds
    
    progressTimer.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / duration) * 100, 100);
      setHoldProgress(progress);
      
      if (progress >= 100) {
        if (progressTimer.current) clearInterval(progressTimer.current);
      }
    }, 16);

    holdTimer.current = setTimeout(() => {
      // Success!
      setShowSparks(true);
      
      // Play hammer sound
      const audio = new Audio('/hammer-strike.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {});
      
      // Vibrate if supported
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
      
      updateData({ oathAccepted: true });
      
      setTimeout(() => {
        onComplete();
      }, 1000);
    }, duration);
  }, [updateData, onComplete]);

  const endHold = useCallback(() => {
    setIsHolding(false);
    setHoldProgress(0);
    if (holdTimer.current) clearTimeout(holdTimer.current);
    if (progressTimer.current) clearInterval(progressTimer.current);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="space-y-8"
    >
      {/* Step indicator */}
      <div className="step-bronze step-active p-6 rounded-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Hand className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Peldaño 1: El Juramento</h2>
            <p className="text-sm text-muted-foreground">Código Gladiador</p>
          </div>
        </div>

        <div className="card-industrial p-6 rounded-xl mt-4">
          <p className="text-xl font-bold text-foreground text-center leading-relaxed">
            "MI PALABRA VALE"
          </p>
          <p className="text-muted-foreground text-center mt-4 leading-relaxed">
            Prometo ser serio, subir por mi propio mérito y trabajar por un país justo.
          </p>
        </div>
      </div>

      {/* Hold button */}
      <div className="relative flex flex-col items-center">
        <motion.button
          className="relative w-48 h-48 rounded-full bg-gradient-neon flex items-center justify-center shadow-neon-strong overflow-hidden"
          onMouseDown={startHold}
          onMouseUp={endHold}
          onMouseLeave={endHold}
          onTouchStart={startHold}
          onTouchEnd={endHold}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {/* Progress ring */}
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle
              cx="96"
              cy="96"
              r="88"
              fill="none"
              stroke="rgba(0,0,0,0.3)"
              strokeWidth="8"
            />
            <circle
              cx="96"
              cy="96"
              r="88"
              fill="none"
              stroke="hsl(35 60% 45%)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={553}
              strokeDashoffset={553 - (553 * holdProgress) / 100}
              className="transition-all duration-75"
            />
          </svg>
          
          <div className="relative text-center z-10">
            <Shield className="w-12 h-12 text-primary-foreground mx-auto mb-2" />
            <span className="font-bold text-primary-foreground text-sm">
              {isHolding ? 'MANTÉN...' : '¡ACEPTO EL RETO!'}
            </span>
          </div>
        </motion.button>

        <p className="text-sm text-muted-foreground mt-4">
          Mantén pulsado por 2 segundos
        </p>

        {/* Sparks explosion */}
        {showSparks && (
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(50)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute left-1/2 top-1/2 w-2 h-2 bg-primary rounded-full"
                initial={{ scale: 0, x: 0, y: 0 }}
                animate={{
                  scale: [0, 1, 0],
                  x: (Math.random() - 0.5) * 300,
                  y: (Math.random() - 0.5) * 300,
                }}
                transition={{ duration: 0.8, delay: Math.random() * 0.2 }}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Peldaño 2: Evidencia de Identidad
const EvidenceStep = ({ onComplete }: { onComplete: () => void }) => {
  const [currentPhoto, setCurrentPhoto] = useState<'front' | 'back' | 'selfie'>('front');
  const [photos, setPhotos] = useState<{ front?: string; back?: string; selfie?: string }>({});
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data, updateData } = useRegistration();

  const photoLabels = {
    front: 'Cédula (Frente)',
    back: 'Cédula (Reverso)',
    selfie: 'Selfie de Integridad',
  };

  const handleCapture = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Server-side validation constants
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error('Archivo muy grande. Máximo 10MB.');
      return;
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Solo se permiten imágenes JPG, PNG o WEBP.');
      return;
    }

    setIsUploading(true);
    
    try {
      // Get current authenticated user for secure file path
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        toast.error('Debes iniciar sesión para subir archivos.');
        return;
      }

      const fileExt = file.name.split('.').pop()?.toLowerCase();
      // Validate extension matches allowed types
      if (!fileExt || !['jpg', 'jpeg', 'png', 'webp'].includes(fileExt)) {
        toast.error('Extensión de archivo no válida.');
        return;
      }
      
      // Use user_id in file path for RLS compliance
      const fileName = `${user.id}/${currentPhoto}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('evidencias')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Create signed URL for secure access (1 hour expiry)
      const { data: signedUrlData, error: signedError } = await supabase.storage
        .from('evidencias')
        .createSignedUrl(fileName, 3600);

      if (signedError) throw signedError;

      const url = signedUrlData.signedUrl;
      
      setPhotos(prev => ({ ...prev, [currentPhoto]: url }));
      
      // Update in database - store the file path, not the signed URL
      const columnMap = {
        front: 'cedula_front_url',
        back: 'cedula_back_url',
        selfie: 'selfie_url',
      };
      
      // Store the permanent file reference (path) in the database
      const storagePath = `${fileName}`;
      
      if (data.registrationId) {
        await supabase
          .from('registrations')
          .update({ [columnMap[currentPhoto]]: storagePath })
          .eq('id', data.registrationId);
      }

      // Move to next photo or complete
      if (currentPhoto === 'front') {
        setCurrentPhoto('back');
      } else if (currentPhoto === 'back') {
        setCurrentPhoto('selfie');
      } else {
        updateData({
          cedulaFrontUrl: photos.front,
          cedulaBackUrl: photos.back,
          selfieUrl: url,
        });
        toast.success('¡Evidencia capturada!');
        onComplete();
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Error al subir la foto. Intenta de nuevo.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="space-y-6"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Step indicator */}
      <div className="step-bronze step-active p-6 rounded-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Camera className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Peldaño 2: Evidencia</h2>
            <p className="text-sm text-muted-foreground">Captura tus fotos de verificación</p>
          </div>
        </div>
      </div>

      {/* Photo progress */}
      <div className="flex gap-3">
        {(['front', 'back', 'selfie'] as const).map((type) => (
          <div
            key={type}
            className={`flex-1 p-3 rounded-lg border-2 transition-all ${
              currentPhoto === type
                ? 'border-primary bg-primary/10'
                : photos[type]
                ? 'border-bronze bg-bronze/10'
                : 'border-muted bg-muted/50'
            }`}
          >
            <div className="flex items-center gap-2">
              {photos[type] ? (
                <Check className="w-4 h-4 text-bronze" />
              ) : currentPhoto === type ? (
                <Camera className="w-4 h-4 text-primary" />
              ) : (
                <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/50" />
              )}
              <span className="text-xs font-medium text-foreground">
                {type === 'front' ? 'Frente' : type === 'back' ? 'Reverso' : 'Selfie'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Capture area */}
      <motion.div
        className="card-industrial rounded-xl aspect-[4/3] flex flex-col items-center justify-center p-8"
        key={currentPhoto}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        {photos[currentPhoto] ? (
          <img
            src={photos[currentPhoto]}
            alt={photoLabels[currentPhoto]}
            className="max-h-full max-w-full rounded-lg object-contain"
          />
        ) : (
          <div className="text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto">
              <Camera className="w-10 h-10 text-muted-foreground" />
            </div>
            <div>
              <p className="font-bold text-foreground">{photoLabels[currentPhoto]}</p>
              <p className="text-sm text-muted-foreground">
                {currentPhoto === 'selfie' 
                  ? 'Toma una foto clara de tu rostro'
                  : 'Asegúrate que sea legible'
                }
              </p>
            </div>
          </div>
        )}
      </motion.div>

      {/* Capture button */}
      <Button
        variant="gladiator"
        size="xl"
        className="w-full"
        onClick={handleCapture}
        disabled={isUploading}
      >
        {isUploading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Subiendo...
          </>
        ) : (
          <>
            <Camera className="w-5 h-5" />
            CAPTURAR {photoLabels[currentPhoto].toUpperCase()}
          </>
        )}
      </Button>
    </motion.div>
  );
};

// Peldaño 3: La Recompensa y el Anclaje
const ChoiceStep = ({ onComplete }: { onComplete: () => void }) => {
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const { data, updateData } = useRegistration();

  const areas = [
    { id: 'emprendimiento', label: 'Emprendimiento', icon: '💼', desc: 'Capital semilla y mentoría' },
    { id: 'tecnologia', label: 'Tecnología', icon: '💻', desc: 'Becas y certificaciones' },
    { id: 'deporte', label: 'Deporte', icon: '⚽', desc: 'Equipos y sponsors' },
    { id: 'empleo_tecnico', label: 'Empleo Técnico', icon: '🔧', desc: 'Ofertas laborales' },
  ];

  const handleComplete = async () => {
    if (!selectedArea) {
      toast.error('Selecciona un área de interés');
      return;
    }

    if (data.registrationId) {
      await supabase
        .from('registrations')
        .update({ interest_area: selectedArea as any })
        .eq('id', data.registrationId);
    }

    updateData({ interestArea: selectedArea as any });
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
            <MapPin className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Peldaño 3: La Recompensa</h2>
            <p className="text-sm text-muted-foreground">Elige tu área de interés</p>
          </div>
        </div>
      </div>

      {/* Interest areas */}
      <div className="grid grid-cols-2 gap-4">
        {areas.map((area) => (
          <motion.button
            key={area.id}
            onClick={() => setSelectedArea(area.id)}
            className={`p-4 rounded-xl border-2 transition-all text-left ${
              selectedArea === area.id
                ? 'border-primary bg-primary/10 shadow-neon'
                : 'border-bronze/30 bg-card hover:border-bronze'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="text-3xl block mb-2">{area.icon}</span>
            <p className="font-bold text-foreground text-sm">{area.label}</p>
            <p className="text-xs text-muted-foreground mt-1">{area.desc}</p>
          </motion.button>
        ))}
      </div>

      {/* Important message */}
      <div className="card-industrial p-4 rounded-xl border-l-4 border-primary">
        <p className="text-sm text-muted-foreground">
          <span className="font-bold text-primary">⚠️ El Mensaje:</span> Tu firma física es la llave. 
          Sin firma en papel, no hay recompensa.
        </p>
      </div>

      {/* Botín Explanation Button (va aquí, en lugar del mapa) */}
      <BotinExplanation />

      {/* Continue button */}
      <Button
        variant="gladiator"
        size="xl"
        className="w-full"
        onClick={handleComplete}
        disabled={!selectedArea}
      >
        RECLAMAR MI PASAPORTE
      </Button>
    </motion.div>
  );
};
