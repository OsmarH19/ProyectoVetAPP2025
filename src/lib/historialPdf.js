const STORAGE_KEY = "historial_pdf_urls";

const readMap = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

const writeMap = (map) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore storage failures
  }
};

export const getHistorialPdfUrl = (mascotaId) => {
  if (!mascotaId) return "";
  const map = readMap();
  return map[String(mascotaId)] || "";
};

export const setHistorialPdfUrl = (mascotaId, url) => {
  if (!mascotaId || !url) return;
  const map = readMap();
  map[String(mascotaId)] = url;
  writeMap(map);
};

