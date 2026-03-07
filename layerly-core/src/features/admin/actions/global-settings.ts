'use server';

import { revalidatePath } from 'next/cache';
import { setMaintenanceStatus } from '@/lib/maintenance';
import { setEmailConfirmationRequired } from '@/lib/email-confirmation';

export async function toggleMaintenanceMode(enabled: boolean) {
  try {
    await setMaintenanceStatus(enabled);
    revalidatePath('/', 'layout');
    revalidatePath('/coming-soon', 'page');
    revalidatePath('/admin/settings', 'page');
    return { success: true };
  } catch (error) {
    console.error('Failed to toggle maintenance mode:', error);
    return { success: false, error: 'Failed to update settings' };
  }
}

export async function toggleEmailConfirmationRequired(enabled: boolean) {
  try {
    await setEmailConfirmationRequired(enabled);
    revalidatePath('/admin/settings', 'page');
    return { success: true };
  } catch (error) {
    console.error('Failed to toggle email confirmation requirement:', error);
    return { success: false, error: 'Failed to update settings' };
  }
}
