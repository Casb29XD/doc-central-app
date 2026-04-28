import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Map as MapIcon, Cloud, Clock, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { bibliometriaService, VisualizacionResponse } from "@/lib/bibliometriaService";
import { worldMapPaths, continentOutlines } from "@/lib/worldMapPaths";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Treemap } from "recharts";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#ef4444", "#f97316", "#eab308", "#10b981", "#14b8a6"];

/**
 * Interpolate between two hex colors based on a 0..1 ratio.
 */
function interpolateColor(color1: string, color2: string, ratio: number): string {
  const hex = (c: string) => parseInt(c, 16);
  const r1 = hex(color1.slice(1, 3)), g1 = hex(color1.slice(3, 5)), b1 = hex(color1.slice(5, 7));
  const r2 = hex(color2.slice(1, 3)), g2 = hex(color2.slice(3, 5)), b2 = hex(color2.slice(5, 7));
  const r = Math.round(r1 + (r2 - r1) * ratio);
  const g = Math.round(g1 + (g2 - g1) * ratio);
  const b = Math.round(b1 + (b2 - b1) * ratio);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

const VisualizacionPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const dashboardRef = useRef<HTMLDivElement>(null);

  const [data, setData] = useState<VisualizacionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [hoveredCountry, setHoveredCountry] = useState<{
    id: string; name: string; value: number; x: number; y: number;
  } | null>(null);

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

  // Build a lookup for country values (must be before any early return)
  const countryDataMap = useMemo(() => {
    const m = new Map<string, { name: string; value: number }>();
    data?.mapaCalor?.forEach(c => m.set(c.id, { name: c.name, value: c.value }));
    return m;
  }, [data?.mapaCalor]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <RefreshCw className="w-10 h-10 animate-spin text-primary" />
        <p className="font-medium">Consolidando datos geográficos y temporales...</p>
      </div>
    );
  }

  const maxValue = data?.mapaCalor && data.mapaCalor.length > 0 
    ? Math.max(...data.mapaCalor.map(d => d.value)) 
    : 1;

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
  
  const LINE_COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

  const treeMapData = data?.nubePalabras?.map(p => ({
    name: p.palabra,
    size: p.frecuencia
  })) || [];

  // Heat map color scale: light yellow → orange → deep red
  const getHeatColor = (value: number) => {
    const ratio = value / maxValue;
    if (ratio < 0.5) {
      return interpolateColor("#fef9c3", "#f97316", ratio * 2); // yellow → orange
    }
    return interpolateColor("#f97316", "#dc2626", (ratio - 0.5) * 2); // orange → red
  };

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
        
        {/* 1. Mapa de Calor Geográfico — full width */}
        <Card className="shadow-sm border-slate-200 dark:border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapIcon className="w-5 h-5 text-blue-500" />
              Mapa de Calor: Distribución Geográfica
            </CardTitle>
            <CardDescription>Producción por país del primer autor — escala de color por cantidad de publicaciones</CardDescription>
          </CardHeader>
          <CardContent className="p-2 relative overflow-hidden">
            <svg 
              viewBox="0 0 1000 500" 
              className="w-full h-auto" 
              style={{ background: "linear-gradient(135deg, #eff6ff 0%, #e0f2fe 50%, #dbeafe 100%)" }}
            >
              {/* Ocean grid */}
              <defs>
                <pattern id="ocean-grid" width="50" height="50" patternUnits="userSpaceOnUse">
                  <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#bfdbfe" strokeWidth="0.5" opacity="0.4" />
                </pattern>
                <filter id="country-shadow" x="-5%" y="-5%" width="110%" height="110%">
                  <feDropShadow dx="1" dy="1" stdDeviation="1.5" floodColor="#00000020" />
                </filter>
              </defs>
              <rect width="1000" height="500" fill="url(#ocean-grid)" />

              {/* Continent background outlines (landmass) */}
              {continentOutlines.map((d, i) => (
                <path 
                  key={`continent-${i}`} 
                  d={d} 
                  fill="#e2e8f0"
                  stroke="#cbd5e1"
                  strokeWidth="1"
                  className="dark:fill-slate-700 dark:stroke-slate-600"
                />
              ))}

              {/* Country shapes with heat colors */}
              {worldMapPaths.map(country => {
                const info = countryDataMap.get(country.id);
                const hasData = !!info;
                const value = info?.value || 0;
                const fillColor = hasData ? getHeatColor(value) : "#d1d5db";

                return (
                  <g key={country.id}>
                    <path
                      d={country.d}
                      fill={fillColor}
                      stroke={hoveredCountry?.id === country.id ? "#1e3a5f" : "#94a3b8"}
                      strokeWidth={hoveredCountry?.id === country.id ? 2.5 : 1}
                      filter="url(#country-shadow)"
                      className="cursor-pointer transition-all duration-200"
                      style={{ 
                        opacity: hasData ? (hoveredCountry?.id === country.id ? 1 : 0.85) : 0.5,
                      }}
                      onMouseEnter={(e) => {
                        if (hasData) {
                          const svgRect = (e.target as SVGPathElement).ownerSVGElement?.getBoundingClientRect();
                          setHoveredCountry({
                            id: country.id,
                            name: info!.name,
                            value: info!.value,
                            x: country.labelX,
                            y: country.labelY,
                          });
                        }
                      }}
                      onMouseLeave={() => setHoveredCountry(null)}
                    />
                    {/* Country label */}
                    {hasData && (
                      <text
                        x={country.labelX}
                        y={country.labelY}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize="10"
                        fontWeight="700"
                        fill="#1e293b"
                        style={{ pointerEvents: "none", textShadow: "0 0 3px rgba(255,255,255,0.8)" }}
                      >
                        {country.id}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Tooltip on SVG */}
              {hoveredCountry && (
                <g>
                  <rect
                    x={hoveredCountry.x - 70}
                    y={hoveredCountry.y - 52}
                    width="140"
                    height="40"
                    rx="8"
                    fill="rgba(15,23,42,0.88)"
                  />
                  <text
                    x={hoveredCountry.x}
                    y={hoveredCountry.y - 38}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="12"
                    fontWeight="700"
                  >
                    {hoveredCountry.name}
                  </text>
                  <text
                    x={hoveredCountry.x}
                    y={hoveredCountry.y - 22}
                    textAnchor="middle"
                    fill="#94a3b8"
                    fontSize="10"
                    fontWeight="500"
                  >
                    {hoveredCountry.value} Publicaciones
                  </text>
                </g>
              )}
            </svg>

            {/* Legend: color scale */}
            <div className="flex items-center justify-between mt-3 px-4">
              <span className="text-xs text-muted-foreground font-medium">Menor producción</span>
              <div className="flex-1 mx-3 h-3 rounded-full overflow-hidden" style={{
                background: "linear-gradient(to right, #fef9c3, #f97316, #dc2626)"
              }} />
              <span className="text-xs text-muted-foreground font-medium">Mayor producción</span>
            </div>
            <div className="flex items-center justify-center mt-1 gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm" style={{ background: "#d1d5db" }}></span>
                Sin datos
              </span>
              <span>|</span>
              <span>Total países: {data?.mapaCalor?.length || 0}</span>
              <span>|</span>
              <span>Máx: {maxValue} publicaciones</span>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
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

          {/* 3. Línea Temporal por Revista */}
          <Card className="shadow-sm border-slate-200 dark:border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="w-5 h-5 text-orange-500" />
                Línea Temporal de Publicaciones
              </CardTitle>
              <CardDescription>Evolución por año y por revista científica</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
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
                      stroke={LINE_COLORS[idx % LINE_COLORS.length]} 
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
