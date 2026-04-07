import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

interface DocumentSearchProps {
  onSearch: (query: string) => void;
}

const DocumentSearch = ({ onSearch }: DocumentSearchProps) => {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre, tipo o ID del documento..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-11 h-12 text-base"
        />
      </div>
      <Button type="submit" className="h-12 px-6 font-semibold">
        Buscar
      </Button>
    </form>
  );
};

export default DocumentSearch;
