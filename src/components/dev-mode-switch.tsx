'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { loginDevUser, getCurrentDevUser, type DevAuthUser } from '@/lib/auth/dev-auth';
import { getAllDevUsers } from '@/lib/auth/dev-users';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function DevModeSwitch() {
  const [isDevMode] = useState(() => {
    return process.env.NODE_ENV === 'development' ||
           process.env.NEXT_PUBLIC_DEV_MODE === 'true';
  });
  const [currentUser, setCurrentUser] = useState<DevAuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const devUsers = getAllDevUsers();

  useEffect(() => {
    // Sprawdź czy użytkownik jest już zalogowany
    getCurrentDevUser().then(setCurrentUser);
  }, []);

  const handleLogin = async (email: string) => {
    setIsLoading(true);
    try {
      const result = await loginDevUser(email);

      if (result.success && result.token) {
        // Zapisz token w cookies
        document.cookie = `dev-auth-token=${result.token}; path=/; max-age=86400`; // 24h

        setCurrentUser(result.user || null);
        toast.success(`Zalogowano jako ${result.user?.name}`);

        // Przekieruj do dashboard
        router.push('/pl/dashboard');
      } else {
        toast.error(result.error || 'Błąd logowania');
      }
    } catch {
      toast.error('Wystąpił błąd podczas logowania');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    document.cookie = 'dev-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    setCurrentUser(null);
    toast.success('Wylogowano');
    router.push('/');
  };

  if (!isDevMode) {
    return null; // Nie pokazuj w trybie produkcyjnym
  }

  if (currentUser) {
    return (
      <Card className="w-full max-w-md mx-auto mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Tryb Deweloperski</CardTitle>
          <CardDescription className="text-xs">
            Aktualnie zalogowany: {currentUser.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Badge variant={currentUser.role === 'bride' ? 'default' : currentUser.role === 'groom' ? 'secondary' : 'outline'}>
              {currentUser.role === 'bride' ? 'Pani Młoda' :
               currentUser.role === 'groom' ? 'Pan Młody' : 'Gość'}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="text-xs"
            >
              Wyloguj
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Tryb Deweloperski</CardTitle>
        <CardDescription className="text-xs">
          Wybierz konto testowe (bez logowania)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {devUsers.map((user) => (
            <div key={user.email} className="flex items-center justify-between p-2 border rounded">
              <div className="flex-1">
                <div className="font-medium text-sm">{user.name}</div>
                <div className="text-xs text-muted-foreground">{user.email}</div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={user.role === 'bride' ? 'default' : user.role === 'groom' ? 'secondary' : 'outline'} className="text-xs">
                  {user.role === 'bride' ? 'Pani Młoda' :
                   user.role === 'groom' ? 'Pan Młody' : 'Gość'}
                </Badge>
                <Button
                  size="sm"
                  onClick={() => handleLogin(user.email)}
                  disabled={isLoading}
                  className="text-xs"
                >
                  {isLoading ? '...' : 'Zaloguj'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}