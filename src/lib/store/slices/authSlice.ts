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
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  roles: [],
  isLogged: false,
  loading: false,
  error: null,
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
    return { user, roles: roles ?? [], isLogged: true, loading: false, error: null };
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
  { user: User; roles: string[] },
  { email: string; password: string },
  { rejectValue: string }
>('auth/signin', async ({ email, password }, { rejectWithValue }) => {
  try {
    const { data } = await apiClient.post<{
      userlog: User;
      roles: string[];
    }>('/auth/signin', { email, password });

    const { userlog, roles } = data;

    const rawId = userlog?.id ?? (userlog as { _id?: string })?._id;
    const user: User = {
      ...userlog,
      id: rawId != null ? String(rawId) : '',
    };

    saveSession(user, roles);
    return { user, roles };
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

    dispatch(clearAuth());
    clearSession();

    try {
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
      state.error = null;
    },
    clearAuth: (state) => {
      state.user = null;
      state.roles = [];
      state.isLogged = false;
      state.error = null;
    },
    updateRoles: (state, action: { payload: string[] }) => {
      state.roles = action.payload;
      if (state.user) saveSession(state.user, action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(signin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signin.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.user = action.payload.user;
        state.roles = action.payload.roles;
        state.isLogged = true;
      })
      .addCase(signin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Échec de l'authentification";
      });
  },
});

export const { setAuth, clearAuth, updateRoles } = authSlice.actions;
export default authSlice.reducer;
