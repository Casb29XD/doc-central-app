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
  type: 'search' | 'download' | 'similarity' | 'analysis';
  documentTitle?: string;
  details?: string;
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

const MOCK_DOCUMENTS: Document[] = [];

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
