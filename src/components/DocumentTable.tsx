import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileText } from "lucide-react";
import { Document } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";

interface DocumentTableProps {
  documents: Document[];
  onDownload: (doc: Document) => void;
}

const DocumentTable = ({ documents, onDownload }: DocumentTableProps) => {
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
      toast({
        title: "Documento no disponible",
        description: "Este documento aún está en proceso.",
        variant: "destructive",
      });
      return;
    }
    onDownload(doc);
    toast({
      title: "Descarga iniciada",
      description: `Descargando "${doc.title}"`,
    });
  };

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="font-semibold text-foreground">ID</TableHead>
            <TableHead className="font-semibold text-foreground">Documento</TableHead>
            <TableHead className="font-semibold text-foreground hidden md:table-cell">Tipo</TableHead>
            <TableHead className="font-semibold text-foreground hidden sm:table-cell">Fecha</TableHead>
            <TableHead className="font-semibold text-foreground hidden lg:table-cell">Tamaño</TableHead>
            <TableHead className="font-semibold text-foreground">Estado</TableHead>
            <TableHead className="font-semibold text-foreground text-right">Acción</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((doc) => (
            <TableRow key={doc.id} className="hover:bg-muted/30 transition-colors">
              <TableCell className="font-mono text-sm text-muted-foreground">{doc.id}</TableCell>
              <TableCell>
                <div>
                  <p className="font-medium text-foreground">{doc.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block max-w-xs truncate">{doc.description}</p>
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <Badge variant="secondary" className="font-normal">{doc.type}</Badge>
              </TableCell>
              <TableCell className="text-muted-foreground hidden sm:table-cell">{doc.date}</TableCell>
              <TableCell className="text-muted-foreground hidden lg:table-cell">{doc.size}</TableCell>
              <TableCell>
                <Badge
                  variant={doc.status === "Disponible" ? "default" : "secondary"}
                  className={doc.status === "Disponible" ? "bg-success text-success-foreground" : ""}
                >
                  {doc.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button
                  size="sm"
                  variant={doc.status === "Disponible" ? "default" : "secondary"}
                  onClick={() => handleDownload(doc)}
                  disabled={doc.status !== "Disponible"}
                  className="gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Descargar</span>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default DocumentTable;
