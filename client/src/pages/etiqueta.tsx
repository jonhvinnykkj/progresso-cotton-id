import { useState, useRef, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Printer, QrCode, ArrowLeft, Package, MapPin, Loader2 } from "lucide-react";
import QRCode from "qrcode";
import logoProgresso from "/favicon.png";
import type { Bale } from "@shared/schema";

export default function Etiqueta() {
  const [, setLocation] = useLocation();
  const searchParams = new URLSearchParams(useSearch());
  const baleId = searchParams.get("baleId");
  const { user } = useAuth();
  const { toast } = useToast();
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const printAreaRef = useRef<HTMLDivElement>(null);

  // Buscar dados do fardo
  const { data: bale, isLoading } = useQuery<Bale>({
    queryKey: ["/api/bales", baleId],
    enabled: !!baleId,
  });

  // Gerar QR Code quando o fardo for carregado
  useEffect(() => {
    if (bale && bale.qrCode) {
      generateQR(bale.qrCode);
    }
  }, [bale]);

  const generateQR = async (qrCode: string) => {
    try {
      const qrDataURL = await QRCode.toDataURL(qrCode, {
        width: 800,
        margin: 1,
        errorCorrectionLevel: "H",
      });
      setQrDataUrl(qrDataURL);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao gerar QR Code",
        description: error instanceof Error ? error.message : "Erro desconhecido",
      });
    }
  };

  const handlePrint = () => {
    if (!qrDataUrl) {
      toast({
        variant: "destructive",
        title: "Etiqueta não disponível",
        description: "Aguarde o carregamento da etiqueta",
      });
      return;
    }

    window.print();
  };

  const handleBack = () => {
    setLocation("/campo");
  };

  if (!baleId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Erro</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              ID do fardo não fornecido. Volte e tente novamente.
            </p>
            <Button onClick={handleBack} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Carregando etiqueta...</p>
        </div>
      </div>
    );
  }

  if (!bale) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Fardo não encontrado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              O fardo com ID {baleId} não foi encontrado no sistema.
            </p>
            <Button onClick={handleBack} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-background print:hidden">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between gap-4 py-3 sm:py-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleBack}
                  data-testid="button-back"
                  className="shrink-0"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <img 
                  src={logoProgresso} 
                  alt="Grupo Progresso" 
                  className="h-8 sm:h-10 w-auto shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <h1 className="text-base sm:text-xl font-semibold truncate">Etiqueta do Fardo</h1>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">
                    {user?.username}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Conteúdo principal */}
        <main className="container mx-auto px-4 py-6 max-w-2xl space-y-6">
          
          {/* QR Code - Destaque Principal */}
          {qrDataUrl && (
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2">
                  <QrCode className="w-5 h-5 text-primary shrink-0" />
                  QR Code do Fardo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col items-center justify-center gap-6 p-8 bg-white dark:bg-zinc-900 rounded-lg">
                  <img 
                    src={qrDataUrl} 
                    alt="QR Code" 
                    className="w-full max-w-sm aspect-square"
                    data-testid="qr-code-preview"
                  />
                  <div className="text-center space-y-2">
                    <p className="text-xs text-muted-foreground font-medium">ID do Fardo</p>
                    <p className="text-xl font-mono font-bold">{bale.id}</p>
                  </div>
                </div>

                <Button
                  onClick={handlePrint}
                  className="w-full"
                  size="lg"
                  data-testid="button-print-label"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Imprimir Etiqueta
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Informações do Fardo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-primary shrink-0" />
                Informações do Fardo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Talhão</p>
                  <p className="text-lg font-semibold">{bale.talhao}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Número</p>
                  <p className="text-lg font-semibold">{bale.numero}</p>
                </div>
              </div>

              {bale.safra && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground font-medium">Safra</p>
                  <p className="text-lg font-semibold">{bale.safra}</p>
                </div>
              )}

              {bale.campoLatitude && bale.campoLongitude && (
                <div className="pt-4 border-t">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-primary shrink-0 mt-1" />
                    <div className="text-sm">
                      <p className="font-medium text-muted-foreground">Localização GPS</p>
                      <p className="font-mono text-xs mt-1">
                        {bale.campoLatitude}, {bale.campoLongitude}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t bg-primary/5 rounded-lg p-4 -mx-6 -mb-6 mt-6">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4 text-primary shrink-0" />
                  Próximos Passos
                </h3>
                <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                  <li>Imprima a etiqueta em impressora térmica móvel</li>
                  <li>Cole a etiqueta no fardo físico</li>
                  <li>O fardo está pronto para ser transportado</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Print-only area - Layout otimizado para impressão térmica */}
      {qrDataUrl && bale && (
        <div className="hidden print:block fixed inset-0 z-[9999]" ref={printAreaRef}>
          <style>
            {`
              @media print {
                @page {
                  margin: 0.3in;
                  size: 4in 6in;
                }
                body {
                  margin: 0 !important;
                  padding: 0 !important;
                }
                * {
                  print-color-adjust: exact !important;
                  -webkit-print-color-adjust: exact !important;
                }
                .print\\:hidden {
                  display: none !important;
                }
              }
            `}
          </style>
          <div className="w-full h-full bg-white flex items-start justify-center p-6">
            <div className="flex flex-col items-center w-full max-w-md" style={{ gap: '24px' }}>
              {/* QR Code - Maior e bem espaçado */}
              <div className="flex items-center justify-center w-full">
                <img 
                  src={qrDataUrl} 
                  alt="QR Code do Fardo" 
                  style={{ 
                    width: '280px', 
                    height: '280px',
                    display: 'block'
                  }}
                />
              </div>
              
              {/* Informações - Bem espaçadas abaixo do QR */}
              <div className="text-center w-full" style={{ marginTop: '16px' }}>
                <div style={{ marginBottom: '20px' }}>
                  <p style={{ 
                    fontSize: '12px', 
                    color: '#666',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontWeight: '500',
                    marginBottom: '8px'
                  }}>
                    ID do Fardo
                  </p>
                  <p style={{ 
                    fontSize: '20px', 
                    fontFamily: 'monospace',
                    fontWeight: 'bold',
                    color: '#000',
                    wordBreak: 'break-all'
                  }}>
                    {bale.id}
                  </p>
                </div>
                
                <div style={{ marginTop: '20px' }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    gap: '16px',
                    marginBottom: '12px'
                  }}>
                    <div style={{ fontWeight: '600', fontSize: '16px' }}>
                      <span style={{ color: '#666' }}>Talhão: </span>
                      <span style={{ color: '#000' }}>{bale.talhao}</span>
                    </div>
                    <span style={{ color: '#ccc' }}>|</span>
                    <div style={{ fontWeight: '600', fontSize: '16px' }}>
                      <span style={{ color: '#666' }}>Número: </span>
                      <span style={{ color: '#000' }}>{bale.numero}</span>
                    </div>
                  </div>
                  
                  {bale.safra && (
                    <div style={{ 
                      fontWeight: '600', 
                      fontSize: '16px',
                      marginTop: '12px'
                    }}>
                      <span style={{ color: '#666' }}>Safra: </span>
                      <span style={{ color: '#000' }}>{bale.safra}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
