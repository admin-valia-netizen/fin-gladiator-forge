import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, 
  MailOpen, 
  Calendar, 
  ArrowLeft,
  X,
  Loader2,
  Inbox
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';

interface Communication {
  id: string;
  subject: string;
  body: string;
  created_at: string;
}

interface CommunicationsInboxProps {
  onClose: () => void;
}

export const CommunicationsInbox = ({ onClose }: CommunicationsInboxProps) => {
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<Communication | null>(null);
  const [readMessages, setReadMessages] = useState<Set<string>>(() => {
    const stored = localStorage.getItem('fin-read-messages');
    return stored ? new Set(JSON.parse(stored)) : new Set();
  });

  useEffect(() => {
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

    fetchCommunications();
  }, []);

  const markAsRead = (id: string) => {
    const newReadMessages = new Set(readMessages);
    newReadMessages.add(id);
    setReadMessages(newReadMessages);
    localStorage.setItem('fin-read-messages', JSON.stringify([...newReadMessages]));
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

  const handleSelectMessage = (msg: Communication) => {
    setSelectedMessage(msg);
    markAsRead(msg.id);
  };

  const unreadCount = communications.filter(c => !readMessages.has(c.id)).length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background"
    >
      <div className="absolute inset-0 bg-gradient-carbon" />
      
      <div className="relative z-10 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-card/80 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onClose}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0047AB] to-[#FF6B00] flex items-center justify-center">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">Centro de Comunicaciones</h1>
                <p className="text-xs text-muted-foreground">
                  {unreadCount > 0 ? `${unreadCount} mensajes sin leer` : 'Todos los mensajes leídos'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : communications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                <Inbox className="w-10 h-10 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">Bandeja Vacía</h2>
              <p className="text-muted-foreground">
                No hay comunicados de la presidencia por el momento.
              </p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {selectedMessage ? (
                <motion.div
                  key="detail"
                  initial={{ x: 300, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 300, opacity: 0 }}
                  className="h-full flex flex-col"
                >
                  {/* Message Detail Header */}
                  <div className="p-4 border-b border-border">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setSelectedMessage(null)}
                      className="mb-3"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Volver
                    </Button>
                    <h2 className="text-xl font-bold text-foreground mb-1">
                      {selectedMessage.subject}
                    </h2>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      {formatDate(selectedMessage.created_at)}
                    </div>
                  </div>
                  
                  {/* Message Body */}
                  <ScrollArea className="flex-1 p-4">
                    <div className="prose prose-invert max-w-none">
                      <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                        {selectedMessage.body}
                      </p>
                    </div>
                  </ScrollArea>
                </motion.div>
              ) : (
                <motion.div
                  key="list"
                  initial={{ x: -300, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -300, opacity: 0 }}
                >
                  <ScrollArea className="h-full">
                    <div className="p-4 space-y-3">
                      {communications.map((msg, index) => {
                        const isRead = readMessages.has(msg.id);
                        return (
                          <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <Card 
                              className={`cursor-pointer transition-all hover:border-primary/50 ${
                                !isRead ? 'border-[#FF6B00]/50 bg-[#FF6B00]/5' : 'border-border'
                              }`}
                              onClick={() => handleSelectMessage(msg)}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-start gap-3">
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                                    !isRead 
                                      ? 'bg-gradient-to-br from-[#0047AB] to-[#FF6B00]' 
                                      : 'bg-muted'
                                  }`}>
                                    {isRead ? (
                                      <MailOpen className="w-5 h-5 text-muted-foreground" />
                                    ) : (
                                      <Mail className="w-5 h-5 text-white" />
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-start justify-between gap-2 mb-1">
                                      <h3 className={`font-semibold truncate ${
                                        !isRead ? 'text-foreground' : 'text-muted-foreground'
                                      }`}>
                                        {msg.subject}
                                      </h3>
                                      {!isRead && (
                                        <span className="shrink-0 w-2 h-2 rounded-full bg-[#FF6B00]" />
                                      )}
                                    </div>
                                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                      {msg.body}
                                    </p>
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                      <Calendar className="w-3 h-3" />
                                      {formatDate(msg.created_at)}
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </div>
    </motion.div>
  );
};
