import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layouts/AppLayout";
import { SuperAdminLayout } from "@/components/layouts/SuperAdminLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { SubscriptionProtectedRoute } from "@/components/SubscriptionProtectedRoute";
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
import Checkout from "./pages/Checkout";
import CheckoutSuccess from "./pages/CheckoutSuccess";
import NotFound from "./pages/NotFound";
import TestEmail from "./pages/TestEmail";
import Team from "./pages/Team";
import Segmentation from "./pages/Segmentation";
import Automatisations from "./pages/Automatisations";
import Bounces from "./pages/Bounces";
import CampaignAnalytics from "./pages/CampaignAnalytics";
import CampaignDetails from "./pages/CampaignDetails";
import { ErrorBoundary } from "./lib/error-boundary";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
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
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/checkout/success" element={<CheckoutSuccess />} />
            <Route path="/unsubscribe" element={<Unsubscribe />} />
            <Route path="/support" element={<Support />} />
            
            {/* Routes protégées */}
            <Route path="/dashboard" element={<AppLayout><SubscriptionProtectedRoute><Dashboard /></SubscriptionProtectedRoute></AppLayout>} />
            <Route path="/contacts" element={<AppLayout><SubscriptionProtectedRoute><Contacts /></SubscriptionProtectedRoute></AppLayout>} />
            <Route path="/listes" element={<AppLayout><SubscriptionProtectedRoute><Listes /></SubscriptionProtectedRoute></AppLayout>} />
            <Route path="/listes/:id" element={<AppLayout><SubscriptionProtectedRoute><GestionListe /></SubscriptionProtectedRoute></AppLayout>} />
            <Route path="/campagnes" element={<AppLayout><SubscriptionProtectedRoute><Campagnes /></SubscriptionProtectedRoute></AppLayout>} />
            <Route path="/campagnes/nouvelle" element={<AppLayout><SubscriptionProtectedRoute><NouvelleCampagne /></SubscriptionProtectedRoute></AppLayout>} />
            <Route path="/campagnes/:id" element={<AppLayout><SubscriptionProtectedRoute><CampaignDetails /></SubscriptionProtectedRoute></AppLayout>} />
            <Route path="/campagnes/:id/edit" element={<SubscriptionProtectedRoute><NouvelleCampagne /></SubscriptionProtectedRoute>} />
            <Route path="/campagnes/:id/analytics" element={<AppLayout><SubscriptionProtectedRoute><CampaignAnalytics /></SubscriptionProtectedRoute></AppLayout>} />
            <Route path="/statistiques" element={<AppLayout><SubscriptionProtectedRoute><Statistiques /></SubscriptionProtectedRoute></AppLayout>} />
            <Route path="/templates" element={<AppLayout><SubscriptionProtectedRoute><Templates /></SubscriptionProtectedRoute></AppLayout>} />
            <Route path="/parametres" element={<AppLayout><SubscriptionProtectedRoute><Parametres /></SubscriptionProtectedRoute></AppLayout>} />
            <Route path="/team" element={<AppLayout><SubscriptionProtectedRoute><Team /></SubscriptionProtectedRoute></AppLayout>} />
            <Route path="/config-ses" element={<AppLayout><SubscriptionProtectedRoute><ConfigurationSES /></SubscriptionProtectedRoute></AppLayout>} />
            <Route path="/segmentation" element={<AppLayout><SubscriptionProtectedRoute><Segmentation /></SubscriptionProtectedRoute></AppLayout>} />
            <Route path="/automatisations" element={<AppLayout><SubscriptionProtectedRoute><Automatisations /></SubscriptionProtectedRoute></AppLayout>} />
            <Route path="/bounces" element={<AppLayout><SubscriptionProtectedRoute><Bounces /></SubscriptionProtectedRoute></AppLayout>} />
            <Route path="/test-email" element={<AppLayout><SubscriptionProtectedRoute><TestEmail /></SubscriptionProtectedRoute></AppLayout>} />
            <Route path="/superadmin" element={<SuperAdminLayout><ProtectedRoute requiredRole="superadmin"><SuperAdmin /></ProtectedRoute></SuperAdminLayout>} />
            
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </TooltipProvider>
    </BrowserRouter>
  </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
