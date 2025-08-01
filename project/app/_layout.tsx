import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';
import AuthScreen from '../components/auth/AuthScreen';
import LoadingSpinner from '../components/common/LoadingSpinner'

function RootLayoutContent() {
  const { session, user, loading } = useAuth();
  const { theme } = useTheme();

  if (loading) {
    return <LoadingSpinner message="Loading MESSY..." />;
  }

  if (!session || !user) {
    return <AuthScreen />;
  }

  return (
    <React.Fragment>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </React.Fragment>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AuthProvider>
          <PaperProvider>
            <RootLayoutContent />
          </PaperProvider>
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}