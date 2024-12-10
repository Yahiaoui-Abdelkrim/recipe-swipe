'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function VerifyEmail() {
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, sendVerificationEmail } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user?.emailVerified) {
      router.push('/');
    }
  }, [user, router]);

  const handleResendVerification = async () => {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      await sendVerificationEmail();
      setMessage('Verification email sent! Please check your inbox.');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send verification email.';
      setError(errorMessage);
    }

    setLoading(false);
  };

  if (!user) {
    router.push('/auth/sign-in');
    return null;
  }

  return (
    <div className="max-w-md mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-center">Verify Your Email</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            We&apos;ve sent a verification email to <strong>{user.email}</strong>.
            Please check your inbox and click the verification link.
          </p>

          {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {message && (
            <div className="bg-green-50 text-green-600 p-3 rounded-md text-sm">
              {message}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Button
              onClick={handleResendVerification}
              disabled={loading}
            >
              Resend Verification Email
            </Button>
            
            <Button
              variant="outline"
              onClick={() => router.push('/auth/sign-in')}
            >
              Back to Sign In
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
