import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, Chip, Searchbar, DataTable } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';
import { Database } from '../../types/database';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';

type Subscription = Database['public']['Tables']['subscriptions']['Row'] & {
  users: Database['public']['Tables']['users']['Row'];
};

export default function SubscribersTab() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [filteredSubscriptions, setFilteredSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    if (user?.role === 'mess_owner') {
      fetchSubscriptions();
    }
  }, [user]);

  useEffect(() => {
    filterSubscriptions();
  }, [subscriptions, searchQuery, selectedStatus]);

  const fetchSubscriptions = async () => {
    try {
      // First get the user's mess
      const { data: messes } = await supabase
        .from('messes')
        .select('id')
        .eq('owner_id', user?.id)
        .eq('status', 'approved');

      if (messes && messes.length > 0) {
        const messId = messes[0].id;
        
        const { data, error } = await supabase
          .from('subscriptions')
          .select(`
            *,
            users (
              id,
              full_name,
              email,
              phone
            )
          `)
          .eq('mess_id', messId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setSubscriptions(data || []);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filterSubscriptions = () => {
    let filtered = subscriptions;

    // Status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(sub => sub.status === selectedStatus);
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(sub =>
        sub.users.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.users.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.delivery_address.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredSubscriptions(filtered);
  };

  const handleStatusUpdate = async (subscriptionId: string, newStatus: 'active' | 'paused' | 'cancelled') => {
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ status: newStatus })
        .eq('id', subscriptionId);

      if (error) throw error;

      Alert.alert('Success', `Subscription ${newStatus} successfully`);
      fetchSubscriptions();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return theme.colors.success;
      case 'paused': return theme.colors.warning;
      case 'cancelled': return theme.colors.error;
      case 'expired': return theme.colors.error;
      default: return theme.colors.onSurfaceVariant;
    }
  };

  const getPlanTypeColor = (planType: string) => {
    switch (planType) {
      case 'daily': return theme.colors.primary;
      case 'weekly': return theme.colors.secondary;
      case 'monthly': return theme.colors.tertiary;
      default: return theme.colors.onSurfaceVariant;
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading subscribers..." />;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.onBackground }]}>
            Subscribers
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
            Manage customer subscriptions
          </Text>
        </View>

        {error && (
          <ErrorMessage message={error} onRetry={fetchSubscriptions} />
        )}

        {/* Filters */}
        <View style={styles.filters}>
          <Searchbar
            placeholder="Search subscribers..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchbar}
          />
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statusFilters}>
            <Chip
              selected={selectedStatus === 'all'}
              onPress={() => setSelectedStatus('all')}
              style={styles.filterChip}
            >
              All ({subscriptions.length})
            </Chip>
            <Chip
              selected={selectedStatus === 'active'}
              onPress={() => setSelectedStatus('active')}
              style={styles.filterChip}
            >
              Active ({subscriptions.filter(s => s.status === 'active').length})
            </Chip>
            <Chip
              selected={selectedStatus === 'paused'}
              onPress={() => setSelectedStatus('paused')}
              style={styles.filterChip}
            >
              Paused ({subscriptions.filter(s => s.status === 'paused').length})
            </Chip>
            <Chip
              selected={selectedStatus === 'cancelled'}
              onPress={() => setSelectedStatus('cancelled')}
              style={styles.filterChip}
            >
              Cancelled ({subscriptions.filter(s => s.status === 'cancelled').length})
            </Chip>
          </ScrollView>
        </View>

        {/* Subscriptions List */}
        {filteredSubscriptions.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
                No subscribers found
              </Text>
            </Card.Content>
          </Card>
        ) : (
          filteredSubscriptions.map((subscription) => (
            <Card key={subscription.id} style={styles.subscriptionCard}>
              <Card.Content>
                <View style={styles.subscriptionHeader}>
                  <View style={styles.subscriptionInfo}>
                    <Text style={[styles.customerName, { color: theme.colors.onSurface }]}>
                      {subscription.users.full_name}
                    </Text>
                    <Text style={[styles.customerEmail, { color: theme.colors.onSurfaceVariant }]}>
                      {subscription.users.email}
                    </Text>
                    <Text style={[styles.deliveryAddress, { color: theme.colors.onSurfaceVariant }]}>
                      📍 {subscription.delivery_address}
                    </Text>
                  </View>
                  <View style={styles.subscriptionStatus}>
                    <Chip 
                      mode="outlined"
                    >
                      {subscription.status.toUpperCase()}
                    </Chip>
                    <Chip 
                      mode="outlined"
                      style={{ marginTop: 4 }}
                    >
                      {subscription.plan_type.toUpperCase()}
                    </Chip>
                  </View>
                </View>

                <View style={styles.subscriptionDetails}>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>
                      Meal Types:
                    </Text>
                    <Text style={[styles.detailValue, { color: theme.colors.onSurface }]}>
                      {subscription.meal_types.join(', ')}
                    </Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>
                      Period:
                    </Text>
                    <Text style={[styles.detailValue, { color: theme.colors.onSurface }]}>
                      {new Date(subscription.start_date).toLocaleDateString()} - {new Date(subscription.end_date).toLocaleDateString()}
                    </Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>
                      Price per meal:
                    </Text>
                    <Text style={[styles.detailValue, { color: theme.colors.primary }]}>
                      ₹{subscription.price_per_meal}
                    </Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>
                      Total amount:
                    </Text>
                    <Text style={[styles.detailValue, { color: theme.colors.primary, fontWeight: 'bold' }]}>
                      ₹{subscription.total_amount}
                    </Text>
                  </View>
                </View>

                {subscription.delivery_instructions && (
                  <View style={styles.instructions}>
                    <Text style={[styles.instructionsLabel, { color: theme.colors.onSurfaceVariant }]}>
                      Delivery Instructions:
                    </Text>
                    <Text style={[styles.instructionsText, { color: theme.colors.onSurface }]}>
                      {subscription.delivery_instructions}
                    </Text>
                  </View>
                )}

                <View style={styles.subscriptionActions}>
                  <Button 
                    mode="outlined" 
                    onPress={() => Alert.alert('Details', 'Subscription details coming soon')}
                    style={styles.actionButton}
                  >
                    View Details
                  </Button>
                  {subscription.status === 'active' && (
                    <>
                      <Button 
                        mode="outlined" 
                        onPress={() => handleStatusUpdate(subscription.id, 'paused')}
                        style={styles.actionButton}
                      >
                        Pause
                      </Button>
                      <Button 
                        mode="outlined" 
                        onPress={() => handleStatusUpdate(subscription.id, 'cancelled')}
                        style={styles.actionButton}
                      >
                        Cancel
                      </Button>
                    </>
                  )}
                  {subscription.status === 'paused' && (
                    <Button 
                      mode="contained" 
                      onPress={() => handleStatusUpdate(subscription.id, 'active')}
                      style={styles.actionButton}
                    >
                      Resume
                    </Button>
                  )}
                </View>
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  filters: {
    marginBottom: 16,
  },
  searchbar: {
    marginBottom: 16,
  },
  statusFilters: {
    marginBottom: 8,
  },
  filterChip: {
    marginRight: 8,
  },
  emptyCard: {
    marginBottom: 16,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
  },
  subscriptionCard: {
    marginBottom: 16,
    elevation: 2,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  subscriptionInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  customerEmail: {
    fontSize: 14,
    marginBottom: 2,
  },
  deliveryAddress: {
    fontSize: 14,
  },
  subscriptionStatus: {
    alignItems: 'flex-end',
  },
  subscriptionDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
  },
  instructions: {
    marginBottom: 12,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 4,
  },
  instructionsLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  instructionsText: {
    fontSize: 12,
  },
  subscriptionActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
}); 