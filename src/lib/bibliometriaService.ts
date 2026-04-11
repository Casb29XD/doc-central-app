/**
 * Servicio para comunicarse con el backend de Spring Boot
 */

const API_BASE_URL = "http://localhost:8080/api/bibliometria";

export interface Articulo {
  id: string;
  titulo: string;
  autores: string[];
  resumen: string;
  palabrasClave: string[];
  origen: string;
}

export const bibliometriaService = {
  /**
   * Dispara el proceso de descarga y unificación en el servidor
   */
  async descargarArticulos(consulta: string = "generative artificial intelligence", limite: number = 20): Promise<string> {
    try {
      const response = await fetch(`${API_BASE_URL}/descargar?consulta=${encodeURIComponent(consulta)}&limite=${limite}`);
      if (!response.ok) {
        throw new Error(`Error en la descarga: ${response.statusText}`);
      }
      return await response.text();
    } catch (error) {
      console.error("Error al llamar a /descargar:", error);
      throw error;
    }
  },

  /**
   * Obtiene la lista de artículos únicos procesados
   */
  async obtenerArticulos(): Promise<Articulo[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/articulos`);
      if (!response.ok) {
        throw new Error(`Error al obtener artículos: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error al llamar a /articulos:", error);
      throw error;
    }
  }
};
