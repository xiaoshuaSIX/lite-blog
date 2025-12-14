'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus('error');
        setErrorMessage('Invalid verification link');
        return;
      }

      try {
        await api.verifyEmail(token);
        setStatus('success');
      } catch (err) {
        const apiError = err as ApiError;
        setStatus('error');
        setErrorMessage(apiError.error || 'Verification failed');
      }
    };

    verifyEmail();
  }, [token]);

  if (status === 'loading') {
    return (
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="text-muted-foreground">Verifying your email...</p>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="space-y-6 text-center">
        <div className="text-green-500 text-5xl">✓</div>
        <h1 className="text-2xl font-bold">Email Verified!</h1>
        <p className="text-muted-foreground">
          Your email has been successfully verified. You can now log in to your account.
        </p>
        <Link
          href="/login"
          className="inline-block bg-primary text-primary-foreground px-6 py-2 rounded-md font-medium hover:bg-primary/90"
        >
          Go to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-center">
      <div className="text-destructive text-5xl">✕</div>
      <h1 className="text-2xl font-bold">Verification Failed</h1>
      <p className="text-muted-foreground">
        {errorMessage || 'The verification link is invalid or has expired.'}
      </p>
      <div className="space-y-2">
        <Link
          href="/login"
          className="inline-block bg-primary text-primary-foreground px-6 py-2 rounded-md font-medium hover:bg-primary/90"
        >
          Go to Login
        </Link>
        <p className="text-sm text-muted-foreground">
          If your link has expired, you can request a new verification email after logging in.
        </p>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
