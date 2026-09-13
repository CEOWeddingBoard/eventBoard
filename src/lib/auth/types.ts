export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
}

export interface AuthResult {
  success: boolean;
  user?: AuthUser;
  error?: string;
}
