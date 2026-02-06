import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Check, X, Loader2, RefreshCw, AlertCircle, ScanLine, MapPin, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { extractCedulaFromImage, compareCedulas, preprocessImage } from '@/lib/ocrService';
import { supabase } from '@/integrations/supabase/client';

interface CedulaOCRValidatorProps {
  userCedula: string;
  registrationId?: string;
  onValidationComplete: (isValid: boolean, extractedCedula?: string, provincia?: string) => void;
  onSkip?: () => void;
}

export const CedulaOCRValidator = ({
  userCedula,
  registrationId,
  onValidationComplete,
  onSkip,
}: CedulaOCRValidatorProps) => {
  const [status, setStatus] = useState<'idle' | 'capturing' | 'processing' | 'success' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [extractedCedula, setExtractedCedula] = useState<string | null>(null);
  const [extractedName, setExtractedName] = useState<string | null>(null);
  const [extractedProvincia, setExtractedProvincia] = useState<string | null>(null);
  const [similarity, setSimilarity] = useState<number>(0);
  const [retryCount, setRetryCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCapture = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecciona una imagen');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('La imagen es muy grande. Máximo 10MB.');
      return;
    }

    setStatus('processing');
    setProgress(0);

    try {
      // Preprocess image for better OCR results
      toast.info('Procesando imagen...');
      const preprocessedImage = await preprocessImage(file);

      // Extract text from image
      const result = await extractCedulaFromImage(preprocessedImage, (p) => {
        setProgress(p);
      });

      if (result.success && result.cedula) {
        setExtractedCedula(result.cedula);
        setExtractedName(result.fullName || null);
        setExtractedProvincia(result.provincia || null);

        // Compare with user's cédula (allow 1 digit tolerance for OCR errors)
        const comparison = compareCedulas(result.cedula, userCedula, 1);
        setSimilarity(comparison.similarity);

        if (comparison.match) {
          setStatus('success');
          toast.success('¡Cédula verificada correctamente!');
          
          // Update registration with detected province
          if (registrationId && result.provincia) {
            try {
              await supabase
                .from('registrations')
                .update({ provincia: result.provincia })
                .eq('id', registrationId);
              
              toast.success(`Provincia detectada: ${result.provincia}`);
            } catch (error) {
              console.error('Error updating province:', error);
            }
          }
          
          // Auto-complete after showing success
          setTimeout(() => {
            onValidationComplete(true, result.cedula, result.provincia);
          }, 2000);
        } else {
          setStatus('error');
          
          if (comparison.similarity >= 80) {
            toast.error(`Cédula similar pero no coincide exactamente (${comparison.errors} dígitos diferentes)`);
          } else {
            toast.error('La cédula en la imagen no coincide con la registrada');
          }
        }
      } else {
        setStatus('error');
        setExtractedName(result.fullName || null);
        setExtractedProvincia(result.provincia || null);
        toast.error(result.error || 'No se pudo leer la cédula. Intenta con mejor iluminación.');
      }
    } catch (error) {
      console.error('OCR Processing error:', error);
      setStatus('error');
      toast.error('Error al procesar la imagen. Intenta de nuevo.');
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRetry = () => {
    setStatus('idle');
    setProgress(0);
    setExtractedCedula(null);
    setExtractedName(null);
    setExtractedProvincia(null);
    setSimilarity(0);
    setRetryCount(prev => prev + 1);
  };

  const handleSkip = () => {
    if (onSkip) {
      toast.info('Validación OCR omitida. Se realizará verificación manual.');
      onSkip();
    }
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Header */}
      <div className="step-bronze step-active p-4 rounded-xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <ScanLine className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">Validación de Cédula</h2>
            <p className="text-xs text-muted-foreground">Verificación automática OCR</p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Toma una foto clara del frente de tu cédula para verificar que coincide con tus datos de registro.
        </p>
      </div>

      {/* Status display */}
      <AnimatePresence mode="wait">
        {status === 'idle' && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className="card-industrial p-6 rounded-xl text-center">
              <Camera className="w-16 h-16 text-primary mx-auto mb-4" />
              <p className="text-foreground font-medium mb-2">
                Captura tu cédula
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Asegúrate de que el número sea visible y legible
              </p>

              <div className="space-y-3">
                <Button
                  variant="gladiator"
                  size="lg"
                  className="w-full"
                  onClick={handleCapture}
                >
                  <Camera className="w-5 h-5 mr-2" />
                  Tomar Foto
                </Button>

                {onSkip && retryCount >= 2 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-muted-foreground"
                    onClick={handleSkip}
                  >
                    Omitir validación OCR
                  </Button>
                )}
              </div>
            </div>

            {/* Tips */}
            <div className="bg-muted/30 rounded-xl p-4 space-y-2">
              <p className="text-xs font-medium text-foreground">Consejos para mejor lectura:</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Buena iluminación, sin reflejos</li>
                <li>• Cédula completamente visible</li>
                <li>• Imagen enfocada y nítida</li>
                <li>• Fondo contrastante</li>
              </ul>
            </div>
          </motion.div>
        )}

        {status === 'processing' && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="card-industrial p-8 rounded-xl text-center"
          >
            <div className="relative w-24 h-24 mx-auto mb-6">
              <motion.div
                className="absolute inset-0 rounded-full border-4 border-primary/30"
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              />
              <div className="absolute inset-2 rounded-full bg-primary/10 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
              </div>
            </div>

            <p className="text-foreground font-bold mb-2">Analizando imagen...</p>
            <p className="text-sm text-muted-foreground mb-4">
              Extrayendo datos de tu cédula
            </p>

            {/* Progress bar */}
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">{progress}%</p>
          </motion.div>
        )}

        {status === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="card-industrial p-8 rounded-xl text-center"
          >
            <motion.div
              className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            >
              <Check className="w-12 h-12 text-green-500" />
            </motion.div>

            <p className="text-foreground font-bold text-lg mb-2">¡Cédula Verificada!</p>
            <p className="text-sm text-muted-foreground mb-4">
              Tu identidad ha sido confirmada
            </p>

            <div className="space-y-3">
              {extractedCedula && (
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Cédula detectada:</p>
                  <p className="font-mono text-foreground font-bold">
                    {extractedCedula.replace(/(\d{3})(\d{7})(\d{1})/, '$1-$2-$3')}
                  </p>
                </div>
              )}
              
              {extractedName && (
                <div className="bg-muted/30 rounded-lg p-3 flex items-center gap-2">
                  <User className="w-4 h-4 text-primary shrink-0" />
                  <div className="text-left">
                    <p className="text-xs text-muted-foreground">Nombre detectado:</p>
                    <p className="text-sm text-foreground font-medium">{extractedName}</p>
                  </div>
                </div>
              )}
              
              {extractedProvincia && (
                <div className="bg-primary/10 rounded-lg p-3 flex items-center gap-2 border border-primary/30">
                  <MapPin className="w-4 h-4 text-primary shrink-0" />
                  <div className="text-left">
                    <p className="text-xs text-muted-foreground">Provincia detectada:</p>
                    <p className="text-sm text-primary font-bold">{extractedProvincia}</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {status === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="space-y-4"
          >
            <div className="card-industrial p-8 rounded-xl text-center">
              <motion.div
                className="w-24 h-24 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-6"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              >
                <X className="w-12 h-12 text-destructive" />
              </motion.div>

              <p className="text-foreground font-bold text-lg mb-2">Verificación Fallida</p>
              
              {extractedCedula ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    La cédula detectada no coincide con la registrada
                  </p>
                  
                  <div className="grid grid-cols-2 gap-3 text-left">
                    <div className="bg-muted/30 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">Registrada:</p>
                      <p className="font-mono text-foreground text-sm">
                        {userCedula.replace(/(\d{3})(\d{7})(\d{1})/, '$1-$2-$3')}
                      </p>
                    </div>
                    <div className="bg-destructive/10 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">Detectada:</p>
                      <p className="font-mono text-foreground text-sm">
                        {extractedCedula.replace(/(\d{3})(\d{7})(\d{1})/, '$1-$2-$3')}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Similitud: {similarity.toFixed(0)}%
                  </p>
                  
                  {/* Show extracted data even on error */}
                  {(extractedName || extractedProvincia) && (
                    <div className="border-t border-border pt-3 mt-3 space-y-2">
                      <p className="text-xs text-muted-foreground">Otros datos detectados:</p>
                      {extractedName && (
                        <div className="flex items-center gap-2 text-xs">
                          <User className="w-3 h-3 text-muted-foreground" />
                          <span className="text-foreground">{extractedName}</span>
                        </div>
                      )}
                      {extractedProvincia && (
                        <div className="flex items-center gap-2 text-xs">
                          <MapPin className="w-3 h-3 text-muted-foreground" />
                          <span className="text-foreground">{extractedProvincia}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No se pudo leer el número de cédula. Intenta con mejor iluminación.
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleRetry}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reintentar
              </Button>

              {onSkip && retryCount >= 1 && (
                <Button
                  variant="ghost"
                  className="flex-1 text-muted-foreground"
                  onClick={handleSkip}
                >
                  Omitir
                </Button>
              )}
            </div>

            {/* Warning for multiple failures */}
            {retryCount >= 2 && (
              <div className="flex items-start gap-2 p-3 bg-amber-500/10 rounded-lg">
                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  Si continúas teniendo problemas, puedes omitir esta validación. 
                  Un moderador verificará tu cédula manualmente.
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
