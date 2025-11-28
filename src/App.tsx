import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layouts/AppLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Contacts from "./pages/Contacts";
import Listes from "./pages/Listes";
import GestionListe from "./pages/GestionListe";
import Campagnes from "./pages/Campagnes";
import NouvelleCampagne from "./pages/NouvelleCampagne";
import Statistiques from "./pages/Statistiques";
import Templates from "./pages/Templates";
import Parametres from "./pages/Parametres";
import ConfigurationSES from "./pages/ConfigurationSES";
import SuperAdmin from "./pages/SuperAdmin";
import Support from "./pages/Support";
import Unsubscribe from "./pages/Unsubscribe";
import Pricing from "./pages/Pricing";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/unsubscribe" element={<Unsubscribe />} />
            
            {/* Routes protégées */}
            <Route path="/dashboard" element={<AppLayout><Dashboard /></AppLayout>} />
            <Route path="/contacts" element={<AppLayout><Contacts /></AppLayout>} />
            <Route path="/listes" element={<AppLayout><Listes /></AppLayout>} />
            <Route path="/listes/:id" element={<AppLayout><GestionListe /></AppLayout>} />
            <Route path="/campagnes" element={<AppLayout><Campagnes /></AppLayout>} />
            <Route path="/campagnes/nouvelle" element={<AppLayout><NouvelleCampagne /></AppLayout>} />
            <Route path="/statistiques" element={<AppLayout><Statistiques /></AppLayout>} />
            <Route path="/templates" element={<AppLayout><Templates /></AppLayout>} />
            <Route path="/parametres" element={<AppLayout><Parametres /></AppLayout>} />
            <Route path="/config-ses" element={<AppLayout><ConfigurationSES /></AppLayout>} />
            <Route path="/superadmin" element={<AppLayout><ProtectedRoute requiredRole="superadmin"><SuperAdmin /></ProtectedRoute></AppLayout>} />
            <Route path="/support" element={<AppLayout><Support /></AppLayout>} />
            
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </TooltipProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
