import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/components/ichub/AuthProvider";
import Header from "@/components/ichub/Header";
import Index from "./pages/Index.tsx";
import TopicPage from "./pages/TopicPage.tsx";
import TagsPage from "./pages/TagsPage.tsx";
import QueuePage from "./pages/QueuePage.tsx";
import StatsPage from "./pages/StatsPage.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Header />
          <main className="min-h-[calc(100vh-57px)]">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/topic" element={<TopicPage />} />
              <Route path="/tags" element={<TagsPage />} />
              <Route path="/stats" element={<StatsPage />} />
              <Route path="/queue" element={<QueuePage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
