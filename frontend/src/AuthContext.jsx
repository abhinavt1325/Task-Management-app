import React, { createContext, useState, useEffect } from 'react';
import api from './api';

// Create the context
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // When the app starts, check if we have a token and if it's valid
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // Verify the token by calling the backend
          const response = await api.get('/user/is_auth');
          setUser(response.data);
        } catch (error) {
          // If token is invalid or expired
          console.error("Authentication check failed", error);
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = (token) => {
    localStorage.setItem('token', token);
    // After login, we fetch the user data
    api.get('/user/is_auth')
      .then(response => setUser(response.data))
      .catch(() => localStorage.removeItem('token'));
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
