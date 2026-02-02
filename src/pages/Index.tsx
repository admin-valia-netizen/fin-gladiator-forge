import { useRegistration } from '@/hooks/useRegistration';
import { useAuth } from '@/hooks/useAuth';
import { OnboardingSlides } from '@/components/OnboardingSlides';
import { WelcomeVideo } from '@/components/WelcomeVideo';
import { RegistrationForm } from '@/components/RegistrationForm';
import { BronzeStaircase } from '@/components/BronzeStaircase';
import { BronzePassport } from '@/components/BronzePassport';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const Index = () => {
  const { currentStep } = useRegistration();
  const { isAuthenticated, loading } = useAuth();

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-carbon" />
        <motion.div
          className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    );
  }

  // Redirect to auth if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      {currentStep === 'onboarding' && <OnboardingSlides />}
      {currentStep === 'welcome' && <WelcomeVideo />}
      {currentStep === 'registration' && <RegistrationForm />}
      {currentStep === 'staircase' && <BronzeStaircase />}
      {currentStep === 'passport' && <BronzePassport />}
    </div>
  );
};

export default Index;
