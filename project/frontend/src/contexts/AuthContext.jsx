import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    let active = true;

    const checkAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        if (active) {
          setLoading(false);
        }
        return;
      }

      try {
        const userData = await api.getCurrentUser();
        if (!active) {
          return;
        }
        // Ignore stale responses if login/logout changed the token meanwhile.
        if (localStorage.getItem('token') !== storedToken) {
          return;
        }
        setUser(userData);
        setToken(storedToken);
      } catch {
        if (!active) {
          return;
        }
        if (localStorage.getItem('token') === storedToken) {
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    checkAuth();
    return () => {
      active = false;
    };
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.login(email, password);
      const accessToken = response?.access_token;
      if (!accessToken) {
        return { success: false, error: 'Login failed: no access token received.' };
      }

      localStorage.setItem('token', accessToken);
      setToken(accessToken);

      const userData = await api.getCurrentUser();
      setUser(userData);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const register = async (userData) => {
    try {
      await api.register(userData);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const updateUser = async (userData) => {
    try {
      const updatedUser = await api.updateCurrentUser(userData);
      setUser(updatedUser);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const uploadAvatar = async (file) => {
    try {
      const updatedUser = await api.uploadProfileAvatar(file);
      setUser(updatedUser);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const removeAvatar = async () => {
    try {
      const updatedUser = await api.deleteProfileAvatar();
      setUser(updatedUser);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    updateUser,
    uploadAvatar,
    removeAvatar,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN',
    isStaff: user?.role === 'STAFF' || user?.role === 'ADMIN',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
