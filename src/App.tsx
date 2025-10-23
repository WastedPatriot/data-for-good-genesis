import React, { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Contribute from "./pages/Contribute";
import Marketplace from "./pages/Marketplace";
import ClaimBadge from "./pages/ClaimBadge";
import Projects from "./pages/Projects";
import SubmitProject from "./pages/SubmitProject";
import { LoadingScreen } from "./components/LoadingScreen";
import About from "./pages/About";
import Donate from "./pages/Donate";
import Login from "./pages/Login";
import Contact from "./pages/Contact";
import Help from "./pages/Help";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import OrganizationSignup from "./pages/OrganizationSignup";
import OrganizationProfile from "./pages/OrganizationProfile";
import Admin from "./pages/Admin";
import WhyContribute from "./pages/WhyContribute";
import ImpactDashboard from "./pages/ImpactDashboard";
import { ProtectedRoute } from "./components/ProtectedRoute";
import NotFound from "./pages/NotFound";
import Navigation from "./components/Navigation";
import Earth3DBackground from "./components/Earth3DBackground";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Earth3DBackground />
        <div
          className="pointer-events-none fixed inset-0 z-[1] bg-[radial-gradient(ellipse_at_center,_hsl(var(--background)/0.35)_0%,_hsl(var(--background)/0.6)_60%,_hsl(var(--background)/0.75)_100%)]"
          aria-hidden="true"
        />
        <Navigation />
        <div className="pt-16 relative z-10">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/contribute" element={<Contribute />} />
            <Route path="/why-contribute" element={<WhyContribute />} />
            <Route path="/impact-dashboard" element={<ImpactDashboard />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/claim-badge" element={<ClaimBadge />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/submit-project" element={<SubmitProject />} />
            <Route path="/about" element={<About />} />
            <Route path="/donate" element={<Donate />} />
            <Route path="/login" element={<Login />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/help" element={<Help />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/organization-signup" element={<OrganizationSignup />} />
            <Route path="/organization-profile" element={<OrganizationProfile />} />
            <Route path="/admin" element={
              <ProtectedRoute requireAdmin={true}>
                <Admin />
              </ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
