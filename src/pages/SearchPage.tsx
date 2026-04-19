import { useState, useCallback, useEffect, useRef } from "react";
import DocumentSearch from "@/components/DocumentSearch";
import DocumentTable from "@/components/DocumentTable";
import { addHistory, toggleFavorite, getFavorites, Document, FACULTIES, DOCUMENT_TYPES } from "@/lib/store";
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
  const [favorites, setFavorites] = useState<string[]>(getFavorites());
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

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


  const handleSearch = useCallback((q: string) => {
    setQuery(q);
    setCurrentPage(0);
    loadDocuments(0, q);
    if (q.trim()) {
      addHistory({ query: q, type: "search" });
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
    // Buscamos el objeto artículo original en la selección
    const selectedArticles = documents.filter(d => selectedIds.includes(d.id));
    navigate("/similarity", { state: { articles: selectedArticles } });
  };

  const handleDownloadCsvClick = () => {
    window.open("http://localhost:8080/api/bibliometria/exportar/unificados", "_blank");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Gestión Bibliométrica</h2>
          <p className="text-muted-foreground text-sm">Analice la similitud de los abstracts de arXiv y Semantic Scholar</p>
        </div>
        <div className="flex gap-2">
          {selectedIds.length >= 1 && (
            <Button 
              onClick={goToSimilarity}
              className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
            >
              Analizar Similitud ({selectedIds.length})
            </Button>
          )}
          <Button 
            onClick={() => window.open("http://localhost:8080/api/bibliometria/exportar/eliminados", "_blank")}
            variant="ghost"
            className="gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
            title="Lista de artículos filtrados (duplicados)"
          >
            <Download className="w-4 h-4" />
            Duplicados
          </Button>
          <Button 
            onClick={() => window.open("http://localhost:8080/api/bibliometria/exportar/unificados", "_blank")}
            variant="outline"
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Base Unificada
          </Button>
          <Button 
            onClick={handleAutoExtractClick} 
            disabled={isExtracting}
            className="bg-green-600 hover:bg-green-700 text-white gap-2"
          >
            <Download className={`w-4 h-4 ${isExtracting ? 'animate-bounce' : ''}`} />
            {isExtracting ? 'Descargando...' : 'Extraer de APIs'}
          </Button>
        </div>
      </div>
      
      <div className="mt-4">
        <DocumentSearch onSearch={handleSearch} />
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
