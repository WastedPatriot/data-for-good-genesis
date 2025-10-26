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
import Profile from "./pages/Profile";
import Contact from "./pages/Contact";
import Help from "./pages/Help";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import DataCollection from "./pages/DataCollection";
import OrganizationSignup from "./pages/OrganizationSignup";
import OrganizationProfile from "./pages/OrganizationProfile";
import Admin from "./pages/Admin";
import AdminReview from "./pages/AdminReview";
import AdminReleasePolicy from "./pages/AdminReleasePolicy";
import AdminUsers from "./pages/admin/Users";
import AdminDatasets from "./pages/admin/Datasets";
import AdminPurchases from "./pages/admin/Purchases";
import SystemLogs from "./pages/admin/SystemLogs";
import ContactManagement from "./pages/admin/ContactManagement";
import LiveAnalytics from "./pages/admin/LiveAnalytics";
import VisitorInsights from "./pages/admin/VisitorInsights";
import WarmLeads from "./pages/admin/WarmLeads";
import DataPipeline from "./pages/admin/DataPipeline";
import Communications from "./pages/admin/Communications";
import Campaigns from "./pages/admin/Campaigns";
import AdminDatasetBuilder from "./pages/admin/DatasetBuilder";
import ImpactTransparency from "./pages/ImpactTransparency";
import WhyContribute from "./pages/WhyContribute";
import ImpactDashboard from "./pages/ImpactDashboard";
import EnterpriseDashboard from "./pages/EnterpriseDashboard";
import Domains from "./pages/Domains";
import { ProtectedRoute } from "./components/ProtectedRoute";
import NotFound from "./pages/NotFound";
import Navigation from "./components/Navigation";
import Earth3DBackground from "./components/Earth3DBackground";
import { useVisitorTracking } from "./hooks/useVisitorTracking";
import { useLeadScoring } from "./hooks/useLeadScoring";
import { CookieConsent } from "./components/CookieConsent";

const queryClient = new QueryClient();

const AppContent = () => {
  useVisitorTracking();
  useLeadScoring();
  
  return (
    <>
      <Earth3DBackground />
      <div
        className="pointer-events-none fixed inset-0 z-[1] bg-[radial-gradient(ellipse_at_center,_hsl(var(--background)/0.35)_0%,_hsl(var(--background)/0.6)_60%,_hsl(var(--background)/0.75)_100%)]"
        aria-hidden="true"
      />
      <Navigation />
      <CookieConsent />
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
          <Route path="/profile" element={<Profile />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/help" element={<Help />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/data-collection" element={<DataCollection />} />
          <Route path="/organization-signup" element={<OrganizationSignup />} />
          <Route path="/organization-profile" element={<OrganizationProfile />} />
          <Route path="/admin" element={
            <ProtectedRoute requireAdmin={true}>
              <Admin />
            </ProtectedRoute>
          } />
          <Route path="/admin/review" element={
            <ProtectedRoute requireAdmin={true}>
              <AdminReview />
            </ProtectedRoute>
          } />
          <Route path="/admin/release-policy" element={
            <ProtectedRoute requireAdmin={true}>
              <AdminReleasePolicy />
            </ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute requireAdmin={true}>
              <AdminUsers />
            </ProtectedRoute>
          } />
          <Route path="/admin/datasets" element={
            <ProtectedRoute requireAdmin={true}>
              <AdminDatasets />
            </ProtectedRoute>
          } />
          <Route path="/admin/purchases" element={
            <ProtectedRoute requireAdmin={true}>
              <AdminPurchases />
            </ProtectedRoute>
          } />
          <Route path="/admin/logs" element={
            <ProtectedRoute requireAdmin={true}>
              <SystemLogs />
            </ProtectedRoute>
          } />
          <Route path="/admin/contacts" element={
            <ProtectedRoute requireAdmin={true}>
              <ContactManagement />
            </ProtectedRoute>
          } />
          <Route path="/admin/analytics" element={
            <ProtectedRoute requireAdmin={true}>
              <LiveAnalytics />
            </ProtectedRoute>
          } />
          <Route path="/admin/visitor-insights" element={
            <ProtectedRoute requireAdmin={true}>
              <VisitorInsights />
            </ProtectedRoute>
          } />
          <Route path="/admin/warm-leads" element={
            <ProtectedRoute requireAdmin={true}>
              <WarmLeads />
            </ProtectedRoute>
          } />
          <Route path="/admin/data-pipeline" element={
            <ProtectedRoute requireAdmin={true}>
              <DataPipeline />
            </ProtectedRoute>
          } />
          <Route path="/admin/communications" element={
            <ProtectedRoute requireAdmin={true}>
              <Communications />
            </ProtectedRoute>
          } />
          <Route path="/admin/campaigns" element={
            <ProtectedRoute requireAdmin={true}>
              <Campaigns />
            </ProtectedRoute>
          } />
          <Route path="/admin/dataset-builder" element={
            <ProtectedRoute requireAdmin={true}>
              <AdminDatasetBuilder />
            </ProtectedRoute>
          } />
          <Route path="/impact-transparency" element={<ImpactTransparency />} />
          <Route path="/enterprise/dashboard" element={
            <ProtectedRoute requireAdmin={false}>
              <EnterpriseDashboard />
            </ProtectedRoute>
          } />
          <Route path="/domains" element={<Domains />} />
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
