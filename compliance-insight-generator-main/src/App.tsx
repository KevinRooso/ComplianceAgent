import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Index from "./pages/Index";
import Rankings from "./pages/Rankings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const NavBar = () => (
  <nav className="border-b bg-white">
    <div className="container mx-auto px-4 py-3 flex items-center justify-between">
      <Link to="/" className="text-xl font-bold text-primary">
        AI Compliance
      </Link>
      <div className="flex space-x-6">
        <Link 
          to="/" 
          className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
        >
          Home
        </Link>
        <Link 
          to="/rankings" 
          className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
        >
          Rankings
        </Link>
      </div>
    </div>
  </nav>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="min-h-screen bg-gray-50">
          <NavBar />
          <main className="container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/rankings" element={<Rankings />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
