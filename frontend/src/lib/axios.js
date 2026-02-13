import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: "https://fullstack-chat-app-9dor.onrender.com/api",
  withCredentials: true,
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});