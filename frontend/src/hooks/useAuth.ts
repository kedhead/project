import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi, RegisterData, LoginData } from '../api/auth.api';
import { useAuthStore } from '../stores/authStore';

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { setAuth, clearAuth } = useAuthStore();

  const register = async (data: RegisterData) => {
    try {
      setLoading(true);
      setError(null);
      const result = await authApi.register(data);
      setAuth(result.user, result.accessToken, result.refreshToken);
      navigate('/dashboard');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Registration failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const login = async (data: LoginData) => {
    try {
      setLoading(true);
      setError(null);
      const result = await authApi.login(data);
      setAuth(result.user, result.accessToken, result.refreshToken);
      navigate('/dashboard');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Login failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
      clearAuth();
      navigate('/login');
    } catch (err: any) {
      // Clear auth even if API call fails
      clearAuth();
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  return {
    register,
    login,
    logout,
    loading,
    error,
    clearError: () => setError(null),
  };
};
