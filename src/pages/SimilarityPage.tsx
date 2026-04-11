import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowLeft, Brain, Calculator, Info, CheckCircle2 } from "lucide-react";
import { similarityService, MatrizSimilitud, ResultadoSimilitud } from "@/lib/similarityService";
import { useToast } from "@/hooks/use-toast";

const SimilarityPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<MatrizSimilitud | null>(null);
  
  const articles = location.state?.articles || [];

  useEffect(() => {
    if (articles.length < 2) {
      toast({
        title: "Selección insuficiente",
        description: "Se necesitan al menos 2 artículos para comparar.",
        variant: "destructive"
      });
      navigate("/");
      return;
    }

    const fetchAnalysis = async () => {
      setLoading(true);
      try {
        // Asegurar que mapeamos 'description' a 'resumen' para que el backend lo reconozca
        const mappedArticles = articles.map((art: any) => ({
          ...art,
          resumen: art.resumen || art.description // Intentar ambos por si acaso
        }));
        const data = await similarityService.analizarSimilitud(mappedArticles);
        setResults(data);
      } catch (error) {
        toast({
          title: "Error en el análisis",
          description: "No se pudo completar el análisis de similitud.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [articles, navigate, toast]);

  const getScoreColor = (score: number) => {
    if (score > 0.8) return "text-success font-bold";
    if (score > 0.5) return "text-primary font-semibold";
    return "text-muted-foreground";
  };

  const formatScore = (score: number) => (score * 100).toFixed(1) + "%";

  return (
    <div className="container mx-auto py-6 space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Análisis de Similitud Textual</h1>
          <p className="text-muted-foreground">Comparación algorítmica de abstracts y contenido científico</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {articles.map((art: any, idx: number) => (
          <Card key={art.id} className="border-l-4 border-l-primary">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <Badge variant="outline">Documento {idx + 1}</Badge>
                <span className="text-xs text-muted-foreground font-mono">{art.id}</span>
              </div>
              <CardTitle className="text-lg line-clamp-1">{art.title}</CardTitle>
              <CardDescription className="line-clamp-2 italic">
                {art.description}
              </CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      {loading ? (
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-lg font-medium animate-pulse">Analizando algoritmos clásicos e IA...</p>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Estamos calculando distancias de edición, vectores estadísticos y embeddings semánticos.
            </p>
          </div>
        </Card>
      ) : results && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-primary" />
                Resultados Comparativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Algoritmo</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Puntaje de Similitud</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results[Object.keys(results)[0]]?.map((res, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{res.algoritmo}</TableCell>
                      <TableCell>
                        <Badge variant={res.algoritmo.startsWith("IA") ? "default" : "secondary"}>
                          {res.algoritmo.startsWith("IA") ? "Inteligencia Artificial" : "Clásico"}
                        </Badge>
                      </TableCell>
                      <TableCell className={`text-right ${getScoreColor(res.score)}`}>
                        {formatScore(res.score)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Info className="w-6 h-6 text-primary" />
              Explicación Matemática Paso a Paso
            </h2>
            
            <Accordion type="single" collapsible className="w-full space-y-4">
              {results[Object.keys(results)[0]]?.map((res, idx) => (
                <AccordionItem key={idx} value={`item-${idx}`} className="border rounded-lg bg-card px-4">
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-center gap-3">
                      {res.algoritmo.startsWith("IA") ? (
                        <Brain className="w-5 h-5 text-purple-500" />
                      ) : (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      )}
                      <span className="font-semibold">{res.algoritmo}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-6">
                    <div className="space-y-4 pt-2">
                      <p className="text-sm text-muted-foreground">
                        A continuación se detalla el funcionamiento interno del algoritmo para estos documentos:
                      </p>
                      <ul className="space-y-3">
                        {res.pasosExplicacion.map((paso, pIdx) => (
                          <li key={pIdx} className="flex gap-4 items-start">
                            <span className="flex-none w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                              {pIdx + 1}
                            </span>
                            <span className="text-sm leading-relaxed">{paso}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimilarityPage;
