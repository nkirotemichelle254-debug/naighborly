import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import { PostsProvider } from "@/context/PostsContext";
import { MessagesProvider } from "@/context/MessagesContext";
import { BlocksProvider } from "@/context/BlocksContext";
import AppLayout from "@/components/layout/AppLayout";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import Home from "@/pages/Home";
import Create from "@/pages/Create";
import Details from "@/pages/Details";
import Inbox from "@/pages/Inbox";
import Profile from "@/pages/Profile";
import NotFound from "@/pages/NotFound";
import UserProfile from "@/pages/UserProfile";

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
      <BlocksProvider>
        <PostsProvider>
          <MessagesProvider>
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
                  <Route path="/create" element={<Create />} />
                  <Route path="/inbox" element={<Inbox />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/post/:id" element={<Details />} />
                  <Route path="/user/:id" element={<UserProfile />} />
                </Route>
                <Route path="/legacy" element={<LegacyRedirect />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
            </TooltipProvider>
          </MessagesProvider>
        </PostsProvider>
      </BlocksProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
