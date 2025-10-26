import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Trash2, UserPlus, Users } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

type UserRole = "admin" | "campo" | "transporte" | "algodoeira";

interface User {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
  createdAt: string;
  createdBy?: string;
}

export default function UserManagement() {
  const { user, selectedRole } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<UserRole[]>(["campo"]);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const toggleRole = (roleToToggle: UserRole) => {
    setSelectedRoles(prev => {
      if (prev.includes(roleToToggle)) {
        // Não permitir desmarcar se for o último
        if (prev.length === 1) return prev;
        return prev.filter(r => r !== roleToToggle);
      } else {
        return [...prev, roleToToggle];
      }
    });
  };

  // Verificar se é superadmin
  if (selectedRole !== "superadmin") {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Acesso Negado</CardTitle>
            <CardDescription>
              Apenas Super Administradores podem acessar esta página.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Buscar todos os usuários
  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["users"],
    queryFn: async () => {
      const response = await fetch("/api/users", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Erro ao buscar usuários");
      }
      return response.json();
    },
  });

  // Criar usuário
  const createUserMutation = useMutation({
    mutationFn: async (userData: { username: string; displayName: string; password: string; role: UserRole; roles: UserRole[] }) => {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(userData),
      });
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Erro ao criar usuário");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({
        title: "Usuário criado!",
        description: `Usuário ${displayName} foi criado com sucesso.`,
      });
      // Limpar formulário
      setUsername("");
      setDisplayName("");
      setPassword("");
      setSelectedRoles(["campo"]);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar usuário",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Deletar usuário
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Erro ao deletar usuário");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({
        title: "Usuário removido!",
        description: "O usuário foi removido do sistema.",
      });
      setUserToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao remover usuário",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !displayName || !password || selectedRoles.length === 0) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos e selecione pelo menos um papel.",
        variant: "destructive",
      });
      return;
    }
    // Usar o primeiro papel selecionado como papel principal
    const mainRole = selectedRoles[0];
    createUserMutation.mutate({ 
      username, 
      displayName, 
      password, 
      role: mainRole,
      roles: selectedRoles 
    });
  };

  const getRoleBadge = (role: UserRole | "superadmin") => {
    const roleColors: Record<string, string> = {
      superadmin: "bg-purple-500",
      admin: "bg-blue-500",
      campo: "bg-green-500",
      transporte: "bg-yellow-500",
      algodoeira: "bg-orange-500",
    };
    
    const roleLabels: Record<string, string> = {
      superadmin: "Super Admin",
      admin: "Administrador",
      campo: "Campo",
      transporte: "Transporte",
      algodoeira: "Algodoeira",
    };
    
    return (
      <Badge className={roleColors[role] || "bg-gray-500"}>
        {roleLabels[role] || role}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Formulário de Criação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Criar Novo Usuário
          </CardTitle>
          <CardDescription>
            Adicione um novo usuário ao sistema com permissões específicas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">Nome de Usuário (Login)</Label>
                <Input
                  id="username"
                  placeholder="Ex: joao.silva"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  minLength={3}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="displayName">Nome de Exibição</Label>
                <Input
                  id="displayName"
                  placeholder="Ex: João Silva"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  minLength={3}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Mínimo 4 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={4}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-3">
              <Label>Papéis de Acesso (selecione um ou mais)</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { value: "admin" as UserRole, label: "Administrador" },
                  { value: "campo" as UserRole, label: "Campo" },
                  { value: "transporte" as UserRole, label: "Transporte" },
                  { value: "algodoeira" as UserRole, label: "Algodoeira" }
                ].map(role => (
                  <div key={role.value} className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-accent">
                    <Checkbox 
                      id={role.value}
                      checked={selectedRoles.includes(role.value)}
                      onCheckedChange={() => toggleRole(role.value)}
                    />
                    <Label 
                      htmlFor={role.value} 
                      className="cursor-pointer flex-1"
                    >
                      {role.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            
            <Button type="submit" disabled={createUserMutation.isPending}>
              {createUserMutation.isPending ? "Criando..." : "Criar Usuário"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Tabela de Usuários */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Usuários do Sistema
          </CardTitle>
          <CardDescription>
            {users.length} usuário(s) cadastrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">Carregando usuários...</p>
          ) : users.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhum usuário encontrado</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome de Exibição</TableHead>
                  <TableHead>Login</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.displayName}</TableCell>
                    <TableCell className="text-muted-foreground">{u.username}</TableCell>
                    <TableCell>{getRoleBadge(u.role)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(u.createdAt).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right">
                      {u.id !== user?.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setUserToDelete(u)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover o usuário <strong>{userToDelete?.displayName}</strong>? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => userToDelete && deleteUserMutation.mutate(userToDelete.id)}
              className="bg-red-500 hover:bg-red-600"
            >
              Remover Usuário
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
