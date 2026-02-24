const RAW_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://api.mivetapp.com/api";

export const API_BASE_URL = String(RAW_API_BASE_URL).replace(/\/+$/, "");

export const apiUrl = (path = "") => {
  const normalizedPath = String(path).replace(/^\/+/, "");
  return normalizedPath ? `${API_BASE_URL}/${normalizedPath}` : API_BASE_URL;
};
