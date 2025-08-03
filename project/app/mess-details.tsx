import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, Chip, Divider, List, Avatar } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabase';
import { Database } from '../types/database';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import { LocationService } from '../services/LocationService';

type Mess = Database['public']['Tables']['messes']['Row'] & {
  users: Database['public']['Tables']['users']['Row'];
};

type WeeklyMenu = Database['public']['Tables']['weekly_menu']['Row'];
type Rating = Database['public']['Tables']['ratings']['Row'] & {
  users: Database['public']['Tables']['users']['Row'];
};

interface MessDetails {
  mess: Mess;
  weeklyMenu: WeeklyMenu | null;
  ratings: Rating[];
  distance?: number;
}

export default function MessDetailsPage() {
  const { messId } = useLocalSearchParams<{ messId: string }>();
  const { user } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  
  const [messDetails, setMessDetails] = useState<MessDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [showMenuView, setShowMenuView] = useState(false);

  useEffect(() => {
    if (messId) {
      fetchMessDetails();
      getCurrentLocation();
    }
  }, [messId]);

  const getCurrentLocation = async () => {
    const location = await LocationService.getCurrentLocation();
    if (location) {
      setUserLocation({
        latitude: location.latitude,
        longitude: location.longitude,
      });
    }
  };

  const fetchMessDetails = async () => {
    try {
      // Build the query based on user role
      let query = supabase
        .from('messes')
        .select(`
          *,
          users (
            id,
            full_name,
            email,
            phone,
            created_at
          )
        `)
        .eq('id', messId);

      // Only show approved messes to customers, but show all to admins
      if (user?.role !== 'admin') {
        query = query.eq('status', 'approved');
      }

      const { data: messData, error: messError } = await query.single();

      if (messError) throw messError;

      // Fetch weekly menu
      const { data: weeklyMenuData, error: weeklyMenuError } = await supabase
        .from('weekly_menu')
        .select('*')
        .eq('mess_id', messId)
        .single();

      if (weeklyMenuError && weeklyMenuError.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw weeklyMenuError;
      }

      // Fetch ratings with user details
      const { data: ratingsData, error: ratingsError } = await supabase
        .from('ratings')
        .select(`
          *,
          users (
            id,
            full_name
          )
        `)
        .eq('mess_id', messId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (ratingsError) throw ratingsError;

      // Calculate distance if user location is available
      let distance: number | undefined;
      if (userLocation) {
        distance = LocationService.calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          messData.location.latitude,
          messData.location.longitude
        );
      }

      setMessDetails({
        mess: messData,
        weeklyMenu: weeklyMenuData || null,
        ratings: ratingsData || [],
        distance,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = () => {
    // Navigate to subscription flow
    Alert.alert('Subscribe', 'Navigate to subscription flow');
  };

  const handleViewMenu = () => {
    setShowMenuView(true);
  };

  const handleAdminAction = async (action: 'approve' | 'reject' | 'suspend') => {
    if (!messDetails) return;

    try {
      const { error } = await supabase
        .from('messes')
        .update({ status: action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'suspended' })
        .eq('id', messId);

      if (error) throw error;

      Alert.alert('Success', `Mess ${action}d successfully`);
      fetchMessDetails(); // Refresh data
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const formatOperatingHours = (hours: any) => {
    if (!hours) return 'Not specified';
    return `${hours.open_time} - ${hours.close_time}`;
  };

  const formatDays = (days: string[]) => {
    if (!days || days.length === 0) return 'Not specified';
    return days.join(', ');
  };

  const getDayDisplayName = (day: string) => {
    return day.charAt(0).toUpperCase() + day.slice(1);
  };

  const getMealDisplayName = (meal: string) => {
    return meal.charAt(0).toUpperCase() + meal.slice(1);
  };

  const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
  const MEALS = ['breakfast', 'lunch', 'dinner'] as const;

  if (loading) {
    return <LoadingSpinner message="Loading mess details..." />;
  }

  if (!messDetails) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          {user?.role === 'admin' 
            ? 'Mess not found' 
            : 'Mess not found or not yet approved'
          }
        </Text>
        <Button mode="contained" onPress={() => router.back()}>
          Go Back
        </Button>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Avatar.Image
            size={80}
            source={{ uri: messDetails.mess.images[0] || 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg' }}
            style={styles.messAvatar}
          />
          <View style={styles.headerInfo}>
            <Text style={[styles.title, { color: theme.colors.onBackground }]}>
              {messDetails.mess.name}
            </Text>
            <Text style={[styles.address, { color: theme.colors.onSurfaceVariant }]}>
              {messDetails.mess.address}
            </Text>
            {messDetails.distance && (
              <Text style={[styles.distance, { color: theme.colors.primary }]}>
                {messDetails.distance.toFixed(1)} km away
              </Text>
            )}
            <View style={styles.ratingContainer}>
              <Text style={[styles.ratingText, { color: theme.colors.warning }]}>
                ⭐ {messDetails.mess.rating_average.toFixed(1)}
              </Text>
              <Text style={[styles.ratingCount, { color: theme.colors.onSurfaceVariant }]}>
                ({messDetails.mess.rating_count} reviews)
              </Text>
            </View>
            {/* Show status for admins */}
            {user?.role === 'admin' && (
              <Chip 
                mode="outlined"
                style={{ 
                  backgroundColor: 
                    messDetails.mess.status === 'approved' ? theme.colors.success :
                    messDetails.mess.status === 'pending' ? theme.colors.warning :
                    theme.colors.error,
                  marginTop: 8
                }}
                textStyle={{ color: theme.colors.surface }}
              >
                {messDetails.mess.status.toUpperCase()}
              </Chip>
            )}
          </View>
        </View>

        {error && (
          <ErrorMessage message={error} onRetry={fetchMessDetails} />
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button 
            mode="outlined" 
            onPress={handleViewMenu}
            style={styles.actionButton}
            icon="food"
          >
            View Menu
          </Button>
          <Button 
            mode="contained" 
            onPress={handleSubscribe}
            style={styles.actionButton}
            icon="plus"
          >
            Subscribe Now
          </Button>
        </View>

        {/* Admin Action Buttons */}
        {user?.role === 'admin' && (
          <View style={styles.adminActionButtons}>
            {messDetails.mess.status === 'pending' && (
              <>
                <Button 
                  mode="contained" 
                  onPress={() => handleAdminAction('approve')}
                  style={[styles.adminActionButton, { backgroundColor: theme.colors.success }]}
                  icon="check"
                >
                  Approve Mess
                </Button>
                <Button 
                  mode="contained" 
                  onPress={() => handleAdminAction('reject')}
                  style={[styles.adminActionButton, { backgroundColor: theme.colors.error }]}
                  icon="close"
                >
                  Reject Mess
                </Button>
              </>
            )}
            {messDetails.mess.status === 'approved' && (
              <Button 
                mode="contained" 
                onPress={() => handleAdminAction('suspend')}
                style={[styles.adminActionButton, { backgroundColor: theme.colors.warning }]}
                icon="pause"
              >
                Suspend Mess
              </Button>
            )}
            {(messDetails.mess.status === 'rejected' || messDetails.mess.status === 'suspended') && (
              <Button 
                mode="contained" 
                onPress={() => handleAdminAction('approve')}
                style={[styles.adminActionButton, { backgroundColor: theme.colors.success }]}
                icon="check"
              >
                Approve Mess
              </Button>
            )}
          </View>
        )}

        {/* Basic Information */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              About This Mess
            </Text>
            <Divider style={styles.divider} />
            
            <Text style={[styles.description, { color: theme.colors.onSurfaceVariant }]}>
              {messDetails.mess.description}
            </Text>
            
            <List.Item
              title="Phone"
              description={messDetails.mess.phone}
              left={props => <List.Icon {...props} icon="phone" />}
            />
            {messDetails.mess.email && (
              <List.Item
                title="Email"
                description={messDetails.mess.email}
                left={props => <List.Icon {...props} icon="email" />}
              />
            )}
            <List.Item
              title="Delivery Radius"
              description={`${messDetails.mess.delivery_radius} km`}
              left={props => <List.Icon {...props} icon="map-marker-radius" />}
            />
          </Card.Content>
        </Card>

        {/* Operating Hours */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              Operating Hours
            </Text>
            <Divider style={styles.divider} />
            
            <List.Item
              title="Hours"
              description={formatOperatingHours(messDetails.mess.operating_hours)}
              left={props => <List.Icon {...props} icon="clock" />}
            />
            <List.Item
              title="Days"
              description={formatDays(messDetails.mess.operating_hours?.days)}
              left={props => <List.Icon {...props} icon="calendar-week" />}
            />
          </Card.Content>
        </Card>

        {/* Weekly Menu View */}
        {showMenuView && (
          <Card style={styles.sectionCard}>
            <Card.Content>
              <View style={styles.menuHeader}>
                <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                  Weekly Menu
                </Text>
                <Button 
                  mode="text" 
                  onPress={() => setShowMenuView(false)}
                  icon="close"
                >
                  Close
                </Button>
              </View>
              <Divider style={styles.divider} />
              
              {messDetails.weeklyMenu ? (
                <View style={styles.menuTable}>
                  {/* Table Header */}
                  <View style={styles.tableHeader}>
                    <View style={styles.dayColumn}>
                      <Text style={[styles.headerText, { color: theme.colors.onSurface }]}>
                        Day
                      </Text>
                    </View>
                    {MEALS.map((meal) => (
                      <View key={meal} style={styles.mealColumn}>
                        <Text style={[styles.headerText, { color: theme.colors.onSurface }]}>
                          {getMealDisplayName(meal)}
                        </Text>
                      </View>
                    ))}
                  </View>
                  
                  {/* Table Rows */}
                  {DAYS.map((day) => (
                    <View key={day} style={styles.tableRow}>
                      <View style={styles.dayColumn}>
                        <Text style={[styles.dayText, { color: theme.colors.onSurface }]}>
                          {getDayDisplayName(day)}
                        </Text>
                      </View>
                      {MEALS.map((meal) => {
                        const fieldName = `${day}_${meal}_items` as keyof WeeklyMenu;
                        const items = messDetails.weeklyMenu?.[fieldName] as string[] || [];
                        return (
                          <View key={meal} style={styles.mealColumn}>
                            {items.length > 0 ? (
                              <View style={styles.menuItems}>
                                {items.map((item, index) => (
                                  <Text key={index} style={[styles.menuItem, { color: theme.colors.onSurfaceVariant }]}>
                                    • {item}
                                  </Text>
                                ))}
                              </View>
                            ) : (
                              <Text style={[styles.emptyMeal, { color: theme.colors.onSurfaceVariant }]}>
                                No items
                              </Text>
                            )}
                          </View>
                        );
                      })}
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={[styles.emptyMenu, { color: theme.colors.onSurfaceVariant }]}>
                  No weekly menu available for this mess.
                </Text>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Recent Reviews */}
        {messDetails.ratings.length > 0 && (
          <Card style={styles.sectionCard}>
            <Card.Content>
              <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                Customer Reviews
              </Text>
              <Divider style={styles.divider} />
              
              {messDetails.ratings.slice(0, 5).map((rating) => (
                <List.Item
                  key={rating.id}
                  title={rating.users.full_name}
                  description={rating.review || 'No review text'}
                  left={props => <List.Icon {...props} icon="star" />}
                  right={() => (
                    <View style={styles.reviewRatingContainer}>
                      <Text style={[styles.reviewRatingText, { color: theme.colors.warning }]}>
                        ⭐ {rating.rating}
                      </Text>
                      <Text style={[styles.ratingDate, { color: theme.colors.onSurfaceVariant }]}>
                        {new Date(rating.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                  )}
                />
              ))}
            </Card.Content>
          </Card>
        )}

        {/* Owner Information */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              Mess Owner
            </Text>
            <Divider style={styles.divider} />
            
            <List.Item
              title="Owner Name"
              description={messDetails.mess.users.full_name}
              left={props => <List.Icon {...props} icon="account" />}
            />
            <List.Item
              title="Owner Since"
              description={new Date(messDetails.mess.users.created_at).toLocaleDateString()}
              left={props => <List.Icon {...props} icon="calendar" />}
            />
          </Card.Content>
        </Card>
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
    marginBottom: 15,
  },
  header: {
    flexDirection: 'row',
    marginBottom: 24,
    paddingTop: 20,
  },
  messAvatar: {
    marginRight: 16,
  },
  headerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  address: {
    fontSize: 14,
    marginBottom: 4,
  },
  distance: {
    fontSize: 12,
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 4,
  },
  ratingCount: {
    fontSize: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  adminActionButtons: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 12,
  },
  adminActionButton: {
    flex: 1,
  },
  sectionCard: {
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  divider: {
    marginBottom: 16,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  reviewRatingContainer: {
    alignItems: 'flex-end',
  },
  reviewRatingText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  ratingDate: {
    fontSize: 12,
  },
  errorText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 50,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  menuTable: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#e0e0e0',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  dayColumn: {
    flex: 1,
    alignItems: 'center',
  },
  mealColumn: {
    flex: 1,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 14,
    textAlign: 'center',
    color: '#000000',
    fontWeight: 'bold',
  },
  dayText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  menuItems: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  menuItem: {
    fontSize: 13,
    marginBottom: 2,
  },
  emptyMeal: {
    fontSize: 13,
    marginTop: 4,
  },
  emptyMenu: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 10,
  },
}); 