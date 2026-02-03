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
    const updateSW = registerSW({
      immediate: true,
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
  }, []);

  return null;
};
