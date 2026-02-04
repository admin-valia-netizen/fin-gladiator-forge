import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export const AdminButton = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }

      try {
        const { data, error } = await supabase.rpc('has_role', {
          _user_id: user.id,
          _role: 'admin',
        });

        if (error) throw error;
        setIsAdmin(data === true);
      } catch (err) {
        console.error('Error checking admin role:', err);
        setIsAdmin(false);
      }
    };

    if (isAuthenticated) {
      checkAdminRole();
    }
  }, [user, isAuthenticated]);

  if (!isAdmin) return null;

  return (
    <Button
      variant="ghost"
      size="icon"
      className="fixed top-4 right-4 z-50 bg-card/80 backdrop-blur-sm border border-primary/30 hover:bg-primary/20"
      onClick={() => navigate('/admin')}
      title="Panel de Administración"
    >
      <Shield className="w-5 h-5 text-primary" />
    </Button>
  );
};
