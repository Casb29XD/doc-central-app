import { useState, useCallback, useEffect } from "react";
import DocumentTable from "@/components/DocumentTable";
import { Document, getUser } from "@/lib/store";
import { bibliometriaService } from "@/lib/bibliometriaService";
import { Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const FavoritesPage = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const { toast } = useToast();

  const loadFavorites = useCallback(async () => {
    try {
      const userId = getUser() || "anonymous";
      const data = await bibliometriaService.listarFavoritos(userId);
      const mappedDocs = data.map((fav: any) => ({
        id: fav.articuloId,
        title: fav.titulo,
        type: "Artículo",
        faculty: "Favorito",
        date: fav.fechaAgregado,
        size: "N/A",
        status: "Guardado",
        description: ""
      }));
      setDocuments(mappedDocs);
      setFavorites(mappedDocs.map(d => d.id));
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const handleDownload = useCallback((doc: Document) => {
    // History logging handled in backend now if needed
    window.open(`https://scholar.google.com/scholar?q=${encodeURIComponent(doc.title)}`, "_blank");
  }, []);

  const handleToggleFavorite = useCallback(async (doc: Document) => {
    try {
      const userId = getUser() || "anonymous";
      // Si ya está en favoritos, se quita
      await bibliometriaService.quitarFavorito(userId, doc.id);
      await loadFavorites();
      toast({ title: "Favorito removido", description: "El artículo ha sido eliminado de tus favoritos en Atlas." });
    } catch (error) {
      toast({ title: "Error", description: "No se pudo modificar el favorito.", variant: "destructive" });
    }
  }, [loadFavorites, toast]);

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
