import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ESIMHome from "./pages/ESIMHome";
import ESIMMarketplace from "./pages/ESIMMarketplace";
import MyESIMs from "./pages/MyESIMs";
import VirtualLocation from "./pages/VirtualLocation";
import Support from "./pages/Support";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import Navigation from "./components/Navigation";

const queryClient = new QueryClient();

const AppContent = () => {
  return (
    <>
      <Navigation />
      <Routes>
        <Route path="/" element={<ESIMHome />} />
        <Route path="/marketplace" element={<ESIMMarketplace />} />
        <Route path="/my-esims" element={<MyESIMs />} />
        <Route path="/virtual-location" element={<VirtualLocation />} />
        <Route path="/support" element={<Support />} />
        <Route path="/login" element={<Login />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
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
