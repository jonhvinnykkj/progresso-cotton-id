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
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, User, Package, Truck, Building } from "lucide-react";
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
  const { login, isAuthenticated, role } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

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
    if (isAuthenticated && role) {
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
    }
  }, [isAuthenticated, role, setLocation]);

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

      login(user);

      toast({
        title: "Login realizado com sucesso",
        description: `Bem-vindo, ${user.displayName || roles.find((r) => r.value === user.role)?.label}!`,
      });

      // Redirect based on role from server
      switch (user.role) {
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

  return (
    <div className="mobile-page bg-gradient-to-br from-green-50 via-white to-yellow-50 dark:from-background dark:via-background dark:to-background">
      {/* Hero section com gradiente da marca */}
      <div className="brand-gradient text-white py-12 px-4 shadow-xl">
        <div className="container mx-auto max-w-md text-center space-y-4">
          <div className="flex justify-center">
            <img
              src={logoProgresso}
              alt="Grupo Progresso"
              className="h-20 sm:h-24 w-auto drop-shadow-2xl"
            />
          </div>
          <h1 className="text-white font-bold drop-shadow-md">Rastreabilidade de Fardos</h1>
          <p className="text-sm text-white/95 leading-snug drop-shadow">
            Sistema de controle de algodão do campo ao beneficiamento
          </p>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 -mt-6">
        <Card className="w-full max-w-[360px] shadow-primary border-primary/10">
          <CardHeader className="space-y-2 pb-4">
            <CardTitle className="text-lg text-center">
              Acesse sua conta
            </CardTitle>
            <CardDescription className="text-center text-xs">
              Entre com suas credenciais para continuar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
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
                      <FormLabel className="text-sm">Usuário</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Digite seu usuário"
                          {...field}
                          disabled={isLoading}
                          data-testid="input-username"
                          className="h-11"
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
                      <FormLabel className="text-sm">Senha</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Digite sua senha"
                          {...field}
                          disabled={isLoading}
                          data-testid="input-password"
                          className="h-11"
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full h-11 shadow-primary hover-shadow-primary font-semibold"
                  disabled={isLoading}
                  data-testid="button-login"
                >
                  {isLoading ? "Entrando..." : "Entrar"}
                </Button>
              </form>
            </Form>

            <div className="p-3 bg-primary/5 rounded-lg space-y-2 border border-primary/20">
              <p className="text-xs font-semibold text-center text-primary">
                Credenciais de Teste
              </p>
              <div className="space-y-1.5">
                {roles.map((role) => (
                  <div
                    key={role.value}
                    className="flex items-center justify-between gap-2 text-xs"
                  >
                    <span className="font-medium text-muted-foreground truncate">
                      {role.label}:
                    </span>
                    <code className="bg-background px-2 py-1 rounded text-[10px] font-mono whitespace-nowrap">
                      {role.value}/{role.value}123
                    </code>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
