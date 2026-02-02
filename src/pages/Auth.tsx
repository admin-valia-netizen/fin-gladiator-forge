import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, Shield, ArrowRight, UserPlus, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const authSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

type AuthFormData = z.infer<typeof authSchema>;

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AuthFormData>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Check if user is already logged in
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          navigate('/');
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const onSubmit = async (data: AuthFormData) => {
    setIsSubmitting(true);
    
    try {
      if (isSignUp) {
        const redirectUrl = `${window.location.origin}/`;
        
        const { error } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            emailRedirectTo: redirectUrl,
          },
        });

        if (error) {
          if (error.message.includes('already registered')) {
            toast.error('Este correo ya está registrado. Intenta iniciar sesión.');
          } else {
            throw error;
          }
          return;
        }

        toast.success('¡Cuenta creada! Revisa tu correo para confirmar.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });

        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast.error('Credenciales inválidas. Verifica tu correo y contraseña.');
          } else if (error.message.includes('Email not confirmed')) {
            toast.error('Por favor confirma tu correo electrónico antes de iniciar sesión.');
          } else {
            throw error;
          }
          return;
        }

        toast.success('¡Bienvenido de vuelta, Gladiador!');
        navigate('/');
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      toast.error('Error de autenticación. Intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-carbon" />
      
      {/* Animated sparks background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-primary rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1.5, 0],
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <motion.header
        className="relative z-10 px-6 py-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3">
          <Shield className="w-10 h-10 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">FIN</h1>
            <p className="text-sm text-muted-foreground">Registro de Integridad</p>
          </div>
        </div>
      </motion.header>

      {/* Content */}
      <motion.div
        className="relative z-10 flex-1 px-6 pb-8 flex flex-col justify-center max-w-md mx-auto w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {/* Toggle */}
        <div className="flex mb-8 bg-card rounded-xl p-1 border border-bronze/30">
          <button
            onClick={() => setIsSignUp(true)}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
              isSignUp 
                ? 'bg-gradient-neon text-primary-foreground shadow-neon' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            Registrarse
          </button>
          <button
            onClick={() => setIsSignUp(false)}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
              !isSignUp 
                ? 'bg-gradient-neon text-primary-foreground shadow-neon' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <LogIn className="w-4 h-4" />
            Iniciar Sesión
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2 text-foreground">
              <Mail className="w-4 h-4 text-bronze" />
              Correo Electrónico
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@correo.com"
              className="bg-card border-bronze/30 focus:border-primary h-12"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="flex items-center gap-2 text-foreground">
              <Lock className="w-4 h-4 text-bronze" />
              Contraseña
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              className="bg-card border-bronze/30 focus:border-primary h-12"
              {...register('password')}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

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
                {isSignUp ? '¡CREAR CUENTA!' : 'ENTRAR'}
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          {isSignUp 
            ? '¿Ya tienes cuenta? ' 
            : '¿No tienes cuenta? '}
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-bronze hover:text-primary transition-colors font-medium"
          >
            {isSignUp ? 'Inicia sesión' : 'Regístrate'}
          </button>
        </p>
      </motion.div>

      {/* Bottom bronze accent */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-bronze" />
    </div>
  );
};

export default Auth;
