import { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowLeft, Brain, Calculator, Info, CheckCircle2, BookOpen, Fingerprint, Activity, Code, FunctionSquare } from "lucide-react";
import { similarityService, ResultadoComparacion } from "@/lib/similarityService";
import { bibliometriaService, AlgoritmoInfo } from "@/lib/bibliometriaService";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

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
        const baseArticleMapped = {
          titulo: baseArt.title,
          resumen: baseArt.description,
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

  // Preparamos datos para la gráfica buscando el mejor artículo comparado
  const topMatch = useMemo(() => {
    if (results.length === 0) return null;
    return results.reduce((prev, current) => {
      const sumA = Object.values(prev.puntajesPorAlgoritmo).reduce((a, b) => a + b, 0);
      const sumB = Object.values(current.puntajesPorAlgoritmo).reduce((a, b) => a + b, 0);
      return sumA > sumB ? prev : current;
    });
  }, [results]);

  const chartData = useMemo(() => {
    if (!topMatch) return [];
    return algoritmos.map(algo => ({
      name: algo.nombre.split(" ")[0] || "AI",
      Similitud: parseFloat(((topMatch.puntajesPorAlgoritmo[algo.nombre] || 0) * 100).toFixed(1))
    }));
  }, [topMatch, algoritmos]);

  const baseArt = articles[baseArticleIndex];

  return (
    <div className="container mx-auto py-6 space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Análisis de Similitud Semántica</h1>
          <p className="text-muted-foreground">Requerimiento 2: Análisis Algorítmico y Matemático</p>
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
        <Tabs defaultValue="datos" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
            <TabsTrigger value="datos" className="flex gap-2"><Calculator className="w-4 h-4" /> Tabla de Resultados</TabsTrigger>
            <TabsTrigger value="fundamentos" className="flex gap-2"><Activity className="w-4 h-4" /> Fórmulas y Gráficas</TabsTrigger>
          </TabsList>
          
          <TabsContent value="datos" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Comparamos tu artículo contra {results.length} documentos únicos</CardTitle>
                <CardDescription>
                  Se aplican matemáticas de bolsa de palabras e inteligencia artificial para hallar plagios/redundancias.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader className="bg-muted">
                      <TableRow>
                        <TableHead className="py-4">Veredicto y Obra Contrastada</TableHead>
                        {algoritmos.map(algo => (
                          <TableHead key={algo.nombre} className="text-center font-bold px-4 py-4 min-w-[120px]">
                            {algo.nombre}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results.length > 0 ? results.map((res, idx) => (
                        <TableRow key={idx} className="hover:bg-muted/50 transition-colors">
                          <TableCell className="max-w-[200px] font-medium leading-relaxed">
                            {res.tituloTarget}
                          </TableCell>
                          {algoritmos.map(algo => (
                            <TableCell key={algo.nombre} className={`text-center text-sm ${getScoreColor(res.puntajesPorAlgoritmo[algo.nombre] || 0)}`}>
                              {formatScore(res.puntajesPorAlgoritmo[algo.nombre] || 0)}
                            </TableCell>
                          ))}
                        </TableRow>
                      )) : (
                        <TableRow>
                          <TableCell colSpan={algoritmos.length + 1} className="text-center py-10 text-muted-foreground">
                            No hay suficientes documentos en la BD asíncrona para comparar tu artículo.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="fundamentos" className="mt-6 space-y-6">
            {chartData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Activity className="w-6 h-6 text-primary" /> Diagrama Comparativo (vs Documento Más Similar)
                  </CardTitle>
                  <CardDescription>
                    Así calificó matemáticamente la máquina el grado de similitud entre tu base y "{topMatch?.tituloTarget || "el artículo más cercano"}".
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="name" tick={{ fontSize: 13, fontWeight: "bold" }} />
                      <YAxis domain={[0, 100]} tickFormatter={(val) => `${val}%`} />
                      <Tooltip formatter={(value) => [`${value}% Similitud`, "Similitud"]} />
                      <Legend />
                      <Bar dataKey="Similitud" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} barSize={50} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FunctionSquare className="w-5 h-5 text-primary" /> Fundamentos Matemáticos por Algoritmo
                </CardTitle>
                <CardDescription>Explicación técnica detallada (paso a paso), tal cual lo demanda el Requerimiento 2.</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full space-y-4">
                  {algoritmos.map((algo, idx) => (
                    <AccordionItem key={idx} value={`item-${idx}`} className="border rounded-lg bg-card px-5 border-primary/20 shadow-sm">
                      <AccordionTrigger className="hover:no-underline py-4">
                        <div className="flex items-center gap-3">
                          {algo.nombre.includes("IA") || algo.nombre.includes("Word2Vec") || algo.nombre.includes("Sentence-BERT") ? 
                            <Brain className="w-5 h-5 text-purple-600 dark:text-purple-400" /> : 
                            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                          }
                          <span className="text-base font-bold">{algo.nombre}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-6">
                        <div className="p-4 bg-muted/30 rounded-md border space-y-4">
                          <p className="text-sm font-medium text-foreground leading-relaxed">
                            {algo.explicacion}
                          </p>
                          <div className="pt-2">
                            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
                              <Code className="w-3 h-3" /> Expresión Teórica
                            </h4>
                            <div className="bg-background border p-4 rounded-md overflow-x-auto shadow-inner text-center font-mono text-sm">
                              {/* Lógica condicional cruda para detectar a qué Algoritmo pertenece, inyectando su fórmula */}
                              {algo.nombre.includes("Coseno") && (
                                <span>Sim(A,B) = <span className="text-primary font-bold">(A · B) / (||A|| × ||B||)</span></span>
                              )}
                              {algo.nombre.includes("Jaccard") && (
                                <span>J(A,B) = <span className="text-primary font-bold">|A ∩ B| / |A ∪ B|</span> = |Intersección| / |Unión|</span>
                              )}
                              {algo.nombre.includes("Levenshtein") && (
                                <span>Dist(a,b) = <span className="text-primary font-bold">min</span > (inserciones, eliminaciones, sustituciones) para a → b <br/> <br /> <span className="text-xs text-muted-foreground">Sim(a,b) = 1 - (Dist(a,b) / max(|a|, |b|))</span></span>
                              )}
                              {algo.nombre.includes("Dice") && (
                                <span>DSC(A,B) = <span className="text-primary font-bold">2 |A ∩ B| / (|A| + |B|)</span> <br /><br /><span className="text-xs text-muted-foreground">Donde A y B son los conjuntos de bigramas de cada texto</span></span>
                              )}
                              {algo.nombre.includes("Sentence-BERT") && (
                                <span>Similitud_SBERT = <span className="text-primary font-bold">Coseno( RedNeuronal(TextoA), RedNeuronal(TextoB) )</span></span>
                              )}
                              {algo.nombre.includes("Word2Vec") && (
                                <span>Score = <span className="text-primary font-bold">Promedio_Global</span>( Vectorizacion(Palabras_A) ) · <span className="text-primary font-bold">Promedio_Global</span>( Vectorizacion(Palabras_B) )</span>
                              )}
                              {/* Fallback si añaden otro raro */}
                              {!algo.nombre.includes("Coseno") && !algo.nombre.includes("Jaccard") && !algo.nombre.includes("Levenshtein") && !algo.nombre.includes("Dice") && !algo.nombre.includes("Sentence-BERT") && !algo.nombre.includes("Word2Vec") && (
                                <span>Métrica Computacional para Frecuencia Normalizada</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default SimilarityPage;
