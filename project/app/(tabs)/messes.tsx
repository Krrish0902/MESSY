import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, Chip, Searchbar, Dialog, Portal } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';
import { Database } from '../../types/database';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';

type Mess = Database['public']['Tables']['messes']['Row'] & {
  users: Database['public']['Tables']['users']['Row'];
};

export default function MessesTab() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [messes, setMesses] = useState<Mess[]>([]);
  const [filteredMesses, setFilteredMesses] = useState<Mess[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('pending');
  const [selectedMess, setSelectedMess] = useState<Mess | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchMesses();
    }
  }, [user]);

  useEffect(() => {
    filterMesses();
  }, [messes, searchQuery, selectedStatus]);

  const fetchMesses = async () => {
    try {
      const { data, error } = await supabase
        .from('messes')
        .select(`
          *,
          users (
            id,
            full_name,
            email,
            phone
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMesses(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filterMesses = () => {
    let filtered = messes;

    // Status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(mess => mess.status === selectedStatus);
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(mess =>
        mess.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mess.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mess.users.full_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredMesses(filtered);
  };

  const handleStatusUpdate = async (messId: string, newStatus: 'approved' | 'rejected' | 'suspended') => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('messes')
        .update({ status: newStatus })
        .eq('id', messId);

      if (error) throw error;

      Alert.alert('Success', `Mess ${newStatus} successfully`);
      fetchMesses();
      setShowDetailsDialog(false);
      setSelectedMess(null);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading messes..." />;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.onBackground }]}>
            Mess Management
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
            Approve and manage mess registrations
          </Text>
        </View>

        {error && (
          <ErrorMessage message={error} onRetry={fetchMesses} />
        )}

        {/* Filters */}
        <View style={styles.filters}>
          <Searchbar
            placeholder="Search messes..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchbar}
          />
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statusFilters}>
            <Chip
              selected={selectedStatus === 'pending'}
              onPress={() => setSelectedStatus('pending')}
              style={styles.filterChip}
            >
              Pending ({messes.filter(m => m.status === 'pending').length})
            </Chip>
            <Chip
              selected={selectedStatus === 'approved'}
              onPress={() => setSelectedStatus('approved')}
              style={styles.filterChip}
            >
              Approved ({messes.filter(m => m.status === 'approved').length})
            </Chip>
            <Chip
              selected={selectedStatus === 'rejected'}
              onPress={() => setSelectedStatus('rejected')}
              style={styles.filterChip}
            >
              Rejected ({messes.filter(m => m.status === 'rejected').length})
            </Chip>
            <Chip
              selected={selectedStatus === 'all'}
              onPress={() => setSelectedStatus('all')}
              style={styles.filterChip}
            >
              All ({messes.length})
            </Chip>
          </ScrollView>
        </View>

        {/* Messes List */}
        {filteredMesses.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
                No messes found
              </Text>
            </Card.Content>
          </Card>
        ) : (
          filteredMesses.map((mess) => (
            <Card key={mess.id} style={styles.messCard}>
              <Card.Content>
                <View style={styles.messHeader}>
                  <View style={styles.messInfo}>
                    <Text style={[styles.messName, { color: theme.colors.onSurface }]}>
                      {mess.name}
                    </Text>
                    <Text style={[styles.messOwner, { color: theme.colors.onSurfaceVariant }]}>
                      Owner: {mess.users.full_name}
                    </Text>
                    <Text style={[styles.messAddress, { color: theme.colors.onSurfaceVariant }]}>
                      {mess.address}
                    </Text>
                  </View>
                  <Chip 
                    mode="outlined"
                  >
                    {mess.status.toUpperCase()}
                  </Chip>
                </View>

                <Text style={[styles.messDescription, { color: theme.colors.onSurfaceVariant }]}>
                  {mess.description}
                </Text>

                <View style={styles.messStats}>
                  <Text style={[styles.stat, { color: theme.colors.onSurfaceVariant }]}>
                    📞 {mess.phone}
                  </Text>
                  <Text style={[styles.stat, { color: theme.colors.onSurfaceVariant }]}>
                    ⭐ {mess.rating_average.toFixed(1)} ({mess.rating_count})
                  </Text>
                  <Text style={[styles.stat, { color: theme.colors.onSurfaceVariant }]}>
                    📍 {mess.delivery_radius}km radius
                  </Text>
                </View>

                <View style={styles.messActions}>
                  <Button 
                    mode="outlined" 
                    onPress={() => {
                      setSelectedMess(mess);
                      setShowDetailsDialog(true);
                    }}
                    style={styles.actionButton}
                  >
                    View Details
                  </Button>
                  {mess.status === 'pending' && (
                    <>
                      <Button 
                        mode="contained" 
                        onPress={() => handleStatusUpdate(mess.id, 'approved')}
                        style={[styles.actionButton, { backgroundColor: theme.colors.success }]}
                      >
                        Approve
                      </Button>
                      <Button 
                        mode="contained" 
                        onPress={() => handleStatusUpdate(mess.id, 'rejected')}
                        style={[styles.actionButton, { backgroundColor: theme.colors.error }]}
                      >
                        Reject
                      </Button>
                    </>
                  )}
                  {mess.status === 'approved' && (
                    <Button 
                      mode="contained" 
                      onPress={() => handleStatusUpdate(mess.id, 'suspended')}
                      style={[styles.actionButton, { backgroundColor: theme.colors.error }]}
                    >
                      Suspend
                    </Button>
                  )}
                </View>
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>

      {/* Mess Details Dialog */}
      <Portal>
        <Dialog visible={showDetailsDialog} onDismiss={() => setShowDetailsDialog(false)}>
          <Dialog.Title>Mess Details</Dialog.Title>
          <Dialog.Content>
            {selectedMess && (
              <ScrollView>
                <Text style={styles.detailLabel}>Name:</Text>
                <Text style={styles.detailValue}>{selectedMess.name}</Text>
                
                <Text style={styles.detailLabel}>Owner:</Text>
                <Text style={styles.detailValue}>{selectedMess.users.full_name}</Text>
                
                <Text style={styles.detailLabel}>Email:</Text>
                <Text style={styles.detailValue}>{selectedMess.users.email}</Text>
                
                <Text style={styles.detailLabel}>Phone:</Text>
                <Text style={styles.detailValue}>{selectedMess.phone}</Text>
                
                <Text style={styles.detailLabel}>Address:</Text>
                <Text style={styles.detailValue}>{selectedMess.address}</Text>
                
                <Text style={styles.detailLabel}>Description:</Text>
                <Text style={styles.detailValue}>{selectedMess.description}</Text>
                
                <Text style={styles.detailLabel}>Operating Hours:</Text>
                <Text style={styles.detailValue}>
                  {selectedMess.operating_hours.open_time} - {selectedMess.operating_hours.close_time}
                </Text>
                <Text style={styles.detailValue}>
                  Days: {selectedMess.operating_hours.days.join(', ')}
                </Text>
                
                <Text style={styles.detailLabel}>Delivery Radius:</Text>
                <Text style={styles.detailValue}>{selectedMess.delivery_radius} km</Text>
                
                <Text style={styles.detailLabel}>Status:</Text>
                <Chip 
                  mode="outlined"
                >
                  {selectedMess.status.toUpperCase()}
                </Chip>
              </ScrollView>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDetailsDialog(false)}>Close</Button>
            {selectedMess?.status === 'pending' && (
              <>
                <Button 
                  mode="contained"
                  onPress={() => handleStatusUpdate(selectedMess.id, 'approved')}
                  loading={updating}
                  disabled={updating}
                  style={{ backgroundColor: theme.colors.success }}
                >
                  Approve
                </Button>
                <Button 
                  mode="contained"
                  onPress={() => handleStatusUpdate(selectedMess.id, 'rejected')}
                  loading={updating}
                  disabled={updating}
                  style={{ backgroundColor: theme.colors.error }}
                >
                  Reject
                </Button>
              </>
            )}
            {selectedMess?.status === 'approved' && (
              <Button 
                mode="contained"
                onPress={() => handleStatusUpdate(selectedMess.id, 'suspended')}
                loading={updating}
                disabled={updating}
                style={{ backgroundColor: theme.colors.error }}
              >
                Suspend
              </Button>
            )}
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
  messOwner: {
    fontSize: 14,
    marginBottom: 2,
  },
  messAddress: {
    fontSize: 14,
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
  detailLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    marginBottom: 8,
  },
}); 