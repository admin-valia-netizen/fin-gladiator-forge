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
  Clock,
  DollarSign,
  Download,
  Settings,
  Trash2,
  BookOpen,
  RefreshCw,
  MessageSquare
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Navigate, useNavigate } from 'react-router-dom';
import { AdminCommunications } from '@/components/AdminCommunications';

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
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [resetting, setResetting] = useState(false);

  // Roles (operativo)
  const [roleCedula, setRoleCedula] = useState('');
  const [roleLookupLoading, setRoleLookupLoading] = useState(false);
  const [roleProcessing, setRoleProcessing] = useState(false);
  const [roleTarget, setRoleTarget] = useState<{
    user_id: string;
    full_name: string;
    cedula: string;
    phone: string;
  } | null>(null);
  const [roleTargetIsAdmin, setRoleTargetIsAdmin] = useState(false);

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

  const refreshRoleTarget = async (userId: string) => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    if (error) throw error;
    const roles = (data ?? []) as Array<{ role: 'admin' | 'moderator' | 'user' }>; 
    setRoleTargetIsAdmin(roles.some(r => r.role === 'admin'));
  };

  const handleFindUserForRole = async () => {
    const ced = roleCedula.trim();
    if (!/^\d{11}$/.test(ced)) {
      toast({
        title: 'Cédula inválida',
        description: 'Debe tener 11 dígitos numéricos.',
        variant: 'destructive',
      });
      return;
    }

    setRoleLookupLoading(true);
    try {
      const { data, error } = await supabase
        .from('registrations')
        .select('user_id, full_name, cedula, phone')
        .eq('cedula', ced)
        .maybeSingle();

      if (error) throw error;
      if (!data?.user_id) {
        setRoleTarget(null);
        toast({
          title: 'No encontrado',
          description: 'No existe un registro con esa cédula.',
          variant: 'destructive',
        });
        return;
      }

      const target = {
        user_id: data.user_id as string,
        full_name: data.full_name as string,
        cedula: data.cedula as string,
        phone: data.phone as string,
      };

      setRoleTarget(target);
      await refreshRoleTarget(target.user_id);

      toast({
        title: 'Usuario encontrado',
        description: `Listo para gestionar roles de ${target.full_name}.`,
      });
    } catch (err: any) {
      console.error('Error finding user for role:', err);
      toast({
        title: 'Error',
        description: err.message || 'No se pudo buscar el usuario.',
        variant: 'destructive',
      });
    } finally {
      setRoleLookupLoading(false);
    }
  };

  const handleGrantAdmin = async () => {
    if (!roleTarget) return;
    setRoleProcessing(true);

    try {
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: roleTarget.user_id, role: 'admin' });

      if (error) throw error;
      await refreshRoleTarget(roleTarget.user_id);

      toast({
        title: 'Rol actualizado',
        description: 'Se asignó el rol de administrador.',
      });
    } catch (err: any) {
      console.error('Error granting admin:', err);
      toast({
        title: 'Error',
        description: err.message || 'No se pudo asignar el rol.',
        variant: 'destructive',
      });
    } finally {
      setRoleProcessing(false);
    }
  };

  const handleRevokeAdmin = async () => {
    if (!roleTarget) return;
    setRoleProcessing(true);

    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', roleTarget.user_id)
        .eq('role', 'admin');

      if (error) throw error;
      await refreshRoleTarget(roleTarget.user_id);

      toast({
        title: 'Rol actualizado',
        description: 'Se retiró el rol de administrador.',
      });
    } catch (err: any) {
      console.error('Error revoking admin:', err);
      toast({
        title: 'Error',
        description: err.message || 'No se pudo retirar el rol.',
        variant: 'destructive',
      });
    } finally {
      setRoleProcessing(false);
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
  const approvedDonations = donations.filter(d => d.status === 'approved');
  const totalRecaudado = approvedDonations.reduce((sum, d) => sum + d.amount, 0);

  // Export approved sponsors to CSV
  const handleExportSponsors = () => {
    const csvContent = [
      ['Nombre', 'Cédula', 'Teléfono', 'Monto', 'Fecha Aprobación'].join(','),
      ...approvedDonations.map(d => [
        `"${d.registration?.full_name || 'N/A'}"`,
        d.cedula_confirmed,
        d.registration?.phone || 'N/A',
        d.amount,
        formatDate(d.created_at)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `patrocinadores-fin-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast({
      title: 'Exportación completada',
      description: `Se exportaron ${approvedDonations.length} patrocinadores.`,
    });
  };

  // Reset all data
  const handleResetAllData = async () => {
    if (resetConfirmText !== 'REINICIAR') return;
    
    setResetting(true);
    
    try {
      // Delete all donations first (due to foreign key)
      const { error: donationsError } = await supabase
        .from('donations')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (donationsError) throw donationsError;

      // Delete all registrations
      const { error: regError } = await supabase
        .from('registrations')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (regError) throw regError;

      // Refresh donations list
      setDonations([]);
      
      toast({
        title: '¡Datos reiniciados!',
        description: 'Todos los registros y donaciones han sido eliminados.',
      });

      setShowResetModal(false);
      setResetConfirmText('');
    } catch (err: any) {
      console.error('Error resetting data:', err);
      toast({
        title: 'Error',
        description: err.message || 'No se pudieron reiniciar los datos',
        variant: 'destructive',
      });
    } finally {
      setResetting(false);
    }
  };

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

        {/* Stats with Total Recaudado */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
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
                <p className="text-2xl font-bold text-foreground">{approvedDonations.length}</p>
                <p className="text-sm text-muted-foreground">Aprobadas</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-transparent">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  RD${totalRecaudado.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Total Recaudado</p>
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

        {/* Tabs for different sections */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Tabs defaultValue="donations" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="donations" className="flex items-center gap-2">
                <Crown className="w-4 h-4" />
                Donaciones
              </TabsTrigger>
              <TabsTrigger value="communications" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Comunicados
              </TabsTrigger>
              <TabsTrigger value="sponsors" className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Patrocinadores
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Configuración
              </TabsTrigger>
            </TabsList>

            {/* Donations Tab */}
            <TabsContent value="donations">
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
            </TabsContent>

            {/* Communications Tab */}
            <TabsContent value="communications">
              <AdminCommunications />
            </TabsContent>

            {/* Sponsors Export Tab */}
            <TabsContent value="sponsors">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="w-5 h-5 text-primary" />
                    Exportar Patrocinadores
                  </CardTitle>
                  <CardDescription>
                    Descarga la lista de patrocinadores aprobados para contabilidad
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-6 rounded-xl bg-muted/50 border border-border">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-lg font-bold text-foreground">
                          {approvedDonations.length} Patrocinadores
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Total recaudado: <span className="font-bold text-primary">RD${totalRecaudado.toLocaleString()}</span>
                        </p>
                      </div>
                      <Button 
                        onClick={handleExportSponsors}
                        disabled={approvedDonations.length === 0}
                        className="bg-gradient-to-r from-primary to-primary/80"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Exportar CSV
                      </Button>
                    </div>
                  </div>

                  {approvedDonations.length > 0 && (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Cédula</TableHead>
                            <TableHead>Teléfono</TableHead>
                            <TableHead className="text-right">Monto</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {approvedDonations.map((donation) => (
                            <TableRow key={donation.id}>
                              <TableCell className="font-medium">
                                {donation.registration?.full_name || 'N/A'}
                              </TableCell>
                              <TableCell className="font-mono">
                                {donation.cedula_confirmed}
                              </TableCell>
                              <TableCell>
                                {donation.registration?.phone || 'N/A'}
                              </TableCell>
                              <TableCell className="text-right font-bold text-primary">
                                RD${donation.amount.toLocaleString()}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings">
              <div className="space-y-6">
                {/* Roles (Operativo) */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-primary" />
                      Roles (Operativo)
                    </CardTitle>
                    <CardDescription>
                      Asigna o retira el rol de administrador sin ejecutar SQL ni tocar código.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-[1fr_auto] items-end">
                      <div className="space-y-2">
                        <Label htmlFor="role-cedula">Cédula</Label>
                        <Input
                          id="role-cedula"
                          value={roleCedula}
                          onChange={(e) => setRoleCedula(e.target.value)}
                          placeholder="00112345678"
                          maxLength={11}
                          className="font-mono"
                        />
                      </div>
                      <Button onClick={handleFindUserForRole} disabled={roleLookupLoading}>
                        {roleLookupLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Buscando...
                          </>
                        ) : (
                          'Buscar'
                        )}
                      </Button>
                    </div>

                    {roleTarget && (
                      <div className="p-4 rounded-xl bg-muted/50 border border-border space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-bold text-foreground truncate">{roleTarget.full_name}</p>
                            <p className="text-sm text-muted-foreground">
                              Cédula: <span className="font-mono text-foreground">{roleTarget.cedula}</span>
                            </p>
                            <p className="text-sm text-muted-foreground">Teléfono: {roleTarget.phone}</p>
                            <p className="text-xs text-muted-foreground break-all">
                              ID usuario: <span className="font-mono">{roleTarget.user_id}</span>
                            </p>
                          </div>

                          <span
                            className={
                              "inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold " +
                              (roleTargetIsAdmin
                                ? "bg-green-500/20 text-green-500"
                                : "bg-muted text-muted-foreground")
                            }
                          >
                            {roleTargetIsAdmin ? 'ADMIN' : 'USUARIO'}
                          </span>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={handleGrantAdmin}
                            disabled={roleProcessing || roleTargetIsAdmin}
                          >
                            Hacer administrador
                          </Button>
                          <Button
                            variant="outline"
                            className="flex-1 text-destructive border-destructive/40 hover:bg-destructive/10"
                            onClick={handleRevokeAdmin}
                            disabled={roleProcessing || !roleTargetIsAdmin}
                          >
                            Quitar administrador
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Admin Manual */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-primary" />
                      Manual del Administrador
                    </CardTitle>
                    <CardDescription>
                      Guía técnica para la gestión del sistema
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="roles">
                        <AccordionTrigger>¿Cómo asignar roles de administrador?</AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-3 text-sm text-muted-foreground">
                            <p>
                              En esta pestaña verás la tarjeta <strong className="text-foreground">Roles (Operativo)</strong>.
                            </p>
                            <ol className="list-decimal list-inside space-y-1">
                              <li>Escribe la cédula del usuario y pulsa <strong className="text-foreground">Buscar</strong>.</li>
                              <li>
                                Si aparece el registro, pulsa <strong className="text-foreground">Hacer administrador</strong> o{' '}
                                <strong className="text-foreground">Quitar administrador</strong>.
                              </li>
                            </ol>
                            <p>Cada cambio queda registrado en la auditoría interna del sistema.</p>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="passport">
                        <AccordionTrigger>¿Cómo funciona el sistema de pasaportes?</AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-3 text-sm text-muted-foreground">
                            <p><strong className="text-foreground">Pasaporte de Bronce:</strong> Se obtiene al completar el registro con verificación de cédula y selfie.</p>
                            <p><strong className="text-foreground">Pasaporte Dorado (Vía del Patrocinio):</strong> Se obtiene al donar RD$5,000 y ser aprobado por un administrador.</p>
                            <p><strong className="text-foreground">Pasaporte Dorado (Vía del Esfuerzo):</strong> Se obtiene al reclutar 50 referidos validados.</p>
                            <p><strong className="text-foreground">Nivel Campeón:</strong> Se alcanza al validar el voto el día de las elecciones.</p>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="votes">
                        <AccordionTrigger>¿Cómo funciona la validación de votos?</AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-3 text-sm text-muted-foreground">
                            <p>El día de las elecciones, los usuarios con Pasaporte Dorado pueden subir una selfie mostrando:</p>
                            <ul className="list-disc list-inside space-y-1 ml-2">
                              <li>Su dedo con la tinta electoral</li>
                              <li>El centro electoral de fondo</li>
                            </ul>
                            <p>El sistema valida que la foto fue tomada en la fecha electoral configurada. Al validar, el usuario asciende a nivel "Campeón" y desbloquea acceso a las recompensas.</p>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="config">
                        <AccordionTrigger>Configuración del día de elecciones</AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-3 text-sm text-muted-foreground">
                            <p>La fecha de las elecciones se configura en el archivo:</p>
                            <pre className="p-3 rounded-lg bg-muted font-mono text-xs overflow-x-auto">
{`src/components/VoteValidationStep.tsx

// Línea 15:
const ELECTION_DATE = '2024-05-19';`}
                            </pre>
                            <p>Cambia esta fecha al día de las elecciones reales en formato <code className="px-1 py-0.5 bg-muted rounded">YYYY-MM-DD</code>.</p>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="bank">
                        <AccordionTrigger>Configurar datos bancarios para donaciones</AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-3 text-sm text-muted-foreground">
                            <p>Los datos bancarios se configuran en el archivo:</p>
                            <pre className="p-3 rounded-lg bg-muted font-mono text-xs overflow-x-auto">
{`src/components/DonationModule.tsx

// Busca y edita estos campos:
banco: 'NOMBRE DEL BANCO'
cuenta: 'NÚMERO DE CUENTA'
rnc: 'RNC DEL PARTIDO'`}
                            </pre>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </CardContent>
                </Card>

                {/* Reset Data */}
                <Card className="border-destructive/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive">
                      <Trash2 className="w-5 h-5" />
                      Zona de Peligro
                    </CardTitle>
                    <CardDescription>
                      Acciones irreversibles que afectan todos los datos
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 space-y-4">
                      <div>
                        <p className="font-bold text-foreground">Reiniciar Todos los Datos</p>
                        <p className="text-sm text-muted-foreground">
                          Elimina TODOS los registros, donaciones y datos de usuarios. Esta acción es irreversible y está diseñada para limpiar el sistema antes de un nuevo lanzamiento.
                        </p>
                      </div>
                      <Button
                        variant="destructive"
                        onClick={() => setShowResetModal(true)}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Reiniciar Sistema
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
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

      {/* Reset Confirmation Modal */}
      <Dialog open={showResetModal} onOpenChange={setShowResetModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              ¡Advertencia! Acción Irreversible
            </DialogTitle>
            <DialogDescription>
              Esta acción eliminará TODOS los registros, donaciones y datos de usuarios permanentemente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Para confirmar, escribe <strong className="text-foreground">REINICIAR</strong> en el campo de abajo:
            </p>
            <Input
              value={resetConfirmText}
              onChange={(e) => setResetConfirmText(e.target.value)}
              placeholder="Escribe REINICIAR para confirmar"
              className="font-mono"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowResetModal(false);
                setResetConfirmText('');
              }}
              disabled={resetting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleResetAllData}
              disabled={resetConfirmText !== 'REINICIAR' || resetting}
            >
              {resetting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Reiniciando...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Confirmar Reinicio
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
