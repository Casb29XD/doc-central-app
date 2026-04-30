import { Articulo } from "./bibliometriaService";

const API_BASE_URL = "http://localhost:8080/api/bibliometria";

export interface ResultadoComparacion {
  idArticuloTarget: string;
  tituloTarget: string;
  resumenTarget?: string;
  puntajesPorAlgoritmo: { [key: string]: number };
}

export const similarityService = {
  /**
   * Envía un artículo base para analizar su similitud contra el resto de la base de datos
   */
  async analizarSimilitud(articuloBase: Articulo, usuarioId: string = "anonymous"): Promise<ResultadoComparacion[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/analizar-similitud`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": usuarioId
        },
        body: JSON.stringify(articuloBase),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error en el análisis: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error al llamar a /analizar-similitud:", error);
      throw error;
    }
  }
};
