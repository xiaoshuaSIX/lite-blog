'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api, User, ApiError } from '@/lib/api';
import { useLanguage } from '@/providers/language-provider';

export default function ProfilePage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await api.getMe();
        setUser(userData);
      } catch {
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [router]);

  const handleResendVerification = async () => {
    setResending(true);
    setError('');
    setResendSuccess(false);

    try {
      await api.resendVerification();
      setResendSuccess(true);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.error || 'Failed to send verification email');
    } finally {
      setResending(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  const getRoleDisplayName = (role: string) => {
    const roleNames: Record<string, string> = {
      admin: t('profile.roleAdmin'),
      member: t('profile.roleMember'),
      user: t('profile.roleUser'),
      guest: t('profile.roleGuest'),
    };
    return roleNames[role] || role;
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <div className="h-8 w-48 bg-muted/50 rounded-lg animate-pulse mx-auto" />
          <div className="h-4 w-64 bg-muted/30 rounded animate-pulse mx-auto" />
        </div>
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 bg-muted/30 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{t('profile.title')}</h1>
        <p className="text-muted-foreground text-sm">{t('profile.subtitle')}</p>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-3 rounded-lg flex items-center gap-2">
          <span className="text-lg">&#9888;&#65039;</span> {error}
        </div>
      )}

      {resendSuccess && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-sm p-3 rounded-lg flex items-center gap-2">
          <span className="text-lg">&#9989;</span> {t('profile.verificationSent')}
        </div>
      )}

      <div className="space-y-4">
        {/* Email */}
        <div className="p-4 rounded-xl bg-background/50 border border-border/50">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
            {t('profile.email')}
          </div>
          <div className="font-medium">{user.email}</div>
        </div>

        {/* Email Status */}
        <div className="p-4 rounded-xl bg-background/50 border border-border/50">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
            {t('profile.emailStatus')}
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {user.email_verified ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-green-600 dark:text-green-400 font-medium">
                    {t('profile.emailVerified')}
                  </span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-yellow-500" />
                  <span className="text-yellow-600 dark:text-yellow-400 font-medium">
                    {t('profile.emailUnverified')}
                  </span>
                </>
              )}
            </div>
            {!user.email_verified && (
              <button
                onClick={handleResendVerification}
                disabled={resending}
                className="text-xs text-primary hover:underline disabled:opacity-50"
              >
                {resending ? '...' : t('profile.resendVerification')}
              </button>
            )}
          </div>
        </div>

        {/* Membership Status */}
        {user.is_member ? (
          <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs text-muted-foreground uppercase tracking-wider">
                  {t('profile.membershipStatus')}
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/20 text-primary text-xs font-semibold">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  {t('profile.memberActive')}
                </div>
              </div>
              <div className="text-sm text-foreground/80">
                {user.member_expire_at ? (
                  <span>{t('profile.memberExpireAt')}: {formatDate(user.member_expire_at)}</span>
                ) : user.roles?.includes('member') ? (
                  <span className="text-primary font-medium">{t('profile.memberForever')}</span>
                ) : null}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-background/50 border border-border/50 border-dashed">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
              {t('profile.membershipStatus')}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t('profile.memberInactive')}</span>
              <button className="text-xs text-primary hover:underline font-medium">
                {t('profile.upgradeMember')}
              </button>
            </div>
          </div>
        )}

        {/* Roles */}
        {user.roles && user.roles.length > 0 && (
          <div className="p-4 rounded-xl bg-background/50 border border-border/50">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
              {t('profile.roles')}
            </div>
            <div className="flex flex-wrap gap-2">
              {user.roles.map((role) => (
                <span
                  key={role}
                  className="px-2 py-1 rounded-lg text-xs font-medium bg-muted/50 text-foreground/80"
                >
                  {getRoleDisplayName(role)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Registered At */}
        <div className="p-4 rounded-xl bg-background/50 border border-border/50">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
            {t('profile.registeredAt')}
          </div>
          <div className="font-medium">{formatDate(user.created_at)}</div>
        </div>
      </div>
    </div>
  );
}
