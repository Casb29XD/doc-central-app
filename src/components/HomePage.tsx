import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { FileText, LogOut } from "lucide-react";
import DocumentSearch from "./DocumentSearch";
import DocumentTable from "./DocumentTable";
import HistoryPanel from "./HistoryPanel";
import { searchDocuments, addHistory, getHistory, Document, HistoryEntry } from "@/lib/store";

interface HomePageProps {
  user: string;
  onLogout: () => void;
}

const HomePage = ({ user, onLogout }: HomePageProps) => {
  const [documents, setDocuments] = useState<Document[]>(searchDocuments(""));
  const [history, setHistory] = useState<HistoryEntry[]>(getHistory());

  const handleSearch = useCallback((query: string) => {
    const results = searchDocuments(query);
    setDocuments(results);
    if (query.trim()) {
      addHistory({ query, type: "search" });
      setHistory(getHistory());
    }
  }, []);

  const handleDownload = useCallback((doc: Document) => {
    addHistory({ query: doc.id, type: "download", documentTitle: doc.title });
    setHistory(getHistory());
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="font-bold text-foreground text-lg hidden sm:block">Portal de Documentos</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:block">{user}</span>
            <Button variant="ghost" size="sm" onClick={onLogout} className="gap-2 text-muted-foreground">
              <LogOut className="w-4 h-4" />
              Salir
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-1">Buscar Documentos</h2>
          <p className="text-muted-foreground">Encuentre y descargue sus documentos</p>
        </div>

        <div className="mb-8">
          <DocumentSearch onSearch={handleSearch} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <DocumentTable documents={documents} onDownload={handleDownload} />
          </div>
          <div>
            <HistoryPanel history={history} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default HomePage;
