import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

/**
 * Base URL backend API FastAPI
 * Diambil dari environment variable NEXT_PUBLIC_API_BASE_URL (default: http://localhost:8000/api/v1)
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30 detik
});

/**
 * Helper untuk akses token di LocalStorage (dengan aman di SSR)
 */
export const getAccessToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("topshop_access_token");
};

export const getRefreshToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("topshop_refresh_token");
};

export const setTokens = (accessToken: string, refreshToken?: string) => {
  if (typeof window === "undefined") return;
  localStorage.setItem("topshop_access_token", accessToken);
  document.cookie = `topshop_access_token=${accessToken}; path=/; max-age=604800; SameSite=Lax`;
  if (refreshToken) {
    localStorage.setItem("topshop_refresh_token", refreshToken);
  }
};

export const clearTokens = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("topshop_access_token");
  localStorage.removeItem("topshop_refresh_token");
  document.cookie = "topshop_access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
};

// =========================================================
// REQUEST INTERCEPTOR: Menyisipkan Bearer Token
// =========================================================
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// =========================================================
// RESPONSE INTERCEPTOR: Auto Silent Refresh Token (HTTP 401)
// =========================================================
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: AxiosError | null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Abaikan jika error bukan 401 atau URL adalah login/refresh itu sendiri
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/login") &&
      !originalRequest.url?.includes("/auth/refresh")
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => api(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = getRefreshToken();

      if (!refreshToken) {
        clearTokens();
        isRefreshing = false;
        return Promise.reject(error);
      }

      try {
        const refreshResponse = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        });

        const { access_token, refresh_token: newRefreshToken } =
          refreshResponse.data;

        setTokens(access_token, newRefreshToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
        }

        processQueue(null);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as AxiosError);
        clearTokens();
        if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
          // Hanya redirect jika bukan di halaman login
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
