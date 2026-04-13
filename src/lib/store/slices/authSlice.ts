'use client';

import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import CryptoJS from 'crypto-js';
import { apiClient } from '@/lib/api-client';

const ENCRYPTION_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || 'default-key-change-me';

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

function loadFromStorage(): AuthState {
  if (typeof window === 'undefined') return initialState;
  try {
    const encryptedUser = localStorage.getItem('encryptedAuthUser');
    const encryptedToken = localStorage.getItem('encryptedAuthToken');
    if (!encryptedUser || !encryptedToken) return initialState;

    const decryptedUser = CryptoJS.AES.decrypt(encryptedUser, ENCRYPTION_KEY);
    const decryptedToken = CryptoJS.AES.decrypt(encryptedToken, ENCRYPTION_KEY);
    const { userlog, roles } = JSON.parse(decryptedUser.toString(CryptoJS.enc.Utf8));
    const { accessToken } = JSON.parse(decryptedToken.toString(CryptoJS.enc.Utf8));

    const rawId = userlog?.id ?? (userlog as { _id?: string })?._id;
    const normalizedUser = userlog
      ? { ...userlog, id: typeof rawId === 'string' ? rawId : rawId?.toString?.() ?? '' }
      : null;
    return {
      user: normalizedUser,
      roles: roles ?? [],
      isLogged: !!accessToken,
      loading: false,
    };
  } catch {
    return initialState;
  }
}

function encryptAndStore(
  userlog: User,
  roles: string[],
  accessToken: string,
  refreshToken: string
): void {
  const serializedUser = JSON.stringify({ userlog, roles });
  const serializedToken = JSON.stringify({ accessToken, refreshToken });
  const encryptedUser = CryptoJS.AES.encrypt(serializedUser, ENCRYPTION_KEY).toString();
  const encryptedToken = CryptoJS.AES.encrypt(serializedToken, ENCRYPTION_KEY).toString();
  localStorage.setItem('encryptedAuthUser', encryptedUser);
  localStorage.setItem('encryptedAuthToken', encryptedToken);
}

export const signin = createAsyncThunk<
  void,
  { email: string; password: string },
  { rejectValue: string }
>('auth/signin', async ({ email, password }, { dispatch, rejectWithValue }) => {
  try {
    const { data } = await apiClient.post<{
      userlog: User;
      roles: string[];
      accessToken: string;
      refreshToken: string;
    }>('/auth/signin', { email, password });

    const { userlog, roles, accessToken, refreshToken } = data;
    encryptAndStore(userlog, roles, accessToken, refreshToken);

    dispatch(setAuth({ user: userlog, roles, accessToken, refreshToken }));
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Authentication failed';
    return rejectWithValue(message);
  }
});

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { dispatch, getState }) => {
    const state = getState() as { auth: AuthState };
    const userId = state.auth.user?.id;

    // Récupérer le refresh token avant de vider le storage
    let refreshToken: string | undefined;
    try {
      const encrypted = localStorage.getItem('encryptedAuthToken');
      if (encrypted) {
        const ENCRYPTION_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || 'default-key-change-me';
        const CryptoJS = (await import('crypto-js')).default;
        const decrypted = CryptoJS.AES.decrypt(encrypted, ENCRYPTION_KEY);
        const parsed = JSON.parse(decrypted.toString(CryptoJS.enc.Utf8));
        refreshToken = parsed?.refreshToken;
      }
    } catch {
      // Ignorer les erreurs de déchiffrement
    }

    dispatch(setAuth({ user: null, roles: [], accessToken: '', refreshToken: '' }));
    localStorage.removeItem('encryptedAuthUser');
    localStorage.removeItem('encryptedAuthToken');

    try {
      if (userId) {
        await apiClient.post('/auth/logout', { _id: userId, refreshToken });
      }
    } catch {
      // Ignorer les erreurs API de logout
    }

    window.location.href = '/auth/signin';
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: loadFromStorage(),
  reducers: {
    setAuth: (state, action) => {
      const { userlog, roles, accessToken } = action.payload;
      const rawId = userlog?.id ?? (userlog as { _id?: string })?._id;
      const normalizedUser = userlog
        ? { ...userlog, id: typeof rawId === 'string' ? rawId : rawId?.toString?.() ?? '' }
        : null;
      state.user = normalizedUser;
      state.roles = roles ?? [];
      state.isLogged = !!accessToken;
    },
  },
});

export const { setAuth } = authSlice.actions;
export default authSlice.reducer;
