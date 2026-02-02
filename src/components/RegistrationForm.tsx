import { motion } from 'framer-motion';
import { useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, CreditCard, Phone, CheckSquare, ArrowRight, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useRegistration } from '@/hooks/useRegistration';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const registrationSchema = z.object({
  fullName: z.string().min(3, 'El nombre debe tener al menos 3 caracteres').max(100),
  cedula: z.string().regex(/^\d{11}$/, 'La cédula debe tener 11 dígitos'),
  phone: z.string().regex(/^\d{10}$/, 'El teléfono debe tener 10 dígitos'),
  legalAccepted: z.boolean().refine(val => val === true, 'Debes aceptar los términos legales'),
});

type RegistrationFormData = z.infer<typeof registrationSchema>;

export const RegistrationForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitLockRef = useRef(false);
  const { updateData, setStep } = useRegistration();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      fullName: '',
      cedula: '',
      phone: '',
      legalAccepted: false,
    },
  });

  const onSubmit = async (data: RegistrationFormData) => {
    if (submitLockRef.current) return;
    submitLockRef.current = true;
    setIsSubmitting(true);
    
    try {
      // Check if user has a referral code in URL
      const urlParams = new URLSearchParams(window.location.search);
      const referredByCode = urlParams.get('ref');

      // DB-first check: if the user already registered (same cedula), resume instead of blocking.
      const { data: existing, error: existingError } = await supabase
        .from('registrations')
        .select('id, full_name, cedula, phone, legal_accepted, qr_code, referral_code')
        .eq('cedula', data.cedula)
        .maybeSingle();

      if (existingError) throw existingError;

      if (existing) {
        // Basic protection: require same phone to continue.
        if (existing.phone !== data.phone) {
          toast.error('Esta cédula ya está registrada con otro teléfono.');
          return;
        }

        updateData({
          fullName: existing.full_name,
          cedula: existing.cedula,
          phone: existing.phone,
          legalAccepted: Boolean(existing.legal_accepted),
          qrCode: existing.qr_code ?? undefined,
          registrationId: existing.id,
          referralCode: existing.referral_code ?? undefined,
        });

        toast.success('Encontramos tu registro. Continuando…');
        setStep('staircase');
        return;
      }

      // Generate QR code data
      const qrData = `FIN-${data.cedula}-${Date.now()}`;
      
      // Save to Supabase (with optional referral)
      const insertData: any = {
        full_name: data.fullName,
        cedula: data.cedula,
        phone: data.phone,
        legal_accepted: data.legalAccepted,
        qr_code: qrData,
      };

      // Add referral code if user was referred
      if (referredByCode) {
        insertData.referred_by = referredByCode;
      }

      const { data: registration, error } = await supabase
        .from('registrations')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        // Race-safe fallback: if insert failed due to duplicate, fetch and resume.
        if (error.code === '23505') {
          const { data: dupe, error: dupeError } = await supabase
            .from('registrations')
            .select('id, full_name, cedula, phone, legal_accepted, qr_code, referral_code')
            .eq('cedula', data.cedula)
            .maybeSingle();

          if (dupeError) throw dupeError;

          if (dupe && dupe.phone === data.phone) {
            updateData({
              fullName: dupe.full_name,
              cedula: dupe.cedula,
              phone: dupe.phone,
              legalAccepted: Boolean(dupe.legal_accepted),
              qrCode: dupe.qr_code ?? undefined,
              registrationId: dupe.id,
              referralCode: dupe.referral_code ?? undefined,
            });
            toast.success('Registro ya existente. Continuando…');
            setStep('staircase');
            return;
          }

          toast.error('Esta cédula ya está registrada');
          return;
        }

        throw error;
      }

      // Update local state
      updateData({
        fullName: data.fullName,
        cedula: data.cedula,
        phone: data.phone,
        legalAccepted: data.legalAccepted,
        qrCode: qrData,
        registrationId: registration.id,
        referralCode: registration.referral_code ?? undefined,
        referredBy: referredByCode ?? undefined,
      });

      toast.success('¡Registro inicial completado!');
      setStep('staircase');
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Error al registrar. Intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
      submitLockRef.current = false;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-carbon" />
      
      {/* Header */}
      <motion.header
        className="relative z-10 px-6 py-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-xl font-bold text-foreground">Registro de Integridad</h1>
            <p className="text-sm text-muted-foreground">Únete a los Gladiadores de FIN</p>
          </div>
        </div>
      </motion.header>

      {/* Form */}
      <motion.div
        className="relative z-10 flex-1 px-6 pb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="fullName" className="flex items-center gap-2 text-foreground">
              <User className="w-4 h-4 text-bronze" />
              Nombre Completo
            </Label>
            <Input
              id="fullName"
              placeholder="Juan Carlos Pérez García"
              className="bg-card border-bronze/30 focus:border-primary h-12"
              {...register('fullName')}
            />
            {errors.fullName && (
              <p className="text-sm text-destructive">{errors.fullName.message}</p>
            )}
          </div>

          {/* Cedula */}
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

          {/* Phone */}
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

          {/* Legal notice */}
          <motion.div
            className="p-4 bg-muted/30 rounded-xl border border-bronze/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
          >
            <p className="text-xs text-muted-foreground leading-relaxed">
              Al registrarte, autorizas al <span className="text-bronze font-medium">Frente de Integridad Nacional (FIN)</span> a 
              utilizar tus datos exclusivamente para los fines de registro oficial ante la Junta Central Electoral (JCE), 
              bajo el cumplimiento de la <span className="text-bronze">Ley 172-13</span> de Protección de Datos y la 
              <span className="text-bronze"> Ley 33-18</span> de Partidos Políticos. Tu información está cifrada y es 100% segura.
            </p>
          </motion.div>

          {/* Legal acceptance */}
          <motion.div 
            className="card-industrial p-4 rounded-xl space-y-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-start gap-3">
              <Controller
                name="legalAccepted"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id="legalAccepted"
                    checked={Boolean(field.value)}
                    onCheckedChange={(checked) => field.onChange(checked === true)}
                    className="mt-1 border-bronze data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                )}
              />
              <Label 
                htmlFor="legalAccepted" 
                className="text-sm text-muted-foreground leading-relaxed cursor-pointer"
              >
                <CheckSquare className="w-4 h-4 text-bronze inline mr-2" />
                Acepto los términos de protección de datos y que mi identidad sea validada para fines de registro oficial en el partido FIN.
              </Label>
            </div>
            {errors.legalAccepted && (
              <p className="text-sm text-destructive">{errors.legalAccepted.message}</p>
            )}
          </motion.div>

          {/* Submit button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Button
              type="submit"
              variant="gladiator"
              size="xl"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <motion.div
                  className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
              ) : (
                <>
                  INICIAR LA ESCALERA
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </Button>
          </motion.div>
        </form>
      </motion.div>

      {/* Bottom bronze accent */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-bronze" />
    </div>
  );
};
