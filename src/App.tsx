import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AnthemPlayer } from "@/components/AnthemPlayer";
import { PwaUpdater } from "@/components/PwaUpdater";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Install from "./pages/Install";
import Admin from "./pages/Admin";
import SessionClosed from "./pages/SessionClosed";
import IntegrityMap from "./pages/IntegrityMap";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <PwaUpdater />
      <AnthemPlayer />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/install" element={<Install />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/session-closed" element={<SessionClosed />} />
          <Route path="/mapa-integridad" element={<IntegrityMap />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
