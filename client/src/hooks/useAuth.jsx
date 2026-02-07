import { createContext, useContext, useReducer, useEffect } from 'react';
import { setTokens, clearTokens, apiFetch } from '../utils/api';

const AuthContext = createContext(null);

const initialState = {
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  loading: true,
};

function reducer(state, action) {
  switch (action.type) {
    case 'LOGIN':
      localStorage.setItem('user', JSON.stringify(action.user));
      return { user: action.user, loading: false };
    case 'LOGOUT':
      return { user: null, loading: false };
    case 'LOADED':
      return { ...state, loading: false };
    case 'UPDATE_USER':
      localStorage.setItem('user', JSON.stringify({ ...state.user, ...action.user }));
      return { ...state, user: { ...state.user, ...action.user } };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      apiFetch('/profile')
        .then((data) => dispatch({ type: 'LOGIN', user: data }))
        .catch(() => {
          clearTokens();
          dispatch({ type: 'LOGOUT' });
        });
    } else {
      dispatch({ type: 'LOADED' });
    }
  }, []);

  const login = async (email, password, remember_me = false) => {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, remember_me }),
    });
    setTokens(data.access_token, data.refresh_token);
    dispatch({ type: 'LOGIN', user: data.user });
    return data;
  };

  const register = async (email, password, display_name) => {
    const data = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, display_name }),
    });
    setTokens(data.access_token, data.refresh_token);
    dispatch({ type: 'LOGIN', user: data.user });
    return data;
  };

  const logout = async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    clearTokens();
    dispatch({ type: 'LOGOUT' });
  };

  const updateUser = (user) => dispatch({ type: 'UPDATE_USER', user });

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
