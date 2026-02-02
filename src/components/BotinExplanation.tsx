import { motion } from 'framer-motion';
import { Coins, Laptop, Anchor, ShieldPlus, FileSignature, Vote, Camera, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const rewards = [
  {
    icon: <Coins className="w-8 h-8" />,
    title: 'CAPITAL SEMILLA',
    description: 'Dinero y asesoría para arrancar tu propio negocio (barbería, tienda, tecnología o arte). Tú pones la idea, nosotros el impulso.',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
  },
  {
    icon: <Laptop className="w-8 h-8" />,
    title: 'CONECTIVIDAD TOTAL',
    description: 'Laptop de alta gama, internet gratuito y becas en las mejores academias tecnológicas. Para que compitas con el mundo.',
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/10',
  },
  {
    icon: <Anchor className="w-8 h-8" />,
    title: 'EMPLEO POR MÉRITO',
    description: 'Prioridad absoluta en las vacantes de GESEMA, el Astillero Nacional y puestos de élite del Estado. Sin cartas de recomendación, solo tu talento.',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-400/10',
  },
  {
    icon: <ShieldPlus className="w-8 h-8" />,
    title: 'SALUD Y BIENESTAR',
    description: 'Seguro médico premium y acceso a centros deportivos de alto rendimiento. Porque un Gladiador necesita estar en su mejor forma.',
    color: 'text-red-400',
    bgColor: 'bg-red-400/10',
  },
];

const steps = [
  {
    icon: <FileSignature className="w-6 h-6" />,
    title: 'LA FIRMA',
    description: 'Regístrate en esta app y firma físicamente en nuestras mesas oficiales de FIN.',
  },
  {
    icon: <Vote className="w-6 h-6" />,
    title: 'LA ACCIÓN',
    description: 'El día de las elecciones, cumple con tu patria y vota con integridad.',
  },
  {
    icon: <Camera className="w-6 h-6" />,
    title: 'EL SELLO',
    description: 'Sube a esta app tu selfie con el dedo entintado.',
  },
];

export const BotinExplanation = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="neon" size="lg" className="w-full mt-4">
          <Coins className="w-5 h-5 mr-2" />
          ¿Qué es el Botín?
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-background border-bronze/30">
        <DialogHeader>
          <DialogTitle className="text-center">
            <span className="text-2xl font-bold bg-gradient-bronze bg-clip-text text-transparent">
              EL BOTÍN DEL GLADIADOR
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Intro */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <p className="text-lg font-semibold text-primary mb-2">
              Tu Esfuerzo, Tu Decisión.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              En el nuevo gobierno del partido FIN, se acabaron las "cuñas" y los favores políticos. 
              Aquí el éxito no se hereda ni se regala: <span className="text-foreground font-medium">se forja por mérito</span>. 
              Tu compromiso hoy es la llave que abre la bóveda de tus derechos.
            </p>
          </motion.div>

          {/* Section title */}
          <div className="text-center">
            <p className="text-sm font-bold text-bronze-metallic uppercase tracking-wider">
              Elige tu recompensa según tu sueño
            </p>
          </div>

          {/* Rewards grid */}
          <div className="space-y-3">
            {rewards.map((reward, index) => (
              <motion.div
                key={reward.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 rounded-xl border border-muted ${reward.bgColor}`}
              >
                <div className="flex gap-4">
                  <div className={`${reward.color} shrink-0`}>
                    {reward.icon}
                  </div>
                  <div>
                    <h4 className={`font-bold text-sm ${reward.color}`}>
                      {reward.title}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {reward.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* How to claim */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="space-y-4"
          >
            <div className="text-center">
              <p className="text-sm font-bold text-primary uppercase tracking-wider">
                ¿Cómo Reclamar Tu Botín?
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Es un pacto de integridad en tres pasos:
              </p>
            </div>

            <div className="space-y-3">
              {steps.map((step, index) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/30"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0">
                    {step.icon}
                  </div>
                  <div>
                    <h5 className="font-bold text-sm text-foreground">{step.title}</h5>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Result */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.9 }}
            className="p-4 rounded-xl bg-gradient-bronze text-center"
          >
            <p className="text-sm text-foreground font-medium leading-relaxed">
              Al validar tu participación, tu <span className="font-bold">Pasaporte de Bronce</span> se 
              vuelve <span className="font-bold text-yellow-300">Oro</span> y se activa automáticamente 
              tu acceso al botín que elegiste.
            </p>
          </motion.div>

          {/* Important note */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="p-3 rounded-lg bg-primary/10 border border-primary/30"
          >
            <p className="text-sm text-foreground leading-relaxed text-center">
              Naturalmente se dará <span className="font-bold text-primary">si Ganamos las elecciones</span>, 
              sino NO, así que <span className="font-bold text-bronze-metallic">trae a tus Amigos</span> y 
              hazlos <span className="font-bold text-primary">Gladiadores de FIN</span>.
            </p>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
            className="text-center pt-2"
          >
            <p className="text-lg font-bold text-primary uppercase tracking-wide">
              ¡Forja Tu Destino!
            </p>
            <p className="text-sm text-bronze-metallic font-semibold">
              Sin cuñas, por tu propio valor.
            </p>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
