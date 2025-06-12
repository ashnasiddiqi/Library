// src/api.ts
import axios from "axios";

export const api = axios.create({
  // only your backend; no trailing slash
  baseURL: import.meta.env.VITE_API_URL,
  // we don’t need cookies → leave withCredentials off (false by default)
});
