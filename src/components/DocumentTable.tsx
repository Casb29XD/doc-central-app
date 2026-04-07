import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, Star } from "lucide-react";
import { Document, isFavorite } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";

interface DocumentTableProps {
  documents: Document[];
  onDownload: (doc: Document) => void;
  onToggleFavorite?: (doc: Document) => void;
  favorites?: string[];
}

const DocumentTable = ({ documents, onDownload, onToggleFavorite, favorites }: DocumentTableProps) => {
  const { toast } = useToast();

  if (documents.length === 0) {
    return (
      <div className="text-center py-16">
        <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground text-lg">No se encontraron documentos</p>
        <p className="text-muted-foreground text-sm mt-1">Intente con otra búsqueda</p>
      </div>
    );
  }

  const handleDownload = (doc: Document) => {
    if (doc.status !== "Disponible") {
      toast({ title: "Documento no disponible", description: "Este documento aún está en proceso.", variant: "destructive" });
      return;
    }
    onDownload(doc);
    toast({ title: "Descarga iniciada", description: `Descargando "${doc.title}"` });
  };

  const checkFav = (docId: string) => {
    if (favorites) return favorites.includes(docId);
    return isFavorite(docId);
  };

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="font-semibold text-foreground w-10"></TableHead>
              <TableHead className="font-semibold text-foreground">ID</TableHead>
              <TableHead className="font-semibold text-foreground">Documento</TableHead>
              <TableHead className="font-semibold text-foreground hidden md:table-cell">Tipo</TableHead>
              <TableHead className="font-semibold text-foreground hidden sm:table-cell">Fecha</TableHead>
              <TableHead className="font-semibold text-foreground">Estado</TableHead>
              <TableHead className="font-semibold text-foreground text-right">Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((doc) => {
              const fav = checkFav(doc.id);
              return (
                <TableRow key={doc.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell>
                    <button
                      onClick={() => onToggleFavorite?.(doc)}
                      className="p-1 rounded-md hover:bg-muted transition-colors"
                      aria-label={fav ? "Quitar de favoritos" : "Agregar a favoritos"}
                    >
                      <Star className={`w-4 h-4 ${fav ? "fill-primary text-primary" : "text-muted-foreground"}`} />
                    </button>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{doc.id}</TableCell>
                  <TableCell>
                    <p className="font-medium text-foreground text-sm">{doc.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block max-w-[200px] truncate">{doc.description}</p>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant="secondary" className="font-normal text-xs">{doc.type}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm hidden sm:table-cell">{doc.date}</TableCell>
                  <TableCell>
                    <Badge
                      variant={doc.status === "Disponible" ? "default" : "secondary"}
                      className={doc.status === "Disponible" ? "bg-success text-success-foreground text-xs" : "text-xs"}
                    >
                      {doc.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant={doc.status === "Disponible" ? "default" : "secondary"} onClick={() => handleDownload(doc)} disabled={doc.status !== "Disponible"} className="gap-1.5">
                      <Download className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Descargar</span>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default DocumentTable;
