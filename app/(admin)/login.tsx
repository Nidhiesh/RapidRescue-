import { useEffect } from 'react';
import { useRouter } from 'expo-router';

/**
 * RapidRescue - Deprecated Separate Admin Login Route
 * All users (Drivers and Admins) now authenticate through the unified common login screen.
 * This route automatically forwards to /(auth)/login.
 */
export default function AdminLoginRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/(auth)/login');
  }, [router]);

  return null;
}
