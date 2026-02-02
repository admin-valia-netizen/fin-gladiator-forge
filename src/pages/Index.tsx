import { useEffect } from 'react';
import { useRegistration } from '@/hooks/useRegistration';
import { useAuth } from '@/hooks/useAuth';
import { SplashScreen } from '@/components/SplashScreen';
import { OnboardingSlides } from '@/components/OnboardingSlides';
import { WelcomeVideo } from '@/components/WelcomeVideo';
import { RegistrationForm } from '@/components/RegistrationForm';
import { BronzeStaircase } from '@/components/BronzeStaircase';
import { BronzePassport } from '@/components/BronzePassport';
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
        const validSteps = ['splash', 'welcome', 'onboarding', 'registration', 'staircase', 'passport'];
        if (!validSteps.includes(parsed?.state?.currentStep)) {
          resetDemo();
        }
      } catch {
        resetDemo();
      }
    }
  }, [resetDemo]);

  // Show loading state only after splash and onboarding
  if (loading && currentStep !== 'splash' && currentStep !== 'onboarding') {
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

  // Show splash screen first (before everything)
  if (currentStep === 'splash') {
    return (
      <>
        <SplashScreen onComplete={() => setStep('welcome')} />
      </>
    );
  }

  // Show welcome video second (after splash, before onboarding)
  if (currentStep === 'welcome') {
    return (
      <>
        <WelcomeVideo />
      </>
    );
  }

  // Show onboarding third (before auth)
  if (currentStep === 'onboarding') {
    return (
      <>
        <OnboardingSlides />
      </>
    );
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
      </div>
    </>
  );
};

export default Index;
