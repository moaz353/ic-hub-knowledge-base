import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/components/ichub/AuthProvider";
import RequireAuth from "@/components/ichub/RequireAuth";
import { SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "@/components/ichub/AppSidebar";
import Index from "./pages/Index.tsx";
import TopicPage from "./pages/TopicPage.tsx";
import TagsPage from "./pages/TagsPage.tsx";
import QueuePage from "./pages/QueuePage.tsx";
import StatsPage from "./pages/StatsPage.tsx";
import CoursesPage from "./pages/CoursesPage.tsx";
import CourseDetailPage from "./pages/CourseDetailPage.tsx";
import NotesPage from "./pages/NotesPage.tsx";
import TasksPage from "./pages/TasksPage.tsx";
import AuthPage from "./pages/AuthPage.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

function ProtectedShell() {
  return (
    <RequireAuth>
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
              <Route path="/notes" element={<NotesPage />} />
              <Route path="/tasks" element={<TasksPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </SidebarProvider>
    </RequireAuth>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/*" element={<ProtectedShell />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
