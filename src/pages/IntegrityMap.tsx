import { motion } from 'framer-motion';
import { ArrowLeft, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ProvinceMap } from '@/components/ProvinceMap';

const IntegrityMap = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-carbon" />
      
      {/* Header */}
      <motion.header
        className="relative z-10 px-6 py-4 border-b border-border"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <span className="font-bold text-foreground text-sm">FIN</span>
          </div>
        </div>
      </motion.header>

      {/* Content */}
      <main className="relative z-10 px-6 py-6">
        <ProvinceMap />
      </main>
    </div>
  );
};

export default IntegrityMap;