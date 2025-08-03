import { useAuth } from '../contexts/AuthContext';
import { useRouter, usePathname } from 'expo-router';
import { useEffect, useRef } from 'react';

// Define role permissions
export const ROLE_PERMISSIONS = {
  customer: {
    screens: ['home', 'discover', 'subscriptions', 'notifications', 'profile'] as const,
    features: ['browse_messes', 'manage_subscriptions', 'view_notifications', 'edit_profile'] as const,
    defaultScreen: 'home' as const
  },
  mess_owner: {
    screens: ['dashboard', 'menu', 'subscribers', 'notifications', 'profile'] as const,
    features: ['manage_mess', 'manage_menu', 'view_subscribers', 'view_notifications', 'edit_profile'] as const,
    defaultScreen: 'dashboard' as const
  },
  admin: {
    screens: ['overview', 'messes', 'notifications', 'settings'] as const,
    features: ['system_management', 'approve_messes', 'view_all_data', 'manage_settings', 'view_notifications'] as const,
    defaultScreen: 'overview' as const
  }
} as const;

type Feature = 
  | 'browse_messes' | 'manage_subscriptions' | 'view_notifications' | 'edit_profile'
  | 'manage_mess' | 'manage_menu' | 'view_subscribers'
  | 'system_management' | 'approve_messes' | 'view_all_data' | 'manage_settings';

export function useRoleBasedNavigation() {
  const { user, session } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const hasRedirected = useRef(false);
  const lastUserRole = useRef<string | null>(null);

  useEffect(() => {
    // Reset redirect flag if user role changes
    if (user && lastUserRole.current !== user.role) {
      hasRedirected.current = false;
      lastUserRole.current = user.role;
    }

    if (user && session && !hasRedirected.current) {
      const userRole = user.role as keyof typeof ROLE_PERMISSIONS;
      const permissions = ROLE_PERMISSIONS[userRole] || ROLE_PERMISSIONS.customer;
      
      // Only check tab screens, not other pages like mess-details
      const currentScreen = pathname.split('/').pop()?.split('?')[0];
      
      // Skip navigation check for non-tab pages
      if (pathname.includes('/(tabs)/') && currentScreen) {
        const isValidPath = permissions.screens.includes(currentScreen as any);
        
        if (!isValidPath) {
          // Redirect to the default screen for this role
          hasRedirected.current = true;
          router.replace(`/(tabs)/${permissions.defaultScreen}` as any);
        }
      }
    }
  }, [user, session, pathname]);

  return {
    isValidScreen: (screenName: string) => {
      if (!user) return false;
      
      const userRole = user.role as keyof typeof ROLE_PERMISSIONS;
      const permissions = ROLE_PERMISSIONS[userRole] || ROLE_PERMISSIONS.customer;
      return permissions.screens.includes(screenName as any);
    },
    hasPermission: (feature: Feature) => {
      if (!user) return false;
      
      const userRole = user.role as keyof typeof ROLE_PERMISSIONS;
      const permissions = ROLE_PERMISSIONS[userRole] || ROLE_PERMISSIONS.customer;
      return permissions.features.includes(feature as any);
    },
    getValidScreens: () => {
      if (!user) return [];
      
      const userRole = user.role as keyof typeof ROLE_PERMISSIONS;
      const permissions = ROLE_PERMISSIONS[userRole] || ROLE_PERMISSIONS.customer;
      return permissions.screens;
    }
  };
} 