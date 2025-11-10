import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// eSIM App Pages
import ESIMHome from "./pages/ESIMHome";
import ESIMMarketplace from "./pages/ESIMMarketplace";
import MyESIMs from "./pages/MyESIMs";
import VirtualLocation from "./pages/VirtualLocation";
import Support from "./pages/Support";

// Website Pages
import Index from "./pages/Index";
import Home from "./pages/Home";
import About from "./pages/About";
import Marketplace from "./pages/Marketplace";
import Projects from "./pages/Projects";
import Contribute from "./pages/Contribute";
import Donate from "./pages/Donate";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import Contact from "./pages/Contact";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import Install from "./pages/Install";

import Navigation from "./components/Navigation";
import Earth3DBackground from "./components/Earth3DBackground";
import { CookieConsent } from "./components/CookieConsent";
import { useVisitorTracking } from "./hooks/useVisitorTracking";
import { useLeadScoring } from "./hooks/useLeadScoring";

const queryClient = new QueryClient();

const AppContent = () => {
  useVisitorTracking();
  useLeadScoring();
  
  return (
    <>
      <Earth3DBackground />
      <Navigation />
      <CookieConsent />
      
      <div className="pt-16 relative z-10">
        <Routes>
          {/* Main Landing - Auto-detect platform */}
          <Route path="/" element={<Index />} />
          
          {/* eSIM App Routes */}
          <Route path="/esim" element={<ESIMHome />} />
          <Route path="/esim/marketplace" element={<ESIMMarketplace />} />
          <Route path="/esim/my-esims" element={<MyESIMs />} />
          <Route path="/esim/virtual-location" element={<VirtualLocation />} />
          <Route path="/esim/support" element={<Support />} />
          
          {/* Website Routes */}
          <Route path="/home" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/contribute" element={<Contribute />} />
          <Route path="/donate" element={<Donate />} />
          <Route path="/admin" element={<Admin />} />
          
          {/* Shared Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/install" element={<Install />} />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
