import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';

export function useRoleBasedNavigation() {
  const { user } = useAuth();
  const router = useRouter();
  const hasRedirected = useRef(false);
  const lastUserRole = useRef<string | null>(null);

  useEffect(() => {
    // Reset redirect flag if user role changes
    if (user && lastUserRole.current !== user.role) {
      hasRedirected.current = false;
      lastUserRole.current = user.role;
    }

    if (user && !hasRedirected.current) {
      // Get the current path
      const currentPath = (router as any).pathname || '';
      
      // Define valid screens for each role
      const validScreens = {
        customer: ['home', 'discover', 'subscriptions', 'messages', 'profile'],
        mess_owner: ['dashboard', 'menu', 'subscribers', 'messages', 'profile'],
        admin: ['overview', 'messes', 'settings'],
      };

      const userValidScreens = validScreens[user.role as keyof typeof validScreens] || validScreens.customer;
      
      // Check if current path is valid for this user
      const isValidPath = userValidScreens.some(screen => currentPath.includes(screen));
      
      if (!isValidPath) {
        // Redirect to the first valid screen for this role
        const defaultScreen = userValidScreens[0];
        hasRedirected.current = true;
        router.replace(`/(tabs)/${defaultScreen}` as any);
      }
    }
  }, [user]);

  return {
    isValidScreen: (screenName: string) => {
      if (!user) return false;
      
      const validScreens = {
        customer: ['home', 'discover', 'subscriptions', 'messages', 'profile'],
        mess_owner: ['dashboard', 'menu', 'subscribers', 'messages', 'profile'],
        admin: ['overview', 'messes', 'settings'],
      };

      const userValidScreens = validScreens[user.role as keyof typeof validScreens] || validScreens.customer;
      return userValidScreens.includes(screenName);
    }
  };
} 