import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, Chip, DataTable } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';
import { Database } from '../../types/database';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import ProtectedRoute from '../../components/common/ProtectedRoute';

type User = Database['public']['Tables']['users']['Row'];
type Mess = Database['public']['Tables']['messes']['Row'];
type Subscription = Database['public']['Tables']['subscriptions']['Row'];

interface SystemStats {
  totalUsers: number;
  totalMesses: number;
  totalSubscriptions: number;
  pendingMesses: number;
  activeSubscriptions: number;
  recentUsers: User[];
  recentMesses: Mess[];
}

export default function OverviewTab() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    totalMesses: 0,
    totalSubscriptions: 0,
    pendingMesses: 0,
    activeSubscriptions: 0,
    recentUsers: [],
    recentMesses: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchSystemStats();
    }
  }, [user]);

  const fetchSystemStats = async () => {
    try {
      // Fetch users count
      const { count: usersCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      // Fetch messes count
      const { count: messesCount } = await supabase
        .from('messes')
        .select('*', { count: 'exact', head: true });

      // Fetch subscriptions count
      const { count: subscriptionsCount } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true });

      // Fetch pending messes
      const { count: pendingMessesCount } = await supabase
        .from('messes')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Fetch active subscriptions
      const { count: activeSubscriptionsCount } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Fetch recent users
      const { data: recentUsers } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      // Fetch recent messes
      const { data: recentMesses } = await supabase
        .from('messes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      setStats({
        totalUsers: usersCount || 0,
        totalMesses: messesCount || 0,
        totalSubscriptions: subscriptionsCount || 0,
        pendingMesses: pendingMessesCount || 0,
        activeSubscriptions: activeSubscriptionsCount || 0,
        recentUsers: recentUsers || [],
        recentMesses: recentMesses || [],
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading system statistics..." />;
  }

  return (
    <ProtectedRoute requiredRole="admin" requiredPermission="system_management">
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ScrollView style={styles.scrollView}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.onBackground }]}>
              System Overview
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
              Welcome back, {user?.full_name}
            </Text>
          </View>

          {error && (
            <ErrorMessage message={error} onRetry={fetchSystemStats} />
          )}

          {/* Statistics Cards */}
          <View style={styles.statsGrid}>
            <Card style={styles.statCard}>
              <Card.Content>
                <Text style={[styles.statNumber, { color: theme.colors.primary }]}>
                  {stats.totalUsers}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Total Users
                </Text>
              </Card.Content>
            </Card>

            <Card style={styles.statCard}>
              <Card.Content>
                <Text style={[styles.statNumber, { color: theme.colors.primary }]}>
                  {stats.totalMesses}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Total Messes
                </Text>
              </Card.Content>
            </Card>

            <Card style={styles.statCard}>
              <Card.Content>
                <Text style={[styles.statNumber, { color: theme.colors.warning }]}>
                  {stats.pendingMesses}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Pending Approval
                </Text>
              </Card.Content>
            </Card>

            <Card style={styles.statCard}>
              <Card.Content>
                <Text style={[styles.statNumber, { color: theme.colors.success }]}>
                  {stats.activeSubscriptions}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Active Subscriptions
                </Text>
              </Card.Content>
            </Card>
          </View>

          {/* Recent Users */}
          <Card style={styles.sectionCard}>
            <Card.Content>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                  Recent Users
                </Text>
                <Button mode="text" onPress={() => {}}>
                  View All
                </Button>
              </View>
              
              <DataTable>
                <DataTable.Header>
                  <DataTable.Title>Name</DataTable.Title>
                  <DataTable.Title>Role</DataTable.Title>
                  <DataTable.Title>Status</DataTable.Title>
                </DataTable.Header>

                {stats.recentUsers.map((user) => (
                  <DataTable.Row key={user.id}>
                    <DataTable.Cell>{user.full_name}</DataTable.Cell>
                    <DataTable.Cell>
                      <Chip size="small" mode="outlined">
                        {user.role}
                      </Chip>
                    </DataTable.Cell>
                    <DataTable.Cell>
                      <Chip 
                        size="small" 
                        mode={user.is_active ? "flat" : "outlined"}
                        textColor={user.is_active ? theme.colors.success : theme.colors.error}
                      >
                        {user.is_active ? 'Active' : 'Inactive'}
                      </Chip>
                    </DataTable.Cell>
                  </DataTable.Row>
                ))}
              </DataTable>
            </Card.Content>
          </Card>

          {/* Recent Messes */}
          <Card style={styles.sectionCard}>
            <Card.Content>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                  Recent Messes
                </Text>
                <Button mode="text" onPress={() => {}}>
                  View All
                </Button>
              </View>
              
              <DataTable>
                <DataTable.Header>
                  <DataTable.Title>Name</DataTable.Title>
                  <DataTable.Title>Status</DataTable.Title>
                  <DataTable.Title>Rating</DataTable.Title>
                </DataTable.Header>

                {stats.recentMesses.map((mess) => (
                  <DataTable.Row key={mess.id}>
                    <DataTable.Cell>{mess.name}</DataTable.Cell>
                    <DataTable.Cell>
                      <Chip 
                        size="small" 
                        mode="outlined"
                        textColor={
                          mess.status === 'approved' ? theme.colors.success :
                          mess.status === 'pending' ? theme.colors.warning :
                          theme.colors.error
                        }
                      >
                        {mess.status}
                      </Chip>
                    </DataTable.Cell>
                    <DataTable.Cell>
                      ⭐ {mess.rating_average.toFixed(1)}
                    </DataTable.Cell>
                  </DataTable.Row>
                ))}
              </DataTable>
            </Card.Content>
          </Card>
        </ScrollView>
      </View>
    </ProtectedRoute>
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    marginBottom: 16,
    elevation: 2,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
  },
  sectionCard: {
    marginBottom: 16,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
}); 