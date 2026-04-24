import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import AppLayout from "@/components/layout/AppLayout";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import Home from "@/pages/Home";
import ComingSoon from "@/pages/ComingSoon";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function LegacyRedirect() {
  if (typeof window !== "undefined") {
    window.location.replace("/naighborly-legacy/index.html");
  }
  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Navigate to="/home" replace />} />
              <Route path="/home" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route
                path="/create"
                element={<ComingSoon title="Create a post" description="Posting form is being migrated next." />}
              />
              <Route
                path="/inbox"
                element={<ComingSoon title="Messages" description="Inbox is being migrated next." />}
              />
              <Route
                path="/profile"
                element={<ComingSoon title="Profile" description="Profile is being migrated next." />}
              />
              <Route
                path="/post/:id"
                element={<ComingSoon title="Post details" description="Details screen is being migrated next." />}
              />
            </Route>
            <Route path="/legacy" element={<LegacyRedirect />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
