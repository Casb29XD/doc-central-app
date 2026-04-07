import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FileText, ArrowRight } from "lucide-react";

interface LoginScreenProps {
  onLogin: (identifier: string) => void;
}

const LoginScreen = ({ onLogin }: LoginScreenProps) => {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) {
      setError("Por favor ingrese su cédula o correo electrónico.");
      return;
    }
    if (trimmed.length < 3) {
      setError("Ingrese al menos 3 caracteres.");
      return;
    }
    onLogin(trimmed);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-4 shadow-lg">
            <FileText className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Portal de Documentos</h1>
          <p className="text-muted-foreground mt-1">Acceda a sus documentos de forma segura</p>
        </div>

        <Card className="shadow-xl border-border/50">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-lg">Iniciar Sesión</CardTitle>
            <CardDescription>Ingrese su cédula o correo electrónico</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  placeholder="Ej: 8-888-888 o correo@ejemplo.com"
                  value={value}
                  onChange={(e) => {
                    setValue(e.target.value);
                    setError("");
                  }}
                  className="h-12 text-base"
                  autoFocus
                />
                {error && <p className="text-destructive text-sm mt-2">{error}</p>}
              </div>
              <Button type="submit" className="w-full h-12 text-base font-semibold gap-2">
                Ingresar
                <ArrowRight className="w-4 h-4" />
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-muted-foreground text-xs mt-6">
          Sistema seguro de consulta de documentos
        </p>
      </div>
    </div>
  );
};

export default LoginScreen;
