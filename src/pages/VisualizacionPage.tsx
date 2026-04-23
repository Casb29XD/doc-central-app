import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Map as MapIcon, Cloud, Clock, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { bibliometriaService, VisualizacionResponse } from "@/lib/bibliometriaService";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Treemap, Cell } from "recharts";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#ef4444", "#f97316", "#eab308", "#10b981", "#14b8a6"];

const VisualizacionPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const dashboardRef = useRef<HTMLDivElement>(null);

  const [data, setData] = useState<VisualizacionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const res = await bibliometriaService.obtenerDatosVisualizacion();
      setData(res);
    } catch (error) {
      toast({
        title: "Error al cargar visualización",
        description: "No se pudieron obtener los datos consolidados del backend.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = async () => {
    if (!dashboardRef.current) return;
    
    setExporting(true);
    try {
      toast({ title: "Generando PDF...", description: "Por favor espera, procesando gráficos." });
      
      const canvas = await html2canvas(dashboardRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff"
      });
      
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.text("Reporte Visual de Producción Científica", 15, 15);
      pdf.setFontSize(10);
      pdf.text(`Generado el: ${new Date().toLocaleString()}`, 15, 22);
      
      // Añadir imagen dejando margen arriba
      pdf.addImage(imgData, "PNG", 10, 30, pdfWidth - 20, pdfHeight - 40);
      
      pdf.save("reporte_bibliometrico.pdf");
      toast({ title: "¡PDF Exportado!", description: "El reporte se descargó correctamente." });
    } catch (error) {
      toast({ title: "Error en exportación", description: "Ocurrió un error al generar el PDF.", variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <RefreshCw className="w-10 h-10 animate-spin text-primary" />
        <p className="font-medium">Consolidando datos geográficos y temporales...</p>
      </div>
    );
  }

  // Preprocesar Timeline Data para Recharts
  const timelineChartData = data?.lineaTemporal?.map(item => {
    const dataObj: any = { anio: item.anio };
    Object.keys(item.revistas).forEach(rev => {
      dataObj[rev] = item.revistas[rev];
    });
    return dataObj;
  }) || [];

  // Obtener todas las revistas únicas para hacer las líneas dinámicas
  const revistasUnicas = new Set<string>();
  data?.lineaTemporal?.forEach(item => {
    Object.keys(item.revistas).forEach(rev => revistasUnicas.add(rev));
  });
  const revistasArray = Array.from(revistasUnicas);

  // Preprocesar Treemap Data (Nube de palabras)
  const treeMapData = data?.nubePalabras?.map(p => ({
    name: p.palabra,
    size: p.frecuencia
  })) || [];

  return (
    <div className="flex-1 space-y-6 animate-in fade-in duration-500 max-w-6xl mx-auto w-full pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              Dashboard Bibliométrico
            </h1>
            <p className="text-muted-foreground mt-1">
              Requerimiento 5 — Mapas, nube de palabras y líneas de tiempo.
            </p>
          </div>
        </div>

        <Button onClick={exportToPDF} disabled={exporting} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
          <Download className="w-4 h-4" />
          {exporting ? "Procesando..." : "Exportar a PDF"}
        </Button>
      </div>

      {/* Contenedor Ref para capturar el PDF */}
      <div ref={dashboardRef} className="space-y-6 bg-background p-4 rounded-xl">
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* 1. Mapa de Calor (Simulado con BarChart Geográfico) */}
          <Card className="shadow-sm border-slate-200 dark:border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapIcon className="w-5 h-5 text-blue-500" />
                Mapa de Calor: Distribución Geográfica
              </CardTitle>
              <CardDescription>Producción por país del primer autor</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.mapaCalor || []} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={80} />
                  <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                  <Bar dataKey="value" name="Publicaciones" radius={[0, 4, 4, 0]}>
                    {(data?.mapaCalor || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* 2. Nube de Palabras (Treemap) */}
          <Card className="shadow-sm border-slate-200 dark:border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Cloud className="w-5 h-5 text-teal-500" />
                Nube de Palabras (Top Términos)
              </CardTitle>
              <CardDescription>Keywords y abstracts combinados (Dinámico)</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                {treeMapData.length > 0 ? (
                  <Treemap
                    data={treeMapData}
                    dataKey="size"
                    aspectRatio={4 / 3}
                    stroke="#fff"
                    fill="#8884d8"
                    content={<CustomTreemapContent colors={COLORS} />}
                  >
                    <Tooltip content={<TreemapTooltip />} />
                  </Treemap>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    No hay palabras suficientes para analizar
                  </div>
                )}
              </ResponsiveContainer>
            </CardContent>
          </Card>

        </div>

        {/* 3. Línea Temporal por Revista */}
        <Card className="shadow-sm border-slate-200 dark:border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="w-5 h-5 text-orange-500" />
              Línea Temporal de Publicaciones
            </CardTitle>
            <CardDescription>Evolución por año y por revista científica</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timelineChartData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="anio" />
                <YAxis />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                {revistasArray.map((revista, idx) => (
                  <Line 
                    key={revista} 
                    type="monotone" 
                    dataKey={revista} 
                    stroke={COLORS[idx % COLORS.length]} 
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

const CustomTreemapContent = (props: any) => {
  const { root, depth, x, y, width, height, index, name, colors } = props;

  const childrenLength = root?.children?.length || 1;
  const colorIndex = Math.floor((index / childrenLength) * (colors?.length || 6));

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill: depth < 2 ? colors[colorIndex % colors.length] : '#ffffff00',
          stroke: '#fff',
          strokeWidth: 2 / (depth + 1e-10),
          strokeOpacity: 1 / (depth + 1e-10),
        }}
      />
      {width > 35 && height > 25 && (
        <text
          x={x + width / 2}
          y={y + height / 2}
          textAnchor="middle"
          fill="#ffffff"
          fontSize={Math.floor(Math.max(12, Math.min(width / 6, height / 3)))}
          fontWeight="600"
          dominantBaseline="central"
          style={{
            pointerEvents: 'none',
            textShadow: '0px 1px 3px rgba(0,0,0,0.6)',
            WebkitFontSmoothing: 'antialiased'
          }}
        >
          {name}
        </text>
      )}
    </g>
  );
};

// Custom Tooltip para el Treemap
const TreemapTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-popover text-popover-foreground border border-border p-3 rounded-lg shadow-md">
        <p className="font-bold text-base capitalize">{data.name}</p>
        <p className="text-sm text-muted-foreground">{data.size} apariciones</p>
      </div>
    );
  }
  return null;
};

export default VisualizacionPage;
