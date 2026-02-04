import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Loader2,
  AlertTriangle,
  Crown,
  ArrowLeft,
  Users,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Navigate, useNavigate } from 'react-router-dom';

interface DonationRequest {
  id: string;
  registration_id: string;
  amount: number;
  payment_proof_url: string;
  cedula_confirmed: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string | null;
  created_at: string;
  registration?: {
    full_name: string;
    cedula: string;
    phone: string;
  };
}

export default function Admin() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [donations, setDonations] = useState<DonationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDonation, setSelectedDonation] = useState<DonationRequest | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  // Check if user is admin
  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .rpc('has_role', { _user_id: user.id, _role: 'admin' });

        if (error) throw error;
        setIsAdmin(data);
      } catch (err) {
        console.error('Error checking admin role:', err);
        setIsAdmin(false);
      }
    };

    if (!authLoading) {
      checkAdminRole();
    }
  }, [user, authLoading]);

  // Fetch pending donations
  useEffect(() => {
    const fetchDonations = async () => {
      if (!isAdmin) return;

      try {
        // First get donations
        const { data: donationsData, error: donationsError } = await supabase
          .from('donations')
          .select('*')
          .order('created_at', { ascending: false });

        if (donationsError) throw donationsError;

        // Then get registrations for each donation
        const donationsWithRegistrations = await Promise.all(
          (donationsData || []).map(async (donation) => {
            const { data: regData } = await supabase
              .from('registrations')
              .select('full_name, cedula, phone')
              .eq('id', donation.registration_id)
              .single();

            return {
              ...donation,
              registration: regData || undefined,
            };
          })
        );

        setDonations(donationsWithRegistrations as DonationRequest[]);
      } catch (err) {
        console.error('Error fetching donations:', err);
        toast({
          title: 'Error',
          description: 'No se pudieron cargar las donaciones',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    if (isAdmin) {
      fetchDonations();
    }
  }, [isAdmin, toast]);

  const handleApprove = async (donation: DonationRequest) => {
    setProcessing(true);
    
    try {
      // Update donation status
      const { error: donationError } = await supabase
        .from('donations')
        .update({
          status: 'approved',
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', donation.id);

      if (donationError) throw donationError;

      // Update registration to golden passport
      const { error: regError } = await supabase
        .from('registrations')
        .update({
          passport_level: 'dorado',
          donation_status: 'approved',
          user_level: 'campeon',
        })
        .eq('id', donation.registration_id);

      if (regError) throw regError;

      // Update local state
      setDonations(prev => 
        prev.map(d => 
          d.id === donation.id 
            ? { ...d, status: 'approved' as const }
            : d
        )
      );

      toast({
        title: '¡Donación Aprobada!',
        description: `Se ha activado el Pasaporte Dorado para ${donation.registration?.full_name}`,
      });
    } catch (err: any) {
      console.error('Error approving donation:', err);
      toast({
        title: 'Error',
        description: err.message || 'No se pudo aprobar la donación',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedDonation || !rejectionReason.trim()) return;

    setProcessing(true);
    
    try {
      const { error: donationError } = await supabase
        .from('donations')
        .update({
          status: 'rejected',
          rejection_reason: rejectionReason,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', selectedDonation.id);

      if (donationError) throw donationError;

      // Update registration donation status
      const { error: regError } = await supabase
        .from('registrations')
        .update({
          donation_status: 'rejected',
        })
        .eq('id', selectedDonation.registration_id);

      if (regError) throw regError;

      // Update local state
      setDonations(prev => 
        prev.map(d => 
          d.id === selectedDonation.id 
            ? { ...d, status: 'rejected' as const, rejection_reason: rejectionReason }
            : d
        )
      );

      toast({
        title: 'Donación Rechazada',
        description: 'La solicitud ha sido rechazada.',
      });

      setShowRejectModal(false);
      setRejectionReason('');
      setSelectedDonation(null);
    } catch (err: any) {
      console.error('Error rejecting donation:', err);
      toast({
        title: 'Error',
        description: err.message || 'No se pudo rechazar la donación',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-DO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/20 text-amber-500 text-xs font-medium">
            <Clock className="w-3 h-3" />
            Pendiente
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/20 text-green-500 text-xs font-medium">
            <CheckCircle className="w-3 h-3" />
            Aprobado
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/20 text-red-500 text-xs font-medium">
            <XCircle className="w-3 h-3" />
            Rechazado
          </span>
        );
    }
  };

  // Loading state
  if (authLoading || isAdmin === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-carbon" />
        <motion.div
          className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // Not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <div className="absolute inset-0 bg-gradient-carbon" />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 text-center"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-destructive/20 flex items-center justify-center">
            <AlertTriangle className="w-10 h-10 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Acceso Denegado</h1>
          <p className="text-muted-foreground mb-6">
            No tienes permisos para acceder a esta sección.
          </p>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Inicio
          </Button>
        </motion.div>
      </div>
    );
  }

  const pendingCount = donations.filter(d => d.status === 'pending').length;

  return (
    <div className="min-h-screen bg-background">
      <div className="absolute inset-0 bg-gradient-carbon" />
      
      <div className="relative z-10 p-6 max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Panel de Administración</h1>
                <p className="text-muted-foreground">Gestión de Donaciones FIN</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
        >
          <Card className="border-amber-500/30">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{pendingCount}</p>
                <p className="text-sm text-muted-foreground">Pendientes</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-500/30">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {donations.filter(d => d.status === 'approved').length}
                </p>
                <p className="text-sm text-muted-foreground">Aprobadas</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/30">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{donations.length}</p>
                <p className="text-sm text-muted-foreground">Total Solicitudes</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Donations Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-500" />
                Solicitudes de Donación
              </CardTitle>
              <CardDescription>
                Gestiona las solicitudes de Pasaporte Dorado por donación
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : donations.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No hay solicitudes de donación aún
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Cédula</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Comprobante</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {donations.map((donation) => (
                        <TableRow key={donation.id}>
                          <TableCell className="font-medium">
                            {donation.registration?.full_name || 'N/A'}
                          </TableCell>
                          <TableCell className="font-mono">
                            {donation.cedula_confirmed}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDate(donation.created_at)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedDonation(donation);
                                setShowImageModal(true);
                              }}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Ver
                            </Button>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(donation.status)}
                          </TableCell>
                          <TableCell className="text-right">
                            {donation.status === 'pending' && (
                              <div className="flex gap-2 justify-end">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-green-500 text-green-500 hover:bg-green-500/10"
                                  onClick={() => handleApprove(donation)}
                                  disabled={processing}
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Aprobar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-red-500 text-red-500 hover:bg-red-500/10"
                                  onClick={() => {
                                    setSelectedDonation(donation);
                                    setShowRejectModal(true);
                                  }}
                                  disabled={processing}
                                >
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Rechazar
                                </Button>
                              </div>
                            )}
                            {donation.status === 'rejected' && donation.rejection_reason && (
                              <span className="text-xs text-muted-foreground italic">
                                {donation.rejection_reason}
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Image Preview Modal */}
      <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Comprobante de Pago</DialogTitle>
            <DialogDescription>
              {selectedDonation?.registration?.full_name} - {selectedDonation?.cedula_confirmed}
            </DialogDescription>
          </DialogHeader>
          {selectedDonation && (
            <div className="mt-4">
              <img
                src={selectedDonation.payment_proof_url}
                alt="Comprobante de pago"
                className="w-full rounded-lg border border-border"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar Solicitud</DialogTitle>
            <DialogDescription>
              Indica el motivo del rechazo para {selectedDonation?.registration?.full_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Motivo del rechazo</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Ej: Depósito no verificado, monto incorrecto..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectModal(false);
                setRejectionReason('');
              }}
              disabled={processing}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectionReason.trim() || processing}
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                'Confirmar Rechazo'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
