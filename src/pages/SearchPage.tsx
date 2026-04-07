import { useState, useCallback } from "react";
import DocumentSearch from "@/components/DocumentSearch";
import DocumentTable from "@/components/DocumentTable";
import { searchDocuments, addHistory, toggleFavorite, getFavorites, Document } from "@/lib/store";

const SearchPage = () => {
  const [documents, setDocuments] = useState<Document[]>(searchDocuments(""));
  const [favorites, setFavorites] = useState<string[]>(getFavorites());

  const handleSearch = useCallback((query: string) => {
    const results = searchDocuments(query);
    setDocuments(results);
    if (query.trim()) {
      addHistory({ query, type: "search" });
    }
  }, []);

  const handleDownload = useCallback((doc: Document) => {
    addHistory({ query: doc.id, type: "download", documentTitle: doc.title });
  }, []);

  const handleToggleFavorite = useCallback((doc: Document) => {
    toggleFavorite(doc.id);
    setFavorites(getFavorites());
  }, []);

  return (
    <div>
      <h2 className="text-xl font-bold text-foreground mb-1">Buscar Documentos</h2>
      <p className="text-muted-foreground text-sm mb-5">Encuentre y descargue sus documentos</p>
      <div className="mb-6">
        <DocumentSearch onSearch={handleSearch} />
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
