import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowLeft, Brain, Calculator, Info, CheckCircle2, User, BookOpen, Fingerprint } from "lucide-react";
import { similarityService, ResultadoComparacion } from "@/lib/similarityService";
import { bibliometriaService, AlgoritmoInfo } from "@/lib/bibliometriaService";
import { useToast } from "@/hooks/use-toast";

const SimilarityPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ResultadoComparacion[]>([]);
  const [algoritmos, setAlgoritmos] = useState<AlgoritmoInfo[]>([]);
  const [baseArticleIndex, setBaseArticleIndex] = useState(0);
  
  const articles = location.state?.articles || [];

  useEffect(() => {
    if (articles.length < 1) {
      toast({
        title: "Selección insuficiente",
        description: "Se necesita al menos 1 artículo para comparar contra la base de datos.",
        variant: "destructive"
      });
      navigate("/");
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const algos = await bibliometriaService.obtenerAlgoritmos();
        setAlgoritmos(algos);

        const baseArt = articles[baseArticleIndex];
        // Mapeamos para asegurar que el backend reciba los campos correctos
        const baseArticleMapped = {
          titulo: baseArt.title,
          resumen: baseArt.description, // En SearchPage usamos description para el resumen
          doi: baseArt.size?.split(": ")[1] || ""
        };

        const comparisons = await similarityService.analizarSimilitud(baseArticleMapped as any);
        setResults(comparisons);
      } catch (error) {
        toast({
          title: "Error en el análisis",
          description: "No se pudo conectar con el motor de algoritmos.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [articles, baseArticleIndex, navigate, toast]);

  const getScoreColor = (score: number) => {
    if (score > 0.8) return "text-green-600 font-bold";
    if (score > 0.5) return "text-blue-600 font-semibold";
    return "text-muted-foreground";
  };

  const formatScore = (score: number) => (score * 100).toFixed(1) + "%";

  const baseArt = articles[baseArticleIndex];

  return (
    <div className="container mx-auto py-6 space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Análisis de Similitud Semántica</h1>
          <p className="text-muted-foreground">Motor de comparación basado en algoritmos clásicos e Inteligencia Artificial</p>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Fingerprint className="w-5 h-5 text-primary" />
          Artículo Base (Seleccionado)
        </h2>
        <Card className="border-l-4 border-l-primary bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl">{baseArt?.title}</CardTitle>
            <div className="flex flex-wrap gap-4 mt-2">
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <BookOpen className="w-4 h-4" /> {baseArt?.faculty}
              </span>
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground font-mono">
                <Info className="w-4 h-4" /> {baseArt?.size}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground italic line-clamp-3">
              "{baseArt?.description}"
            </p>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 space-y-4 border rounded-xl border-dashed">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="font-medium">Calculando métricas de distancia y embeddings...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-primary" />
                  Resultados de Similitud contra el Repositorio
                </CardTitle>
                <CardDescription>
                  Se comparó el abstract seleccionado contra todos los documentos unificados.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Documento Comparado</TableHead>
                      {algoritmos.map(algo => (
                        <TableHead key={algo.nombre} className="text-center text-[10px] uppercase tracking-tighter">
                          {algo.nombre.split(" ")[0]}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.length > 0 ? results.map((res, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="max-w-[150px] truncate font-medium text-xs">
                          {res.tituloTarget}
                        </TableCell>
                        {algoritmos.map(algo => (
                          <TableCell key={algo.nombre} className={`text-center text-xs ${getScoreColor(res.puntajesPorAlgoritmo[algo.nombre] || 0)}`}>
                            {formatScore(res.puntajesPorAlgoritmo[algo.nombre] || 0)}
                          </TableCell>
                        ))}
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={algoritmos.length + 1} className="text-center py-10 text-muted-foreground">
                          No hay otros documentos en la base de datos para comparar.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Info className="w-5 h-5 text-primary" />
              Glosario de Algoritmos
            </h3>
            <Accordion type="single" collapsible className="w-full space-y-3">
              {algoritmos.map((algo, idx) => (
                <AccordionItem key={idx} value={`item-${idx}`} className="border rounded-lg bg-card px-4 border-primary/10">
                  <AccordionTrigger className="hover:no-underline py-3">
                    <div className="flex items-center gap-2">
                      {algo.nombre.includes("IA") ? <Brain className="w-4 h-4 text-purple-500" /> : <CheckCircle2 className="w-4 h-4 text-green-500" />}
                      <span className="text-sm font-semibold">{algo.nombre}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4 text-xs text-muted-foreground leading-relaxed">
                    {algo.explicacion}
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
