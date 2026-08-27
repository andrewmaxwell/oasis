import {AccessLevel, AppUser} from '../types.ts';

type SupabaseUser = {
  id: string;
  email?: string;
  user_metadata?: {name?: string; notes?: string};
  app_metadata?: {access_level?: AccessLevel};
};

/** Flattens Supabase's two metadata buckets into the shape the user form expects. */
export const toAppUser = (user: SupabaseUser): AppUser => ({
  id: user.id,
  email: user.email ?? '',
  name: user.user_metadata?.name ?? '',
  notes: user.user_metadata?.notes ?? '',
  access_level: user.app_metadata?.access_level ?? '',
});
