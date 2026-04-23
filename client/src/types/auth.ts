export interface User {
  id: number;
  nome: string;
  email: string;
}

export interface AuthState {
  user: User | null;
  permissions: string[];
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface LoginResponse {
  exigeTrocaSenha?: boolean;
}

export type AuthLoginApiResponse = {
  accessToken: string;
  user: User;
  permissions: string[];
  exigeTrocaSenha?: boolean;
};
