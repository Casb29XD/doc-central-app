export interface Document {
  id: string;
  title: string;
  type: string;
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

const MOCK_DOCUMENTS: Document[] = [
  { id: "DOC-001", title: "Certificado de Nacimiento", type: "Certificado", date: "2024-01-15", size: "245 KB", status: "Disponible", description: "Certificado oficial de nacimiento emitido por el registro civil." },
  { id: "DOC-002", title: "Declaración de Impuestos 2023", type: "Fiscal", date: "2024-03-20", size: "1.2 MB", status: "Disponible", description: "Declaración anual de impuestos correspondiente al año fiscal 2023." },
  { id: "DOC-003", title: "Licencia de Conducir", type: "Identificación", date: "2023-11-05", size: "512 KB", status: "Disponible", description: "Copia digital de la licencia de conducir vigente." },
  { id: "DOC-004", title: "Constancia de Residencia", type: "Certificado", date: "2024-02-10", size: "180 KB", status: "Disponible", description: "Constancia de residencia emitida por la junta comunal." },
  { id: "DOC-005", title: "Título Universitario", type: "Educación", date: "2022-06-30", size: "3.5 MB", status: "Disponible", description: "Título de grado universitario en Ingeniería de Sistemas." },
  { id: "DOC-006", title: "Certificado de Antecedentes", type: "Legal", date: "2024-04-01", size: "320 KB", status: "Procesando", description: "Certificado de antecedentes penales en trámite." },
  { id: "DOC-007", title: "Póliza de Seguro", type: "Seguro", date: "2024-01-01", size: "890 KB", status: "Disponible", description: "Póliza de seguro de vida vigente hasta diciembre 2024." },
  { id: "DOC-008", title: "Contrato de Trabajo", type: "Laboral", date: "2023-08-15", size: "1.1 MB", status: "Disponible", description: "Contrato laboral firmado con la empresa actual." },
];

const USER_KEY = "docportal_user";
const HISTORY_KEY = "docportal_history";

export function getUser(): string | null {
  return localStorage.getItem(USER_KEY);
}

export function setUser(identifier: string) {
  localStorage.setItem(USER_KEY, identifier);
}

export function logoutUser() {
  localStorage.removeItem(USER_KEY);
}

export function searchDocuments(query: string): Document[] {
  if (!query.trim()) return MOCK_DOCUMENTS;
  const q = query.toLowerCase();
  return MOCK_DOCUMENTS.filter(
    (d) =>
      d.title.toLowerCase().includes(q) ||
      d.type.toLowerCase().includes(q) ||
      d.id.toLowerCase().includes(q) ||
      d.description.toLowerCase().includes(q)
  );
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
