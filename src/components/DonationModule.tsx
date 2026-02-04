import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Crown, 
  Upload, 
  CheckCircle, 
  CreditCard, 
  Building2, 
  FileText,
  Loader2,
  AlertCircle,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRegistration } from '@/hooks/useRegistration';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Bank account details - editable by administrators
const BANK_DETAILS = {
  banco: 'Banco Popular Dominicano',
  tipoCuenta: 'Cuenta Corriente',
  numeroCuenta: 'XXXX-XXXX-XXXX-XXXX',
  rnc: 'XXX-XXXXX-X',
  titular: 'Frente de Integridad Nacional (FIN)',
};

const DONATION_AMOUNT = 5000;

interface DonationModuleProps {
  onClose: () => void;
  registrationId?: string;
}

export const DonationModule = ({ onClose, registrationId }: DonationModuleProps) => {
  const { data, updateData } = useRegistration();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [step, setStep] = useState<'info' | 'upload' | 'pending'>('info');
  const [cedulaConfirm, setCedulaConfirm] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Server-side validation constants
      const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
      const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

      // Validate file type with stricter check
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError('Solo se permiten imágenes JPG, PNG o WEBP.');
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > MAX_FILE_SIZE) {
        setError('La imagen no debe superar los 10MB');
        return;
      }

      // Validate file extension
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      if (!fileExt || !['jpg', 'jpeg', 'png', 'webp'].includes(fileExt)) {
        setError('Extensión de archivo no válida.');
        return;
      }

      setProofFile(file);
      setError(null);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setProofPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!proofFile || !cedulaConfirm) {
      setError('Debes subir el comprobante y confirmar tu cédula');
      return;
    }

    if (cedulaConfirm !== data.cedula) {
      setError('La cédula ingresada no coincide con tu registro');
      return;
    }

    if (!registrationId) {
      setError('Error: No se encontró tu registro. Por favor, intenta de nuevo.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // 1. Upload proof image to storage
      const fileExt = proofFile.name.split('.').pop();
      const fileName = `donation-proof-${registrationId}-${Date.now()}.${fileExt}`;
      const filePath = `donations/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('evidencias')
        .upload(filePath, proofFile);

      if (uploadError) throw uploadError;

      // 2. Get public URL
      const { data: urlData } = supabase.storage
        .from('evidencias')
        .getPublicUrl(filePath);

      // 3. Create donation record
      const { error: insertError } = await supabase
        .from('donations')
        .insert({
          registration_id: registrationId,
          amount: DONATION_AMOUNT,
          payment_proof_url: urlData.publicUrl,
          cedula_confirmed: cedulaConfirm,
          status: 'pending',
        });

      if (insertError) throw insertError;

      // 4. Update registration status
      const { error: updateError } = await supabase
        .from('registrations')
        .update({ donation_status: 'pending' })
        .eq('id', registrationId);

      if (updateError) throw updateError;

      // 5. Update local state
      updateData({ passportLevel: 'pending_donation' as any });

      toast({
        title: '¡Solicitud enviada!',
        description: 'Tu donación está en proceso de validación.',
      });

      setStep('pending');
    } catch (err: any) {
      console.error('Error submitting donation:', err);
      setError(err.message || 'Error al procesar la donación. Intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md"
      >
        <Card className="border-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
          <CardHeader className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-foreground">Pasaporte Dorado por Donación</CardTitle>
                <CardDescription>Donación al partido de RD$ {DONATION_AMOUNT.toLocaleString()}</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {step === 'info' && (
              <>
                {/* Bank details */}
                <div className="space-y-4 p-4 bg-muted/50 rounded-xl border border-border">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-primary" />
                    Datos Bancarios para Transferencia
                  </h3>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Banco:</span>
                      <span className="font-medium text-foreground">{BANK_DETAILS.banco}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tipo:</span>
                      <span className="font-medium text-foreground">{BANK_DETAILS.tipoCuenta}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Número:</span>
                      <span className="font-mono font-medium text-foreground">{BANK_DETAILS.numeroCuenta}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">RNC:</span>
                      <span className="font-mono font-medium text-foreground">{BANK_DETAILS.rnc}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Titular:</span>
                      <span className="font-medium text-foreground text-right">{BANK_DETAILS.titular}</span>
                    </div>
                  </div>
                </div>

                {/* Amount */}
                <div className="flex items-center justify-between p-4 bg-amber-500/10 rounded-xl border border-amber-500/30">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-amber-500" />
                    <span className="font-medium text-foreground">Monto de la donación:</span>
                  </div>
                  <span className="text-xl font-bold text-amber-500">
                    RD$ {DONATION_AMOUNT.toLocaleString()}
                  </span>
                </div>

                {/* Instructions */}
                <div className="p-4 bg-primary/5 rounded-xl border border-primary/20">
                  <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    Instrucciones
                  </h4>
                  <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                    <li>Realiza la transferencia o depósito directo con los datos indicados</li>
                    <li>Toma una foto o captura de pantalla del comprobante</li>
                    <li>Sube el comprobante en el siguiente paso</li>
                    <li>Espera la validación de nuestro equipo (24-48 horas)</li>
                  </ol>
                </div>

                <Button
                  variant="gladiator"
                  size="lg"
                  className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
                  onClick={() => setStep('upload')}
                >
                  Ya realicé la transferencia
                  <CheckCircle className="w-5 h-5 ml-2" />
                </Button>
              </>
            )}

            {step === 'upload' && (
              <>
                {/* Cedula confirmation */}
                <div className="space-y-2">
                  <Label htmlFor="cedula-confirm" className="text-foreground">
                    Confirma tu Cédula
                  </Label>
                  <Input
                    id="cedula-confirm"
                    type="text"
                    placeholder="Ingresa tu número de cédula"
                    value={cedulaConfirm}
                    onChange={(e) => setCedulaConfirm(e.target.value)}
                    className="bg-background border-border"
                  />
                </div>

                {/* File upload */}
                <div className="space-y-2">
                  <Label className="text-foreground">Comprobante de Pago</Label>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {proofPreview ? (
                    <div className="relative">
                      <img
                        src={proofPreview}
                        alt="Comprobante"
                        className="w-full h-48 object-cover rounded-xl border border-border"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          setProofFile(null);
                          setProofPreview(null);
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full h-32 border-dashed border-2"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="w-8 h-8 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          Subir foto del comprobante
                        </span>
                      </div>
                    </Button>
                  )}
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg text-destructive text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setStep('info')}
                    disabled={isSubmitting}
                  >
                    Atrás
                  </Button>
                  <Button
                    variant="gladiator"
                    className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
                    onClick={handleSubmit}
                    disabled={!proofFile || !cedulaConfirm || isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      'Enviar Solicitud'
                    )}
                  </Button>
                </div>
              </>
            )}

            {step === 'pending' && (
              <div className="text-center space-y-4 py-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-20 h-20 mx-auto rounded-full bg-amber-500/20 flex items-center justify-center"
                >
                  <CheckCircle className="w-10 h-10 text-amber-500" />
                </motion.div>
                
                <div>
                  <h3 className="text-xl font-bold text-foreground">
                    ¡Solicitud Enviada!
                  </h3>
                  <p className="text-muted-foreground mt-2">
                    Tu donación está en proceso de validación.
                  </p>
                </div>

                <div className="p-4 bg-amber-500/10 rounded-xl border border-amber-500/30">
                  <p className="text-sm text-amber-500 font-medium">
                    Estado: Validación de Pago Pendiente
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Recibirás una notificación cuando tu donación sea aprobada.
                  </p>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={onClose}
                >
                  Cerrar
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};
