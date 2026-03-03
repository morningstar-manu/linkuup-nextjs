'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Alert } from '@/components/Alert';
import { setupApiInterceptors } from '@/components/providers';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isLogged, roles } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    setupApiInterceptors();
  }, []);

  useEffect(() => {
    if (pathname?.startsWith('/auth')) return;

    if (!isLogged) {
      router.replace('/auth/signin');
      return;
    }

    if (pathname?.startsWith('/manager') && !roles.includes('ROLE_ADMIN') && !roles.includes('ROLE_MODERATOR')) {
      router.replace('/unauthorized');
      return;
    }

    if (
      (pathname?.startsWith('/admin') ||
        pathname?.startsWith('/users') ||
        pathname?.startsWith('/appointments/edit')) &&
      !roles.includes('ROLE_ADMIN')
    ) {
      router.replace('/unauthorized');
      return;
    }
  }, [isLogged, roles, pathname, router]);

  return (
    <div className="flex min-h-screen flex-col bg-grid-pattern">
      <Navbar />
      <main className="mx-auto flex-1 w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
      <div className="mt-auto">
        <Footer />
      </div>
      <Alert />
    </div>
  );
}
