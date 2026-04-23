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

export interface PalabraFrecuencia {
  palabra: string;
  frecuencia: number;
}

export interface PalabraDescubierta {
  palabra: string;
  frecuencia: number;
  precision: number;
}

export interface ResultadoMineria {
  palabrasBase: PalabraFrecuencia[];
  nuevasPalabras: PalabraDescubierta[];
}

export interface AlgoritmoInfo {
  nombre: string;
  explicacion: string;
}

export interface ClusterNode {
  id: string | null;
  label: string | null;
  left: ClusterNode | null;
  right: ClusterNode | null;
  distance: number;
  size: number;
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
   * Extrae artículos automáticamente usando las APIs configuradas (ArXiv, Semantic Scholar)
   */
  async automatizarDescarga(query: string = "generative artificial intelligence"): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/automatizar?query=${encodeURIComponent(query)}`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error(`Error en la extracción automática: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error al llamar a /automatizar:", error);
      throw error;
    }
  },

  /**
   * Obtiene la lista de artículos únicos con paginación
   */
  async obtenerArticulos(page: number = 0, size: number = 10, query: string = ""): Promise<PaginatedResponse<Articulo>> {
    try {
      const queryParam = query ? `&query=${encodeURIComponent(query)}` : "";
      const response = await fetch(`${API_BASE_URL}/articulos?page=${page}&size=${size}${queryParam}`);
      if (!response.ok) {
        throw new Error(`Error al obtener artículos: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error al llamar a /articulos:", error);
      throw error;
    }
  },

  async obtenerMineriaTextos(): Promise<ResultadoMineria> {
    const res = await fetch(`${API_BASE_URL}/mineria/frecuencias`);
    if (!res.ok) throw new Error("Error obteniendo resultados de minería");
    return res.json();
  },

  async obtenerMineriaDocumento(id: string): Promise<ResultadoMineria> {
    const res = await fetch(`${API_BASE_URL}/mineria/frecuencias/${encodeURIComponent(id)}`);
    if (!res.ok) throw new Error("Error obteniendo resultados de minería del documento");
    return res.json();
  },

  async obtenerAgrupamiento(linkage: string = "average", limit: number = 50): Promise<ClusterNode> {
    const res = await fetch(`${API_BASE_URL}/agrupamiento?linkage=${linkage}&limit=${limit}`);
    if (!res.ok) throw new Error("Error obteniendo el agrupamiento jerárquico");
    if (res.status === 204) throw new Error("No hay suficientes artículos para agrupar");
    return res.json();
  },

  async obtenerAgrupamientoPorIds(ids: string[], linkage: string = "average", metric: string = "Coseno"): Promise<ClusterNode> {
    const res = await fetch(`${API_BASE_URL}/agrupamiento`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ids, linkage, metric })
    });
    if (!res.ok) throw new Error("Error obteniendo el agrupamiento jerárquico");
    if (res.status === 204) throw new Error("No hay suficientes artículos para agrupar");
    return res.json();
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
