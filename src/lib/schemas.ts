import { z } from 'zod';

export const userSchema = z.object({
  uid: z.string(),
  email: z.string().email(),
  displayName: z.string(),
  photoURL: z.string().nullable(),
});

export const stakeSchema = z.object({
  id: z.string(),
  userId: z.string(),
  amount: z.number().positive(),
  currency: z.string(),
  platform: z.string(),
  apy: z.number().min(0).max(100),
  startDate: z.date(),
  endDate: z.date().optional(),
  status: z.enum(['active', 'completed', 'cancelled']),
  rewards: z.number().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const platformSchema = z.object({
  id: z.string(),
  name: z.string(),
  website: z.string().url(),
  logo: z.string(),
  supportedCurrencies: z.array(z.string()),
  minStakeAmount: z.record(z.string(), z.number()),
  maxStakeAmount: z.record(z.string(), z.number()),
  apyRange: z.object({
    min: z.number().min(0),
    max: z.number().max(100),
  }),
});

export type User = z.infer<typeof userSchema>;
export type Stake = z.infer<typeof stakeSchema>;
export type Platform = z.infer<typeof platformSchema>; 