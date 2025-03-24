import { User as FirebaseUser } from '@firebase/auth';

export interface User extends FirebaseUser {
  displayName: string;
  email: string;
  photoURL: string | null;
  uid: string;
}

export interface Stake {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  platform: string;
  apy: number;
  startDate: Date;
  endDate?: Date;
  status: 'active' | 'completed' | 'cancelled';
  rewards?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Platform {
  id: string;
  name: string;
  website: string;
  logo: string;
  supportedCurrencies: string[];
  minStakeAmount: Record<string, number>;
  maxStakeAmount: Record<string, number>;
  apyRange: {
    min: number;
    max: number;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
} 