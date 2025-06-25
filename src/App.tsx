
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppWalletProvider } from "./components/WalletProvider";
import { Header } from "./components/Header";
import { Landing } from "./pages/Landing";
import { CreateToken } from "./pages/CreateToken";
import { Wallet } from "./pages/Wallet";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AppWalletProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="min-h-screen fade-background">
            <Header />
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/create" element={<CreateToken />} />
              <Route path="/wallet" element={<Wallet />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </BrowserRouter>
      </AppWalletProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
