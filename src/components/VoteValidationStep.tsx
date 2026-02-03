import { motion } from 'framer-motion';
import { useState, useRef } from 'react';
import { Camera, Check, Loader2, Vote, Fingerprint, MapPin, Trophy, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRegistration } from '@/hooks/useRegistration';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface VoteValidationStepProps {
  onComplete: () => void;
  onBack?: () => void;
}

export const VoteValidationStep = ({ onComplete, onBack }: VoteValidationStepProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [voteSelfieUrl, setVoteSelfieUrl] = useState<string | null>(null);
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${data.cedula}/vote-selfie-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('evidencias')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('evidencias')
        .getPublicUrl(fileName);

      const url = urlData.publicUrl;
      setVoteSelfieUrl(url);
      
      // Update in database
      if (data.registrationId) {
        await supabase
          .from('registrations')
          .update({ 
            vote_selfie_url: url,
            vote_validated_at: new Date().toISOString(),
            passport_level: 'dorado'
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
        passportLevel: 'dorado'
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
            <p className="font-bold text-foreground">Centro Electoral</p>
            <p className="text-sm text-muted-foreground">
              La foto debe tomarse frente al centro electoral donde votaste
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
