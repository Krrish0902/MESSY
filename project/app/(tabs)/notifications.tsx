import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Chip, List, Divider } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';
import { Database } from '../../types/database';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';

type Notification = Database['public']['Tables']['notifications']['Row'];

export default function MessagesTab() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'mess_cut': return '🍽️';
      case 'delivery': return '🚚';
      case 'subscription': return '📋';
      case 'system': return '⚙️';
      case 'rating': return '⭐';
      default: return '📢';
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading Notifications..." />;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.onBackground }]}>
            Notifications
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
            Your notifications and updates
          </Text>
        </View>

        {error && (
          <ErrorMessage message={error} onRetry={fetchNotifications} />
        )}

        {notifications.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
                No Notifications yet
              </Text>
              <Text style={[styles.emptySubtext, { color: theme.colors.onSurfaceVariant }]}>
                You'll see notifications here when you have updates
              </Text>
            </Card.Content>
          </Card>
        ) : (
          notifications.map((notification) => (
            <Card key={notification.id} style={styles.notificationCard}>
              <Card.Content>
                <View style={styles.notificationHeader}>
                  <View style={styles.notificationInfo}>
                    <Text style={[styles.notificationTitle, { color: theme.colors.onSurface }]}>
                      {notification.title}
                    </Text>
                    <Text style={[styles.notificationTime, { color: theme.colors.onSurfaceVariant }]}>
                      {new Date(notification.created_at).toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationIcon}>
                      {getNotificationIcon(notification.type)}
                    </Text>
                    <Chip 
                      mode="outlined"
                      style={{ marginTop: 4 }}
                    >
                      {notification.type}
                    </Chip>
                  </View>
                </View>

                <Text style={[styles.notificationMessage, { color: theme.colors.onSurfaceVariant }]}>
                  {notification.message}
                </Text>

                {!notification.is_read && (
                  <View style={styles.unreadIndicator}>
                    <Text style={[styles.unreadText, { color: theme.colors.primary }]}>
                      New
                    </Text>
                  </View>
                )}
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
  notificationCard: {
    marginBottom: 16,
    elevation: 2,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  notificationInfo: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
  },
  notificationBadge: {
    alignItems: 'flex-end',
  },
  notificationIcon: {
    fontSize: 24,
  },
  notificationMessage: {
    fontSize: 14,
    lineHeight: 20,
  },
  unreadIndicator: {
    marginTop: 8,
  },
  unreadText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
}); 