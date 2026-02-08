import { motion } from 'framer-motion';
import { useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, CreditCard, Phone, CheckSquare, ArrowRight, Shield, ArrowLeft, MapPin, Briefcase, Building, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRegistration } from '@/hooks/useRegistration';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Dominican Republic provinces
const PROVINCIAS = [
  'Azua', 'Bahoruco', 'Barahona', 'Dajabón', 'Distrito Nacional', 'Duarte',
  'El Seibo', 'Elías Piña', 'Espaillat', 'Hato Mayor', 'Hermanas Mirabal',
  'Independencia', 'La Altagracia', 'La Romana', 'La Vega', 'María Trinidad Sánchez',
  'Monseñor Nouel', 'Monte Cristi', 'Monte Plata', 'Pedernales', 'Peravia',
  'Puerto Plata', 'Samaná', 'San Cristóbal', 'San José de Ocoa', 'San Juan',
  'San Pedro de Macorís', 'Sánchez Ramírez', 'Santiago', 'Santiago Rodríguez',
  'Santo Domingo', 'Valverde'
];

const REGIONES = ['Norte', 'Sur', 'Este', 'Ozama', 'Cibao Central', 'Cibao Norte', 'Cibao Sur', 'Enriquillo', 'Higuamo', 'Valdesia'];

const ZONAS = ['Urbana', 'Rural'];

const FRENTES_SECTORIALES = [
  'Juventud', 'Mujeres', 'Profesionales', 'Empresarios', 'Trabajadores',
  'Campesinos', 'Deportistas', 'Artistas', 'Religiosos', 'Educadores',
  'Salud', 'Transporte', 'Tecnología', 'Veteranos', 'Otro'
];

const registrationSchema = z.object({
  // Personal data
  nombres: z.string().min(2, 'Mínimo 2 caracteres').max(50),
  apellidos: z.string().min(2, 'Mínimo 2 caracteres').max(50),
  apodo: z.string().max(30).optional(),
  cedula: z.string().regex(/^\d{11}$/, 'La cédula debe tener 11 dígitos'),
  
  // Geographic data
  provincia: z.string().min(1, 'Selecciona una provincia'),
  municipio: z.string().min(2, 'Ingresa el municipio'),
  circunscripcion: z.string().optional(),
  distritoMunicipal: z.string().optional(),
  region: z.string().min(1, 'Selecciona una región'),
  zona: z.string().min(1, 'Selecciona una zona'),
  
  // Contact data
  celular: z.string().regex(/^\d{10}$/, 'El celular debe tener 10 dígitos'),
  telefonoResidencial: z.string().regex(/^\d{10}$/, 'Debe tener 10 dígitos').optional().or(z.literal('')),
  telefonoTrabajo: z.string().regex(/^\d{10}$/, 'Debe tener 10 dígitos').optional().or(z.literal('')),
  
  // Address
  calle: z.string().min(3, 'Ingresa la calle'),
  numeroCasa: z.string().optional(),
  sector: z.string().min(2, 'Ingresa el sector'),
  
  // Party data
  categoria: z.enum(['simpatizante', 'militante']),
  frenteSectorial: z.string().optional(),
  ocupacion: z.string().min(2, 'Ingresa tu ocupación'),
  
  // Legal
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
    watch,
  } = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      nombres: '',
      apellidos: '',
      apodo: '',
      cedula: '',
      provincia: '',
      municipio: '',
      circunscripcion: '',
      distritoMunicipal: '',
      region: '',
      zona: '',
      celular: '',
      telefonoResidencial: '',
      telefonoTrabajo: '',
      calle: '',
      numeroCasa: '',
      sector: '',
      categoria: 'simpatizante',
      frenteSectorial: '',
      ocupacion: '',
      legalAccepted: false,
    },
  });

  const onSubmit = async (data: RegistrationFormData) => {
    if (submitLockRef.current) return;
    submitLockRef.current = true;
    setIsSubmitting(true);
    
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        toast.error('Debes iniciar sesión para registrarte.');
        return;
      }

      const urlParams = new URLSearchParams(window.location.search);
      const referredByCode = urlParams.get('ref');

      // Check if user already has a registration
      const { data: existing, error: existingError } = await supabase
        .from('registrations')
        .select('id, full_name, cedula, phone, legal_accepted, qr_code, referral_code')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingError) throw existingError;

      if (existing) {
        const generatedReferralCode = `FIN-${existing.cedula}`;
        updateData({
          fullName: existing.full_name,
          cedula: existing.cedula,
          phone: existing.phone,
          legalAccepted: Boolean(existing.legal_accepted),
          qrCode: existing.qr_code ?? undefined,
          registrationId: existing.id,
          referralCode: generatedReferralCode,
        });
        toast.success('Encontramos tu registro. Continuando…');
        setStep('staircase');
        return;
      }

      // Check if cedula is already used
      const { data: cedulaCheck } = await supabase
        .from('registrations')
        .select('id')
        .eq('cedula', data.cedula)
        .maybeSingle();

      if (cedulaCheck) {
        toast.error('Esta cédula ya está registrada por otro usuario.');
        return;
      }

      const qrData = `FIN-${data.cedula}-${Date.now()}`;
      const fullName = `${data.nombres} ${data.apellidos}`;

      const { data: registration, error } = await supabase
        .from('registrations')
        .insert({
          user_id: user.id,
          full_name: fullName,
          cedula: data.cedula,
          phone: data.celular,
          legal_accepted: data.legalAccepted,
          qr_code: qrData,
          provincia: data.provincia,
          municipio: data.municipio,
          circunscripcion: data.circunscripcion || null,
          distrito_municipal: data.distritoMunicipal || null,
          region: data.region,
          zona: data.zona,
          categoria: data.categoria,
          apellidos: data.apellidos,
          apodo: data.apodo || null,
          telefono_residencial: data.telefonoResidencial || null,
          telefono_trabajo: data.telefonoTrabajo || null,
          calle: data.calle,
          numero_casa: data.numeroCasa || null,
          sector: data.sector,
          frente_sectorial: data.frenteSectorial || null,
          ocupacion: data.ocupacion,
          referred_by: referredByCode || null,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          toast.error('Esta cédula ya está registrada por otro usuario');
          return;
        }
        throw error;
      }

      const generatedReferralCode = `FIN-${data.cedula}`;
      updateData({
        fullName: fullName,
        cedula: data.cedula,
        phone: data.celular,
        legalAccepted: data.legalAccepted,
        qrCode: qrData,
        registrationId: registration.id,
        referralCode: generatedReferralCode,
        referredBy: referredByCode ?? undefined,
      });

      toast.success('¡Registro completado!');
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
      <div className="absolute inset-0 bg-gradient-carbon" />
      
      {/* Header */}
      <motion.header
        className="relative z-10 px-4 py-3 border-b border-border/50"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStep('onboarding')}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Volver
          </Button>
          
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            <span className="font-bold text-foreground">Afiliación FIN</span>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setStep('quick-verify')}
            className="text-muted-foreground hover:text-foreground text-xs"
          >
            ¿Ya afiliado?
          </Button>
        </div>
      </motion.header>

      {/* Form */}
      <motion.div
        className="relative z-10 flex-1 px-4 py-4 overflow-y-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pb-6">
          
          {/* SECTION: Personal Data */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-primary flex items-center gap-2">
              <User className="w-4 h-4" />
              Datos Personales
            </h2>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="nombres" className="text-xs text-muted-foreground">Nombres *</Label>
                <Input
                  id="nombres"
                  placeholder="Juan Carlos"
                  className="bg-card border-border h-10"
                  {...register('nombres')}
                />
                {errors.nombres && <p className="text-xs text-destructive">{errors.nombres.message}</p>}
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="apellidos" className="text-xs text-muted-foreground">Apellidos *</Label>
                <Input
                  id="apellidos"
                  placeholder="Pérez García"
                  className="bg-card border-border h-10"
                  {...register('apellidos')}
                />
                {errors.apellidos && <p className="text-xs text-destructive">{errors.apellidos.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="apodo" className="text-xs text-muted-foreground">Apodo (opcional)</Label>
                <Input
                  id="apodo"
                  placeholder="Juancho"
                  className="bg-card border-border h-10"
                  {...register('apodo')}
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="cedula" className="text-xs text-muted-foreground flex items-center gap-1">
                  <CreditCard className="w-3 h-3" />
                  Cédula *
                </Label>
                <Input
                  id="cedula"
                  placeholder="00112345678"
                  maxLength={11}
                  className="bg-card border-border h-10 font-mono"
                  {...register('cedula')}
                />
                {errors.cedula && <p className="text-xs text-destructive">{errors.cedula.message}</p>}
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="ocupacion" className="text-xs text-muted-foreground flex items-center gap-1">
                <Briefcase className="w-3 h-3" />
                Ocupación *
              </Label>
              <Input
                id="ocupacion"
                placeholder="Ingeniero, Comerciante, etc."
                className="bg-card border-border h-10"
                {...register('ocupacion')}
              />
              {errors.ocupacion && <p className="text-xs text-destructive">{errors.ocupacion.message}</p>}
            </div>
          </section>

          {/* SECTION: Geographic Data */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-primary flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Ubicación Geográfica
            </h2>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Provincia *</Label>
                <Controller
                  name="provincia"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="bg-card border-border h-10">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {PROVINCIAS.map(p => (
                          <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.provincia && <p className="text-xs text-destructive">{errors.provincia.message}</p>}
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="municipio" className="text-xs text-muted-foreground">Municipio *</Label>
                <Input
                  id="municipio"
                  placeholder="Nombre del municipio"
                  className="bg-card border-border h-10"
                  {...register('municipio')}
                />
                {errors.municipio && <p className="text-xs text-destructive">{errors.municipio.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="circunscripcion" className="text-xs text-muted-foreground">Circunscripción</Label>
                <Input
                  id="circunscripcion"
                  placeholder="Ej: 1, 2, 3..."
                  className="bg-card border-border h-10"
                  {...register('circunscripcion')}
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="distritoMunicipal" className="text-xs text-muted-foreground">Distrito Municipal</Label>
                <Input
                  id="distritoMunicipal"
                  placeholder="Opcional"
                  className="bg-card border-border h-10"
                  {...register('distritoMunicipal')}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Región *</Label>
                <Controller
                  name="region"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="bg-card border-border h-10">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {REGIONES.map(r => (
                          <SelectItem key={r} value={r}>{r}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.region && <p className="text-xs text-destructive">{errors.region.message}</p>}
              </div>
              
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Zona *</Label>
                <Controller
                  name="zona"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="bg-card border-border h-10">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {ZONAS.map(z => (
                          <SelectItem key={z} value={z}>{z}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.zona && <p className="text-xs text-destructive">{errors.zona.message}</p>}
              </div>
            </div>
          </section>

          {/* SECTION: Contact */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-primary flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Teléfonos
            </h2>
            
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label htmlFor="celular" className="text-xs text-muted-foreground">Celular *</Label>
                <Input
                  id="celular"
                  placeholder="8091234567"
                  maxLength={10}
                  className="bg-card border-border h-10 font-mono text-sm"
                  {...register('celular')}
                />
                {errors.celular && <p className="text-xs text-destructive">{errors.celular.message}</p>}
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="telefonoResidencial" className="text-xs text-muted-foreground">Residencial</Label>
                <Input
                  id="telefonoResidencial"
                  placeholder="8095551234"
                  maxLength={10}
                  className="bg-card border-border h-10 font-mono text-sm"
                  {...register('telefonoResidencial')}
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="telefonoTrabajo" className="text-xs text-muted-foreground">Trabajo</Label>
                <Input
                  id="telefonoTrabajo"
                  placeholder="8095559876"
                  maxLength={10}
                  className="bg-card border-border h-10 font-mono text-sm"
                  {...register('telefonoTrabajo')}
                />
              </div>
            </div>
          </section>

          {/* SECTION: Address */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-primary flex items-center gap-2">
              <Home className="w-4 h-4" />
              Dirección
            </h2>
            
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2 space-y-1">
                <Label htmlFor="calle" className="text-xs text-muted-foreground">Calle *</Label>
                <Input
                  id="calle"
                  placeholder="Av. Principal"
                  className="bg-card border-border h-10"
                  {...register('calle')}
                />
                {errors.calle && <p className="text-xs text-destructive">{errors.calle.message}</p>}
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="numeroCasa" className="text-xs text-muted-foreground">Número</Label>
                <Input
                  id="numeroCasa"
                  placeholder="#12"
                  className="bg-card border-border h-10"
                  {...register('numeroCasa')}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="sector" className="text-xs text-muted-foreground">Sector *</Label>
              <Input
                id="sector"
                placeholder="Nombre del sector o barrio"
                className="bg-card border-border h-10"
                {...register('sector')}
              />
              {errors.sector && <p className="text-xs text-destructive">{errors.sector.message}</p>}
            </div>
          </section>

          {/* SECTION: Party Affiliation */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-primary flex items-center gap-2">
              <Building className="w-4 h-4" />
              Afiliación Partidaria
            </h2>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Categoría *</Label>
                <Controller
                  name="categoria"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="bg-card border-border h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="simpatizante">Simpatizante</SelectItem>
                        <SelectItem value="militante">Militante</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Frente Sectorial</Label>
                <Controller
                  name="frenteSectorial"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="bg-card border-border h-10">
                        <SelectValue placeholder="Opcional" />
                      </SelectTrigger>
                      <SelectContent>
                        {FRENTES_SECTORIALES.map(f => (
                          <SelectItem key={f} value={f}>{f}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
          </section>

          {/* Legal notice */}
          <motion.div
            className="p-3 bg-muted/30 rounded-lg border border-border"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <p className="text-xs text-muted-foreground leading-relaxed">
              Al registrarte, autorizas al <span className="text-primary font-medium">Frente de Integridad Nacional (FIN)</span> a 
              utilizar tus datos exclusivamente para los fines de registro oficial ante la Junta Central Electoral (JCE), 
              bajo el cumplimiento de la <span className="text-primary">Ley 172-13</span> de Protección de Datos y la 
              <span className="text-primary"> Ley 33-18</span> de Partidos Políticos.
            </p>
          </motion.div>

          {/* Legal acceptance */}
          <div className="flex items-start gap-3 p-3 bg-card rounded-lg border border-border">
            <Controller
              name="legalAccepted"
              control={control}
              render={({ field }) => (
                <Checkbox
                  id="legalAccepted"
                  checked={Boolean(field.value)}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                  className="mt-0.5 border-primary data-[state=checked]:bg-primary"
                />
              )}
            />
            <Label 
              htmlFor="legalAccepted" 
              className="text-sm text-muted-foreground leading-relaxed cursor-pointer"
            >
              <CheckSquare className="w-4 h-4 text-primary inline mr-1" />
              Acepto los términos de protección de datos y autorizo la validación de mi identidad.
            </Label>
          </div>
          {errors.legalAccepted && (
            <p className="text-sm text-destructive">{errors.legalAccepted.message}</p>
          )}

          {/* Submit button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
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
                  COMPLETAR AFILIACIÓN
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </Button>
          </motion.div>
        </form>
      </motion.div>

      {/* Bottom accent */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary" />
    </div>
  );
};
