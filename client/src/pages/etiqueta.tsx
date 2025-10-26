import { useState, useRef, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Printer, QrCode, ArrowLeft, Loader2 } from "lucide-react";
import QRCode from "qrcode";
import logoProgresso from "/favicon.png";
import type { Bale } from "@shared/schema";

export default function Etiqueta() {
  const [, setLocation] = useLocation();
  const searchParams = new URLSearchParams(useSearch());
  const baleIdsParam = searchParams.get("baleIds");
  const baleIds = baleIdsParam ? baleIdsParam.split(',') : [];
  
  const { user } = useAuth();
  const { toast } = useToast();
  const [qrDataUrls, setQrDataUrls] = useState<Map<string, string>>(new Map());
  const printAreaRef = useRef<HTMLDivElement>(null);

  // Buscar dados dos fardos (forçar refetch para garantir dados atualizados)
  const { data: allBales = [], isLoading } = useQuery<Bale[]>({
    queryKey: ["/api/bales"],
    refetchOnMount: "always", // Sempre buscar dados frescos ao montar
    staleTime: 0, // Considerar dados sempre stale
  });

  const bales = allBales.filter(b => baleIds.includes(b.id));

  // Debug: log para verificar se os fardos foram encontrados
  useEffect(() => {
    console.log("Etiqueta - IDs procurados:", baleIds);
    console.log("Etiqueta - Total fardos no sistema:", allBales.length);
    console.log("Etiqueta - Fardos encontrados:", bales.length);
    console.log("Etiqueta - Fardos encontrados (detalhes):", bales.map(b => ({ id: b.id })));
  }, [baleIds, allBales, bales]);

  // Gerar QR Codes quando os fardos forem carregados
  useEffect(() => {
    if (bales.length > 0) {
      generateQRCodes();
    }
  }, [bales]);

  const generateQRCodes = async () => {
    const newQrDataUrls = new Map<string, string>();
    
    for (const bale of bales) {
      try {
        const qrDataURL = await QRCode.toDataURL(bale.id, {
          width: 800,
          margin: 1,
          errorCorrectionLevel: "H",
        });
        newQrDataUrls.set(bale.id, qrDataURL);
      } catch (error) {
        console.error(`Error generating QR for bale ${bale.id}:`, error);
      }
    }
    
    setQrDataUrls(newQrDataUrls);
  };

  const handlePrint = () => {
    if (qrDataUrls.size === 0) {
      toast({
        variant: "destructive",
        title: "Etiquetas não disponíveis",
        description: "Aguarde o carregamento das etiquetas",
      });
      return;
    }

    window.print();
  };

  const handleBack = () => {
    setLocation("/campo");
  };

  if (baleIds.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Erro</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Nenhum fardo selecionado. Volte e tente novamente.
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
          <p className="text-sm text-muted-foreground">Carregando etiquetas...</p>
        </div>
      </div>
    );
  }

  if (bales.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Fardos não encontrados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Os fardos selecionados não foram encontrados no sistema.
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
                  <h1 className="text-base sm:text-xl font-semibold truncate">Etiquetas dos Fardos</h1>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">
                    {bales.length} {bales.length === 1 ? 'etiqueta' : 'etiquetas'} • {user?.username}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Conteúdo principal */}
        <main className="container mx-auto px-4 py-6 max-w-4xl space-y-6">
          
          {/* Preview das etiquetas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-primary shrink-0" />
                  Preview das Etiquetas
                </span>
                <Button
                  onClick={handlePrint}
                  size="lg"
                  data-testid="button-print-labels"
                  disabled={qrDataUrls.size === 0}
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Imprimir Todas
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {bales.map((bale) => {
                  const qrUrl = qrDataUrls.get(bale.id);
                  
                  return (
                    <div key={bale.id} className="border rounded-lg p-4 space-y-3">
                      {qrUrl ? (
                        <img 
                          src={qrUrl} 
                          alt={`QR Code ${bale.numero}`}
                          className="w-full aspect-square"
                        />
                      ) : (
                        <div className="w-full aspect-square bg-muted animate-pulse rounded" />
                      )}
                      
                      <div className="text-center space-y-1">
                        <p className="text-xs text-muted-foreground">Talhão: {bale.talhao}</p>
                        <p className="text-lg font-bold font-mono">{bale.numero}</p>
                        {bale.safra && (
                          <p className="text-xs text-muted-foreground">Safra: {bale.safra}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Informações */}
          <Card className="bg-muted/30 border-muted">
            <CardContent className="pt-5 pb-5">
              <h3 className="font-semibold text-sm mb-3">Instruções de Impressão</h3>
              <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                <li>Conecte a impressora térmica móvel</li>
                <li>Clique em "Imprimir Todas" acima</li>
                <li>Verifique se todas as etiquetas foram impressas corretamente</li>
                <li>Cole cada etiqueta no fardo físico correspondente</li>
              </ol>
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Print-only area */}
      {qrDataUrls.size > 0 && (
        <div className="hidden print:block" ref={printAreaRef}>
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
                .print-page-break {
                  page-break-after: always;
                }
              }
            `}
          </style>
          
          {bales.map((bale, index) => {
            const qrUrl = qrDataUrls.get(bale.id);
            if (!qrUrl) return null;
            
            return (
              <div 
                key={bale.id} 
                className={`w-full h-full bg-white flex items-start justify-center p-6 ${
                  index < bales.length - 1 ? 'print-page-break' : ''
                }`}
              >
                <div className="flex flex-col items-center w-full max-w-md" style={{ gap: '24px' }}>
                  {/* QR Code */}
                  <div className="flex items-center justify-center w-full">
                    <img 
                      src={qrUrl} 
                      alt={`QR Code ${bale.numero}`}
                      style={{ 
                        width: '280px', 
                        height: '280px',
                        display: 'block'
                      }}
                    />
                  </div>
                  
                  {/* Informações */}
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
            );
          })}
        </div>
      )}
    </>
  );
}