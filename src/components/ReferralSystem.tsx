import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Share2, Copy, Check, Crown, AlertTriangle, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Referral {
  id: string;
  full_name: string;
  passport_level: string | null;
  created_at: string;
}

interface ReferralSystemProps {
  referralCode?: string;
  registrationId?: string;
}

const REQUIRED_REFERRALS = 50;

export const ReferralSystem = ({ referralCode, registrationId }: ReferralSystemProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [userReferralCode, setUserReferralCode] = useState(referralCode);

  // Fetch user's referral code and initial referral count on mount
  useEffect(() => {
    const initialize = async () => {
      let code = referralCode;
      
      // If no referral code provided, fetch from DB
      if (!code && registrationId) {
        const { data } = await supabase
          .from('registrations')
          .select('referral_code, cedula')
          .eq('id', registrationId)
          .maybeSingle();
        
        // Generate code locally if not in DB
        code = data?.referral_code || (data?.cedula ? `FIN-${data.cedula}` : undefined);
      }
      
      if (code) {
        setUserReferralCode(code);
        
        // Fetch initial referral count
        const { data: refs, error } = await supabase
          .from('registrations')
          .select('id, full_name, passport_level, created_at')
          .eq('referred_by', code)
          .order('created_at', { ascending: false });
        
        if (!error && refs) {
          setReferrals(refs);
        }
      }
      
      setInitialLoading(false);
    };
    
    initialize();
  }, [referralCode, registrationId]);

  // Refresh referrals when dialog opens
  useEffect(() => {
    const fetchReferrals = async () => {
      if (!isOpen || !userReferralCode) return;
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('registrations')
          .select('id, full_name, passport_level, created_at')
          .eq('referred_by', userReferralCode)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setReferrals(data || []);
      } catch (error) {
        console.error('Error fetching referrals:', error);
        toast.error('Error al cargar referidos');
      } finally {
        setLoading(false);
      }
    };

    fetchReferrals();
  }, [isOpen, userReferralCode]);

  const handleCopyCode = async () => {
    if (!userReferralCode) return;
    
    try {
      await navigator.clipboard.writeText(userReferralCode);
      setCopied(true);
      toast.success('¡Código copiado!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Error al copiar');
    }
  };

  const handleShare = async () => {
    if (!userReferralCode) {
      toast.error('No hay código de referido disponible');
      return;
    }

    const shareUrl = `${window.location.origin}?ref=${userReferralCode}`;
    const shareText = `🏛️ ¡Únete a FIN como Gladiador!\n\nUsa mi código de referido: ${userReferralCode}\n\nRegístrate aquí: ${shareUrl}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'FIN - Frente de Integridad Nacional',
          text: shareText,
          url: shareUrl,
        });
        toast.success('¡Compartido exitosamente!');
      } catch (error: any) {
        // User cancelled sharing - try copy as fallback
        if (error.name !== 'AbortError') {
          await handleCopyCode();
        }
      }
    } else {
      // Fallback to copy for browsers without Web Share API
      try {
        await navigator.clipboard.writeText(shareText);
        toast.success('¡Enlace copiado al portapapeles!');
      } catch {
        toast.error('Error al copiar. Copia manualmente: ' + userReferralCode);
      }
    }
  };

  const completedReferrals = referrals.filter(r => r.passport_level === 'bronce' || r.passport_level === 'dorado').length;
  const progress = (completedReferrals / REQUIRED_REFERRALS) * 100;
  const isComplete = completedReferrals >= REQUIRED_REFERRALS;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full border-amber-500/30 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20"
          disabled={initialLoading}
        >
          <Users className="w-4 h-4 mr-2" />
          {initialLoading ? 'Cargando...' : `Mis Referidos (${referrals.length}/${REQUIRED_REFERRALS})`}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[85vh] overflow-hidden bg-background/95 backdrop-blur-xl border-bronze/30">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center flex items-center justify-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Sistema de Referidos
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto max-h-[60vh] pr-2">
          {/* Referral Code Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30"
          >
            <p className="text-xs text-muted-foreground text-center mb-2">
              Tu Código de Gladiador
            </p>
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl font-mono font-bold text-primary tracking-wider">
                {userReferralCode || '---'}
              </span>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={handleCopyCode}
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </motion.div>

          {/* Share Button */}
          <Button
            onClick={handleShare}
            variant="neon"
            className="w-full"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Compartir Código
          </Button>

          {/* Progress Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-4 rounded-xl bg-muted/30 border border-border"
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Progreso de Reclutamiento</span>
              <span className={`text-sm font-bold ${isComplete ? 'text-green-500' : 'text-amber-500'}`}>
                {completedReferrals}/{REQUIRED_REFERRALS}
              </span>
            </div>
            <Progress value={progress} className="h-3" />
            <p className="text-xs text-muted-foreground mt-2 text-center">
              {isComplete ? (
                <span className="text-green-500 flex items-center justify-center gap-1">
                  <Crown className="w-3 h-3" />
                  ¡Meta cumplida! Tu grupo está listo para el Botín
                </span>
              ) : (
                `Faltan ${REQUIRED_REFERRALS - completedReferrals} gladiadores para completar tu grupo`
              )}
            </p>
          </motion.div>

          {/* Warning */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-3 rounded-lg bg-destructive/10 border border-destructive/30"
          >
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                <span className="text-destructive font-bold">Recuerda:</span> Todos tus referidos deben completar la Escalera de Bronce para que el grupo reciba el Botín.
              </p>
            </div>
          </motion.div>

          {/* Referrals List */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Users className="w-4 h-4" />
              Tus Gladiadores Referidos
            </h4>

            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : referrals.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-2 opacity-20" />
                <p className="text-sm">Aún no tienes referidos</p>
                <p className="text-xs mt-1">¡Comparte tu código para empezar!</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                <AnimatePresence>
                  {referrals.map((referral, index) => (
                    <motion.div
                      key={referral.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        referral.passport_level === 'dorado'
                          ? 'bg-amber-500/10 border border-amber-500/30'
                          : referral.passport_level === 'bronce'
                          ? 'bg-bronze/10 border border-bronze/30'
                          : 'bg-muted/30 border border-border'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                          referral.passport_level === 'dorado'
                            ? 'bg-amber-500/20 text-amber-500'
                            : referral.passport_level === 'bronce'
                            ? 'bg-bronze/20 text-bronze-light'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{referral.full_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(referral.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className={`text-xs font-semibold px-2 py-1 rounded ${
                        referral.passport_level === 'dorado'
                          ? 'bg-amber-500/20 text-amber-500'
                          : referral.passport_level === 'bronce'
                          ? 'bg-bronze/20 text-bronze-light'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {referral.passport_level === 'dorado' ? '🏆 Campeón' 
                          : referral.passport_level === 'bronce' ? '🛡️ Bronce' 
                          : '⏳ Pendiente'}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
