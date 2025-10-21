import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import FeaturesPage from "./pages/FeaturesPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import AboutPage from "./pages/AboutPage";
import  PricingPage  from "./pages/PricingPage";
import OverviewDashboard from "./pages/OverviewDashboard";
import WorkflowsList from "./pages/WorkflowsList";
import WorkflowBuilder from "./pages/WorkflowBuilder";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Marketing Pages */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          
          {/* Authentication */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Application Pages (Protected) */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <OverviewDashboard />
            </ProtectedRoute>
          } />
          <Route path="/personal" element={
            <ProtectedRoute>
              <WorkflowsList />
            </ProtectedRoute>
          } />
          <Route path="/projects" element={
            <ProtectedRoute>
              <WorkflowsList />
            </ProtectedRoute>
          } />
          <Route path="/workflows" element={
            <ProtectedRoute>
              <WorkflowsList />
            </ProtectedRoute>
          } />
          <Route path="/credentials" element={
            <ProtectedRoute>
              <WorkflowsList />
            </ProtectedRoute>
          } />
          <Route path="/executions" element={
            <ProtectedRoute>
              <WorkflowsList />
            </ProtectedRoute>
          } />
          <Route path="/data-tables" element={
            <ProtectedRoute>
              <WorkflowsList />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <WorkflowsList />
            </ProtectedRoute>
          } />
          <Route path="/workflow/new" element={
            <ProtectedRoute>
              <WorkflowBuilder />
            </ProtectedRoute>
          } />
          <Route path="/workflow/:id" element={
            <ProtectedRoute>
              <WorkflowBuilder />
            </ProtectedRoute>
          } />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
