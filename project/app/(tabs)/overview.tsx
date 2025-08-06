import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, Chip, DataTable, Divider } from 'react-native-paper';
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
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Header Section */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={[styles.title, { color: theme.colors.onBackground }]}>
                System Overview
              </Text>
              <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
                Welcome back, {user?.full_name}
              </Text>
              <Text style={[styles.dateText, { color: theme.colors.onSurfaceVariant }]}>
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </Text>
            </View>
          </View>

          {error && (
            <ErrorMessage message={error} onRetry={fetchSystemStats} />
          )}

          {/* Statistics Cards */}
          <View style={styles.statsGrid}>
            <Card style={[styles.statCard, { backgroundColor: theme.colors.surface }]} elevation={4}>
              <Card.Content style={styles.statCardContent}>
                <View style={[styles.statIcon, { backgroundColor: theme.colors.primaryContainer }]}>
                  <Text style={[styles.statIconText, { color: theme.colors.onPrimaryContainer }]}>
                    👥
                  </Text>
                </View>
                <View style={styles.statInfo}>
                  <Text style={[styles.statNumber, { color: theme.colors.primary }]}>
                    {stats.totalUsers.toLocaleString()}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
                    Total Users
                  </Text>
                </View>
              </Card.Content>
            </Card>

            <Card style={[styles.statCard, { backgroundColor: theme.colors.surface }]} elevation={4}>
              <Card.Content style={styles.statCardContent}>
                <View style={[styles.statIcon, { backgroundColor: theme.colors.secondaryContainer }]}>
                  <Text style={[styles.statIconText, { color: theme.colors.onSecondaryContainer }]}>
                    🏠
                  </Text>
                </View>
                <View style={styles.statInfo}>
                  <Text style={[styles.statNumber, { color: theme.colors.secondary }]}>
                    {stats.totalMesses.toLocaleString()}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
                    Total Messes
                  </Text>
                </View>
              </Card.Content>
            </Card>

            <Card style={[styles.statCard, { backgroundColor: theme.colors.surface }]} elevation={4}>
              <Card.Content style={styles.statCardContent}>
                <View style={[styles.statIcon, { backgroundColor: theme.colors.tertiaryContainer }]}>
                  <Text style={[styles.statIconText, { color: theme.colors.onTertiaryContainer }]}>
                    ⏳
                  </Text>
                </View>
                <View style={styles.statInfo}>
                  <Text style={[styles.statNumber, { color: theme.colors.tertiary }]}>
                    {stats.pendingMesses.toLocaleString()}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
                    Pending Approval
                  </Text>
                </View>
              </Card.Content>
            </Card>

            <Card style={[styles.statCard, { backgroundColor: theme.colors.surface }]} elevation={4}>
              <Card.Content style={styles.statCardContent}>
                <View style={[styles.statIcon, { backgroundColor: theme.colors.primaryContainer }]}>
                  <Text style={[styles.statIconText, { color: theme.colors.onPrimaryContainer }]}>
                    ✅
                  </Text>
                </View>
                <View style={styles.statInfo}>
                  <Text style={[styles.statNumber, { color: theme.colors.success }]}>
                    {stats.activeSubscriptions.toLocaleString()}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
                    Active Subscriptions
                  </Text>
                </View>
              </Card.Content>
            </Card>
          </View>

          {/* Recent Users */}
          <Card style={[styles.sectionCard, { backgroundColor: theme.colors.surface }]} elevation={4}>
            <Card.Content>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleContainer}>
                  <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                    Recent Users
                  </Text>
                  <Text style={[styles.sectionSubtitle, { color: theme.colors.onSurfaceVariant }]}>
                    Latest registered users
                  </Text>
                </View>
                <Button mode="text" onPress={() => {}} style={styles.viewAllButton}>
                  View All
                </Button>
              </View>
              
              <Divider style={[styles.divider, { backgroundColor: theme.colors.outline }]} />
              
              <DataTable>
                <DataTable.Header>
                  <DataTable.Title>
                    <Text style={[styles.tableHeaderText, { color: theme.colors.onSurface }]}>
                      Name
                    </Text>
                  </DataTable.Title>
                  <DataTable.Title>
                    <Text style={[styles.tableHeaderText, { color: theme.colors.onSurface }]}>
                      Role
                    </Text>
                  </DataTable.Title>
                  <DataTable.Title>
                    <Text style={[styles.tableHeaderText, { color: theme.colors.onSurface }]}>
                      Status
                    </Text>
                  </DataTable.Title>
                </DataTable.Header>

                {stats.recentUsers.map((user) => (
                  <DataTable.Row key={user.id} style={styles.tableRow}>
                    <DataTable.Cell>
                      <Text style={[styles.tableCellText, { color: theme.colors.onSurface }]}>
                        {user.full_name}
                      </Text>
                    </DataTable.Cell>
                    <DataTable.Cell>
                      <Chip mode="outlined" style={[styles.roleChip, { backgroundColor: theme.colors.surfaceVariant }]}>
                        {user.role}
                      </Chip>
                    </DataTable.Cell>
                    <DataTable.Cell>
                      <Chip 
                        mode={user.is_active ? "flat" : "outlined"}
                        style={[styles.statusChip, { 
                          backgroundColor: user.is_active ? theme.colors.success : theme.colors.error,
                        }]}
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
          <Card style={[styles.sectionCard, { backgroundColor: theme.colors.surface }]} elevation={4}>
            <Card.Content>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleContainer}>
                  <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                    Recent Messes
                  </Text>
                  <Text style={[styles.sectionSubtitle, { color: theme.colors.onSurfaceVariant }]}>
                    Latest registered messes
                  </Text>
                </View>
                <Button mode="text" onPress={() => {}} style={styles.viewAllButton}>
                  View All
                </Button>
              </View>
              
              <Divider style={[styles.divider, { backgroundColor: theme.colors.outline }]} />
              
              <DataTable>
                <DataTable.Header>
                  <DataTable.Title>
                    <Text style={[styles.tableHeaderText, { color: theme.colors.onSurface }]}>
                      Name
                    </Text>
                  </DataTable.Title>
                  <DataTable.Title>
                    <Text style={[styles.tableHeaderText, { color: theme.colors.onSurface }]}>
                      Status
                    </Text>
                  </DataTable.Title>
                  <DataTable.Title>
                    <Text style={[styles.tableHeaderText, { color: theme.colors.onSurface }]}>
                      Rating
                    </Text>
                  </DataTable.Title>
                </DataTable.Header>

                {stats.recentMesses.map((mess) => (
                  <DataTable.Row key={mess.id} style={styles.tableRow}>
                    <DataTable.Cell>
                      <Text style={[styles.tableCellText, { color: theme.colors.onSurface }]}>
                        {mess.name}
                      </Text>
                    </DataTable.Cell>
                    <DataTable.Cell>
                      <Chip 
                        mode="outlined"
                        style={[styles.statusChip, {
                          backgroundColor: 
                            mess.status === 'approved' ? theme.colors.success :
                            mess.status === 'pending' ? theme.colors.warning :
                            theme.colors.error,
                        }]}
                      >
                        {mess.status === 'approved' ? 'Approved' : 'Pending'}
                      </Chip>
                    </DataTable.Cell>
                    <DataTable.Cell>
                      <View style={styles.ratingContainer}>
                        <Text style={[styles.ratingText, { color: theme.colors.warning }]}>
                          ⭐ {mess.rating_average.toFixed(1)}
                        </Text>
                      </View>
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
    marginTop: 26,
  },
  headerContent: {
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  dateText: {
    fontSize: 14,
    marginTop: 4,
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
  statCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  statIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  statIconText: {
    fontSize: 28,
  },
  statInfo: {
    flex: 1,
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
  sectionTitleContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  sectionSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  viewAllButton: {
    paddingHorizontal: 0,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  tableHeaderText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  tableRow: {
    height: 60,
  },
  tableCellText: {
    fontSize: 15,
  },
  roleChip: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    width: 90,
  },
  statusChip: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    width: 90,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
  },
}); 