/**
 * Servicio para comunicarse con el backend de Spring Boot
 */

const API_BASE_URL = "http://localhost:8080/api/bibliometria";

export interface Articulo {
  id?: string;
  titulo: string;
  autores: string[];
  resumen: string;
  anio?: number;
  revista?: string;
  doi?: string;
  palabrasClave?: string[];
  origen?: string;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
}

export interface AlgoritmoInfo {
  nombre: string;
  explicacion: string;
}

export const bibliometriaService = {
  /**
   * Carga archivos y dispara el proceso de unificación en el servidor
   */
  async cargarArchivos(files: FileList | File[]): Promise<any> {
    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append("archivos", file);
    });

    try {
      const response = await fetch(`${API_BASE_URL}/cargar`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        throw new Error(`Error en la carga: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error al llamar a /cargar:", error);
      throw error;
    }
  },

  /**
   * Obtiene la lista de artículos únicos con paginación
   */
  async obtenerArticulos(page: number = 0, size: number = 10): Promise<PaginatedResponse<Articulo>> {
    try {
      const response = await fetch(`${API_BASE_URL}/articulos?page=${page}&size=${size}`);
      if (!response.ok) {
        throw new Error(`Error al obtener artículos: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error al llamar a /articulos:", error);
      throw error;
    }
  },

  /**
   * Obtiene la información de los algoritmos de similitud disponibles
   */
  async obtenerAlgoritmos(): Promise<AlgoritmoInfo[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/algoritmos`);
      if (!response.ok) {
        throw new Error(`Error al obtener algoritmos: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error al obtener algoritmos:", error);
      throw error;
    }
  }
};
