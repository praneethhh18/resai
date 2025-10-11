
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser, useAuth } from '@/firebase';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import * as React from 'react';
import { GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';

function SignInPageContent() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  useEffect(() => {
    if (!isUserLoading && user) {
      const redirect = searchParams.get('redirect') || '/';
      router.push(redirect);
    }
  }, [user, isUserLoading, router, searchParams]);

  const handleAuthAction = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!auth) return;
    setIsSubmitting(true);
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
        toast({
            title: 'Account Created',
            description: "You've successfully signed up! Please sign in.",
        });
        setIsSignUp(false); // Switch to sign-in view
        setEmail('');
        setPassword('');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      // Redirect is handled by the useEffect hook
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Please check your credentials and try again.';
      toast({
        variant: 'destructive',
        title: isSignUp ? 'Sign Up Failed' : 'Sign In Failed',
        description: message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async (): Promise<void> => {
    if (!auth) return;
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      // Redirect is handled by the useEffect hook
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Could not sign in with Google. Please try again.';
      toast({
        variant: 'destructive',
        title: 'Google Sign In Failed',
        description: message,
      });
    }
  };

  if (isUserLoading || user) {
    return <div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2 xl:min-h-screen">
      <div className="relative hidden h-full bg-gray-100 lg:block">
        <Image
          src="/food2.png"
          alt="Image"
          fill
          className="h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
          data-ai-hint="bowl soup"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/30 to-transparent" />
      </div>
      <div className="relative flex h-screen items-center justify-center py-12">
        <div className="absolute left-0 top-0 bottom-0 -z-10 w-full bg-white [clip-path:url(#wave)] lg:hidden">
            <div className='relative h-full w-full'>
                 <Image
                    src="/food2.png"
                    alt="Image"
                    fill
                    className="h-full w-full object-cover"
                    data-ai-hint="bowl soup"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/40 to-transparent" />
            </div>
        </div>
         <svg width="0" height="0">
            <defs>
                <clipPath id="wave" clipPathUnits="objectBoundingBox">
                <path d="M1,0H0V1C0.2,0.86,0.3,0.71,0.38,0.59C0.5,0.4,0.59,0.22,0.73,0.11C0.83,0.04,0.91,0,1,0V0Z" />
                </clipPath>
            </defs>
        </svg>

        <div className="mx-auto grid w-[350px] gap-6 p-8 rounded-lg bg-white/80 backdrop-blur-sm lg:bg-transparent lg:backdrop-blur-none">
          <div className="grid gap-2 text-center">
            <h1 className="text-3xl font-bold">{isSignUp ? 'Create an Account' : 'Welcome Back!'}</h1>
            <p className="text-balance text-muted-foreground">
              {isSignUp ? 'Enter your details to get started.' : 'Sign in to discover your next favorite dish.'}
            </p>
          </div>
          <form onSubmit={handleAuthAction} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
                {!isSignUp && (
                    <a
                    href="#"
                    className="ml-auto inline-block text-sm underline"
                    onClick={(e) => {e.preventDefault(); toast({title: "Feature coming soon!"})}}
                    >
                    Forgot Password?
                    </a>
                )}
              </div>
               <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isSignUp ? "Must be at least 6 characters" : ""}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                >
                  {showPassword ? <EyeOff className="h-4 w-4 text-gray-500" /> : <Eye className="h-4 w-4 text-gray-500" />}
                </button>
              </div>
            </div>
             {!isSignUp && (
                <div className="flex items-center space-x-2">
                    <Checkbox id="remember-me" />
                    <Label htmlFor="remember-me" className="text-sm font-normal">Remember me</Label>
                </div>
             )}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
               {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isSignUp ? 'Sign Up' : 'Sign In'}
            </Button>
          </form>
           <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-muted-foreground lg:bg-background">
                    Or
                    </span>
                </div>
            </div>
          <Button variant="outline" className="w-full" onClick={handleGoogleSignIn}>
            <svg className="mr-2 h-4 w-4" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
              <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
              <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.61-3.317-11.28-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
              <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C43.021,36.226,44,30.338,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
            </svg>
            Sign in with Google
          </Button>
          <div className="mt-4 text-center text-sm">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}
             <button onClick={() => setIsSignUp(!isSignUp)} className="underline">
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <SignInPageContent />
    </Suspense>
  );
}
