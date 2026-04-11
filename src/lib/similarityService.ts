import { Articulo } from "./bibliometriaService";

const API_BASE_URL = "http://localhost:8080/api/similitud";

export interface ResultadoSimilitud {
  score: number;
  algoritmo: string;
  pasosExplicacion: string[];
}

export interface MatrizSimilitud {
  [key: string]: ResultadoSimilitud[];
}

export const similarityService = {
  /**
   * Envía una lista de artículos para analizar la similitud entre ellos
   */
  async analizarSimilitud(articulos: Articulo[]): Promise<MatrizSimilitud> {
    try {
      const response = await fetch(`${API_BASE_URL}/analizar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(articulos),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error en el análisis: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error al llamar a /analizar:", error);
      throw error;
    }
  }
};
