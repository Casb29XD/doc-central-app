import { useState, useCallback, useEffect, useRef } from "react";
import DocumentSearch from "@/components/DocumentSearch";
import DocumentTable from "@/components/DocumentTable";
import { addHistory, toggleFavorite, getFavorites, Document, FACULTIES, DOCUMENT_TYPES } from "@/lib/store";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Filter, X, Upload, ChevronLeft, ChevronRight } from "lucide-react";
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

  const loadDocuments = useCallback(async (page: number) => {
    try {
      const response = await bibliometriaService.obtenerArticulos(page, 10);
      const mappedArticles = response.content.map(mapArticuloToDocument);
      
      // Aplicar filtros locales de UI si es necesario (aunque lo ideal sería filtros en el backend)
      // Por ahora, recargamos según la página del backend
      setDocuments(mappedArticles);
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
    loadDocuments(currentPage);
  }, [currentPage, loadDocuments]);

  const handleSearch = useCallback((q: string) => {
    setQuery(q);
    if (q.trim()) {
      addHistory({ query: q, type: "search" });
    }
  }, []);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
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
      await loadDocuments(0);
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

  return (
    <div className="space-y-6">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        multiple 
        accept=".csv,.bib" 
        className="hidden" 
      />
      
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Gestión Bibliométrica</h2>
          <p className="text-muted-foreground text-sm">Cargue archivos y analice la similitud de los abstracts</p>
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
            onClick={handleUploadClick} 
            disabled={isUploading}
            variant="outline"
            className="gap-2"
          >
            <Upload className={`w-4 h-4 ${isUploading ? 'animate-pulse' : ''}`} />
            {isUploading ? 'Procesando...' : 'Cargar CSV/BibTeX'}
          </Button>
        </div>
      </div>
      
      <div className="mt-4">
        <DocumentSearch onSearch={handleSearch} />
      </div>

      <DocumentTable
        documents={documents}
        onDownload={() => {}} // No necesario para este requerimiento
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
