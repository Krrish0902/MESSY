import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useRoleBasedNavigation } from '../../hooks/useRoleBasedNavigation';
import { useTheme } from '../../contexts/ThemeContext';
import { Button } from 'react-native-paper';
import { useRouter } from 'expo-router';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'customer' | 'mess_owner' | 'admin';
  requiredPermission?: string;
  fallbackScreen?: string;
}

export default function ProtectedRoute({ 
  children, 
  requiredRole, 
  requiredPermission,
  fallbackScreen 
}: ProtectedRouteProps) {
  const { user, session } = useAuth();
  const { hasPermission, getValidScreens } = useRoleBasedNavigation();
  const { theme } = useTheme();
  const router = useRouter();

  // Check if user is authenticated
  if (!user || !session) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.text, { color: theme.colors.onBackground }]}>
          Please sign in to access this page.
        </Text>
        <Button 
          mode="contained" 
          onPress={() => router.replace('/(tabs)/home' as any)}
          style={styles.button}
        >
          Go to Login
        </Button>
      </View>
    );
  }

  // Check role-based access
  if (requiredRole && user.role !== requiredRole) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.text, { color: theme.colors.onBackground }]}>
          You don't have permission to access this page.
        </Text>
        <Text style={[styles.subtext, { color: theme.colors.onSurfaceVariant }]}>
          Required role: {requiredRole}
        </Text>
        <Button 
          mode="contained" 
          onPress={() => router.replace(`/(tabs)/${getValidScreens()[0]}` as any)}
          style={styles.button}
        >
          Go to Dashboard
        </Button>
      </View>
    );
  }

  // Check feature-based access
  if (requiredPermission && !hasPermission(requiredPermission as any)) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.text, { color: theme.colors.onBackground }]}>
          You don't have permission to access this feature.
        </Text>
        <Text style={[styles.subtext, { color: theme.colors.onSurfaceVariant }]}>
          Required permission: {requiredPermission}
        </Text>
        <Button 
          mode="contained" 
          onPress={() => router.replace(`/(tabs)/${getValidScreens()[0]}` as any)}
          style={styles.button}
        >
          Go to Dashboard
        </Button>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  text: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 10,
  },
  subtext: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    marginTop: 10,
  },
}); 