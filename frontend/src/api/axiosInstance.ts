import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Important for cookies
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add token (if needed)
axiosInstance.interceptors.request.use(
  (config) => {
    // Token is automatically sent via cookies
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clean up local storage if you use it, but DO NOT redirect here!
      localStorage.removeItem("token");

      // Let the error pass through so RTK Query and AppInitializer can handle it natively
    }
    return Promise.reject(error);
  }
);
