import { HistoryEntry } from "@/lib/store";
import { Search, Download, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface HistoryPanelProps {
  history: HistoryEntry[];
}

const HistoryPanel = ({ history }: HistoryPanelProps) => {
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
              <div key={entry.id} className="px-6 py-3 flex items-start gap-3 hover:bg-muted/30 transition-colors">
                <div className={`mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  entry.type === "search" ? "bg-primary/10 text-primary" : "bg-success/10 text-success"
                }`}>
                  {entry.type === "search" ? <Search className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">
                    {entry.type === "search" ? `Búsqueda: "${entry.query}"` : entry.documentTitle}
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
