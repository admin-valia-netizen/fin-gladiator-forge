import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Users } from 'lucide-react';

export const TotalRegisteredCounter = () => {
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCount = async () => {
      const { count, error } = await supabase
        .from('registrations')
        .select('*', { count: 'exact', head: true });
      
      if (!error && count !== null) {
        setCount(count);
      }
      setLoading(false);
    };

    fetchCount();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('registrations-count')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'registrations' },
        () => fetchCount()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.6 }}
      className="flex flex-col items-center gap-3"
    >
      <div className="flex items-center gap-2 text-muted-foreground">
        <Users className="w-5 h-5" />
        <span className="text-sm font-medium uppercase tracking-wider">
          Gladiadores Registrados
        </span>
      </div>
      
      <AnimatePresence mode="wait">
        <motion.div
          key={count}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          className="relative"
        >
          <span className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-primary via-amber-400 to-primary bg-clip-text text-transparent drop-shadow-lg">
            {count?.toLocaleString('es-DO') ?? '0'}
          </span>
          
          {/* Glow effect */}
          <div className="absolute inset-0 blur-2xl bg-primary/20 -z-10" />
        </motion.div>
      </AnimatePresence>
      
      <p className="text-xs text-muted-foreground/70 mt-1">
        en la Legión
      </p>
    </motion.div>
  );
};
