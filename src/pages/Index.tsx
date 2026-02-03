import { useEffect } from 'react';
import { useRegistration } from '@/hooks/useRegistration';
import { useAuth } from '@/hooks/useAuth';
import { SplashScreen } from '@/components/SplashScreen';
import { OnboardingSlides } from '@/components/OnboardingSlides';
import { WelcomeVideo } from '@/components/WelcomeVideo';
import { MottoScreen } from '@/components/MottoScreen';
import { GlossaryScreen } from '@/components/GlossaryScreen';
import { RegistrationForm } from '@/components/RegistrationForm';
import { BronzeStaircase } from '@/components/BronzeStaircase';
import { BronzePassport } from '@/components/BronzePassport';
import { VoteValidationStep } from '@/components/VoteValidationStep';
import { GoldenPassport } from '@/components/GoldenPassport';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const Index = () => {
  const { currentStep, setStep, resetDemo } = useRegistration();
  const { isAuthenticated, loading } = useAuth();

  // Force splash on first load if state is corrupted or old format
  useEffect(() => {
    const stored = localStorage.getItem('fin-registration');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // If currentStep is not in the valid steps, reset to splash
        const validSteps = ['splash', 'welcome', 'motto', 'glossary', 'onboarding', 'registration', 'staircase', 'passport', 'vote-validation', 'golden-passport'];
        if (!validSteps.includes(parsed?.state?.currentStep)) {
          resetDemo();
        }
      } catch {
        resetDemo();
      }
    }
  }, [resetDemo]);

  // Show loading state only after intro sequence
  const introSteps = ['splash', 'welcome', 'motto', 'glossary', 'onboarding'];
  if (loading && !introSteps.includes(currentStep)) {
    return (
      <>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-carbon" />
          <motion.div
            className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
        </div>
      </>
    );
  }

  // 1. Splash Screen - Logo de FIN
  if (currentStep === 'splash') {
    return <SplashScreen onComplete={() => setStep('welcome')} />;
  }

  // 2. Video de Impacto - Gladiador golpeando escudo
  if (currentStep === 'welcome') {
    return <WelcomeVideo />;
  }

  // 3. El Estandarte (Lema) - ORDEN. MORALIDAD. CONFIANZA.
  if (currentStep === 'motto') {
    return <MottoScreen />;
  }

  // 4. Glosario "Entiende tu Poder"
  if (currentStep === 'glossary') {
    return <GlossaryScreen />;
  }

  // 5. Onboarding (Manifiesto) - 3 láminas
  if (currentStep === 'onboarding') {
    return <OnboardingSlides />;
  }

  // After onboarding, require auth for all other steps
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <>
      <div className="min-h-screen bg-background">
        {currentStep === 'registration' && <RegistrationForm />}
        {currentStep === 'staircase' && <BronzeStaircase />}
        {currentStep === 'passport' && <BronzePassport />}
        {currentStep === 'vote-validation' && (
          <div className="min-h-screen bg-background flex flex-col">
            <div className="absolute inset-0 bg-gradient-carbon" />
            <div className="relative z-10 flex-1 px-6 py-8">
              <VoteValidationStep onComplete={() => setStep('golden-passport')} />
            </div>
          </div>
        )}
        {currentStep === 'golden-passport' && <GoldenPassport />}
      </div>
    </>
  );
};

export default Index;
