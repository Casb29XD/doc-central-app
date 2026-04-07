import { useState, useCallback } from "react";
import DocumentTable from "@/components/DocumentTable";
import { getFavoriteDocuments, addHistory, toggleFavorite, getFavorites, Document } from "@/lib/store";
import { Star } from "lucide-react";

const FavoritesPage = () => {
  const [documents, setDocuments] = useState<Document[]>(getFavoriteDocuments());
  const [favorites, setFavorites] = useState<string[]>(getFavorites());

  const handleDownload = useCallback((doc: Document) => {
    addHistory({ query: doc.id, type: "download", documentTitle: doc.title });
  }, []);

  const handleToggleFavorite = useCallback((doc: Document) => {
    toggleFavorite(doc.id);
    setFavorites(getFavorites());
    setDocuments(getFavoriteDocuments());
  }, []);

  if (documents.length === 0) {
    return (
      <div>
        <h2 className="text-xl font-bold text-foreground mb-1">Favoritos</h2>
        <p className="text-muted-foreground text-sm mb-5">Documentos que ha marcado como favoritos</p>
        <div className="text-center py-20">
          <Star className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-lg">No tiene favoritos aún</p>
          <p className="text-muted-foreground text-sm mt-1">Marque documentos con la estrella para verlos aquí</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-foreground mb-1">Favoritos</h2>
      <p className="text-muted-foreground text-sm mb-5">{documents.length} documento{documents.length !== 1 ? "s" : ""} guardado{documents.length !== 1 ? "s" : ""}</p>
      <DocumentTable
        documents={documents}
        onDownload={handleDownload}
        onToggleFavorite={handleToggleFavorite}
        favorites={favorites}
      />
    </div>
  );
};

export default FavoritesPage;
