import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { useTheme } from '../../contexts/ThemeContext';
import LoginScreen from './LoginScreen';
import SignUpScreen from './SignUpScreen';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const { theme } = useTheme();

  return (
    <PaperProvider theme={theme}>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {isLogin ? (
          <LoginScreen onSwitchToSignUp={() => setIsLogin(false)} />
        ) : (
          <SignUpScreen onSwitchToLogin={() => setIsLogin(true)} />
        )}
      </View>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});