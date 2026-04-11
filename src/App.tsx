import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/components/ichub/AuthProvider";
import { SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "@/components/ichub/AppSidebar";
import Index from "./pages/Index.tsx";
import TopicPage from "./pages/TopicPage.tsx";
import TagsPage from "./pages/TagsPage.tsx";
import QueuePage from "./pages/QueuePage.tsx";
import StatsPage from "./pages/StatsPage.tsx";
import CoursesPage from "./pages/CoursesPage.tsx";
import CourseDetailPage from "./pages/CourseDetailPage.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <SidebarProvider>
            <div className="min-h-screen flex w-full">
              <AppSidebar />
              <main className="flex-1 overflow-auto">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/topic" element={<TopicPage />} />
                  <Route path="/tags" element={<TagsPage />} />
                  <Route path="/stats" element={<StatsPage />} />
                  <Route path="/queue" element={<QueuePage />} />
                  <Route path="/courses" element={<CoursesPage />} />
                  <Route path="/courses/:id" element={<CourseDetailPage />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
            </div>
          </SidebarProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
