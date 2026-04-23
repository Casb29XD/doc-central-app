import { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Network, GitMerge, Info, ArrowLeft, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { bibliometriaService, ClusterNode, AlgoritmoInfo } from "@/lib/bibliometriaService";
import { Slider } from "@/components/ui/slider";

const DendrogramSVG = ({ data }: { data: ClusterNode | null }) => {
  const [thresholdPercent, setThresholdPercent] = useState(70);

  if (!data) return <div className="text-center p-10 text-muted-foreground">No hay datos para mostrar</div>;

  const width = 800;
  const leafHeight = 25;
  const margin = { top: 20, right: 300, bottom: 20, left: 20 };

  const { leaves, maxDist } = useMemo(() => {
    const lvs: ClusterNode[] = [];
    let max = 0;
    const traverse = (n: ClusterNode) => {
      if (n.distance > max) max = n.distance;
      if (!n.left && !n.right) {
        lvs.push(n);
      } else {
        if (n.left) traverse(n.left);
        if (n.right) traverse(n.right);
      }
    };
    traverse(data);
    // Para evitar división por 0 si todos los abstractos son idénticos
    if (max === 0) max = 1; 
    return { leaves: lvs, maxDist: max };
  }, [data]);

  // Invertimos el porcentaje: 100% Similitud = 0 Distancia, 0% Similitud = maxDist
  const threshold = ((100 - thresholdPercent) / 100) * maxDist;

  const height = leaves.length * leafHeight + margin.top + margin.bottom;
  const drawWidth = width - margin.left - margin.right;

  // Calculamos posiciones
  const positions = new Map<ClusterNode, { x: number; y: number }>();
  let leafIndex = 0;

  const calculatePositions = (n: ClusterNode) => {
    // Calculamos X
    const x = margin.left + drawWidth * (1.0 - n.distance / maxDist);

    if (!n.left && !n.right) {
      const y = margin.top + leafIndex * leafHeight;
      leafIndex++;
      positions.set(n, { x, y });
      return { x, y };
    }

    const leftPos = n.left ? calculatePositions(n.left) : { x: 0, y: 0 };
    const rightPos = n.right ? calculatePositions(n.right) : { x: 0, y: 0 };
    const y = (leftPos.y + rightPos.y) / 2;

    positions.set(n, { x, y });
    return { x, y };
  };

  calculatePositions(data);

  // Paleta de colores para los clústeres
  const clusterColors = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];
  const nodeColors = new Map<ClusterNode, string>();
  let colorIndex = 0;
  let numClusters = 0;

  // Asignamos colores
  const assignColors = (n: ClusterNode, parentColor: string | null) => {
    let myColor = parentColor;
    if (n.distance <= threshold && !parentColor) {
      // Inicia un nuevo clúster aquí
      myColor = clusterColors[colorIndex % clusterColors.length];
      colorIndex++;
      numClusters++;
    }
    
    if (myColor) {
      nodeColors.set(n, myColor);
    }
    
    if (n.left) assignColors(n.left, myColor);
    if (n.right) assignColors(n.right, myColor);
  };
  
  assignColors(data, null);

  const exportToCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,Titulo;Grupo\n";
    
    const traverseAndExport = (n: ClusterNode, parentColor: string | null) => {
      let myColor = parentColor;
      if (n.distance <= threshold && !parentColor) {
         myColor = nodeColors.get(n) || "Grupo Base";
      }
      if (!n.left && !n.right) {
         csvContent += `"${(n.label || '').replace(/"/g, '""')}";"${myColor || 'Sin Agrupar'}"\n`;
      }
      if (n.left) traverseAndExport(n.left, myColor);
      if (n.right) traverseAndExport(n.right, myColor);
    };
    
    traverseAndExport(data, null);
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "agrupamiento.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // Renderizamos los paths y nodos
  const renderTree = (n: ClusterNode): React.ReactNode => {
    const pos = positions.get(n);
    if (!pos) return null;

    const color = nodeColors.get(n) || "hsl(var(--muted-foreground))";
    const opacity = nodeColors.has(n) ? "opacity-100" : "opacity-40";

    if (!n.left && !n.right) {
      return (
        <g key={n.id || Math.random()}>
          <circle cx={pos.x} cy={pos.y} r={4} fill={color} />
          <text x={pos.x + 8} y={pos.y + 4} fill={color} className={`text-xs font-medium ${opacity}`} title={n.label || ""}>
            {n.label && n.label.length > 45 ? n.label.substring(0, 45) + "..." : n.label}
          </text>
        </g>
      );
    }

    const leftPos = n.left ? positions.get(n.left) : null;
    const rightPos = n.right ? positions.get(n.right) : null;

    const leftColor = n.left ? (nodeColors.get(n.left) || "hsl(var(--muted-foreground))") : color;
    const rightColor = n.right ? (nodeColors.get(n.right) || "hsl(var(--muted-foreground))") : color;

    return (
      <g key={Math.random()}>
        {leftPos && rightPos && (
          <>
            {/* Línea vertical conectando los hijos */}
            <line x1={pos.x} y1={leftPos.y} x2={pos.x} y2={rightPos.y} stroke={color} className={`stroke-2 ${opacity}`} />
            {/* Líneas horizontales hacia los hijos */}
            <line x1={pos.x} y1={leftPos.y} x2={leftPos.x} y2={leftPos.y} stroke={leftColor} className={`stroke-2 ${nodeColors.has(n.left!) ? "opacity-100" : "opacity-40"}`} />
            <line x1={pos.x} y1={rightPos.y} x2={rightPos.x} y2={rightPos.y} stroke={rightColor} className={`stroke-2 ${nodeColors.has(n.right!) ? "opacity-100" : "opacity-40"}`} />
          </>
        )}
        <circle cx={pos.x} cy={pos.y} r={3} fill={color} className={opacity} />
        
        {n.left && renderTree(n.left)}
        {n.right && renderTree(n.right)}
      </g>
    );
  };

  const thresholdX = margin.left + drawWidth * (1.0 - threshold / maxDist);

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex flex-col gap-3 p-4 border rounded-md bg-muted/20">
        <div className="flex justify-between items-center text-sm font-medium">
          <span>Similitud Mínima Requerida: {(thresholdPercent).toFixed(0)}%</span>
          <div className="flex gap-2">
            <span className="text-primary font-bold bg-primary/10 px-2 py-1 rounded-md">{numClusters} Clústeres</span>
            <Button variant="outline" size="sm" onClick={exportToCSV} className="h-7 gap-1">
              <Download className="w-3 h-3" /> Exportar
            </Button>
          </div>
        </div>
        <Slider
          value={[thresholdPercent]}
          min={0}
          max={100}
          step={1}
          onValueChange={(vals) => setThresholdPercent(vals[0])}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Desliza para ajustar la sensibilidad del agrupamiento. Hacia la derecha (100%) exige que los textos sean idénticos, a la izquierda (0%) junta artículos con poca similitud.
        </p>
      </div>

      <div className="overflow-x-auto overflow-y-auto border rounded-xl bg-card w-full max-h-[600px] flex justify-center relative">
        <svg width={width} height={height} className="min-w-[800px]">
          {/* Línea de corte (umbral) */}
          <line 
            x1={thresholdX} 
            y1={margin.top} 
            x2={thresholdX} 
            y2={height - margin.bottom} 
            stroke="hsl(var(--destructive))" 
            strokeWidth="2" 
            strokeDasharray="5,5" 
            className="opacity-40"
          />
          {renderTree(data)}
        </svg>
      </div>
    </div>
  );
};

const AgrupamientoPage = () => {
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [data, setData] = useState<ClusterNode | null>(null);
  const [loading, setLoading] = useState(false);
  const [method, setMethod] = useState("average");
  const [metric, setMetric] = useState("Coseno");
  const [algoritmos, setAlgoritmos] = useState<AlgoritmoInfo[]>([]);

  const articles = location.state?.articles || [];

  useEffect(() => {
    bibliometriaService.obtenerAlgoritmos().then(setAlgoritmos).catch(console.error);
  }, []);

  useEffect(() => {
    if (articles.length === 0) return;
    
    const fetchData = async () => {
      setLoading(true);
      try {
        const ids = articles.map((a: any) => a.id);
        const root = await bibliometriaService.obtenerAgrupamientoPorIds(ids, method, metric);
        setData(root);
      } catch (error) {
        toast({
          title: "Error al generar clúster",
          description: "No se pudo generar el agrupamiento.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [method, metric, toast, articles]); // articles is basically static from location state

  if (articles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4 animate-in fade-in">
        <Network className="w-16 h-16 text-muted-foreground opacity-50" />
        <h2 className="text-xl font-bold">No hay artículos seleccionados</h2>
        <p className="text-muted-foreground text-center max-w-md">
          Para ver el dendrograma jerárquico, primero debes ir a la pantalla de búsqueda, 
          seleccionar los artículos que te interesan y presionar "Agrupar Selección".
        </p>
        <Button onClick={() => navigate("/")} className="mt-4 gap-2">
          <ArrowLeft className="w-4 h-4" /> Volver a Búsqueda
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto w-full pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <Network className="w-8 h-8 text-primary" />
              Agrupamiento Jerárquico ({articles.length} artículos)
            </h1>
            <p className="text-muted-foreground mt-1">
              Requerimiento 4 — Visualice la similitud estructural entre los abstracts seleccionados.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-card p-2 rounded-lg border">
          <span className="text-sm font-medium ml-2">Métrica:</span>
          <Select value={metric} onValueChange={setMetric}>
            <SelectTrigger className="w-[180px] h-8 text-sm">
              <SelectValue placeholder="Algoritmo" />
            </SelectTrigger>
            <SelectContent>
              {algoritmos.map(a => (
                <SelectItem key={a.nombre} value={a.nombre}>{a.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="average" onValueChange={setMethod} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="single">Single Linkage</TabsTrigger>
          <TabsTrigger value="average">Average Linkage (UPGMA)</TabsTrigger>
          <TabsTrigger value="complete">Complete Linkage</TabsTrigger>
        </TabsList>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitMerge className="w-5 h-5 text-indigo-500" />
              Dendrograma de Similitud
            </CardTitle>
            <CardDescription>
              Representación en árbol de los artículos basada en su similitud de {metric}. 
              {method === "single" && " El método Single Linkage agrupa por la distancia mínima (tiende a formar 'cadenas')."}
              {method === "average" && " El método Average Linkage promedia las distancias (suele dar los grupos más balanceados e interpretables)."}
              {method === "complete" && " El método Complete Linkage agrupa por la distancia máxima (fuerza clústeres muy compactos)."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex flex-col items-center justify-center p-20 space-y-4">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="font-medium text-muted-foreground">Calculando matriz de distancias y agrupando...</p>
              </div>
            ) : (
              <DendrogramSVG data={data} />
            )}
            
            <div className="mt-6 bg-muted/50 p-4 rounded-lg border flex gap-3 text-sm">
              <Info className="w-5 h-5 text-primary shrink-0" />
              <div>
                <p className="font-medium mb-1">Análisis de Coherencia</p>
                <p className="text-muted-foreground leading-relaxed">
                  Basado en minería de textos científicos, el <strong>Average Linkage</strong> tiende a producir las agrupaciones más coherentes.
                  El Single Linkage a menudo sufre del efecto de encadenamiento (chaining), donde artículos dispares se agrupan debido a una sola coincidencia de palabras. 
                  El Complete Linkage asegura clústeres compactos, pero ignora similitudes locales útiles que Average sí logra balancear.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
};

export default AgrupamientoPage;
