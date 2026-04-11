import { useState, useCallback, useEffect } from "react";
import DocumentSearch from "@/components/DocumentSearch";
import DocumentTable from "@/components/DocumentTable";
import { searchDocuments, addHistory, toggleFavorite, getFavorites, Document, FACULTIES, DOCUMENT_TYPES } from "@/lib/store";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Filter, X, RefreshCw } from "lucide-react";
import { bibliometriaService, Articulo } from "@/lib/bibliometriaService";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const SearchPage = () => {
  const [query, setQuery] = useState("");
  const [faculty, setFaculty] = useState<string>("");
  const [docType, setDocType] = useState<string>("");
  const [documents, setDocuments] = useState<Document[]>([]);
  const [favorites, setFavorites] = useState<string[]>(getFavorites());
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const mapArticuloToDocument = (art: Articulo): Document => ({
    id: art.id || `API-${Math.random().toString(36).substr(2, 9)}`,
    title: art.titulo || "Sin título",
    type: "Artículo",
    faculty: art.origen || "API Externa",
    date: new Date().toISOString().split('T')[0],
    size: "N/A",
    status: "Disponible",
    description: art.resumen || (art.palabrasClave ? art.palabrasClave.join(", ") : "") || "Sin descripción"
  });

  const loadDocuments = useCallback(async () => {
    try {
      const apiArticles = await bibliometriaService.obtenerArticulos();
      
      // Filtrar artículos de la API
      const filteredApi = apiArticles.filter(art => {
        const q = query.toLowerCase();
        const matchesQuery = !q || 
          (art.titulo && art.titulo.toLowerCase().includes(q)) ||
          (art.resumen && art.resumen.toLowerCase().includes(q)) ||
          (art.origen && art.origen.toLowerCase().includes(q));
          
        const matchesFaculty = !faculty || art.origen === faculty;
        // Los artículos de la API siempre son tipo "Artículo"
        const matchesType = !docType || docType === "Artículo";
        
        return matchesQuery && matchesFaculty && matchesType;
      });

      const mappedArticles = filteredApi.map(mapArticuloToDocument);
      setDocuments(mappedArticles);
    } catch (error) {
      console.error("Error al cargar documentos del backend:", error);
      setDocuments([]); // No mostrar nada si falla, o podrías dejarlo vacío
    }
  }, [query, faculty, docType]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // Sincronización automática inicial
  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const apiArticles = await bibliometriaService.obtenerArticulos();
        if (apiArticles.length === 0 && !isSyncing) {
          handleSync();
        }
      } catch (e) {
        console.error("Error en auto-sync inicial:", e);
      }
    }, 1000); // Pequeño delay para permitir que el backend cargue
    return () => clearTimeout(timer);
  }, []); // Solo al montar

  const handleSearch = useCallback((q: string) => {
    setQuery(q);
    if (q.trim()) {
      addHistory({ query: q, type: "search" });
    }
  }, []);

  const handleFacultyChange = (val: string) => {
    const v = val === "all" ? "" : val;
    setFaculty(v);
  };

  const handleTypeChange = (val: string) => {
    const v = val === "all" ? "" : val;
    setDocType(v);
  };

  const clearFilters = () => {
    setFaculty("");
    setDocType("");
    setQuery("");
  };

  const handleDownload = useCallback((doc: Document) => {
    addHistory({ query: doc.id, type: "download", documentTitle: doc.title });
    toast({
      title: "Descarga iniciada",
      description: `Iniciando la descarga de: ${doc.title}`,
    });
  }, [toast]);

  const handleToggleFavorite = useCallback((doc: Document) => {
    toggleFavorite(doc.id);
    setFavorites(getFavorites());
  }, []);

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const goToSimilarity = () => {
    const selectedArticles = documents.filter(d => selectedIds.includes(d.id));
    navigate("/similarity", { state: { articles: selectedArticles } });
  };

  const handleSync = async () => {
    setIsSyncing(true);
    toast({
      title: "Sincronización iniciada",
      description: "Descargando artículos de arXiv y Semantic Scholar...",
    });

    try {
      const result = await bibliometriaService.descargarArticulos(query || "generative artificial intelligence", 10);
      toast({
        title: "Sincronización completada",
        description: result,
      });
      await loadDocuments(); // Recargar después de sincronizar
    } catch (error) {
      toast({
        title: "Error de sincronización",
        description: "No se pudo conectar con el servicio de Spring Boot. Verifica que esté corriendo.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const hasFilters = faculty || docType || query;

  return (
    <div>
      <div className="flex justify-between items-start mb-1">
        <div>
          <h2 className="text-xl font-bold text-foreground">Buscar Documentos</h2>
          <p className="text-muted-foreground text-sm">Encuentre y descargue documentos de productividad científica</p>
        </div>
        <div className="flex gap-2">
          {selectedIds.length >= 2 && (
            <Button 
              onClick={goToSimilarity}
              className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
            >
              Comparar ({selectedIds.length})
            </Button>
          )}
          <Button 
            onClick={handleSync} 
            disabled={isSyncing}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Sincronizando...' : 'Sincronizar APIs'}
          </Button>
        </div>
      </div>
      
      <div className="mb-4 mt-5">
        <DocumentSearch onSearch={handleSearch} />
      </div>
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <Select value={faculty || "all"} onValueChange={handleFacultyChange}>
          <SelectTrigger className="w-[220px] h-10">
            <SelectValue placeholder="Todas las facultades" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las facultades</SelectItem>
            {FACULTIES.map((f) => (
              <SelectItem key={f} value={f}>{f}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={docType || "all"} onValueChange={handleTypeChange}>
          <SelectTrigger className="w-[220px] h-10">
            <SelectValue placeholder="Todos los tipos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            {DOCUMENT_TYPES.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1.5 text-muted-foreground">
            <X className="w-3.5 h-3.5" />
            Limpiar filtros
          </Button>
        )}
      </div>
      <DocumentTable
        documents={documents}
        onDownload={handleDownload}
        onToggleFavorite={handleToggleFavorite}
        favorites={favorites}
        selectedIds={selectedIds}
        onToggleSelect={handleToggleSelect}
      />
    </div>
  );
};

export default SearchPage;
