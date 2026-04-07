import { useState } from "react";
import HistoryPanel from "@/components/HistoryPanel";
import { getHistory } from "@/lib/store";

const HistoryPage = () => {
  const [history] = useState(getHistory());

  return (
    <div>
      <h2 className="text-xl font-bold text-foreground mb-1">Historial</h2>
      <p className="text-muted-foreground text-sm mb-5">Búsquedas y descargas recientes</p>
      <HistoryPanel history={history} />
    </div>
  );
};

export default HistoryPage;
