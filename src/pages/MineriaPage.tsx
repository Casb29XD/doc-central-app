import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, BarChart3, Lightbulb, Target, TrendingUp, Sparkles } from "lucide-react";
import { bibliometriaService, PalabraFrecuencia, PalabraDescubierta, ResultadoMineria } from "@/lib/bibliometriaService";
import { useToast } from "@/hooks/use-toast";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
  Treemap
} from "recharts";

// Paleta vibrante para las barras
const COLORS_BASE = [
  "#6366f1", "#8b5cf6", "#a855f7", "#d946ef", "#ec4899",
  "#f43f5e", "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#14b8a6", "#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6"
];

const COLORS_NEW = [
  "#10b981", "#059669", "#047857", "#065f46", "#064e3b",
  "#0d9488", "#0891b2", "#0284c7", "#2563eb", "#4f46e5",
  "#7c3aed", "#9333ea", "#c026d3", "#db2777", "#e11d48"
];

const MineriaPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [resultado, setResultado] = useState<ResultadoMineria | null>(null);

  useEffect(() => {
    const cargar = async () => {
      setLoading(true);
      try {
        const data = await bibliometriaService.obtenerMineriaTextos();
        setResultado(data);
      } catch (error) {
        toast({
          title: "Error de Minería",
          description: "No se pudo conectar con el backend de procesamiento de texto.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, [toast]);

  const chartDataBase = resultado?.palabrasBase
    .filter(p => p.frecuencia > 0)
    .sort((a, b) => b.frecuencia - a.frecuencia)
    .map((p, i) => ({
      name: p.palabra,
      Frecuencia: p.frecuencia,
      fill: COLORS_BASE[i % COLORS_BASE.length],
    })) || [];

  const chartDataNew = resultado?.nuevasPalabras
    .sort((a, b) => b.frecuencia - a.frecuencia)
    .map((p, i) => ({
      name: p.palabra,
      Frecuencia: p.frecuencia,
      Precisión: Math.round(p.precision * 100),
      fill: COLORS_NEW[i % COLORS_NEW.length],
    })) || [];

  const treemapData = resultado?.nuevasPalabras.map(p => ({
    name: p.palabra,
    size: p.frecuencia,
    precision: p.precision,
  })) || [];

  return (
    <div className="container mx-auto py-6 space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/search")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-primary" />
            Minería de Textos
          </h1>
          <p className="text-muted-foreground">
            Requerimiento 3 — Frecuencias de la categoría <span className="font-semibold text-foreground">"Concepts of Generative AI in Education"</span>
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 space-y-4 border rounded-xl border-dashed">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="font-medium">Analizando todos los abstracts de la base de datos...</p>
        </div>
      ) : (
        <Tabs defaultValue="base" className="w-full">
          <TabsList className="flex w-full max-w-[700px] h-12 p-1 gap-1">
            <TabsTrigger value="base" className="flex-1 flex items-center justify-center gap-2 text-sm">
              <Target className="w-4 h-4 shrink-0" /> Palabras Base
            </TabsTrigger>
            <TabsTrigger value="nuevas" className="flex-1 flex items-center justify-center gap-2 text-sm">
              <Sparkles className="w-4 h-4 shrink-0" /> Descubiertas
            </TabsTrigger>
            <TabsTrigger value="precision" className="flex-1 flex items-center justify-center gap-2 text-sm">
              <TrendingUp className="w-4 h-4 shrink-0" /> Precisión
            </TabsTrigger>
          </TabsList>

          {/* ==================== TAB 1: Palabras Base ==================== */}
          <TabsContent value="base" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Target className="w-6 h-6 text-indigo-500" />
                  Frecuencia de las 15 Palabras Predefinidas
                </CardTitle>
                <CardDescription>
                  Se recorrieron todos los abstracts buscando exactamente las palabras de la tabla del requerimiento.
                  La barra muestra cuántas veces aparece cada término en toda la base de datos unificada.
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[420px]">
                {chartDataBase.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartDataBase} layout="vertical" margin={{ top: 5, right: 30, left: 120, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fontWeight: 600 }} width={110} />
                      <Tooltip
                        formatter={(value: number) => [`${value} apariciones`, "Frecuencia"]}
                        contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}
                      />
                      <Bar dataKey="Frecuencia" radius={[0, 6, 6, 0]} barSize={18}>
                        {chartDataBase.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    <p>Ninguna de las palabras base fue encontrada en los abstracts actuales.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tabla detallada */}
            <Card>
              <CardHeader>
                <CardTitle>Detalle Numérico</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-bold">Palabra Clave (Categoría)</TableHead>
                      <TableHead className="text-center font-bold">Frecuencia Total</TableHead>
                      <TableHead className="text-center font-bold">Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {resultado?.palabrasBase.map((p, i) => (
                      <TableRow key={i} className="hover:bg-muted/30">
                        <TableCell className="font-medium capitalize">{p.palabra}</TableCell>
                        <TableCell className="text-center font-mono text-sm">{p.frecuencia}</TableCell>
                        <TableCell className="text-center">
                          {p.frecuencia > 0 ? (
                            <Badge className="bg-green-600/20 text-green-700 border-green-300">Encontrada</Badge>
                          ) : (
                            <Badge variant="secondary">No encontrada</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ==================== TAB 2: Palabras Descubiertas ==================== */}
          <TabsContent value="nuevas" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Sparkles className="w-6 h-6 text-emerald-500" />
                  15 Nuevas Palabras Descubiertas por el Algoritmo
                </CardTitle>
                <CardDescription>
                  El motor de NLP analizó todos los abstracts, eliminó ruido (stopwords, preposiciones) y extrajo
                  los términos más frecuentes que <strong>no</strong> estaban en el diccionario original.
                  Estas son las palabras que el algoritmo considera relevantes para el dominio "Generative AI".
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[420px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartDataNew} layout="vertical" margin={{ top: 5, right: 30, left: 120, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fontWeight: 600 }} width={110} />
                    <Tooltip
                      formatter={(value: number, name: string) => [
                        name === "Precisión" ? `${value}%` : `${value} apariciones`,
                        name
                      ]}
                      contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}
                    />
                    <Legend />
                    <Bar dataKey="Frecuencia" radius={[0, 6, 6, 0]} barSize={14}>
                      {chartDataNew.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Tabla detallada nuevas */}
            <Card>
              <CardHeader>
                <CardTitle>Detalle de Hallazgos</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-bold">#</TableHead>
                      <TableHead className="font-bold">Palabra Descubierta</TableHead>
                      <TableHead className="text-center font-bold">Frecuencia</TableHead>
                      <TableHead className="text-center font-bold">Precisión</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {resultado?.nuevasPalabras.map((p, i) => (
                      <TableRow key={i} className="hover:bg-muted/30">
                        <TableCell className="text-muted-foreground text-xs">{i + 1}</TableCell>
                        <TableCell className="font-medium capitalize">{p.palabra}</TableCell>
                        <TableCell className="text-center font-mono text-sm">{p.frecuencia}</TableCell>
                        <TableCell className="text-center">
                          <Badge className={
                            p.precision >= 0.8 ? "bg-green-600/20 text-green-700 border-green-300" :
                            p.precision >= 0.5 ? "bg-blue-600/20 text-blue-700 border-blue-300" :
                            "bg-orange-600/20 text-orange-700 border-orange-300"
                          }>
                            {(p.precision * 100).toFixed(1)}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ==================== TAB 3: Análisis de Precisión ==================== */}
          <TabsContent value="precision" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <TrendingUp className="w-6 h-6 text-amber-500" />
                  Análisis de Precisión de las Nuevas Palabras
                </CardTitle>
                <CardDescription>
                  La <strong>precisión</strong> mide cuán ligada está cada palabra nueva al dominio de "Generative AI".
                  Se calcula como la proporción de veces que la palabra aparece junto a las palabras base
                  del diccionario vs. las veces que aparece en total.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Fórmula visual */}
                <div className="bg-muted/30 border rounded-lg p-6 mb-6">
                  <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-amber-500" /> Fórmula Matemática de Precisión
                  </h4>
                  <div className="bg-background border p-5 rounded-md text-center font-mono text-lg shadow-inner">
                    <span>Precisión(w) = </span>
                    <span className="text-primary font-bold">
                      Co-ocurrencias(w, Categoría)
                    </span>
                    <span> / </span>
                    <span className="text-primary font-bold">
                      Frecuencia_Total(w)
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                    Donde <strong>Co-ocurrencias(w, Categoría)</strong> = Número de abstracts donde la palabra "w"
                    aparece junto a al menos una palabra del diccionario base ("generative models", "ethics", etc.).
                    <br />
                    <strong>Frecuencia_Total(w)</strong> = Todas las apariciones de la palabra "w" en todos los abstracts.
                    <br /><br />
                    <em>Si Precisión = 1.0 (100%), la palabra SIEMPRE aparece en contextos de IA Generativa. 
                    Si Precisión = 0.5 (50%), solo la mitad de sus apariciones son relevantes al dominio.</em>
                  </p>
                </div>

                {/* Gráfica de Barras de Precisión */}
                <div className="h-[380px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartDataNew}
                      margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 11, fontWeight: 600 }}
                        angle={-35}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis
                        domain={[0, 100]}
                        tickFormatter={(val) => `${val}%`}
                        label={{ value: "Precisión (%)", angle: -90, position: "insideLeft", style: { fontSize: 12 } }}
                      />
                      <Tooltip
                        formatter={(value: number) => [`${value}%`, "Precisión"]}
                        contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}
                      />
                      <Bar dataKey="Precisión" radius={[6, 6, 0, 0]} barSize={30}>
                        {chartDataNew.map((entry, index) => (
                          <Cell
                            key={`cell-prec-${index}`}
                            fill={entry.Precisión >= 80 ? "#22c55e" : entry.Precisión >= 50 ? "#3b82f6" : "#f97316"}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default MineriaPage;
