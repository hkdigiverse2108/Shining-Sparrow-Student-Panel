import React from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { AuthGuard } from './components/AuthGuard';
import { Loader } from './components/Loader';
import { PageTransition } from './components/PageTransition';

// Pages
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { Dashboard } from './pages/Dashboard';
import { ProfilePage } from './pages/ProfilePage';
import { CourseDetailsPage } from './pages/CourseDetailsPage';
import { CourseLMSPage } from './pages/CourseLMSPage';
import { ExamInterfacePage } from './pages/ExamInterfacePage';
import { WorkshopLMSPage } from './pages/WorkshopLMSPage';
import { BlogDetailsPage } from './pages/BlogDetailsPage';
import { ChatPage } from './pages/ChatPage';
import { PaymentHistoryPage } from './pages/PaymentHistoryPage';
import { SupportPage } from './pages/SupportPage';
import { GalleryPage } from './pages/GalleryPage';

// Context Providers
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { ChatProvider } from './context/ChatContext';

// Layout Wrapper
const AppLayout = () => {
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuth();

  React.useEffect(() => {
    // Disable right click
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // Disable copy / paste / cut actions
    const handleCopy = (e: ClipboardEvent) => {
      e.clipboardData?.setData("text/plain", "Copying content is disabled on Shining Sparrow.");
      e.preventDefault();
    };

    // Disable print, inspect element and page source shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // Intercept PrintScreen and OS-level screenshot shortcuts
      if (
        e.key === "PrintScreen" ||
        (e.metaKey && e.shiftKey && (e.key === "s" || e.key === "S")) ||
        (e.metaKey && e.shiftKey && (e.key === "4" || e.key === "3"))
      ) {
        document.body.classList.add("screenshot-protect-blur");
        try {
          navigator.clipboard?.writeText("Screenshots are disabled on Shining Sparrow.").catch(() => {});
        } catch (err) {}
        e.preventDefault();
        return false;
      }

      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "J" || e.key === "C")) ||
        (e.ctrlKey && e.key === "u") ||
        (e.metaKey && e.altKey && e.key === "i")
      ) {
        e.preventDefault();
        return false;
      }
      if (
        (e.ctrlKey && (e.key === "s" || e.key === "p")) ||
        (e.metaKey && (e.key === "s" || e.key === "p"))
      ) {
        e.preventDefault();
        return false;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (
        e.key === "PrintScreen" ||
        (e.metaKey && e.shiftKey && (e.key === "s" || e.key === "S"))
      ) {
        document.body.classList.add("screenshot-protect-blur");
        try {
          navigator.clipboard?.writeText("Screenshots are disabled on Shining Sparrow.").catch(() => {});
        } catch (err) {}
      }
    };

    // Protect against screenshots/overlays by blurring when window loses focus and clearing clipboard
    const handleBlur = () => {
      document.body.classList.add("screenshot-protect-blur");
      try {
        navigator.clipboard?.writeText("Screenshots are disabled on Shining Sparrow.").catch(() => {});
      } catch {}
    };

    const handleFocus = () => {
      document.body.classList.remove("screenshot-protect-blur");
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        document.body.classList.add("screenshot-protect-blur");
        try {
          navigator.clipboard?.writeText("Screenshots are disabled on Shining Sparrow.").catch(() => {});
        } catch {}
      } else {
        document.body.classList.remove("screenshot-protect-blur");
      }
    };

    window.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("copy", handleCopy);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("copy", handleCopy);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);
  
  // Hide header and footer in assessment mode
  const isExamActive = location.pathname.startsWith('/exam/');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  const showSidebar = !isExamActive && isAuthenticated;

  return (
    <div className={`h-screen overflow-hidden bg-slate-50 dark:bg-page-dark transition-colors duration-200 ${showSidebar ? 'flex flex-col lg:flex-row' : 'flex flex-col'}`}>
      {showSidebar && <Sidebar />}
      
      <div className="grow flex flex-col min-w-0 h-full overflow-hidden">
        {showSidebar && <Header />}
        <div className="grow overflow-y-auto">
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              {/* Entry Gate */}
              <Route 
                path="/" 
                element={
                  isAuthenticated 
                    ? <Navigate to="/dashboard" replace /> 
                    : <PageTransition><LoginPage /></PageTransition>
                } 
              />
              <Route 
                path="/login" 
                element={
                  isAuthenticated 
                    ? <Navigate to="/dashboard" replace /> 
                    : <PageTransition><LoginPage /></PageTransition>
                } 
              />
              <Route 
                path="/signup" 
                element={
                  <PageTransition>
                    <SignupPage />
                  </PageTransition>
                } 
              />

              {/* Protected Paths */}
              <Route 
                path="/dashboard" 
                element={
                  <AuthGuard>
                    <PageTransition>
                      <Dashboard />
                    </PageTransition>
                  </AuthGuard>
                } 
              />
              <Route 
                path="/profile" 
                element={
                  <AuthGuard>
                    <PageTransition>
                      <ProfilePage />
                    </PageTransition>
                  </AuthGuard>
                } 
              />
              <Route 
                path="/payments/history" 
                element={
                  <AuthGuard>
                    <PageTransition>
                      <PaymentHistoryPage />
                    </PageTransition>
                  </AuthGuard>
                } 
              />
              <Route 
                path="/courses/:id" 
                element={
                  <AuthGuard>
                    <PageTransition>
                      <CourseDetailsPage />
                    </PageTransition>
                  </AuthGuard>
                } 
              />
              <Route 
                path="/lms/:courseId" 
                element={
                  <AuthGuard>
                    <PageTransition>
                      <CourseLMSPage />
                    </PageTransition>
                  </AuthGuard>
                } 
              />
              <Route 
                path="/exam/:examId" 
                element={
                  <AuthGuard>
                    <PageTransition>
                      <ExamInterfacePage />
                    </PageTransition>
                  </AuthGuard>
                } 
              />
              <Route 
                path="/workshop-lms/:workshopId" 
                element={
                  <AuthGuard>
                    <PageTransition>
                      <WorkshopLMSPage />
                    </PageTransition>
                  </AuthGuard>
                } 
              />
              <Route 
                path="/blogs/:id" 
                element={
                  <AuthGuard>
                    <PageTransition>
                      <BlogDetailsPage />
                    </PageTransition>
                  </AuthGuard>
                } 
              />
              <Route 
                path="/chat" 
                element={
                  <AuthGuard>
                    <PageTransition>
                      <ChatPage />
                    </PageTransition>
                  </AuthGuard>
                } 
              />
              <Route 
                path="/support" 
                element={
                  <AuthGuard>
                    <PageTransition>
                      <SupportPage />
                    </PageTransition>
                  </AuthGuard>
                } 
              />
              <Route 
                path="/gallery" 
                element={
                  <AuthGuard>
                    <PageTransition>
                      <GalleryPage />
                    </PageTransition>
                  </AuthGuard>
                } 
              />

              
              {/* Fallback */}
              <Route 
                path="*" 
                element={
                  isAuthenticated 
                    ? <Navigate to="/dashboard" replace /> 
                    : <Navigate to="/login" replace />
                } 
              />
            </Routes>
          </AnimatePresence>
        </div>

        {/* Footer removed to prevent extra scroll on panel pages */}
      </div>
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <ChatProvider>
            <AppLayout />
          </ChatProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
