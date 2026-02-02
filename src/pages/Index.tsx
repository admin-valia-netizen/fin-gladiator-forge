import { useRegistration } from '@/hooks/useRegistration';
import { OnboardingSlides } from '@/components/OnboardingSlides';
import { WelcomeVideo } from '@/components/WelcomeVideo';
import { RegistrationForm } from '@/components/RegistrationForm';
import { BronzeStaircase } from '@/components/BronzeStaircase';
import { BronzePassport } from '@/components/BronzePassport';

const Index = () => {
  const { currentStep } = useRegistration();

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
