'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/lib/store';
import { logout } from '@/lib/store/slices/authSlice';
import { useTheme } from '@/components/ThemeProvider';

const navLinkClass = (active: boolean) =>
  `px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
    active
      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-500'
      : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100'
  }`;

export function Navbar() {
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const pathname = usePathname();
  const { isLogged, roles, user } = useSelector((state: RootState) => state.auth);
  const { theme, toggleTheme } = useTheme();

  const hasRole = (role: string) => roles.includes(role);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isLogged) return null;

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/90 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/90">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="flex items-center gap-2.5 transition-opacity hover:opacity-90"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-white">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <span className="text-lg font-semibold text-zinc-900 dark:text-white">
              Linkuup
            </span>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            <Link href="/" className={navLinkClass(pathname === '/')}>
              Accueil
            </Link>
            {(hasRole('ROLE_ADMIN') || hasRole('ROLE_MODERATOR')) && (
              <>
                <Link
                  href="/manager"
                  className={navLinkClass(pathname === '/manager')}
                >
                  Manager
                </Link>
                {hasRole('ROLE_ADMIN') && (
                  <Link
                    href="/admin"
                    className={navLinkClass(pathname === '/admin')}
                  >
                    Admin
                  </Link>
                )}
              </>
            )}
            <Link
              href="/about"
              className={navLinkClass(pathname === '/about')}
            >
              A propos
            </Link>
          </div>
        </div>

        <div className="relative flex items-center gap-2">
          <button
            type="button"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-3 rounded-lg p-2 pr-3 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 text-sm font-semibold text-white">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div className="hidden text-left sm:block">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-zinc-500 truncate max-w-[140px]">
                {user?.email}
              </p>
            </div>
          </button>

          {userMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setUserMenuOpen(false)}
              />
              <div className="absolute right-0 top-14 z-50 w-56 anim-slide-down rounded-lg border border-zinc-200 bg-white py-1 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
                <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="truncate text-xs text-zinc-500">
                    {user?.email}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => dispatch(logout())}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-medium text-red-500 transition-colors hover:bg-red-500/10"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Deconnexion
                </button>
              </div>
            </>
          )}

          <button
            type="button"
            onClick={toggleTheme}
            className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
          >
            {theme === 'dark' ? (
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            )}
          </button>
          
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="rounded-lg p-2 text-zinc-500 md:hidden hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div className="border-t border-zinc-200 px-4 py-3 md:hidden dark:border-zinc-800">
          <div className="flex flex-col gap-1">
            <Link href="/" className={navLinkClass(pathname === '/')} onClick={() => setMenuOpen(false)}>
              Accueil
            </Link>
            {(hasRole('ROLE_ADMIN') || hasRole('ROLE_MODERATOR')) && (
              <>
                <Link href="/manager" className={navLinkClass(pathname === '/manager')} onClick={() => setMenuOpen(false)}>
                  Manager
                </Link>
                {hasRole('ROLE_ADMIN') && (
                  <Link href="/admin" className={navLinkClass(pathname === '/admin')} onClick={() => setMenuOpen(false)}>
                    Admin
                  </Link>
                )}
              </>
            )}
            <Link href="/about" className={navLinkClass(pathname === '/about')} onClick={() => setMenuOpen(false)}>
              A propos
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
