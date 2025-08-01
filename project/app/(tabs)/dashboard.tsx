import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, FAB, Dialog, Portal, TextInput, SegmentedButtons } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';
import { Database } from '../../types/database';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';

type Mess = Database['public']['Tables']['messes']['Row'];

export default function DashboardTab() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [messes, setMesses] = useState<Mess[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    delivery_radius: '5',
    open_time: '08:00',
    close_time: '22:00',
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  });

  useEffect(() => {
    if (user?.role === 'mess_owner') {
      fetchMesses();
    }
  }, [user]);

  const fetchMesses = async () => {
    try {
      const { data, error } = await supabase
        .from('messes')
        .select('*')
        .eq('owner_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMesses(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMess = async () => {
    if (!formData.name || !formData.description || !formData.address || !formData.phone) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setCreating(true);
    try {
      const messData = {
        owner_id: user?.id,
        name: formData.name,
        description: formData.description,
        address: formData.address,
        location: { latitude: 0, longitude: 0 }, // Will be updated with actual location
        phone: formData.phone,
        email: formData.email || undefined,
        images: [],
        operating_hours: {
          open_time: formData.open_time,
          close_time: formData.close_time,
          days: formData.days,
        },
        delivery_radius: parseFloat(formData.delivery_radius),
        status: 'pending',
      };

      const { error } = await supabase
        .from('messes')
        .insert(messData);

      if (error) throw error;

      Alert.alert('Success', 'Mess created successfully! It will be reviewed by admin.');
      setShowCreateDialog(false);
      setFormData({
        name: '',
        description: '',
        address: '',
        phone: '',
        email: '',
        delivery_radius: '5',
        open_time: '08:00',
        close_time: '22:00',
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      });
      fetchMesses();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setCreating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return theme.colors.success;
      case 'pending': return theme.colors.warning;
      case 'rejected': return theme.colors.error;
      case 'suspended': return theme.colors.error;
      default: return theme.colors.onSurfaceVariant;
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading your messes..." />;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.onBackground }]}>
            My Messes
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
            Manage your messes and track their performance
          </Text>
        </View>

        {error && (
          <ErrorMessage message={error} onRetry={fetchMesses} />
        )}

        {messes.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
                You haven't created any messes yet
              </Text>
              <Text style={[styles.emptySubtext, { color: theme.colors.onSurfaceVariant }]}>
                Create your first mess to start serving customers
              </Text>
            </Card.Content>
          </Card>
        ) : (
          messes.map((mess) => (
            <Card key={mess.id} style={styles.messCard}>
              <Card.Content>
                <View style={styles.messHeader}>
                  <View style={styles.messInfo}>
                    <Text style={[styles.messName, { color: theme.colors.onSurface }]}>
                      {mess.name}
                    </Text>
                    <Text style={[styles.messAddress, { color: theme.colors.onSurfaceVariant }]}>
                      {mess.address}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(mess.status) }]}>
                    <Text style={[styles.statusText, { color: theme.colors.surface }]}>
                      {mess.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
                
                <Text style={[styles.messDescription, { color: theme.colors.onSurfaceVariant }]}>
                  {mess.description}
                </Text>

                <View style={styles.messStats}>
                  <Text style={[styles.stat, { color: theme.colors.onSurfaceVariant }]}>
                    ⭐ {mess.rating_average.toFixed(1)} ({mess.rating_count} reviews)
                  </Text>
                  <Text style={[styles.stat, { color: theme.colors.onSurfaceVariant }]}>
                    📍 {mess.delivery_radius}km radius
                  </Text>
                </View>

                <View style={styles.messActions}>
                  <Button mode="outlined" style={styles.actionButton}>
                    Edit
                  </Button>
                  <Button mode="outlined" style={styles.actionButton}>
                    View Menu
                  </Button>
                </View>
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => setShowCreateDialog(true)}
      />

      <Portal>
        <Dialog visible={showCreateDialog} onDismiss={() => setShowCreateDialog(false)}>
          <Dialog.Title>Create New Mess</Dialog.Title>
          <Dialog.Content>
            <ScrollView>
              <TextInput
                label="Mess Name *"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                style={styles.input}
              />
              <TextInput
                label="Description *"
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                multiline
                numberOfLines={3}
                style={styles.input}
              />
              <TextInput
                label="Address *"
                value={formData.address}
                onChangeText={(text) => setFormData({ ...formData, address: text })}
                style={styles.input}
              />
              <TextInput
                label="Phone Number *"
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                keyboardType="phone-pad"
                style={styles.input}
              />
              <TextInput
                label="Email (optional)"
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                keyboardType="email-address"
                style={styles.input}
              />
              <TextInput
                label="Delivery Radius (km)"
                value={formData.delivery_radius}
                onChangeText={(text) => setFormData({ ...formData, delivery_radius: text })}
                keyboardType="numeric"
                style={styles.input}
              />
              <View style={styles.timeContainer}>
                <TextInput
                  label="Open Time"
                  value={formData.open_time}
                  onChangeText={(text) => setFormData({ ...formData, open_time: text })}
                  style={[styles.input, styles.halfInput]}
                />
                <TextInput
                  label="Close Time"
                  value={formData.close_time}
                  onChangeText={(text) => setFormData({ ...formData, close_time: text })}
                  style={[styles.input, styles.halfInput]}
                />
              </View>
            </ScrollView>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button 
              mode="contained" 
              onPress={handleCreateMess}
              loading={creating}
              disabled={creating}
            >
              Create Mess
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
  emptyCard: {
    marginBottom: 16,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubtext: {
    textAlign: 'center',
    fontSize: 14,
  },
  messCard: {
    marginBottom: 16,
    elevation: 2,
  },
  messHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  messInfo: {
    flex: 1,
  },
  messName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  messAddress: {
    fontSize: 14,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  messDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  messStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  stat: {
    fontSize: 12,
  },
  messActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  input: {
    marginBottom: 16,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    flex: 1,
    marginHorizontal: 4,
  },
}); 