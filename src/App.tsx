import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layouts/AppLayout";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Contacts from "./pages/Contacts";
import Listes from "./pages/Listes";
import Campagnes from "./pages/Campagnes";
import Profil from "./pages/Profil";
import ParametresEnvoi from "./pages/ParametresEnvoi";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            
            {/* Routes protégées */}
            <Route path="/dashboard" element={<AppLayout><Dashboard /></AppLayout>} />
            <Route path="/contacts" element={<AppLayout><Contacts /></AppLayout>} />
            <Route path="/listes" element={<AppLayout><Listes /></AppLayout>} />
            <Route path="/campagnes" element={<AppLayout><Campagnes /></AppLayout>} />
            <Route path="/profil" element={<AppLayout><Profil /></AppLayout>} />
            <Route path="/parametres-envoi" element={<AppLayout><ParametresEnvoi /></AppLayout>} />
            
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
