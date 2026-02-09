import { useState, useEffect } from 'react';
import { 
  Send, 
  MessageSquare, 
  Loader2,
  Trash2,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface Communication {
  id: string;
  subject: string;
  body: string;
  created_at: string;
}

export const AdminCommunications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedComm, setSelectedComm] = useState<Communication | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCommunications = async () => {
    try {
      const { data, error } = await supabase
        .from('communications')
        .select('id, subject, body, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCommunications(data || []);
    } catch (err) {
      console.error('Error fetching communications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunications();
  }, []);

  const handleSend = async () => {
    if (!subject.trim() || !body.trim() || !user) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('communications')
        .insert({
          subject: subject.trim(),
          body: body.trim(),
          author_id: user.id,
        });

      if (error) throw error;

      toast({
        title: '¡Comunicado enviado!',
        description: 'El mensaje ha sido publicado para todos los militantes.',
      });

      setSubject('');
      setBody('');
      fetchCommunications();
    } catch (err: any) {
      console.error('Error sending communication:', err);
      toast({
        title: 'Error',
        description: err.message || 'No se pudo enviar el comunicado.',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedComm) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('communications')
        .delete()
        .eq('id', selectedComm.id);

      if (error) throw error;

      toast({
        title: 'Comunicado eliminado',
        description: 'El mensaje ha sido eliminado.',
      });

      setShowDeleteModal(false);
      setSelectedComm(null);
      fetchCommunications();
    } catch (err: any) {
      console.error('Error deleting communication:', err);
      toast({
        title: 'Error',
        description: err.message || 'No se pudo eliminar el comunicado.',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
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

  return (
    <div className="space-y-6">
      {/* New Communication Form */}
      <Card className="border-[#0047AB]/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="w-5 h-5 text-[#0047AB]" />
            Nuevo Comunicado
          </CardTitle>
          <CardDescription>
            Envía un mensaje o directriz a todos los militantes del FIN
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="comm-subject">Asunto</Label>
            <Input
              id="comm-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ej: Convocatoria importante para el domingo"
              maxLength={200}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="comm-body">Mensaje</Label>
            <Textarea
              id="comm-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Escribe el contenido del comunicado..."
              className="min-h-[150px]"
              maxLength={5000}
            />
          </div>
          <Button 
            onClick={handleSend}
            disabled={!subject.trim() || !body.trim() || sending}
            className="w-full bg-gradient-to-r from-[#0047AB] to-[#FF6B00]"
          >
            {sending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Publicar Comunicado
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Previous Communications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#FF6B00]" />
            Comunicados Anteriores
          </CardTitle>
          <CardDescription>
            Historial de mensajes enviados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : communications.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No hay comunicados enviados aún
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Asunto</TableHead>
                    <TableHead className="max-w-[300px]">Vista Previa</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {communications.map((comm) => (
                    <TableRow key={comm.id}>
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(comm.created_at)}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {comm.subject}
                      </TableCell>
                      <TableCell className="max-w-[300px] truncate text-muted-foreground">
                        {comm.body}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-destructive/50 text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            setSelectedComm(comm);
                            setShowDeleteModal(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Comunicado</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de eliminar el comunicado "{selectedComm?.subject}"? 
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteModal(false);
                setSelectedComm(null);
              }}
              disabled={deleting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Eliminando...
                </>
              ) : (
                'Eliminar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
