import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Card } from 'react-native-paper';
import { useTheme } from '../../contexts/ThemeContext';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  retryText?: string;
}

export default function ErrorMessage({ 
  message, 
  onRetry, 
  retryText = 'Try Again' 
}: ErrorMessageProps) {
  const { theme } = useTheme();

  return (
    <Card style={[styles.container, { backgroundColor: theme.colors.errorContainer }]}>
      <Card.Content>
        <Text style={[styles.message, { color: theme.colors.onErrorContainer }]}>
          {message}
        </Text>
        {onRetry && (
          <Button
            mode="contained"
            onPress={onRetry}
            style={styles.retryButton}
            buttonColor={theme.colors.error}
          >
            {retryText}
          </Button>
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 16,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    marginTop: 8,
  },
});