export interface Document {
  id: string;
  title: string;
  type: string;
  faculty: string;
  date: string;
  size: string;
  status: string;
  description: string;
}

export interface HistoryEntry {
  id: string;
  query: string;
  timestamp: string;
  type: 'search' | 'download';
  documentTitle?: string;
}

export const FACULTIES = [
  "Ciencias de la Salud",
  "Ingeniería",
  "Ciencias Sociales",
  "Ciencias Económicas",
  "Derecho",
  "Educación",
  "Ciencias Naturales",
] as const;

export const DOCUMENT_TYPES = [
  "Artículo",
  "Conferencia",
  "Capítulo de Libro",
  "Tesis",
  "Informe Técnico",
  "Ponencia",
  "Proyecto de Investigación",
] as const;

const MOCK_DOCUMENTS: Document[] = [
  { id: "DOC-001", title: "Impacto de la telemedicina en zonas rurales", type: "Artículo", faculty: "Ciencias de la Salud", date: "2024-01-15", size: "245 KB", status: "Disponible", description: "Artículo científico sobre telemedicina y su impacto en comunidades rurales." },
  { id: "DOC-002", title: "Optimización de redes neuronales profundas", type: "Conferencia", faculty: "Ingeniería", date: "2024-03-20", size: "1.2 MB", status: "Disponible", description: "Ponencia presentada en congreso internacional de inteligencia artificial." },
  { id: "DOC-003", title: "Migración y políticas públicas en Latinoamérica", type: "Capítulo de Libro", faculty: "Ciencias Sociales", date: "2023-11-05", size: "512 KB", status: "Disponible", description: "Capítulo sobre movimientos migratorios y respuestas gubernamentales." },
  { id: "DOC-004", title: "Modelos econométricos para mercados emergentes", type: "Artículo", faculty: "Ciencias Económicas", date: "2024-02-10", size: "180 KB", status: "Disponible", description: "Análisis de modelos predictivos aplicados a economías en desarrollo." },
  { id: "DOC-005", title: "Derecho ambiental comparado", type: "Tesis", faculty: "Derecho", date: "2022-06-30", size: "3.5 MB", status: "Disponible", description: "Tesis doctoral sobre legislación ambiental en países de la región." },
  { id: "DOC-006", title: "Metodologías activas en educación superior", type: "Informe Técnico", faculty: "Educación", date: "2024-04-01", size: "320 KB", status: "Procesando", description: "Informe sobre implementación de aprendizaje basado en proyectos." },
  { id: "DOC-007", title: "Biodiversidad en ecosistemas costeros", type: "Proyecto de Investigación", faculty: "Ciencias Naturales", date: "2024-01-01", size: "890 KB", status: "Disponible", description: "Proyecto de investigación sobre especies marinas en peligro." },
  { id: "DOC-008", title: "Aplicación de IoT en sistemas de riego", type: "Conferencia", faculty: "Ingeniería", date: "2023-08-15", size: "1.1 MB", status: "Disponible", description: "Presentación sobre automatización agrícola con Internet de las Cosas." },
  { id: "DOC-009", title: "Prevalencia de diabetes tipo 2 en jóvenes", type: "Artículo", faculty: "Ciencias de la Salud", date: "2024-05-12", size: "340 KB", status: "Disponible", description: "Estudio epidemiológico sobre diabetes en población juvenil." },
  { id: "DOC-010", title: "Reformas tributarias y crecimiento económico", type: "Ponencia", faculty: "Ciencias Económicas", date: "2023-09-22", size: "275 KB", status: "Disponible", description: "Ponencia sobre el efecto de reformas fiscales en el PIB." },
  { id: "DOC-011", title: "Gamificación en la enseñanza de matemáticas", type: "Capítulo de Libro", faculty: "Educación", date: "2024-02-28", size: "410 KB", status: "Disponible", description: "Experiencias de gamificación en aulas de secundaria." },
  { id: "DOC-012", title: "Análisis genético de especies endémicas", type: "Tesis", faculty: "Ciencias Naturales", date: "2023-12-10", size: "2.8 MB", status: "Disponible", description: "Tesis sobre diversidad genética de fauna endémica panameña." },
];

const USER_KEY = "docportal_user";
const HISTORY_KEY = "docportal_history";
const FAVORITES_KEY = "docportal_favorites";

export function getUser(): string | null {
  return localStorage.getItem(USER_KEY);
}

export function setUser(identifier: string) {
  localStorage.setItem(USER_KEY, identifier);
}

export function logoutUser() {
  localStorage.removeItem(USER_KEY);
}

export interface SearchFilters {
  query?: string;
  faculty?: string;
  type?: string;
}

export function searchDocuments(query: string, filters?: { faculty?: string; type?: string }): Document[] {
  let results = MOCK_DOCUMENTS;

  if (filters?.faculty) {
    results = results.filter((d) => d.faculty === filters.faculty);
  }
  if (filters?.type) {
    results = results.filter((d) => d.type === filters.type);
  }
  if (query.trim()) {
    const q = query.toLowerCase();
    results = results.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        d.type.toLowerCase().includes(q) ||
        d.id.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q) ||
        d.faculty.toLowerCase().includes(q)
    );
  }

  return results;
}

export function getAllDocuments(): Document[] {
  return MOCK_DOCUMENTS;
}

export function getHistory(): HistoryEntry[] {
  const raw = localStorage.getItem(HISTORY_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function addHistory(entry: Omit<HistoryEntry, "id" | "timestamp">) {
  const history = getHistory();
  history.unshift({
    ...entry,
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
  });
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 50)));
}

export function getFavorites(): string[] {
  const raw = localStorage.getItem(FAVORITES_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function toggleFavorite(docId: string): boolean {
  const favs = getFavorites();
  const index = favs.indexOf(docId);
  if (index >= 0) {
    favs.splice(index, 1);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
    return false;
  } else {
    favs.push(docId);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
    return true;
  }
}

export function isFavorite(docId: string): boolean {
  return getFavorites().includes(docId);
}

export function getFavoriteDocuments(): Document[] {
  const favIds = getFavorites();
  return MOCK_DOCUMENTS.filter((d) => favIds.includes(d.id));
}
