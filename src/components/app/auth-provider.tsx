'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { Loader2 } from 'lucide-react';

const publicPaths = ['/signin'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isUserLoading) {
      return; // Wait until the user's auth state is determined
    }

    const isPublic = publicPaths.includes(pathname);

    if (user && isPublic) {
      // If user is logged in and on a public page, redirect to home
      router.push('/');
    } else if (!user && !isPublic) {
      // If user is not logged in and on a protected page, redirect to signin
      router.push('/signin');
    }
  }, [user, isUserLoading, pathname, router]);

  // While checking user auth state, show a loader on protected routes
  if (isUserLoading && !publicPaths.includes(pathname)) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // If on a public path, render children immediately to avoid flashes of loaders
  if (publicPaths.includes(pathname)) {
    return <>{children}</>;
  }

  // If logged in and on a protected path, render children
  if (user) {
    return <>{children}</>;
  }

  // This will be shown briefly for protected routes before the redirect kicks in
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  );
}
