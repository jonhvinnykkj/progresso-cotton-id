import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "./lib/auth-context";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Campo from "@/pages/campo";
import Transporte from "@/pages/transporte";
import Algodoeira from "@/pages/algodoeira";
import BaleDetails from "@/pages/bale-details";
import Etiqueta from "@/pages/etiqueta";
import SettingsPage from "@/pages/settings";
import TalhaoStats from "@/pages/talhao-stats";
import UserManagement from "@/pages/user-management";
import ReportsPage from "@/pages/reports";

function ProtectedRoute({ component: Component, allowedRoles }: { 
  component: () => JSX.Element; 
  allowedRoles?: string[] 
}) {
  const { isAuthenticated, selectedRole } = useAuth();

  if (!isAuthenticated) {
    return <Redirect to="/" />;
  }

  if (allowedRoles && selectedRole && !allowedRoles.includes(selectedRole)) {
    return <Redirect to="/" />;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Login} />
      
      <Route path="/dashboard">
        <ProtectedRoute component={Dashboard} />
      </Route>
      
      <Route path="/campo">
        <ProtectedRoute component={Campo} allowedRoles={["campo", "admin"]} />
      </Route>
      
      <Route path="/etiqueta">
        <ProtectedRoute component={Etiqueta} allowedRoles={["campo", "admin"]} />
      </Route>
      
      <Route path="/transporte">
        <ProtectedRoute component={Transporte} allowedRoles={["transporte", "admin"]} />
      </Route>
      
      <Route path="/algodoeira">
        <ProtectedRoute component={Algodoeira} allowedRoles={["algodoeira", "admin"]} />
      </Route>
      
      <Route path="/bale/:id">
        <ProtectedRoute component={BaleDetails} />
      </Route>
      
      <Route path="/settings">
        <ProtectedRoute component={SettingsPage} allowedRoles={["superadmin"]} />
      </Route>
      
      <Route path="/talhao-stats">
        <ProtectedRoute component={TalhaoStats} allowedRoles={["admin", "superadmin"]} />
      </Route>
      
      <Route path="/reports">
        <ProtectedRoute component={ReportsPage} allowedRoles={["admin", "superadmin"]} />
      </Route>
      
      <Route path="/users">
        <ProtectedRoute component={UserManagement} allowedRoles={["superadmin"]} />
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Router />
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
