import axios from "axios";
import SummaryApi from "./SummaryApi";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_AUTH_API_URL,
  withCredentials: true, // Crucial for sending/receiving HttpOnly cookies
  headers: {
    "Content-Type": "application/json",
  },
});

let accessToken = ""; // Memory store for access token

export const setAccessToken = (token: string) => {
  accessToken = token;
  if (token) {
    axiosInstance.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete axiosInstance.defaults.headers.common.Authorization;
  }
};

export const getAccessToken = () => accessToken;

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for automatic refresh
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Detect 401 and avoid infinite retry loops
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Skip refresh for logout and refresh endpoints
      const isAuthEndpoint = originalRequest.url === SummaryApi.auth.logout.url || 
                             originalRequest.url === SummaryApi.auth.refresh.url;
      
      if (isAuthEndpoint) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        // Attempt to refresh the access token
        const refreshResponse = await axiosInstance.post(SummaryApi.auth.refresh.url);
        const { access_token } = refreshResponse.data;

        // Update local memory and global headers
        setAccessToken(access_token);
        
        // Update original request header and retry
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // Refresh failed
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
