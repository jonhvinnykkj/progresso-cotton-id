import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  loginSchema,
  type LoginCredentials,
  type UserRole,
} from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { Footer } from "@/components/footer";
import { ShieldCheck, User, Package, Truck, Building, Loader2, Lock, Wheat } from "lucide-react";
import logoProgresso from "/favicon.png";

const roles: {
  value: UserRole;
  label: string;
  icon: typeof User;
  description: string;
}[] = [
  {
    value: "superadmin",
    label: "Super Administrador",
    icon: ShieldCheck,
    description: "Acesso total + gestão de usuários",
  },
  {
    value: "admin",
    label: "Administrador",
    icon: ShieldCheck,
    description: "Acesso completo ao sistema",
  },
  {
    value: "campo",
    label: "Operador de Campo",
    icon: Package,
    description: "Cadastro de novos fardos",
  },
  {
    value: "transporte",
    label: "Transportador",
    icon: Truck,
    description: "Movimentação para pátio",
  },
  {
    value: "algodoeira",
    label: "Algodoeira",
    icon: Building,
    description: "Beneficiamento de fardos",
  },
];

export default function Login() {
  const [, setLocation] = useLocation();
  const { login, isAuthenticated, selectedRole } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showRoleSelector, setShowRoleSelector] = useState(false);
  const [pendingUser, setPendingUser] = useState<any>(null);
  const [availableRoles, setAvailableRoles] = useState<UserRole[]>([]);

  // Check and clear cache if app version changed
  useEffect(() => {
    const APP_VERSION = 'v4-superadmin';
    const storedVersion = localStorage.getItem('app_version');
    
    if (storedVersion && storedVersion !== APP_VERSION) {
      // Version changed, clear caches
      if ('caches' in window) {
        caches.keys().then(cacheNames => {
          cacheNames.forEach(cacheName => caches.delete(cacheName));
        });
      }
      localStorage.setItem('app_version', APP_VERSION);
    } else if (!storedVersion) {
      localStorage.setItem('app_version', APP_VERSION);
    }
  }, []);

  // Redirect authenticated users to their role-specific page
  useEffect(() => {
    if (isAuthenticated && selectedRole) {
      switch (selectedRole) {
        case "superadmin":
        case "admin":
          setLocation("/dashboard");
          break;
        case "campo":
          setLocation("/campo");
          break;
        case "transporte":
          setLocation("/transporte");
          break;
        case "algodoeira":
          setLocation("/algodoeira");
          break;
        default:
          setLocation("/dashboard");
      }
    }
  }, [isAuthenticated, selectedRole, setLocation]);

  const form = useForm<LoginCredentials>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginCredentials) => {
    setIsLoading(true);
    try {
      // Call backend auth API
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: data.username,
          password: data.password,
        }),
      });

      if (!response.ok) {
        throw new Error("Credenciais inválidas");
      }

      const user = await response.json();

      // Sempre mostrar dialog de seleção de papel
      if (user.availableRoles && user.availableRoles.length > 0) {
        setPendingUser(user);
        setAvailableRoles(user.availableRoles);
        setShowRoleSelector(true);
        setIsLoading(false);
        return;
      }

      // Fallback se não tiver papéis (não deveria acontecer)
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Usuário sem papéis definidos. Contate o administrador.",
      });
      setIsLoading(false);
      
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao fazer login",
        description:
          error instanceof Error
            ? error.message
            : "Verifique suas credenciais e tente novamente.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const completeLogin = (user: any, role: UserRole) => {
    login(user, role);

    toast({
      title: "Login realizado com sucesso",
      description: `Bem-vindo, ${user.displayName || roles.find((r) => r.value === role)?.label}!`,
    });

    // Redirect based on selected role
    switch (role) {
      case "superadmin":
      case "admin":
        setLocation("/dashboard");
        break;
      case "campo":
        setLocation("/campo");
        break;
      case "transporte":
        setLocation("/transporte");
        break;
      case "algodoeira":
        setLocation("/algodoeira");
        break;
      default:
        setLocation("/dashboard");
    }
  };

  const handleRoleSelect = (selectedRole: UserRole) => {
    if (pendingUser) {
      completeLogin(pendingUser, selectedRole);
      setShowRoleSelector(false);
      setPendingUser(null);
    }
  };

  return (
    <div className="mobile-page relative overflow-hidden min-h-screen bg-gradient-to-br from-emerald-400 via-green-500 to-emerald-600">
      {/* Animação de gradiente de fundo suave */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-300/20 via-green-400/20 to-emerald-500/20 animate-gradient-shift"></div>
      
      {/* Partículas de algodão flutuantes - mais suaves */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Bolinhas brancas de algodão */}
        <div className="absolute top-10 left-5 animate-float-slow opacity-60" style={{ animationDelay: '0s' }}>
          <div className="w-16 h-16 bg-white rounded-full shadow-xl"></div>
        </div>
        <div className="absolute top-20 right-10 animate-float-slow opacity-50" style={{ animationDelay: '2s' }}>
          <div className="w-12 h-12 bg-white rounded-full shadow-lg"></div>
        </div>
        <div className="absolute top-1/3 left-1/4 animate-float-slow opacity-40" style={{ animationDelay: '4s' }}>
          <div className="w-20 h-20 bg-white rounded-full shadow-xl"></div>
        </div>
        <div className="absolute bottom-1/4 right-1/3 animate-float-slow opacity-55" style={{ animationDelay: '3s' }}>
          <div className="w-24 h-24 bg-white rounded-full shadow-2xl"></div>
        </div>
        <div className="absolute bottom-10 left-10 animate-float-slow opacity-45" style={{ animationDelay: '5s' }}>
          <div className="w-10 h-10 bg-white rounded-full shadow-lg"></div>
        </div>
        <div className="absolute top-1/2 right-1/4 animate-float-slow opacity-50" style={{ animationDelay: '1s' }}>
          <div className="w-14 h-14 bg-white rounded-full shadow-lg"></div>
        </div>
        
        {/* Círculos pequenos adicionais */}
        <div className="absolute top-1/4 right-1/2 animate-pulse opacity-40">
          <div className="w-4 h-4 bg-white rounded-full"></div>
        </div>
        <div className="absolute bottom-1/3 left-1/3 animate-pulse opacity-35" style={{ animationDelay: '1.5s' }}>
          <div className="w-6 h-6 bg-white rounded-full"></div>
        </div>
      </div>

      {/* Hero section centralizado */}
      <div className="relative text-white py-12 px-4">
        <div className="container mx-auto max-w-md text-center space-y-5 relative z-10">
          <div className="flex justify-center animate-bounce-slow">
            <div className="relative">
              {/* Círculos brilhantes ao redor do logo */}
              <div className="absolute inset-0 bg-white/20 rounded-full blur-2xl animate-pulse"></div>
              <div className="absolute -inset-4 border-4 border-white/30 rounded-full animate-spin-slow"></div>
              
              {/* Logo */}
              <img
                src={logoProgresso}
                alt="Grupo Progresso"
                className="relative h-20 sm:h-24 w-auto drop-shadow-2xl transform hover:scale-110 transition-transform duration-500"
                style={{ 
                  filter: 'brightness(0) saturate(100%) invert(48%) sepia(79%) saturate(2476%) hue-rotate(86deg) brightness(100%) contrast(119%)'
                }}
              />
            </div>
          </div>
          
          <div className="space-y-2 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <h1 className="text-3xl sm:text-4xl font-bold drop-shadow-2xl tracking-tight">
              Progresso Cotton Management
            </h1>
            <div className="flex items-center justify-center gap-2 text-sm sm:text-base font-medium">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span className="text-white drop-shadow-lg">Rastreabilidade de Fardos</span>
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
          </div>
          
          <p className="text-sm text-white/95 leading-relaxed drop-shadow-lg max-w-xs mx-auto font-medium animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            🌱 Do campo ao beneficiamento
          </p>
          
          {/* Badges */}
          <div className="flex items-center justify-center gap-3 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold border border-white/30 shadow-lg">
              <div className="w-2 h-2 bg-green-300 rounded-full animate-ping"></div>
              <span>Sistema Ativo</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-yellow-400/25 backdrop-blur-sm rounded-full text-xs font-semibold border border-yellow-300/40 shadow-lg">
              <span>⚡</span>
              <span>100% Digital</span>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo principal - Card de Login */}
      <div className="relative flex-1 flex items-center justify-center px-4 pb-12">
        <Card className="w-full max-w-[380px] shadow-2xl border-3 border-white/70 backdrop-blur-sm bg-white/95 dark:bg-background/95 transform hover:scale-[1.01] transition-all duration-300 animate-slide-up-bounce relative overflow-visible rounded-2xl">
          
          <CardHeader className="space-y-2 pb-4 pt-8 relative">
            {/* Ícone de algodão no topo */}
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-white rounded-full p-3.5 shadow-xl border-4 border-green-100 animate-float-gentle z-10">
              <Wheat className="w-8 h-8 text-green-600" />
            </div>
            
            <div className="pt-6">
              <CardTitle className="text-xl text-center font-bold text-gray-800 flex items-center justify-center gap-2">
                <Lock className="w-5 h-5 text-gray-600" />
                Acesse sua conta
                <Lock className="w-5 h-5 text-gray-600" />
              </CardTitle>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4 relative pb-6">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-3"
              >
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" />
                        Usuário
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="admin"
                          {...field}
                          disabled={isLoading}
                          data-testid="input-username"
                          className="h-10 border-2 border-gray-200 focus:border-green-500 transition-colors bg-white"
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5" />
                        Senha
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          {...field}
                          disabled={isLoading}
                          data-testid="input-password"
                          className="h-10 border-2 border-gray-200 focus:border-green-500 transition-colors bg-white"
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full mt-5 h-11 text-sm font-bold shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                  disabled={isLoading}
                  data-testid="submit-login"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    <>Entrar no Sistema</>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      {/* Dialog de Seleção de Papel */}
      <Dialog open={showRoleSelector} onOpenChange={setShowRoleSelector}>
        <DialogContent className="sm:max-w-md rounded-2xl border-2">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <ShieldCheck className="w-5 h-5 text-green-600 dark:text-green-500" />
              </div>
              Selecione seu Papel
            </DialogTitle>
            <DialogDescription className="font-medium">
              Você tem acesso a múltiplos papéis. Escolha como deseja acessar o sistema.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            {availableRoles.map((roleValue) => {
              const roleInfo = roles.find((r) => r.value === roleValue);
              if (!roleInfo) return null;
              
              const Icon = roleInfo.icon;
              
              return (
                <Button
                  key={roleValue}
                  variant="outline"
                  className="h-auto p-4 justify-start border-2 rounded-xl hover:scale-[1.02] hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-950 hover:shadow-lg transition-all"
                  onClick={() => handleRoleSelect(roleValue)}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                      <Icon className="w-6 h-6 text-foreground" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-bold text-base">{roleInfo.label}</p>
                      <p className="text-xs text-muted-foreground font-medium">{roleInfo.description}</p>
                    </div>
                  </div>
                </Button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <Footer />
    </div>
  );
}
