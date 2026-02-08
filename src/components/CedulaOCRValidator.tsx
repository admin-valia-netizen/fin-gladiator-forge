import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Check, X, Loader2, RefreshCw, AlertCircle, ScanLine, MapPin, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { extractCedulaFromImage, compareCedulas, preprocessImage } from '@/lib/ocrService';
import { supabase } from '@/integrations/supabase/client';
import { createWorker } from 'tesseract.js';

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
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedCedula, setExtractedCedula] = useState<string | null>(null);
  const [extractedName, setExtractedName] = useState<string | null>(null);
  const [extractedProvincia, setExtractedProvincia] = useState<string | null>(null);
  const [similarity, setSimilarity] = useState<number>(0);
  const [retryCount, setRetryCount] = useState(0);
  const [extractedData, setExtractedData] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCapture = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validación del archivo
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
    setIsProcessing(true);

    try {
      // Preprocesamiento de imagen para el radar OCR
      toast.info('Procesando imagen...');
      const preprocessedImage = await preprocessImage(file);
      
      // Extracción de datos del motor principal
      const result = await extractCedulaFromImage(preprocessedImage, (p) => {
        setProgress(p);
      });

      if (result.success && result.cedula) {
        setExtractedCedula(result.cedula);
        setExtractedName(result.fullName || null);
        setExtractedProvincia(result.provincia || null);

        // Comparación con la cédula del Gladiador
        const comparison = compareCedulas(result.cedula, userCedula, 1);
        setSimilarity(comparison.similarity);

        if (comparison.match) {
          setStatus('success');
          toast.success('¡Cédula verificada correctamente!');

          // Actualizamos la provincia en la base de datos de FIN
          if (registrationId && result.provincia) {
            try {
              await supabase
                .from('registrations')
                .update({ provincia: result.provincia })
                .eq('id', registrationId);
              toast.success(`Provincia detectada: ${result.provincia}`);
            } catch (error) {
              console.error('Error al actualizar provincia:', error);
            }
          }

          // Completado automático tras éxito
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

      // Motor secundario Tesseract para blindaje de datos local
      const worker = await createWorker('spa');
      const { data: { text } } = await worker.recognize(file);
      await worker.terminate();
      setExtractedData(text);

    } catch (error) {
      console.error('OCR Processing error:', error);
      setStatus('error');
      toast.error('Error al procesar la imagen. Intenta de nuevo.');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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
      toast.info('Validación OCR omitida. Se requerirá verificación manual.');
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

      <div className="p-6 bg-slate-900 text-white rounded-xl shadow-2xl border border-blue-500">
        <h3 className="text-lg font-bold mb-4">Escaneo de Cédula (Blindaje Local)</h3>
        
        {/* Encabezado de estado */}
        <div className="step-bronze step-active p-4 rounded-xl mb-4">
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
            Toma una foto clara del frente de tu cédula para verificar que coincide con tus datos.
          </p>
        </div>

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
                <p className="text-foreground font-medium mb-2">Captura tu cédula</p>
                <div className="space-y-3">
                  <Button variant="gladiator" size="lg" className="w-full" onClick={handleCapture}>
                    <Camera className="w-5 h-5 mr-2" /> Tomar Foto de la Cédula
                  </Button>
                  {onSkip && retryCount >= 1 && (
                    <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={handleSkip}>
                      Omitir validación OCR
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {status === 'processing' && (
            <motion.div
              key="processing"
              className="card-industrial p-8 rounded-xl text-center"
            >
              <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
              <p className="text-foreground font-bold mb-2">Analizando imagen... {progress}%</p>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden mt-4">
                <motion.div
                  className="h-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                />
              </div>
            </motion.div>
          )}

          {status === 'success' && (
            <motion.div
              key="success"
              className="card-industrial p-8 rounded-xl text-center"
            >
              <Check className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <p className="text-foreground font-bold text-lg mb-2">¡Cédula Verificada!</p>
              <div className="space-y-3 mt-4">
                {extractedCedula && (
                  <div className="bg-muted/30 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">Cédula detectada:</p>
                    <p className="font-mono text-foreground font-bold">{extractedCedula}</p>
                  </div>
                )}
                {extractedProvincia && (
                  <div className="bg-primary/10 rounded-lg p-3 flex items-center gap-2 border border-primary/30">
                    <MapPin className="w-4 h-4 text-primary shrink-0" />
                    <p className="text-sm text-primary font-bold">{extractedProvincia}</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {status === 'error' && (
            <motion.div
              key="error"
              className="space-y-4"
            >
              <div className="card-industrial p-8 rounded-xl text-center">
                <X className="w-12 h-12 text-destructive mx-auto mb-4" />
                <p className="text-foreground font-bold text-lg mb-2">Verificación Fallida</p>
                <Button variant="outline" className="w-full mt-4" onClick={handleRetry}>
                  <RefreshCw className="w-4 h-4 mr-2" /> Reintentar
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {extractedData && (
          <div className="mt-4 p-3 bg-black rounded border border-green-500">
            <p className="text-xs text-green-400 font-bold">Datos brutos procesados:</p>
            <pre className="text-[10px] whitespace-pre-wrap mt-2">{extractedData}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default CedulaOCRValidator;
