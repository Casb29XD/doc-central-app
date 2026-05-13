import { HistoryEntry } from "@/lib/store";
import { Search, Download, Clock, Brain, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface HistoryPanelProps {
  history: HistoryEntry[];
}

const HistoryPanel = ({ history }: HistoryPanelProps) => {
  const navigate = useNavigate();

  const handleItemClick = (entry: HistoryEntry) => {
    if (entry.type === "search") {
      navigate(`/search?q=${encodeURIComponent(entry.query)}`);
    } else if (entry.type === "similarity") {
      try {
        if (entry.details) {
          const article = JSON.parse(entry.details);
          // Mapeamos de Articulo a Document si hace falta o lo mandamos tal cual (SimilarityPage lo parsea de nuevo o ya soporta Object base)
          const mappedArticle = {
            id: article.id || article.doi,
            title: article.titulo,
            description: article.resumen,
            size: "DOI: " + (article.doi || "N/A"),
            faculty: article.origen || "Desconocido"
          };
          navigate('/similarity', { state: { articles: [mappedArticle] } });
        }
      } catch (e) {
        console.error("No se pudo parsear el documento para reanudar el análisis.", e);
      }
    } else if (entry.type === "analysis") {
      try {
        if (entry.details) {
          const article = JSON.parse(entry.details);
          const mappedArticle = {
            id: article.id || article.doi,
            title: article.titulo,
            description: article.resumen,
            size: "DOI: " + (article.doi || "N/A"),
            faculty: article.origen || "Desconocido"
          };
          navigate(`/mineria/${mappedArticle.id}`, { state: { doc: mappedArticle } });
        }
      } catch (e) {
        console.error("No se pudo parsear el documento para reanudar la minería.", e);
      }
    }
  };

  if (history.length === 0) {
    return (
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Historial
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm text-center py-6">
            No hay actividad reciente
          </p>
        </CardContent>
      </Card>
    );
  }

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("es", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Historial
          <Badge variant="secondary" className="ml-auto font-normal text-xs">{history.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          <div className="divide-y divide-border">
            {history.map((entry) => (
              <div 
                key={entry.id} 
                onClick={() => handleItemClick(entry)}
                className="px-6 py-3 flex items-start gap-3 hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <div className={`mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  entry.type === "search" ? "bg-primary/10 text-primary" : 
                  entry.type === "similarity" ? "bg-purple-500/10 text-purple-600" :
                  entry.type === "analysis" ? "bg-amber-500/10 text-amber-600" :
                  "bg-success/10 text-success"
                }`}>
                  {entry.type === "search" ? <Search className="w-3.5 h-3.5" /> : 
                   entry.type === "similarity" ? <Brain className="w-3.5 h-3.5" /> :
                   entry.type === "analysis" ? <BarChart3 className="w-3.5 h-3.5" /> :
                   <Download className="w-3.5 h-3.5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">
                    {entry.type === "search" ? `Búsqueda: "${entry.query}"` : 
                     entry.type === "similarity" ? entry.query :
                     entry.type === "analysis" ? entry.query :
                     entry.documentTitle}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{formatTime(entry.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default HistoryPanel;
