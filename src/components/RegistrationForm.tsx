import { motion } from 'framer-motion';
import { useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, CreditCard, Phone, CheckSquare, ArrowRight, ArrowLeft, MapPin, Briefcase, Home, Users, Mail } from 'lucide-react';
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
  'Salud', 'Transporte', 'Tecnología', 'Veteranos', 'Ninguno', 'Otro'
];

const registrationSchema = z.object({
  // UBICACIÓN
  provincia: z.string().min(1, 'Requerido'),
  municipio: z.string().min(2, 'Requerido'),
  circunscripcion: z.string().optional(),
  distritoMunicipal: z.string().optional(),
  region: z.string().min(1, 'Requerido'),
  zona: z.string().min(1, 'Requerido'),
  
  // CATEGORÍA
  categoria: z.enum(['simpatizante', 'militante']),
  
  // REFERIDOR
  referidorCedula: z.string().regex(/^\d{11}$/, 'Debe tener 11 dígitos').optional().or(z.literal('')),
  referidorNombre: z.string().max(100).optional(),
  referidorTelefono: z.string().regex(/^\d{10}$/, 'Debe tener 10 dígitos').optional().or(z.literal('')),
  
  // DATOS PERSONALES
  cedula: z.string().regex(/^\d{11}$/, 'La cédula debe tener 11 dígitos'),
  nombres: z.string().min(2, 'Mínimo 2 caracteres').max(50),
  apellidos: z.string().min(2, 'Mínimo 2 caracteres').max(50),
  apodo: z.string().max(30).optional(),
  celular: z.string().regex(/^\d{10}$/, 'Debe tener 10 dígitos'),
  telefonoResidencial: z.string().regex(/^\d{10}$/, 'Debe tener 10 dígitos').optional().or(z.literal('')),
  telefonoTrabajo: z.string().regex(/^\d{10}$/, 'Debe tener 10 dígitos').optional().or(z.literal('')),
  telefonoOtro: z.string().regex(/^\d{10}$/, 'Debe tener 10 dígitos').optional().or(z.literal('')),
  
  // DIRECCIÓN
  calle: z.string().min(2, 'Requerido'),
  numero: z.string().optional(),
  residencialNombre: z.string().optional(),
  barrioSector: z.string().min(2, 'Requerido'),
  parajeSeccion: z.string().optional(),
  ciudad: z.string().min(2, 'Requerido'),
  correo: z.string().email('Email inválido').optional().or(z.literal('')),
  
  // PERFIL
  frenteSectorial: z.string().optional(),
  ocupacion: z.string().min(2, 'Requerido'),
  
  // LEGAL
  legalAccepted: z.boolean().refine(val => val === true, 'Debes aceptar los términos'),
});

type RegistrationFormData = z.infer<typeof registrationSchema>;

// Section Header Component with FIN colors
const SectionHeader = ({ icon: Icon, title, color = 'blue' }: { icon: React.ElementType; title: string; color?: 'blue' | 'orange' }) => (
  <div className={`flex items-center gap-2 py-2 px-3 rounded-md mb-3 ${
    color === 'blue' 
      ? 'bg-blue-600 text-white' 
      : 'bg-orange-500 text-white'
  }`}>
    <Icon className="w-4 h-4" />
    <span className="text-sm font-bold uppercase tracking-wide">{title}</span>
  </div>
);

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
      provincia: '',
      municipio: '',
      circunscripcion: '',
      distritoMunicipal: '',
      region: '',
      zona: '',
      categoria: 'simpatizante',
      referidorCedula: '',
      referidorNombre: '',
      referidorTelefono: '',
      cedula: '',
      nombres: '',
      apellidos: '',
      apodo: '',
      celular: '',
      telefonoResidencial: '',
      telefonoTrabajo: '',
      telefonoOtro: '',
      calle: '',
      numero: '',
      residencialNombre: '',
      barrioSector: '',
      parajeSeccion: '',
      ciudad: '',
      correo: '',
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

      // Check existing registration
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

      // Check duplicate cedula
      const { data: cedulaCheck } = await supabase
        .from('registrations')
        .select('id')
        .eq('cedula', data.cedula)
        .maybeSingle();

      if (cedulaCheck) {
        toast.error('Esta cédula ya está registrada.');
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
          // Ubicación
          provincia: data.provincia,
          municipio: data.municipio,
          circunscripcion: data.circunscripcion || null,
          distrito_municipal: data.distritoMunicipal || null,
          region: data.region,
          zona: data.zona,
          // Categoría
          categoria: data.categoria,
          // Referidor
          referidor_cedula: data.referidorCedula || null,
          referidor_nombre: data.referidorNombre || null,
          referidor_telefono: data.referidorTelefono || null,
          // Datos personales
          apellidos: data.apellidos,
          apodo: data.apodo || null,
          telefono_residencial: data.telefonoResidencial || null,
          telefono_trabajo: data.telefonoTrabajo || null,
          telefono_otro: data.telefonoOtro || null,
          // Dirección
          calle: data.calle,
          numero_casa: data.numero || null,
          residencial_nombre: data.residencialNombre || null,
          barrio_sector: data.barrioSector || null,
          sector: data.barrioSector,
          paraje_seccion: data.parajeSeccion || null,
          ciudad: data.ciudad,
          correo: data.correo || null,
          // Perfil
          frente_sectorial: data.frenteSectorial || null,
          ocupacion: data.ocupacion,
          // Referral
          referred_by: referredByCode || null,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          toast.error('Esta cédula ya está registrada.');
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

      toast.success('¡Afiliación completada!');
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
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Header with FIN colors */}
      <motion.header
        className="sticky top-0 z-20 bg-blue-700 text-white px-4 py-3 shadow-lg"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStep('onboarding')}
            className="text-white/80 hover:text-white hover:bg-blue-600"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Volver
          </Button>
          
          <div className="text-center">
            <h1 className="font-bold text-lg">FORMULARIO DE AFILIACIÓN</h1>
            <p className="text-xs text-blue-200">Frente de Integridad Nacional</p>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setStep('quick-verify')}
            className="text-white/80 hover:text-white hover:bg-blue-600 text-xs"
          >
            ¿Ya afiliado?
          </Button>
        </div>
      </motion.header>

      {/* Form */}
      <motion.div
        className="flex-1 px-4 py-4 overflow-y-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pb-6">
          
          {/* ========== UBICACIÓN ========== */}
          <section>
            <SectionHeader icon={MapPin} title="Ubicación" color="blue" />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-slate-400">Provincia *</Label>
                <Controller
                  name="provincia"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="bg-slate-800 border-slate-600 text-white h-9 text-sm">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {PROVINCIAS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.provincia && <p className="text-xs text-red-400">{errors.provincia.message}</p>}
              </div>
              
              <div>
                <Label className="text-xs text-slate-400">Municipio *</Label>
                <Input {...register('municipio')} placeholder="Municipio" className="bg-slate-800 border-slate-600 text-white h-9 text-sm" />
                {errors.municipio && <p className="text-xs text-red-400">{errors.municipio.message}</p>}
              </div>
              
              <div>
                <Label className="text-xs text-slate-400">CIRC</Label>
                <Input {...register('circunscripcion')} placeholder="Circ." className="bg-slate-800 border-slate-600 text-white h-9 text-sm" />
              </div>
              
              <div>
                <Label className="text-xs text-slate-400">Dist. Municipal</Label>
                <Input {...register('distritoMunicipal')} placeholder="Distrito" className="bg-slate-800 border-slate-600 text-white h-9 text-sm" />
              </div>
              
              <div>
                <Label className="text-xs text-slate-400">Región *</Label>
                <Controller
                  name="region"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="bg-slate-800 border-slate-600 text-white h-9 text-sm">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {REGIONES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.region && <p className="text-xs text-red-400">{errors.region.message}</p>}
              </div>
              
              <div>
                <Label className="text-xs text-slate-400">Zona *</Label>
                <Controller
                  name="zona"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="bg-slate-800 border-slate-600 text-white h-9 text-sm">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {ZONAS.map(z => <SelectItem key={z} value={z}>{z}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.zona && <p className="text-xs text-red-400">{errors.zona.message}</p>}
              </div>
            </div>
          </section>

          {/* ========== CATEGORÍA ========== */}
          <section>
            <SectionHeader icon={Users} title="Categoría" color="orange" />
            <Controller
              name="categoria"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="bg-slate-800 border-slate-600 text-white h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="simpatizante">Simpatizante</SelectItem>
                    <SelectItem value="militante">Militante</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </section>

          {/* ========== REFERIDOR ========== */}
          <section>
            <SectionHeader icon={Users} title="Referidor" color="blue" />
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs text-slate-400">Cédula</Label>
                <Input {...register('referidorCedula')} placeholder="00000000000" maxLength={11} className="bg-slate-800 border-slate-600 text-white h-9 text-sm font-mono" />
              </div>
              <div>
                <Label className="text-xs text-slate-400">Nombre Completo</Label>
                <Input {...register('referidorNombre')} placeholder="Nombre del referidor" className="bg-slate-800 border-slate-600 text-white h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs text-slate-400">Teléfono</Label>
                <Input {...register('referidorTelefono')} placeholder="8091234567" maxLength={10} className="bg-slate-800 border-slate-600 text-white h-9 text-sm font-mono" />
              </div>
            </div>
          </section>

          {/* ========== DATOS PERSONALES ========== */}
          <section>
            <SectionHeader icon={User} title="Datos Personales" color="orange" />
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-slate-400 flex items-center gap-1">
                    <CreditCard className="w-3 h-3" /> Cédula *
                  </Label>
                  <Input {...register('cedula')} placeholder="00000000000" maxLength={11} className="bg-slate-800 border-slate-600 text-white h-9 text-sm font-mono" />
                  {errors.cedula && <p className="text-xs text-red-400">{errors.cedula.message}</p>}
                </div>
                <div>
                  <Label className="text-xs text-slate-400">Apodo</Label>
                  <Input {...register('apodo')} placeholder="Apodo" className="bg-slate-800 border-slate-600 text-white h-9 text-sm" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-slate-400">Nombre(s) *</Label>
                  <Input {...register('nombres')} placeholder="Nombre(s)" className="bg-slate-800 border-slate-600 text-white h-9 text-sm" />
                  {errors.nombres && <p className="text-xs text-red-400">{errors.nombres.message}</p>}
                </div>
                <div>
                  <Label className="text-xs text-slate-400">Apellido(s) *</Label>
                  <Input {...register('apellidos')} placeholder="Apellido(s)" className="bg-slate-800 border-slate-600 text-white h-9 text-sm" />
                  {errors.apellidos && <p className="text-xs text-red-400">{errors.apellidos.message}</p>}
                </div>
              </div>
              
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <Label className="text-xs text-slate-400">Celular *</Label>
                  <Input {...register('celular')} placeholder="Celular" maxLength={10} className="bg-slate-800 border-slate-600 text-white h-9 text-xs font-mono" />
                  {errors.celular && <p className="text-xs text-red-400">{errors.celular.message}</p>}
                </div>
                <div>
                  <Label className="text-xs text-slate-400">Residencial</Label>
                  <Input {...register('telefonoResidencial')} placeholder="Resid." maxLength={10} className="bg-slate-800 border-slate-600 text-white h-9 text-xs font-mono" />
                </div>
                <div>
                  <Label className="text-xs text-slate-400">Trabajo</Label>
                  <Input {...register('telefonoTrabajo')} placeholder="Trabajo" maxLength={10} className="bg-slate-800 border-slate-600 text-white h-9 text-xs font-mono" />
                </div>
                <div>
                  <Label className="text-xs text-slate-400">Otro</Label>
                  <Input {...register('telefonoOtro')} placeholder="Otro" maxLength={10} className="bg-slate-800 border-slate-600 text-white h-9 text-xs font-mono" />
                </div>
              </div>
            </div>
          </section>

          {/* ========== DIRECCIÓN ========== */}
          <section>
            <SectionHeader icon={Home} title="Dirección" color="blue" />
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <Label className="text-xs text-slate-400">Calle/Av/Manzana *</Label>
                  <Input {...register('calle')} placeholder="Calle o Avenida" className="bg-slate-800 border-slate-600 text-white h-9 text-sm" />
                  {errors.calle && <p className="text-xs text-red-400">{errors.calle.message}</p>}
                </div>
                <div>
                  <Label className="text-xs text-slate-400">Número</Label>
                  <Input {...register('numero')} placeholder="#" className="bg-slate-800 border-slate-600 text-white h-9 text-sm" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-slate-400">Residencial</Label>
                  <Input {...register('residencialNombre')} placeholder="Nombre residencial" className="bg-slate-800 border-slate-600 text-white h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs text-slate-400">Barrio/Sector *</Label>
                  <Input {...register('barrioSector')} placeholder="Barrio o Sector" className="bg-slate-800 border-slate-600 text-white h-9 text-sm" />
                  {errors.barrioSector && <p className="text-xs text-red-400">{errors.barrioSector.message}</p>}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-slate-400">Paraje/Sección</Label>
                  <Input {...register('parajeSeccion')} placeholder="Paraje o Sección" className="bg-slate-800 border-slate-600 text-white h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs text-slate-400">Ciudad *</Label>
                  <Input {...register('ciudad')} placeholder="Ciudad" className="bg-slate-800 border-slate-600 text-white h-9 text-sm" />
                  {errors.ciudad && <p className="text-xs text-red-400">{errors.ciudad.message}</p>}
                </div>
              </div>
              
              <div>
                <Label className="text-xs text-slate-400 flex items-center gap-1">
                  <Mail className="w-3 h-3" /> Correo Electrónico
                </Label>
                <Input {...register('correo')} type="email" placeholder="correo@ejemplo.com" className="bg-slate-800 border-slate-600 text-white h-9 text-sm" />
                {errors.correo && <p className="text-xs text-red-400">{errors.correo.message}</p>}
              </div>
            </div>
          </section>

          {/* ========== PERFIL ========== */}
          <section>
            <SectionHeader icon={Briefcase} title="Perfil" color="orange" />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-slate-400">Frente Sectorial</Label>
                <Controller
                  name="frenteSectorial"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="bg-slate-800 border-slate-600 text-white h-9 text-sm">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {FRENTES_SECTORIALES.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div>
                <Label className="text-xs text-slate-400">Ocupación *</Label>
                <Input {...register('ocupacion')} placeholder="Tu ocupación" className="bg-slate-800 border-slate-600 text-white h-9 text-sm" />
                {errors.ocupacion && <p className="text-xs text-red-400">{errors.ocupacion.message}</p>}
              </div>
            </div>
          </section>

          {/* ========== LEGAL ========== */}
          <section className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              Al registrarte, autorizas al <span className="text-orange-400 font-medium">Frente de Integridad Nacional (FIN)</span> a 
              utilizar tus datos exclusivamente para los fines de registro oficial ante la Junta Central Electoral (JCE), 
              bajo el cumplimiento de la <span className="text-blue-400">Ley 172-13</span> de Protección de Datos y la 
              <span className="text-blue-400"> Ley 33-18</span> de Partidos Políticos.
            </p>
            
            <div className="flex items-start gap-3">
              <Controller
                name="legalAccepted"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id="legalAccepted"
                    checked={Boolean(field.value)}
                    onCheckedChange={(checked) => field.onChange(checked === true)}
                    className="mt-0.5 border-orange-400 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                  />
                )}
              />
              <Label htmlFor="legalAccepted" className="text-sm text-slate-300 cursor-pointer">
                <CheckSquare className="w-4 h-4 text-orange-400 inline mr-1" />
                Acepto los términos y autorizo la validación de mi identidad.
              </Label>
            </div>
            {errors.legalAccepted && <p className="text-xs text-red-400 mt-2">{errors.legalAccepted.message}</p>}
          </section>

          {/* Submit */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold text-lg shadow-lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <motion.div
                  className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
              ) : (
                <>
                  COMPLETAR AFILIACIÓN
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </motion.div>
        </form>
      </motion.div>

      {/* Bottom accent with FIN colors */}
      <div className="h-2 bg-gradient-to-r from-blue-600 via-orange-500 to-blue-600" />
    </div>
  );
};
