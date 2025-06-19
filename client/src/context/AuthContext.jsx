import { createContext, useState, useEffect } from 'react';
import { authAPI } from '../utils/api';

// Create the auth context
const AuthContext = createContext();

// Provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is logged in when app loads
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Function to check authentication status
  const checkAuthStatus = async () => {
    try {
      // Check if token exists in localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        setIsAuthenticated(false);
        setUser(null);
        setLoading(false);
        return;
      }
      
      // Verify token by getting current user data
      const response = await authAPI.getMe();
      
      // If successful, set auth state
      setUser(response.data.data);
      setIsAuthenticated(true);
      setError(null);
    } catch (err) {
      console.error('Auth check error:', err);
      // If token is invalid or expired
      localStorage.removeItem('token');
      setIsAuthenticated(false);
      setUser(null);
      setError(err.response?.data?.message || 'Authentication failed');
    } finally {
      // Always set loading to false even if there's an error
      setLoading(false);
    }
  };

  // Login function
  const login = async (credentials) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await authAPI.login(credentials);
      
      // Store token in localStorage
      localStorage.setItem('token', response.data.token);
      
      // Set auth state
      setUser(response.data.data);
      setIsAuthenticated(true);
      
      return response.data;
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || err.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (userData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await authAPI.register(userData);
      
      // Store token in localStorage
      localStorage.setItem('token', response.data.token);
      
      // Set auth state
      setUser(response.data.data);
      setIsAuthenticated(true);
      
      return response.data;
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.message || err.message || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      // Call logout API endpoint
      await authAPI.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      // Clear token and auth state regardless of API success
      localStorage.removeItem('token');
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  // Update user profile in context
  const updateUserProfile = (updatedUser) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        error,
        setError,
        login,
        register,
        logout,
        updateUserProfile,
        checkAuthStatus
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 