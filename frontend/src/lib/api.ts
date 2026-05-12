const raw = import.meta.env.VITE_API_URL || "http://localhost:8000";

// Render fromService:host нь "hostname.onrender.com" өгдөг — https нэмнэ
export const API_URL = raw.startsWith("http") ? raw : `https://${raw}`;
