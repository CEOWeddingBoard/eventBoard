"use client"

import { useState, useEffect } from 'react';
import { getCurrentDevUser, type DevAuthUser } from '@/lib/auth/dev-auth';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { LogOut, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function UserNav() {
  const router = useRouter();
  const [user, setUser] = useState<DevAuthUser | null>(null);

  useEffect(() => {
    getCurrentDevUser().then(setUser);
  }, []);

  const handleLogout = () => {
    document.cookie = 'dev-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    setUser(null);
    toast.success('Wylogowano');
    router.push('/');
  };

  // In development mode, show dev user info
  if (user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-9 w-9 rounded-full">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-gradient-to-br from-pink-400 to-purple-500 text-white text-xs">
                {user.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <div className="flex items-center justify-start gap-2 p-2">
            <div className="flex flex-col space-y-1 leading-none">
              <p className="font-medium text-sm">{user.name}</p>
              <p className="w-[200px] truncate text-xs text-muted-foreground">
                {user.email}
              </p>
            </div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <Badge variant={user.role === 'bride' ? 'default' : user.role === 'groom' ? 'secondary' : 'outline'}>
              {user.role === 'bride' ? 'Pani Młoda' :
               user.role === 'groom' ? 'Pan Młody' : 'Gość'}
            </Badge>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="flex items-center gap-2 text-red-600"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Wyloguj
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Fallback for production or when no user
  return (
    <div className="h-9 w-9 rounded-full bg-gray-200 flex items-center justify-center">
      <span className="text-xs text-gray-500">U</span>
    </div>
  );
}
