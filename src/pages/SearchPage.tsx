import { useState, useCallback, useEffect, useRef } from "react";
import DocumentSearch from "@/components/DocumentSearch";
import DocumentTable from "@/components/DocumentTable";
import { addHistory, toggleFavorite, getFavorites, getUser, Document, FACULTIES, DOCUMENT_TYPES } from "@/lib/store";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Filter, X, Upload, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { bibliometriaService, Articulo } from "@/lib/bibliometriaService";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";

const SearchPage = () => {
  const [query, setQuery] = useState("");
  const [faculty, setFaculty] = useState<string>("");
  const [docType, setDocType] = useState<string>("");
  const [documents, setDocuments] = useState<Document[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const userId = getUser() || "anonymous";
        const favs = await bibliometriaService.listarFavoritos(userId);
        setFavorites(favs.map(f => f.articuloId));
      } catch (error) {
        console.error("Error al cargar favoritos", error);
      }
    };
    fetchFavorites();
  }, []);

  const mapArticuloToDocument = (art: Articulo): Document => ({
    id: art.id || `DOI-${art.doi || Math.random().toString(36).substr(2, 9)}`,
    title: art.titulo || "Sin título",
    type: "Artículo",
    faculty: art.origen || "Carga Manual",
    date: art.anio ? String(art.anio) : new Date().toISOString().split('T')[0],
    size: art.doi ? `DOI: ${art.doi}` : "N/A",
    status: "Disponible",
    description: art.resumen || "Sin descripción"
  });

  const loadDocuments = useCallback(async (page: number, currentQuery: string) => {
    try {
      const response = await bibliometriaService.obtenerArticulos(page, 10, currentQuery);
      const mappedArticles = response.content.map(mapArticuloToDocument);
      
      // Filtrado local solo para Selects, la query de texto ya viene del backend
      const filtered = mappedArticles.filter(doc => {
        const matchesFaculty = !faculty || doc.faculty === faculty;
        const matchesType = !docType || doc.type === docType;
        
        return matchesFaculty && matchesType;
      });

      setDocuments(filtered);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (error) {
      console.error("Error al cargar documentos del backend:", error);
      toast({
        title: "Error de conexión",
        description: "No se pudieron recuperar los artículos del servidor.",
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    loadDocuments(currentPage, query);
  }, [currentPage, loadDocuments]); // Removido query para no hacer re-fetch en cada letra, sino al presionar buscar


  const handleSearch = useCallback(async (q: string) => {
    setQuery(q);
    setCurrentPage(0);
    loadDocuments(0, q);
    if (q.trim()) {
      try {
        const userId = getUser() || "anonymous";
        await bibliometriaService.agregarHistorial(userId, q);
      } catch (e) {
        console.error("Error al registrar búsqueda en el historial", e);
      }
    }
  }, [loadDocuments]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleAutoExtractClick = async () => {
    setIsExtracting(true);
    toast({
      title: "Extrayendo de APIs",
      description: "Descargando artículos... esto tomará unos segundos.",
    });

    try {
      const result = await bibliometriaService.automatizarDescarga("generative artificial intelligence");
      toast({
        title: "Extracción Exitosa",
        description: `Nuevos guardados: ${result.unificados.length}. Duplicados ignorados: ${result.eliminados.length}`,
      });
      setCurrentPage(0);
      await loadDocuments(0, query);
    } catch (error) {
      toast({
        title: "Error de Extracción",
        description: "Hubo un problema contactando con arXiv o Semantic Scholar.",
        variant: "destructive",
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    toast({
      title: "Iniciando carga",
      description: `Procesando ${files.length} archivo(s)...`,
    });

    try {
      const result = await bibliometriaService.cargarArchivos(files);
      toast({
        title: "Carga exitosa",
        description: `Unificados: ${result.unificados.length}. Duplicados eliminados: ${result.eliminados.length}`,
      });
      setCurrentPage(0); // Volver a la primera página para ver lo nuevo
      await loadDocuments(0, query);
    } catch (error) {
      toast({
        title: "Error al cargar",
        description: "Hubo un problema al procesar los archivos bibliométricos.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleToggleFavorite = useCallback(async (doc: Document) => {
    try {
      const userId = getUser() || "anonymous";
      const isFav = favorites.includes(doc.id);
      
      if (isFav) {
        await bibliometriaService.quitarFavorito(userId, doc.id);
        setFavorites(prev => prev.filter(id => id !== doc.id));
        toast({ title: "Favorito removido", description: "Eliminado de MongoDB Atlas." });
      } else {
        const articulo: Articulo = {
          id: doc.id,
          titulo: doc.title,
          autores: [],
          resumen: doc.description,
          anio: parseInt(doc.date.split("-")[0]) || new Date().getFullYear(),
          revista: "",
          doi: doc.size.replace("DOI: ", ""),
          origen: doc.faculty
        };
        await bibliometriaService.agregarFavorito(userId, articulo);
        setFavorites(prev => [...prev, doc.id]);
        toast({ title: "Favorito agregado", description: "Guardado en MongoDB Atlas." });
      }
    } catch (error) {
      toast({ title: "Error", description: "No se pudo actualizar el favorito.", variant: "destructive" });
    }
  }, [favorites, toast]);

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const goToSimilarity = () => {
    // Buscamos el objeto artículo original en la selección
    const selectedArticles = documents.filter(d => selectedIds.includes(d.id));
    navigate("/similarity", { state: { articles: selectedArticles } });
  };

  const goToAgrupamiento = () => {
    const selectedArticles = documents.filter(d => selectedIds.includes(d.id));
    navigate("/agrupamiento", { state: { articles: selectedArticles } });
  };

  const handleDownloadCsvClick = () => {
    window.open("http://localhost:8080/api/bibliometria/exportar/unificados", "_blank");
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl p-8 border border-primary/10">
        <h1 className="text-3xl font-extrabold text-foreground mb-2 tracking-tight">Gestor Bibliométrico Profesional</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mb-6">
          Busca, unifica y analiza literatura científica desde arXiv y Semantic Scholar de forma automática.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button 
            onClick={handleAutoExtractClick} 
            disabled={isExtracting}
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 font-medium shadow-sm transition-all"
          >
            <Download className={`w-4 h-4 ${isExtracting ? 'animate-bounce' : ''}`} />
            {isExtracting ? 'Extrayendo datos...' : 'Extraer Nuevos Artículos (APIs)'}
          </Button>
          <Button 
            onClick={() => window.open("http://localhost:8080/api/bibliometria/exportar/unificados", "_blank")}
            variant="outline"
            className="gap-2 bg-background/50 backdrop-blur-sm hover:bg-background"
          >
            <Download className="w-4 h-4" />
            Descargar Base Unificada (CSV)
          </Button>
          <Button 
            onClick={() => window.open("http://localhost:8080/api/bibliometria/exportar/eliminados", "_blank")}
            variant="ghost"
            className="gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
            title="Lista de artículos filtrados (duplicados)"
          >
            Ver Duplicados
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex-1 w-full">
          <DocumentSearch onSearch={handleSearch} />
        </div>
        
        {/* Acciones de Selección */}
        {selectedIds.length >= 1 && (
          <div className="flex gap-2 w-full md:w-auto shrink-0 animate-in slide-in-from-right-2">
            <Button 
              onClick={goToSimilarity}
              className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 flex-1 md:flex-none shadow-sm h-12 px-6 font-semibold"
            >
              Analizar Similitud ({selectedIds.length})
            </Button>
            <Button 
              onClick={goToAgrupamiento}
              className="bg-purple-600 hover:bg-purple-700 text-white gap-2 flex-1 md:flex-none shadow-sm h-12 px-6 font-semibold"
            >
              Agrupar Selección ({selectedIds.length})
            </Button>
          </div>
        )}
      </div>


      <DocumentTable
        documents={documents}
        onDownload={(doc) => {
          let targetUrl = "";
          if (doc.size.startsWith("DOI: ") && doc.size !== "DOI: N/A" && !doc.id.startsWith("DOI-0.")) {
            // Si hay un DOI oficial, dirigimos a ese
            const doi = doc.size.replace("DOI: ", "");
            targetUrl = `https://doi.org/${doi}`;
          } else {
            // Si no hay enlace directo, lo buscamos en Google Scholar para que puedan bajar su PDF
            targetUrl = `https://scholar.google.com/scholar?q=${encodeURIComponent(doc.title)}`;
          }
          window.open(targetUrl, "_blank");
        }}
        onToggleFavorite={handleToggleFavorite}
        favorites={favorites}
        selectedIds={selectedIds}
        onToggleSelect={handleToggleSelect}
      />

      {totalPages > 1 && (
        <div className="py-4 border-t">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <Button 
                  variant="ghost" 
                  disabled={currentPage === 0} 
                  onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                  className="gap-1"
                >
                  <ChevronLeft className="h-4 w-4" /> Anterior
                </Button>
              </PaginationItem>
              
              <PaginationItem>
                <span className="px-4 text-sm text-muted-foreground">
                  Página {currentPage + 1} de {totalPages} ({totalElements} registros)
                </span>
              </PaginationItem>

              <PaginationItem>
                <Button 
                  variant="ghost" 
                  disabled={currentPage === totalPages - 1} 
                  onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                  className="gap-1"
                >
                  Siguiente <ChevronRight className="h-4 w-4" />
                </Button>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
};

export default SearchPage;
