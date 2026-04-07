import { useState, useCallback } from "react";
import DocumentSearch from "@/components/DocumentSearch";
import DocumentTable from "@/components/DocumentTable";
import { searchDocuments, addHistory, toggleFavorite, getFavorites, Document, FACULTIES, DOCUMENT_TYPES } from "@/lib/store";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Filter, X } from "lucide-react";

const SearchPage = () => {
  const [query, setQuery] = useState("");
  const [faculty, setFaculty] = useState<string>("");
  const [docType, setDocType] = useState<string>("");
  const [documents, setDocuments] = useState<Document[]>(searchDocuments(""));
  const [favorites, setFavorites] = useState<string[]>(getFavorites());

  const applyFilters = useCallback((q: string, fac: string, typ: string) => {
    const results = searchDocuments(q, {
      faculty: fac || undefined,
      type: typ || undefined,
    });
    setDocuments(results);
    if (q.trim()) {
      addHistory({ query: q, type: "search" });
    }
  }, []);

  const handleSearch = useCallback((q: string) => {
    setQuery(q);
    applyFilters(q, faculty, docType);
  }, [faculty, docType, applyFilters]);

  const handleFacultyChange = (val: string) => {
    const v = val === "all" ? "" : val;
    setFaculty(v);
    applyFilters(query, v, docType);
  };

  const handleTypeChange = (val: string) => {
    const v = val === "all" ? "" : val;
    setDocType(v);
    applyFilters(query, faculty, v);
  };

  const clearFilters = () => {
    setFaculty("");
    setDocType("");
    applyFilters(query, "", "");
  };

  const handleDownload = useCallback((doc: Document) => {
    addHistory({ query: doc.id, type: "download", documentTitle: doc.title });
  }, []);

  const handleToggleFavorite = useCallback((doc: Document) => {
    toggleFavorite(doc.id);
    setFavorites(getFavorites());
  }, []);

  const hasFilters = faculty || docType;

  return (
    <div>
      <h2 className="text-xl font-bold text-foreground mb-1">Buscar Documentos</h2>
      <p className="text-muted-foreground text-sm mb-5">Encuentre y descargue documentos de productividad científica</p>
      <div className="mb-4">
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
      />
    </div>
  );
};

export default SearchPage;
