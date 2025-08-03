import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, TextInput, Button, Card, Divider, SegmentedButtons } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';

interface SignUpScreenProps {
  onSwitchToLogin: () => void;
}

export default function SignUpScreen({ onSwitchToLogin }: SignUpScreenProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: '',
    role: 'customer' as 'customer' | 'mess_owner',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signUp } = useAuth();
  const { theme } = useTheme();

  const handleSignUp = async () => {
    const { email, password, confirmPassword, fullName, phone, role } = formData;

    if (!email || !password || !fullName) {
      setError('Please fill in all required fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await signUp(email, password, {
        full_name: fullName,
        phone,
        role,
        is_active: true,
      });
    } catch (err: any) {
      setError(err.message || 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return <LoadingSpinner message="Creating your account..." />;
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Text style={[styles.title, { color: theme.colors.primary }]}>
              Join MESSY
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.onSurface }]}>
              Create your account
            </Text>

            {error ? (
              <ErrorMessage 
                message={error} 
                onRetry={() => setError('')}
                retryText="Dismiss"
              />
            ) : null}

            <SegmentedButtons
              value={formData.role}
              onValueChange={(value) => updateFormData('role', value)}
              buttons={[
                { value: 'customer', label: 'Customer' },
                { value: 'mess_owner', label: 'Mess Owner' },
              ]}
              style={styles.roleSelector}
            />

            <TextInput
              label="Full Name *"
              value={formData.fullName}
              onChangeText={(value) => updateFormData('fullName', value)}
              style={styles.input}
              mode="outlined"
            />

            <TextInput
              label="Email *"
              value={formData.email}
              onChangeText={(value) => updateFormData('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
              mode="outlined"
            />

            <TextInput
              label="Phone"
              value={formData.phone}
              onChangeText={(value) => updateFormData('phone', value)}
              keyboardType="phone-pad"
              style={styles.input}
              mode="outlined"
            />

            <TextInput
              label="Password *"
              value={formData.password}
              onChangeText={(value) => updateFormData('password', value)}
              secureTextEntry
              style={styles.input}
              mode="outlined"
            />

            <TextInput
              label="Confirm Password *"
              value={formData.confirmPassword}
              onChangeText={(value) => updateFormData('confirmPassword', value)}
              secureTextEntry
              style={styles.input}
              mode="outlined"
            />

            <Button
              mode="contained"
              onPress={handleSignUp}
              style={styles.button}
              contentStyle={styles.buttonContent}
            >
              Create Account
            </Button>

            <Divider style={styles.divider} />

            <Button
              mode="text"
              onPress={onSwitchToLogin}
              style={styles.switchButton}
            >
              Already have an account? Sign In
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
    padding: 16,
    paddingTop: 32,
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
    marginBottom: 24,
    opacity: 0.7,
  },
  roleSelector: {
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
  },
  button: {
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