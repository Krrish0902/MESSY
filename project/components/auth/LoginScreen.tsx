import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, TextInput, Button, Card, Divider } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';

interface LoginScreenProps {
  onSwitchToSignUp: () => void;
}

export default function LoginScreen({ onSwitchToSignUp }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn } = useAuth();
  const { theme } = useTheme();

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await signIn(email, password);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Signing you in..." />;
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Text style={[styles.title, { color: theme.colors.primary }]}>
              Welcome to MESSY
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.onSurface }]}>
              Sign in to your account
            </Text>

            {error ? (
              <ErrorMessage 
                message={error} 
                onRetry={() => setError('')}
                retryText="Dismiss"
              />
            ) : null}

            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
              mode="outlined"
            />

            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={styles.input}
              mode="outlined"
            />

            <Button
              mode="contained"
              onPress={handleLogin}
              style={styles.button}
              contentStyle={styles.buttonContent}
            >
              Sign In
            </Button>

            <Divider style={styles.divider} />

            <Button
              mode="outlined"
              onPress={() => {
                setEmail('admin@messy.com');
                setPassword('admin123');
                handleLogin();
              }}
              style={styles.adminButton}
              contentStyle={styles.buttonContent}
            >
              Quick Admin Login
            </Button>

            <Divider style={styles.divider} />

            <Button
              mode="text"
              onPress={onSwitchToSignUp}
              style={styles.switchButton}
            >
              Don't have an account? Sign Up
            </Button>
          </Card.Content>
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
    minHeight: '100%',
  },
  card: {
    elevation: 4,
    borderRadius: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    opacity: 0.7,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
    borderRadius: 8,
  },
  adminButton: {
    marginTop: 8,
    borderRadius: 8,
  },
  buttonContent: {
    height: 48,
  },
  divider: {
    marginVertical: 24,
  },
  switchButton: {
    marginTop: 8,
  },
});