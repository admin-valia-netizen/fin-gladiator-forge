import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type InterestArea = 'emprendimiento' | 'tecnologia' | 'deporte' | 'empleo_tecnico';
export type UserLevel = 'aspirante' | 'gladiador' | 'campeon';
export type PassportLevel = 'bronce' | 'dorado';

export interface RegistrationData {
  fullName: string;
  cedula: string;
  phone: string;
  legalAccepted: boolean;
  oathAccepted: boolean;
  cedulaFrontUrl?: string;
  cedulaBackUrl?: string;
  selfieUrl?: string;
  interestArea?: InterestArea;
  signatureConfirmed: boolean;
  userLevel: UserLevel;
  qrCode?: string;
  registrationId?: string;
  voteSelfieUrl?: string;
  passportLevel?: PassportLevel;
  referralCode?: string;
  referredBy?: string;
}

interface RegistrationState {
  currentStep: 'splash' | 'welcome' | 'motto' | 'glossary' | 'onboarding' | 'registration' | 'staircase' | 'passport' | 'vote-validation' | 'golden-passport';
  staircaseStep: number;
  data: RegistrationData;
  setStep: (step: RegistrationState['currentStep']) => void;
  setStaircaseStep: (step: number) => void;
  updateData: (data: Partial<RegistrationData>) => void;
  resetDemo: () => void;
}

const initialData: RegistrationData = {
  fullName: '',
  cedula: '',
  phone: '',
  legalAccepted: false,
  oathAccepted: false,
  signatureConfirmed: false,
  userLevel: 'aspirante',
};

export const useRegistration = create<RegistrationState>()(
  persist(
    (set) => ({
      currentStep: 'splash',
      staircaseStep: 1,
      data: initialData,
      setStep: (step) => set({ currentStep: step }),
      setStaircaseStep: (step) => set({ staircaseStep: step }),
      updateData: (newData) =>
        set((state) => ({
          data: { ...state.data, ...newData },
        })),
      resetDemo: () =>
        set({
          currentStep: 'splash',
          staircaseStep: 1,
          data: initialData,
        }),
    }),
    {
      name: 'fin-registration',
    }
  )
);
