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
import logoProgresso from "/favicon2.png";
import fazendaBg from "/fazenda.jpeg";

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
    <div className="mobile-page relative min-h-screen overflow-hidden">
      {/* Background com imagem da fazenda */}
      <div className="absolute inset-0">
        <img 
          src={fazendaBg} 
          alt="Fazenda Progresso" 
          className="w-full h-full object-cover"
        />
        {/* Overlay verde escuro semi-transparente */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-900/90 via-emerald-800/85 to-green-900/90"></div>
      </div>
      
      {/* Partículas de algodão flutuantes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-5 animate-float-slow opacity-30" style={{ animationDelay: '0s' }}>
          <div className="w-16 h-16 bg-white rounded-full shadow-xl blur-sm"></div>
        </div>
        <div className="absolute top-20 right-10 animate-float-slow opacity-25" style={{ animationDelay: '2s' }}>
          <div className="w-12 h-12 bg-white rounded-full shadow-lg blur-sm"></div>
        </div>
        <div className="absolute top-1/3 left-1/4 animate-float-slow opacity-20" style={{ animationDelay: '4s' }}>
          <div className="w-20 h-20 bg-white rounded-full shadow-xl blur-sm"></div>
        </div>
        <div className="absolute bottom-1/4 right-1/3 animate-float-slow opacity-30" style={{ animationDelay: '3s' }}>
          <div className="w-24 h-24 bg-white rounded-full shadow-2xl blur-sm"></div>
        </div>
      </div>

      {/* Layout de duas colunas (Desktop) / Empilhado (Mobile) */}
      <div className="relative min-h-screen flex flex-col lg:flex-row">
        
        {/* Lado Esquerdo - Informações */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
          <div className="max-w-lg text-white space-y-6 lg:space-y-8 animate-fade-in-up">
            
            {/* Título e Descrição */}
            <div className="space-y-3 lg:space-y-4 text-center lg:text-left" style={{ animationDelay: '0.1s' }}>
              <h1 className="text-3xl lg:text-5xl font-bold drop-shadow-2xl leading-tight">
                Cotton
                <span className="block text-yellow-400">Management</span>
              </h1>
              
              <p className="text-base lg:text-lg text-white/95 font-medium drop-shadow-lg flex items-center justify-center lg:justify-start gap-2">
                🌱 <span>Rastreabilidade completa do campo ao beneficiamento</span>
              </p>
              
              <div className="w-24 h-1 bg-gradient-to-r from-yellow-400 to-green-400 mx-auto lg:mx-0 rounded-full"></div>
            </div>
            
            {/* Features */}
            <div className="space-y-3 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <div className="flex items-center gap-3 text-white/95 justify-center lg:justify-start">
                <div className="w-12 h-12 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20 shadow-lg">
                  <Wheat className="w-6 h-6" />
                </div>
                <span className="font-semibold text-base lg:text-lg">Gestão de Talhões e Safras</span>
              </div>
              
              <div className="flex items-center gap-3 text-white/95 justify-center lg:justify-start">
                <div className="w-12 h-12 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20 shadow-lg">
                  <Package className="w-6 h-6" />
                </div>
                <span className="font-semibold text-base lg:text-lg">Controle de Fardos em Tempo Real</span>
              </div>
              
              <div className="flex items-center gap-3 text-white/95 justify-center lg:justify-start">
                <div className="w-12 h-12 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20 shadow-lg">
                  <Truck className="w-6 h-6" />
                </div>
                <span className="font-semibold text-base lg:text-lg">Rastreamento de Transporte</span>
              </div>
            </div>
            
            {/* Badges */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <div className="flex items-center gap-2 px-5 py-2.5 bg-white/15 backdrop-blur-sm rounded-full text-sm font-bold border border-white/25 shadow-lg">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
                <span>Sistema Ativo</span>
              </div>
              <div className="flex items-center gap-2 px-5 py-2.5 bg-yellow-400/20 backdrop-blur-sm rounded-full text-sm font-bold border border-yellow-300/30 shadow-lg">
                <span>⚡</span>
                <span>100% Digital</span>
              </div>
            </div>
          </div>
        </div>

        {/* Lado Direito - Formulário de Login */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md space-y-6 animate-slide-up-bounce">
            
            {/* Logo acima do card */}
            <div className="flex justify-center">
              <div className="relative bg-white p-4 lg:p-5 rounded-3xl shadow-2xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center">
                <img
                  src={logoProgresso}
                  alt="Grupo Progresso"
                  className="h-12 lg:h-14 w-auto object-contain"
                />
              </div>
            </div>

            {/* Card de Login */}
            <Card className="w-full shadow-2xl border-2 border-white/20 backdrop-blur-xl bg-white/98 dark:bg-gray-900/95 rounded-3xl overflow-hidden">
            
            <CardHeader className="space-y-3 pb-6 pt-10 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-900 border-b-2 border-green-100 dark:border-gray-700">
              <div className="flex justify-center">
                <div className="p-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg">
                  <Lock className="w-8 h-8 text-white" />
                </div>
              </div>
              
              <CardTitle className="text-2xl text-center font-bold text-gray-800 dark:text-white">
                Login de Usuário
              </CardTitle>
              
              <CardDescription className="text-center text-gray-600 dark:text-gray-400">
                Entre com suas credenciais para acessar o sistema
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-5 p-6 lg:p-8">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-bold text-white dark:text-white drop-shadow-lg">
                          Usuário
                        </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="usuario"
                          {...field}
                          disabled={isLoading}
                          data-testid="input-username"
                          className="h-12 rounded-xl border-2 border-white/40 focus:border-white/60 transition-all bg-white/20 backdrop-blur-sm text-white placeholder:text-white/70 font-medium"
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
                      <FormLabel className="text-base font-bold text-white dark:text-white drop-shadow-lg">
                        Senha
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          {...field}
                          disabled={isLoading}
                          data-testid="input-password"
                          className="h-12 rounded-xl border-2 border-white/40 focus:border-white/60 transition-all bg-white/20 backdrop-blur-sm text-white placeholder:text-white/70 font-medium"
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full mt-6 h-12 text-base font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 bg-green-600 hover:bg-green-700 text-white uppercase"
                  disabled={isLoading}
                  data-testid="submit-login"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    "ENTRAR"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
          </div>
        </div>
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
