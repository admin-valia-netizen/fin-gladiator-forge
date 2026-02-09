import { useEffect, useState } from 'react';
import { useRegistration } from '@/hooks/useRegistration';
import { useAuth } from '@/hooks/useAuth';
import { SplashScreen } from '@/components/SplashScreen';
import { OnboardingSlides } from '@/components/OnboardingSlides';
import { WelcomeVideo } from '@/components/WelcomeVideo';
import { MottoScreen } from '@/components/MottoScreen';
import { GlossaryScreen } from '@/components/GlossaryScreen';
import { RegistrationForm } from '@/components/RegistrationForm';
import { QuickVerification } from '@/components/QuickVerification';
import { BronzeStaircase } from '@/components/BronzeStaircase';
import { BronzePassport } from '@/components/BronzePassport';
import { VoteValidationStep } from '@/components/VoteValidationStep';
import { GoldenPassport } from '@/components/GoldenPassport';
import { AdminButton } from '@/components/AdminButton';
import { CommunicationsInbox } from '@/components/CommunicationsInbox';
import { Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const { currentStep, setStep, resetDemo } = useRegistration();
  const { isAuthenticated, loading } = useAuth();
  const [showInbox, setShowInbox] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!isAuthenticated) return;
      
      try {
        const { data, error } = await supabase
          .from('communications')
          .select('id');
        
        if (error) throw error;
        
        const stored = localStorage.getItem('fin-read-messages');
        const readMessages = stored ? new Set(JSON.parse(stored)) : new Set();
        const unread = (data || []).filter(c => !readMessages.has(c.id)).length;
        setUnreadCount(unread);
      } catch (err) {
        console.error('Error fetching unread count:', err);
      }
    };

    fetchUnreadCount();
  }, [isAuthenticated, showInbox]);

  // Force splash on first load if state is corrupted or old format
  useEffect(() => {
    const stored = localStorage.getItem('fin-registration');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // If currentStep is not in the valid steps, reset to splash
        const validSteps = ['splash', 'welcome', 'motto', 'glossary', 'onboarding', 'registration', 'quick-verify', 'staircase', 'passport', 'vote-validation', 'golden-passport'];
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
      <AdminButton />
      
      {/* Inbox Button - shown for authenticated users */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 bg-card/80 backdrop-blur-sm border border-[#0047AB]/30 hover:bg-[#0047AB]/20"
        onClick={() => setShowInbox(true)}
        title="Centro de Comunicaciones"
      >
        <Mail className="w-5 h-5 text-[#0047AB]" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#FF6B00] text-white text-xs flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {/* Communications Inbox Modal */}
      <AnimatePresence>
        {showInbox && (
          <CommunicationsInbox onClose={() => setShowInbox(false)} />
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-background">
        {currentStep === 'registration' && <RegistrationForm />}
        {currentStep === 'quick-verify' && <QuickVerification />}
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
