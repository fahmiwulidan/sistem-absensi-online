import { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check localStorage on load
    const token = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');

    if (token && storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
        // Silently verify session with backend
        authApi.me()
          .then((profileUser) => {
            const normalized = {
              ...profileUser,
              name: profileUser.profile?.name || (profileUser.role === 'admin' ? 'Administrator' : profileUser.username),
            };
            setUser(normalized);
            localStorage.setItem('auth_user', JSON.stringify(normalized));
          })
          .catch(() => {
            // Token expired or invalid
            logout();
          });
      } catch (e) {
        logout();
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (usernameOrEmail, password) => {
    const res = await authApi.login({ username: usernameOrEmail, password });
    
    if (res && res.token && res.user) {
      const userData = {
        ...res.user,
        name: res.user.profile?.name || (res.user.role === 'admin' ? 'Administrator' : res.user.username),
      };
      
      localStorage.setItem('auth_token', res.token);
      localStorage.setItem('auth_user', JSON.stringify(userData));
      setUser(userData);
      return userData;
    }
    throw new Error('Format respon login tidak valid');
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
