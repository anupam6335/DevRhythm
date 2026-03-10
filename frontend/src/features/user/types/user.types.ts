import { User } from '@/features/auth/types/auth.types';

export interface UserSearchResponse {
  users: User[];
  pagination: any;
}

export interface UsernameAvailability {
  available: boolean;
  username: string;
}