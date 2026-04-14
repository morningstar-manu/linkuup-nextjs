'use client';

import axios, { AxiosError } from 'axios';
import { getErrorMessage } from '@/lib/utils/errors';

/**
 * Client HTTP centralisé.
 *
 * Les tokens JWT sont stockés dans des cookies httpOnly gérés par le serveur.
 * Le navigateur les envoie automatiquement grâce à `withCredentials: true`.
 * Aucun token n'est accessible au JavaScript côté client → protection XSS maximale.
 */
export const apiClient = axios.create({
  baseURL: '/api',
  withCredentials: true,          // Envoie les cookies httpOnly automatiquement
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,                // 15 secondes max
});

let onUnauthorized: (() => void) | null = null;

export function setApiUnauthorizedHandler(handler: () => void): void {
  onUnauthorized = handler;
}

// ─── Intercepteur de réponse ───────────────────────────────────────────────
apiClient.interceptors.response.use(
  (res) => res,
  async (err: AxiosError) => {
    const originalConfig = err.config as typeof err.config & { _retry?: boolean };

    // Pas de réponse du tout → problème réseau
    if (!err.response) {
      return Promise.reject(
        new Error('Impossible de joindre le serveur. Vérifiez votre connexion.')
      );
    }

    // 401 : token expiré → tenter un refresh automatique (cookie httpOnly)
    if (err.response.status === 401 && !originalConfig?._retry) {
      originalConfig._retry = true;

      try {
        // Le cookie refreshToken est envoyé automatiquement par le navigateur
        await apiClient.post('/auth/refreshtoken');
        // Nouveau accessToken cookie posé par le serveur → relancer la requête originale
        return apiClient(originalConfig!);
      } catch {
        onUnauthorized?.();
        return Promise.reject(new Error('Session expirée. Veuillez vous reconnecter.'));
      }
    }

    // 403 : accès refusé (compte désactivé, rôle insuffisant)
    if (err.response.status === 403) {
      onUnauthorized?.();
    }

    const msg = getErrorMessage(err);
    return Promise.reject(new Error(msg));
  }
);
