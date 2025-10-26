import { useState } from "react";
import { useLocation } from "wouter";
import type { Bale } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { QRScanner } from "@/components/qr-scanner";
import { StatusBadge } from "@/components/status-badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { useOfflineBales } from "@/lib/use-offline-bales";
import {
  ScanLine,
  Truck,
  LogOut,
  Loader2,
  Package,
  AlertCircle,
  Wheat,
  Hash,
  CheckCircle2,
  Keyboard,
  WifiOff,
  Wifi,
  RefreshCw,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import logoProgresso from "/favicon.png";

export default function Transporte() {
  const [, setLocation] = useLocation();
  const { logout, user } = useAuth();
  const { toast } = useToast();
  const [showScanner, setShowScanner] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualBaleId, setManualBaleId] = useState("");
  const [scannedBale, setScannedBale] = useState<Bale | null>(null);

  const {
    bales,
    isLoading,
    isOnline,
    syncInProgress,
    updateStatus,
    isUpdating,
    syncPendingUpdates,
  } = useOfflineBales();

  const processBaleId = async (baleId: string) => {
    // Remove espaços em branco e normaliza o ID
    const normalizedId = baleId.trim().toUpperCase();
    
    console.log('🔍 DEBUG TRANSPORTE - ID do QR Code:', {
      original: baleId,
      normalizado: normalizedId,
      length: normalizedId.length,
      chars: normalizedId.split('').map(c => `${c}(${c.charCodeAt(0)})`).join(' ')
    });
    console.log('📦 Total de fardos disponíveis:', bales.length);
    console.log('📋 Primeiros 10 IDs no sistema:', bales.map(b => b.id).slice(0, 10));
    console.log('📋 Status dos fardos:', bales.map(b => ({ id: b.id, status: b.status })).slice(0, 5));
    
    // Busca pelo ID (que é o próprio QR Code) - case insensitive
    const bale = bales.find((b) => b.id.toUpperCase() === normalizedId);

    if (!bale) {
      console.error('❌ FARDO NÃO ENCONTRADO!');
      console.error('ID buscado:', normalizedId);
      console.error('Todos os IDs no sistema:', bales.map(b => b.id));
      
      // Tenta buscar direto na API como fallback
      try {
        const encodedId = encodeURIComponent(normalizedId);
        const response = await fetch(`/api/bales/${encodedId}`);
        if (response.ok) {
          const apiBale = await response.json();
          console.log('✅ Fardo encontrado direto na API:', apiBale);
          if (apiBale.status !== "campo") {
            toast({
              variant: "destructive",
              title: "Fardo não disponível",
              description: `Este fardo já está com status "${apiBale.status}". Apenas fardos no campo podem ser transportados.`,
            });
            return;
          }
          setScannedBale(apiBale);
          return;
        }
      } catch (error) {
        console.error('Erro ao buscar fardo na API:', error);
      }
      
      toast({
        variant: "destructive",
        title: "Fardo não encontrado",
        description: `ID "${normalizedId}" não está cadastrado no sistema.`,
      });
      return;
    }

    console.log('✅ Fardo encontrado:', bale);

    if (bale.status !== "campo") {
      toast({
        variant: "destructive",
        title: "Fardo não disponível",
        description: `Este fardo já está com status "${bale.status}". Apenas fardos no campo podem ser transportados.`,
      });
      return;
    }

    setScannedBale(bale);
  };

  const handleScan = async (qrCode: string) => {
    setShowScanner(false);
    await processBaleId(qrCode);
  };

  const handleManualSubmit = async () => {
    if (!manualBaleId.trim()) {
      toast({
        variant: "destructive",
        title: "ID inválido",
        description: "Por favor, digite um ID válido.",
      });
      return;
    }

    setShowManualInput(false);
    await processBaleId(manualBaleId.trim());
    setManualBaleId("");
  };

  const handleConfirmTransport = () => {
    if (!scannedBale) return;

    updateStatus(
      {
        id: scannedBale.id,
        data: {
          status: "patio",
          userId: user?.id,
        },
      },
      {
        onSuccess: () => {
          // Close modal after successful update
          setScannedBale(null);
        },
      }
    );
  };

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  return (
    <div className="mobile-page">
      {/* Header compacto mobile */}
      <header className="mobile-header">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex items-center justify-between gap-3 py-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <img 
                src={logoProgresso} 
                alt="Grupo Progresso" 
                className="h-8 w-auto shrink-0"
              />
              <div className="min-w-0 flex-1">
                <h1 className="text-base font-semibold truncate">Transporte</h1>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground truncate">
                    {user?.username}
                  </p>
                  {!isOnline && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      <WifiOff className="w-3 h-3 mr-1" />
                      Offline
                    </Badge>
                  )}
                  {syncInProgress && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                      Sync
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              data-testid="button-logout"
              className="h-9 shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Conteúdo principal mobile-first */}
      <main className="mobile-content">
        <div className="container mx-auto px-4 py-6 max-w-2xl space-y-5">
          
          {/* Alerta de modo offline */}
          {!isOnline && (
            <Alert className="border-amber-500/50 bg-amber-500/10">
              <WifiOff className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-sm">
                <strong>Modo Offline:</strong> Trabalhando com dados salvos localmente. 
                As atualizações serão sincronizadas quando você voltar online.
              </AlertDescription>
            </Alert>
          )}

          {!scannedBale ? (
            <Card className="shadow-md">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Truck className="w-5 h-5 text-primary shrink-0" />
                  Escanear Fardo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  <Button
                    onClick={() => setShowScanner(true)}
                    className="w-full h-11 shadow"
                    data-testid="button-scan-qr"
                  >
                    <ScanLine className="w-4 h-4 mr-2" />
                    Escanear QR Code
                  </Button>

                  <Button
                    onClick={() => setShowManualInput(true)}
                    variant="outline"
                    className="w-full h-11"
                    data-testid="button-manual-input"
                  >
                    <Keyboard className="w-4 h-4 mr-2" />
                    Digitar Manualmente
                  </Button>
                </div>

                <Alert className="border-primary/20 bg-primary/5">
                  <Package className="h-4 w-4 text-primary shrink-0" />
                  <AlertDescription className="text-sm leading-snug">
                    Escaneie o QR Code ou digite manualmente o ID do fardo que será transportado do campo para o
                    pátio. Apenas fardos com status "Campo" podem ser movimentados.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-md">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Truck className="w-5 h-5 text-primary shrink-0" />
                  Confirmar Transporte
                  <Badge variant="secondary" className="ml-auto">
                    Campo → Pátio
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-sm font-medium text-muted-foreground">
                      Status Atual:
                    </span>
                    <StatusBadge status={scannedBale.status} />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                        <Hash className="w-3 h-3" />
                        Número
                      </p>
                      <p className="font-semibold truncate" data-testid="text-bale-numero">
                        {scannedBale.numero}
                      </p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                        <Wheat className="w-3 h-3" />
                        Talhão
                      </p>
                      <p className="font-semibold truncate" data-testid="text-bale-talhao">
                        {scannedBale.talhao}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-primary/10 border border-primary/20 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-xs font-medium text-primary">QR Code / ID</p>
                      <p className="text-xs font-mono text-muted-foreground break-all leading-snug">
                        {scannedBale.id}
                      </p>
                    </div>
                  </div>

                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <AlertDescription className="text-sm leading-snug">
                      <strong>Atenção:</strong> Ao confirmar, o fardo será marcado como
                      "Pátio" e não poderá ser revertido para "Campo".
                    </AlertDescription>
                  </Alert>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setScannedBale(null)}
                    className="flex-1 h-11"
                    data-testid="button-cancel"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleConfirmTransport}
                    disabled={isUpdating}
                    className="flex-1 h-11 shadow"
                    data-testid="button-confirm-transport"
                  >
                    {isUpdating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {isOnline ? "Atualizando..." : "Salvando..."}
                      </>
                    ) : (
                      <>
                        <Truck className="w-4 h-4 mr-2" />
                        Confirmar
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Instruções */}
          <Card className="bg-muted/30 border-muted">
            <CardContent className="pt-5 pb-5">
              <h3 className="font-semibold text-sm mb-3">Instruções</h3>
              <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside leading-snug">
                <li>Escaneie o QR Code do fardo a ser transportado</li>
                <li>Verifique os dados do fardo exibidos</li>
                <li>Clique em "Confirmar" para atualizar o status</li>
              </ol>
            </CardContent>
          </Card>
        </div>
      </main>

      {showScanner && (
        <QRScanner onScan={handleScan} onClose={() => setShowScanner(false)} />
      )}

      {/* Manual Input Dialog */}
      <Dialog open={showManualInput} onOpenChange={setShowManualInput}>
        <DialogContent data-testid="dialog-manual-input">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Keyboard className="w-5 h-5" />
              Digitar ID do Fardo
            </DialogTitle>
            <DialogDescription>
              Digite o ID do fardo que você deseja processar. Você pode usar o ID completo ou o código QR.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="bale-id" className="text-sm font-medium">
                ID do Fardo
              </label>
              <Input
                id="bale-id"
                placeholder="Ex: fZZWULwYD1NY"
                value={manualBaleId}
                onChange={(e) => setManualBaleId(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleManualSubmit();
                  }
                }}
                data-testid="input-manual-bale-id"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowManualInput(false);
                setManualBaleId("");
              }}
              data-testid="button-cancel-manual"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleManualSubmit}
              disabled={!manualBaleId.trim()}
              data-testid="button-submit-manual"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Buscar Fardo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}