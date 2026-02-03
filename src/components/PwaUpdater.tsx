import { useEffect, useRef } from "react";
import { registerSW } from "virtual:pwa-register";
import { toast } from "sonner";

/**
 * Ensures installed PWA users get prompted to refresh when a new version is available.
 * This prevents the app from feeling "stuck" on an older cached build.
 */
export const PwaUpdater = () => {
  const didPrompt = useRef(false);

  useEffect(() => {
    let intervalId: number | undefined;

    const updateSW = registerSW({
      immediate: true,
      onRegisteredSW(_swUrl, registration) {
        if (!registration) return;

        // Force an early update check (Android/installed PWAs sometimes delay it)
        window.setTimeout(() => {
          registration.update().catch(() => {});
        }, 2000);

        // Periodic update checks so the "Hay una actualización disponible" aviso appears reliably
        intervalId = window.setInterval(() => {
          registration.update().catch(() => {});
        }, 15 * 60 * 1000);
      },
      onNeedRefresh() {
        if (didPrompt.current) return;
        didPrompt.current = true;

        toast("Hay una actualización disponible", {
          duration: Infinity,
          action: {
            label: "Actualizar",
            onClick: () => updateSW(true),
          },
          cancel: {
            label: "Luego",
            onClick: () => {},
          },
        });
      },
    });

    return () => {
      if (intervalId) window.clearInterval(intervalId);
    };
  }, []);

  return null;
};
