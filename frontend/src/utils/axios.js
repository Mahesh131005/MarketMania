import axios from 'axios';

//Creating axios instance
const instance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  withCredentials: true
});

//Adds token from local storage to headers
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle authentication errors
//if everything fine then reponse returned
//if not first time try to verify again
//If verifed next make old request again
//if not verifed return and ask to login again
instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If the error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to verify the token
        await instance.get('/api/auth/verify');
        return instance(originalRequest);
      } catch (verifyError) {
        // If verification fails, redirect to login
        localStorage.removeItem('token');
        window.location.href = '/login';
        return Promise.reject(verifyError);
      }
    }

    return Promise.reject(error);
  }
);

export default instance; 