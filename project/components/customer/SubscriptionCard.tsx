import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card, Button, Chip } from 'react-native-paper';
import { useTheme } from '../../contexts/ThemeContext';
import { Database } from '../../types/database';
import { DateTime } from 'luxon';

type Subscription = Database['public']['Tables']['subscriptions']['Row'] & {
  messes: Database['public']['Tables']['messes']['Row'];
};

interface SubscriptionCardProps {
  subscription: Subscription;
  onManage: () => void;
  onSkipMeal: () => void;
}

export default function SubscriptionCard({ subscription, onManage, onSkipMeal }: SubscriptionCardProps) {
  const { theme } = useTheme();

  const getStatusColor = () => {
    switch (subscription.status) {
      case 'active': return theme.colors.success;
      case 'paused': return theme.colors.warning;
      case 'cancelled': return theme.colors.error;
      case 'expired': return theme.colors.onSurfaceVariant;
      default: return theme.colors.onSurfaceVariant;
    }
  };

  const formatDate = (dateString: string) => {
    return DateTime.fromISO(dateString).toFormat('MMM dd, yyyy');
  };

  return (
    <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <Card.Content>
        <View style={styles.header}>
          <Text style={[styles.messName, { color: theme.colors.onSurface }]}>
            {subscription.messes.name}
          </Text>
          <Chip
            style={[styles.statusChip, { backgroundColor: getStatusColor() }]}
            textStyle={{ color: 'white' }}
          >
            {subscription.status.toUpperCase()}
          </Chip>
        </View>

        <Text style={[styles.planType, { color: theme.colors.primary }]}>
          {subscription.plan_type.toUpperCase()} PLAN
        </Text>

        <View style={styles.details}>
          <Text style={[styles.detailText, { color: theme.colors.onSurfaceVariant }]}>
            Meals: {subscription.meal_types.join(', ')}
          </Text>
          <Text style={[styles.detailText, { color: theme.colors.onSurfaceVariant }]}>
            Period: {formatDate(subscription.start_date)} - {formatDate(subscription.end_date)}
          </Text>
          <Text style={[styles.priceText, { color: theme.colors.onSurface }]}>
            ₹{subscription.price_per_meal}/meal
          </Text>
        </View>

        <Text style={[styles.address, { color: theme.colors.onSurfaceVariant }]}>
          Delivery to: {subscription.delivery_address}
        </Text>

        <View style={styles.actions}>
          <Button
            mode="outlined"
            onPress={onSkipMeal}
            style={styles.actionButton}
            disabled={subscription.status !== 'active'}
          >
            Skip Meal
          </Button>
          <Button
            mode="contained"
            onPress={onManage}
            style={styles.actionButton}
          >
            Manage
          </Button>
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: 8,
    elevation: 2,
    borderRadius: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  messName: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  statusChip: {
    marginLeft: 8,
  },
  planType: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  details: {
    marginBottom: 12,
  },
  detailText: {
    fontSize: 14,
    marginBottom: 4,
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
  },
  address: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
});