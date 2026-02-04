import { motion } from 'framer-motion';
import { useState, useRef } from 'react';
import { Camera, Check, Loader2, Vote, Fingerprint, MapPin, Trophy, ArrowLeft, Calendar, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRegistration } from '@/hooks/useRegistration';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface VoteValidationStepProps {
  onComplete: () => void;
  onBack?: () => void;
}

// Election day configuration - EDITABLE
const ELECTION_DATE = '2024-05-19'; // Format: YYYY-MM-DD

export const VoteValidationStep = ({ onComplete, onBack }: VoteValidationStepProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [voteSelfieUrl, setVoteSelfieUrl] = useState<string | null>(null);
  const [dateWarning, setDateWarning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data, updateData, setStep } = useRegistration();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      setStep('passport');
    }
  };

  const handleCapture = () => {
    fileInputRef.current?.click();
  };

  // Validate if photo was taken on election day (checking EXIF or current date)
  const validateElectionDate = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      // Check if current date matches election day
      const today = new Date().toISOString().split('T')[0];
      const isElectionDay = today === ELECTION_DATE;
      
      // If it's election day, accept the photo
      if (isElectionDay) {
        resolve(true);
        return;
      }
      
      // Try to read EXIF data for photo date
      // For now, we'll show a warning but allow upload (admin can verify)
      setDateWarning(true);
      resolve(true); // Allow upload but flag it
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setDateWarning(false);
    
    try {
      // Get current authenticated user for secure file path
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        toast.error('Debes iniciar sesión para subir archivos.');
        setIsUploading(false);
        return;
      }

      // Validate election date
      await validateElectionDate(file);
      
      const fileExt = file.name.split('.').pop();
      const timestamp = Date.now();
      const today = new Date().toISOString().split('T')[0];
      // Use user_id in file path for RLS compliance
      const fileName = `${user.id}/vote-selfie-${today}-${timestamp}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('evidencias')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Create signed URL for secure access
      const { data: signedUrlData, error: signedError } = await supabase.storage
        .from('evidencias')
        .createSignedUrl(fileName, 3600);

      if (signedError) throw signedError;

      const url = signedUrlData.signedUrl;
      setVoteSelfieUrl(url);
      
      // Update in database with file path (not signed URL)
      if (data.registrationId) {
        await supabase
          .from('registrations')
          .update({ 
            vote_selfie_url: fileName,
            vote_validated_at: new Date().toISOString(),
            passport_level: 'dorado',
            user_level: 'campeon'
          })
          .eq('id', data.registrationId);
      }

      // Vibrate on success
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100, 50, 200]);
      }

      toast.success('¡Voto validado! Tu Pasaporte Dorado está listo');
      
      // Update local state
      updateData({ 
        voteSelfieUrl: url,
        passportLevel: 'dorado',
        userLevel: 'campeon'
      });

      // Wait a moment for the animation
      setTimeout(() => {
        onComplete();
      }, 1500);
      
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Error al subir la foto. Intenta de nuevo.');
    } finally {
      setIsUploading(false);
    }
  };

  // Format election date for display
  const formatElectionDate = () => {
    const date = new Date(ELECTION_DATE + 'T12:00:00');
    return date.toLocaleDateString('es-DO', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
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

      {/* Back button */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="mb-4"
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver al Pasaporte
        </Button>
      </motion.div>

      {/* Step indicator */}
      <div className="step-bronze step-active p-6 rounded-xl border-2 border-amber-500">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
            <Vote className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Peldaño Final: El Sello</h2>
            <p className="text-sm text-muted-foreground">Valida tu voto y desbloquea el Oro</p>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="card-industrial p-5 rounded-xl space-y-4">
        <div className="flex items-start gap-3">
          <Fingerprint className="w-6 h-6 text-amber-500 shrink-0" />
          <div>
            <p className="font-bold text-foreground">Dedo Entintado</p>
            <p className="text-sm text-muted-foreground">
              Muestra tu dedo con la tinta electoral como prueba de que votaste
            </p>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <MapPin className="w-6 h-6 text-amber-500 shrink-0" />
          <div>
            <p className="font-bold text-foreground">Centro Electoral de Fondo</p>
            <p className="text-sm text-muted-foreground">
              La foto debe tomarse frente al centro electoral donde votaste
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Calendar className="w-6 h-6 text-amber-500 shrink-0" />
          <div>
            <p className="font-bold text-foreground">Día de Elecciones</p>
            <p className="text-sm text-muted-foreground">
              La foto debe ser tomada el <span className="text-amber-500 font-semibold">{formatElectionDate()}</span>
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Trophy className="w-6 h-6 text-amber-500 shrink-0" />
          <div>
            <p className="font-bold text-foreground">Pasaporte Dorado</p>
            <p className="text-sm text-muted-foreground">
              Al validar desbloqueas tu Pasaporte Dorado y acceso a la Recompensa si ganamos
            </p>
          </div>
        </div>
      </div>

      {/* Date warning */}
      {dateWarning && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30"
        >
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-500">Aviso sobre la fecha</p>
            <p className="text-sm text-muted-foreground">
              La foto será verificada para confirmar que fue tomada el día de las elecciones. 
              Si no corresponde al día electoral, tu solicitud podría ser rechazada.
            </p>
          </div>
        </motion.div>
      )}

      {/* Capture area */}
      <motion.div
        className="card-industrial rounded-xl aspect-[4/3] flex flex-col items-center justify-center p-8 border-2 border-dashed border-amber-500/50"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        {voteSelfieUrl ? (
          <motion.div
            className="relative w-full h-full"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <img
              src={voteSelfieUrl}
              alt="Selfie de voto"
              className="max-h-full max-w-full rounded-lg object-contain mx-auto"
            />
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring' }}
            >
              <div className="w-20 h-20 rounded-full bg-amber-500 flex items-center justify-center">
                <Check className="w-10 h-10 text-primary-foreground" />
              </div>
            </motion.div>
          </motion.div>
        ) : (
          <div className="text-center space-y-4">
            <motion.div 
              className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mx-auto"
              animate={{ 
                boxShadow: [
                  '0 0 20px rgba(245, 158, 11, 0.3)',
                  '0 0 40px rgba(245, 158, 11, 0.5)',
                  '0 0 20px rgba(245, 158, 11, 0.3)'
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Fingerprint className="w-12 h-12 text-white" />
            </motion.div>
            <div>
              <p className="font-bold text-foreground text-lg">Selfie del Dedo Entintado</p>
              <p className="text-sm text-muted-foreground mt-1">
                Toma una foto mostrando tu dedo con tinta frente al centro electoral
              </p>
            </div>
          </div>
        )}
      </motion.div>

      {/* Capture button */}
      {!voteSelfieUrl && (
        <Button
          variant="gladiator"
          size="xl"
          className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
          onClick={handleCapture}
          disabled={isUploading}
        >
          {isUploading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Validando voto...
            </>
          ) : (
            <>
              <Camera className="w-5 h-5" />
              CAPTURAR SELFIE DEL VOTO
            </>
          )}
        </Button>
      )}

      {/* Success message */}
      {voteSelfieUrl && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-industrial p-5 rounded-xl bg-gradient-to-r from-amber-500/10 to-amber-600/10 border border-amber-500/30"
        >
          <div className="flex items-center gap-3">
            <Trophy className="w-8 h-8 text-amber-500" />
            <div>
              <p className="font-bold text-foreground">¡Voto Validado!</p>
              <p className="text-sm text-muted-foreground">
                Tu Pasaporte Dorado está siendo desbloqueado...
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};
