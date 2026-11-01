import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, setAuthToken, getAuthToken } from '../services/api.js';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const data = await api.getMe();
      setUser(data.user);
    } catch (err) {
      console.warn('Session verification failed:', err.message);
      setAuthToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();

    const handleExpired = () => {
      setUser(null);
    };

    window.addEventListener('finsight_auth_expired', handleExpired);
    return () => window.removeEventListener('finsight_auth_expired', handleExpired);
  }, [fetchCurrentUser]);

  const login = async (email, password) => {
    const data = await api.login({ email, password });
    setAuthToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (email, password, full_name, currency) => {
    const data = await api.register({ email, password, full_name, currency });
    setAuthToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const demoLogin = async () => {
    const data = await api.demoLogin();
    setAuthToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    setAuthToken(null);
    setUser(null);
  };

  const updateUserProfile = (newProfile) => {
    setUser(prev => ({ ...prev, ...newProfile }));
  };

  const formatCurrency = (amount) => {
    const num = parseFloat(amount) || 0;
    const symbol = user?.currency_symbol || '₹';
    const curr = user?.currency || 'INR';

    if (curr === 'INR') {
      return `${symbol}${num.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
    }
    return `${symbol}${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        demoLogin,
        logout,
        formatCurrency,
        updateUserProfile,
        refreshUser: fetchCurrentUser,
        currencySymbol: user?.currency_symbol || '₹',
        currency: user?.currency || 'INR'
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
