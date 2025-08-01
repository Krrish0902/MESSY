import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Button, FAB } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';
import { Database } from '../../types/database';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import { DateTime } from 'luxon';

type Delivery = Database['public']['Tables']['deliveries']['Row'] & {
  subscriptions: Database['public']['Tables']['subscriptions']['Row'] & {
    messes: Database['public']['Tables']['messes']['Row'];
  };
};

export default function HomeTab() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.role === 'customer') {
      fetchTodayDeliveries();
    }
  }, [user]);

  const fetchTodayDeliveries = async () => {
    try {
      const today = DateTime.now().toISODate();
      
      const { data, error } = await supabase
        .from('deliveries')
        .select(`
          *,
          subscriptions (
            *,
            messes (*)
          )
        `)
        .eq('customer_id', user?.id)
        .eq('date', today)
        .order('meal_type');

      if (error) throw error;
      setDeliveries(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchTodayDeliveries();
  };

  if (loading) {
    return <LoadingSpinner message="Loading your meals..." />;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={[styles.greeting, { color: theme.colors.onBackground }]}>
            Good {DateTime.now().hour < 12 ? 'Morning' : DateTime.now().hour < 17 ? 'Afternoon' : 'Evening'}, {user?.full_name}!
          </Text>
          <Text style={[styles.date, { color: theme.colors.onSurfaceVariant }]}>
            {DateTime.now().toFormat('EEEE, MMMM dd')}
          </Text>
        </View>

        {error && (
          <ErrorMessage message={error} onRetry={fetchTodayDeliveries} />
        )}

        <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
          Today's Meals
        </Text>

        {deliveries.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
                No meals scheduled for today
              </Text>
              <Button mode="outlined" style={styles.exploreButton}>
                Explore Messes
              </Button>
            </Card.Content>
          </Card>
        ) : (
          deliveries.map((delivery) => (
            <Card key={delivery.id} style={styles.deliveryCard}>
              <Card.Content>
                <View style={styles.deliveryHeader}>
                  <Text style={[styles.mealType, { color: theme.colors.primary }]}>
                    {delivery.meal_type.toUpperCase()}
                  </Text>
                  <Text style={[
                    styles.status,
                    {
                      color: delivery.status === 'delivered' ? theme.colors.success :
                             delivery.status === 'skipped' ? theme.colors.warning :
                             theme.colors.onSurfaceVariant
                    }
                  ]}>
                    {delivery.status.toUpperCase()}
                  </Text>
                </View>
                <Text style={[styles.messName, { color: theme.colors.onSurface }]}>
                  {delivery.subscriptions.messes.name}
                </Text>
                {delivery.status === 'scheduled' && (
                  <Button
                    mode="text"
                    style={styles.actionButton}
                    textColor={theme.colors.primary}
                  >
                    Skip This Meal
                  </Button>
                )}
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => {}}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  date: {
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  emptyCard: {
    marginBottom: 16,
  },
  emptyText: {
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 16,
  },
  exploreButton: {
    alignSelf: 'center',
  },
  deliveryCard: {
    marginBottom: 12,
    elevation: 2,
  },
  deliveryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  mealType: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  status: {
    fontSize: 12,
    fontWeight: '600',
  },
  messName: {
    fontSize: 18,
    marginBottom: 12,
  },
  actionButton: {
    alignSelf: 'flex-start',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});