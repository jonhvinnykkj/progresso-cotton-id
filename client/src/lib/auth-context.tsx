import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { User, UserRole } from "@shared/schema";

interface AuthContextType {
  user: User | null;
  selectedRole: UserRole | null;
  setSelectedRole: (role: UserRole) => void;
  login: (user: User, selectedRole?: UserRole) => void;
  logout: () => void;
  isAuthenticated: boolean;
  clearCacheAndReload: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRoleState] = useState<UserRole | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("cotton_user");
    const storedRole = localStorage.getItem("cotton_selected_role");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        if (storedRole) {
          setSelectedRoleState(storedRole as UserRole);
        }
      } catch (error) {
        console.error("Error parsing stored user:", error);
        localStorage.removeItem("cotton_user");
        localStorage.removeItem("cotton_selected_role");
      }
    }
  }, []);

  const login = (newUser: User, role?: UserRole) => {
    setUser(newUser);
    localStorage.setItem("cotton_user", JSON.stringify(newUser));
    
    if (role) {
      setSelectedRoleState(role);
      localStorage.setItem("cotton_selected_role", role);
    }
  };

  const setSelectedRole = (role: UserRole) => {
    setSelectedRoleState(role);
    localStorage.setItem("cotton_selected_role", role);
  };

  const logout = () => {
    setUser(null);
    setSelectedRoleState(null);
    localStorage.removeItem("cotton_user");
    localStorage.removeItem("cotton_selected_role");
  };

  const clearCacheAndReload = async () => {
    try {
      // Clear all caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      
      // Clear localStorage (keep user session)
      const currentUser = localStorage.getItem("cotton_user");
      localStorage.clear();
      if (currentUser) {
        localStorage.setItem("cotton_user", currentUser);
      }
      
      // Clear sessionStorage
      sessionStorage.clear();
      
      // Unregister service worker
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(reg => reg.unregister()));
      }
      
      // Hard reload
      window.location.reload();
    } catch (error) {
      console.error('Error clearing cache:', error);
      // Reload anyway
      window.location.reload();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        selectedRole,
        setSelectedRole,
        login,
        logout,
        isAuthenticated: !!user,
        clearCacheAndReload,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
