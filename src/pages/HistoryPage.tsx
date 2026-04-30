import { useState, useEffect } from "react";
import HistoryPanel from "@/components/HistoryPanel";
import { bibliometriaService } from "@/lib/bibliometriaService";
import { getUser } from "@/lib/store";

const HistoryPage = () => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const userId = getUser() || "anonymous";
        const data = await bibliometriaService.listarHistorial(userId);
        
        // Map backend model to frontend expected model if necessary
        const mapped = data.map(h => ({
          id: h.id,
          query: h.tituloArticuloAnalizado,
          timestamp: h.fecha,
          type: "search",
          documentTitle: `${h.totalResultados} resultados`
        }));
        
        setHistory(mapped);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  return (
    <div>
      <h2 className="text-xl font-bold text-foreground mb-1">Historial</h2>
      <p className="text-muted-foreground text-sm mb-5">Búsquedas y análisis recientes (Atlas)</p>
      {loading ? <p>Cargando...</p> : <HistoryPanel history={history} />}
    </div>
  );
};

export default HistoryPage;
