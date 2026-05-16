import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query-client';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Toaster as Sonner } from "sonner";
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';

// Public pages
import Landing from '@/pages/Landing';
import Register from '@/pages/Register';
import Login from '@/pages/Login';
import PublicBooking from '@/pages/PublicBooking';

// App pages (authenticated)
import Dashboard from '@/pages/Dashboard';
import Appointments from '@/pages/Appointments';
import Patients from '@/pages/Patients';
import TreatmentRecords from '@/pages/TreatmentRecords';
import Courses from '@/pages/Courses';
import Billing from '@/pages/Billing';
import Staff from '@/pages/Staff';
import Reviews from '@/pages/Reviews';
import Settings from '@/pages/Settings';
import SuperAdmin from '@/pages/SuperAdmin';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') return <UserNotRegisteredError />;
    if (authError.type === 'auth_required') { navigateToLogin(); return null; }
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/book/:slug" element={<PublicBooking />} />

      {/* Protected app routes */}
      <Route element={<ProtectedRoute unauthenticatedElement={<Landing />} />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/patients" element={<Patients />} />
          <Route path="/treatment-records" element={<TreatmentRecords />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/invoices" element={<Billing />} />
          <Route path="/staff" element={<Staff />} />
          <Route path="/reviews" element={<Reviews />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/super-admin" element={<SuperAdmin />} />
        </Route>
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
        <Sonner richColors />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
