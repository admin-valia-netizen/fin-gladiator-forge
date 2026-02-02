import { useEffect, useMemo, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRegistration } from "@/hooks/useRegistration";
import { useAuth } from "@/hooks/useAuth";

import himnoFin from "@/assets/himno-fin.mp3";

const STORAGE_KEY = "fin-anthem-enabled";

export const AnthemPlayer = () => {
  const { currentStep } = useRegistration();
  const { isAuthenticated } = useAuth();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [enabled, setEnabled] = useState<boolean>(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (v === null) return true;
      return v === "1";
    } catch {
      return true;
    }
  });

  const [needsGesture, setNeedsGesture] = useState(false);

  const shouldPlay = useMemo(() => {
    // Pausamos durante el video para que se escuche limpio.
    if (!enabled) return false;
    if (currentStep === "welcome") return false;
    return true;
  }, [enabled, currentStep]);

  // Stop audio immediately when user logs out
  useEffect(() => {
    if (!isAuthenticated && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const audio = new Audio(himnoFin);
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = 0.25;
    audioRef.current = audio;

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  const tryPlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      await audio.play();
      setNeedsGesture(false);
    } catch {
      // Autoplay bloqueado por el navegador.
      setNeedsGesture(true);
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!shouldPlay) {
      audio.pause();
      return;
    }

    void tryPlay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldPlay]);

  const persist = (next: boolean) => {
    setEnabled(next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
    } catch {
      // ignore
    }
  };

  const toggle = async () => {
    const next = !enabled;
    persist(next);

    const audio = audioRef.current;
    if (!audio) return;

    if (!next) {
      setNeedsGesture(false);
      audio.pause();
      return;
    }

    await tryPlay();
  };

  return (
    <>
      {enabled && needsGesture && (
        <div className="fixed bottom-16 left-4 z-50 max-w-[18rem] rounded-lg border border-border bg-card/80 px-3 py-2 text-xs text-muted-foreground backdrop-blur-sm">
          Tu navegador bloqueó el audio automático. Toca el ícono para activar el himno.
        </div>
      )}

      <div className="fixed bottom-4 left-4 z-50">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={toggle}
          aria-label={enabled ? "Silenciar himno" : "Activar himno"}
        >
          {enabled ? <Volume2 /> : <VolumeX />}
        </Button>
      </div>
    </>
  );
};
