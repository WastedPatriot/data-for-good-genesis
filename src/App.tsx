/**
 * App.tsx - Main Application Entry Point
 * 
 * ARCHITECTURE OVERVIEW:
 * DataForEarth is a full-stack data marketplace platform built on:
 * - Frontend: React + TypeScript + Vite
 * - UI: Tailwind CSS + shadcn/ui components + Framer Motion
 * - Backend: Supabase (PostgreSQL + Edge Functions)
 * - Payments: Stripe
 * - Auth: Supabase Auth
 * 
 * CORE FEATURES:
 * 1. Data Marketplace - Buy/sell anonymized datasets
 * 2. Eco Project Funding - Community-voted project funding
 * 3. Enterprise Badges - Tiered certification system
 * 4. Visitor Analytics - Track & package user behavior
 * 5. Admin Dashboard - Full platform management
 * 
 * ROUTING STRUCTURE:
 * - Public Routes: Home, Marketplace, Projects, About, etc.
 * - Auth Routes: Login, Profile, Organization Signup
 * - Protected Routes: Admin pages (role-based access)
 * - Data Routes: Contribute, Submit Data (anonymous OK)
 * 
 * SECURITY MODEL:
 * - Row-Level Security (RLS) on all Supabase tables
 * - Admin role verification via user_roles table
 * - Protected routes enforce authentication
 * - Visitor tracking respects opt-out preferences
 * 
 * DATA FLOW:
 * 1. Visitors browse site → tracked anonymously (if consented)
 * 2. Users submit data → stored in data_submissions
 * 3. AI analyzes submissions → curated_pool
 * 4. Admin builds datasets → datasets table + Stripe products
 * 5. Customers purchase → purchases table + badge generation
 * 6. Revenue allocated → community-voted projects
 * 
 * @module App
 * @requires react, react-router-dom
 */

import React, { useState } from "react";
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

// Keep some existing pages
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import Profile from "./pages/Profile";
import Contact from "./pages/Contact";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import ImpactDashboard from "./pages/ImpactDashboard";
import NotFound from "./pages/NotFound";
import Navigation from "./components/Navigation";
import Earth3DBackground from "./components/Earth3DBackground";
import { useVisitorTracking } from "./hooks/useVisitorTracking";
import { useLeadScoring } from "./hooks/useLeadScoring";
import { useAutomationHeartbeat } from "./hooks/useAutomationHeartbeat";
import { useSiteTheme } from "./hooks/useSiteTheme";
import ThemeSwitcher from "./components/ThemeSwitcher";
import HolidayDecorations from "./components/HolidayDecorations";
import { CookieConsent } from "./components/CookieConsent";

const queryClient = new QueryClient();

const AppContent = () => {
  useVisitorTracking();
  useLeadScoring();
  useAutomationHeartbeat();
  useSiteTheme();
  
  return (
    <>
      <Earth3DBackground />
      <HolidayDecorations />
      <div
        className="pointer-events-none fixed inset-0 z-[1] bg-[radial-gradient(ellipse_at_center,_hsl(var(--background)/0.35)_0%,_hsl(var(--background)/0.6)_60%,_hsl(var(--background)/0.75)_100%)]"
        aria-hidden="true"
      />
      <Navigation />
      <CookieConsent />
      <ThemeSwitcher />
      <div className="pt-16 relative z-10">
        <Routes>
          {/* Main eSIM App Routes */}
          <Route path="/" element={<ESIMHome />} />
          <Route path="/esim/marketplace" element={<ESIMMarketplace />} />
          <Route path="/esim/my-esims" element={<MyESIMs />} />
          <Route path="/esim/virtual-location" element={<VirtualLocation />} />
          <Route path="/support" element={<Support />} />
          
          {/* Impact & Environmental */}
          <Route path="/impact" element={<ImpactDashboard />} />
          
          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/profile" element={<Profile />} />
          
          {/* Legal & Support */}
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          
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
