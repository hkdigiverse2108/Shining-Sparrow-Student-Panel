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

// Context Providers
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';

// Layout Wrapper
const AppLayout = () => {
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuth();
  
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
          <AppLayout />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
