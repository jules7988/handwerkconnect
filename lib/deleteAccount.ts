import { supabase } from './supabase';

export type DeleteAccountResult =
  | { success: true }
  | { success: false };

export async function deleteAccount(): Promise<DeleteAccountResult> {
  try {
    const { data, error } = await supabase.functions.invoke('delete-account', {
      method: 'POST',
    });

    if (error) {
      return { success: false };
    }

    if (!data || data.success !== true) {
      return { success: false };
    }

    try {
      await supabase.auth.signOut();
    } catch {
      // The account is already permanently deleted server-side.
      // A sign-out failure must not turn a successful deletion into an error.
    }

    return { success: true };
  } catch {
    return { success: false };
  }
}