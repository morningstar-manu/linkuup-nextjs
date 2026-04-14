'use client';

import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { apiClient } from '@/lib/api-client';

export interface User {
  id?: string;
  _id?: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface AuthState {
  user: User | null;
  roles: string[];
  isLogged: boolean;
  loading: boolean;
}

const initialState: AuthState = {
  user: null,
  roles: [],
  isLogged: false,
  loading: false,
};

const SESSION_KEY = 'authSession';

/** Charge les données de profil (non-sensibles) depuis localStorage. */
function loadFromStorage(): AuthState {
  if (typeof window === 'undefined') return initialState;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return initialState;
    const { user, roles } = JSON.parse(raw) as { user: User; roles: string[] };
    if (!user) return initialState;
    return { user, roles: roles ?? [], isLogged: true, loading: false };
  } catch {
    return initialState;
  }
}

/** Persiste uniquement les données de profil (jamais les tokens). */
function saveSession(user: User, roles: string[]): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ user, roles }));
}

function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

// ─── Thunks ────────────────────────────────────────────────────────────────

export const signin = createAsyncThunk<
  void,
  { email: string; password: string },
  { rejectValue: string }
>('auth/signin', async ({ email, password }, { dispatch, rejectWithValue }) => {
  try {
    const { data } = await apiClient.post<{
      userlog: User;
      roles: string[];
    }>('/auth/signin', { email, password });

    const { userlog, roles } = data;

    // Normaliser l'ID utilisateur (id ou _id selon la version de l'API)
    const rawId = userlog?.id ?? (userlog as { _id?: string })?._id;
    const user: User = {
      ...userlog,
      id: rawId != null ? String(rawId) : '',
    };

    saveSession(user, roles);
    dispatch(setAuth({ user, roles }));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Échec de l'authentification";
    return rejectWithValue(message);
  }
});

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { dispatch, getState }) => {
    const state = getState() as { auth: AuthState };
    const userId = state.auth.user?.id;

    // Vider l'état Redux et le localStorage immédiatement
    dispatch(clearAuth());
    clearSession();

    try {
      // Le serveur invalide le refreshToken en base et efface les cookies
      await apiClient.post('/auth/logout', { _id: userId });
    } catch {
      // Ignorer — la session est déjà effacée côté client
    }

    window.location.href = '/auth/signin';
  }
);

// ─── Slice ─────────────────────────────────────────────────────────────────

const authSlice = createSlice({
  name: 'auth',
  initialState: loadFromStorage(),
  reducers: {
    setAuth: (state, action: { payload: { user: User | null; roles: string[] } }) => {
      state.user = action.payload.user;
      state.roles = action.payload.roles ?? [];
      state.isLogged = !!action.payload.user;
    },
    clearAuth: (state) => {
      state.user = null;
      state.roles = [];
      state.isLogged = false;
    },
  },
});

export const { setAuth, clearAuth } = authSlice.actions;
export default authSlice.reducer;
