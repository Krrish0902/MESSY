import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, List, Switch, Divider, Avatar, Chip } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function ProfileTab() {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    notifications: true,
    emailUpdates: true,
    pushNotifications: true,
  });

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await signOut();
            } catch (error) {
              console.error('Sign out error:', error);
            } finally {
              setLoading(false);
            }
          }
        },
      ]
    );
  };

  if (loading) {
    return <LoadingSpinner message="Signing out..." />;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.onBackground }]}>
            Profile
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
            Manage your account settings
          </Text>
        </View>

        {/* Profile Info */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <View style={styles.profileHeader}>
              <Avatar.Text 
                size={80} 
                label={user?.full_name?.charAt(0) || 'U'} 
                style={{ backgroundColor: theme.colors.primary }}
              />
              <View style={styles.profileInfo}>
                <Text style={[styles.profileName, { color: theme.colors.onSurface }]}>
                  {user?.full_name}
                </Text>
                <Text style={[styles.profileEmail, { color: theme.colors.onSurfaceVariant }]}>
                  {user?.email}
                </Text>
                <Chip 
                  mode="outlined"
                  style={{ marginTop: 8 }}
                >
                  {user?.role}
                </Chip>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Account Settings */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              Account Settings
            </Text>
            
            <List.Item
              title="Edit Profile"
              description="Update your personal information"
              left={(props) => <List.Icon {...props} icon="account-edit" />}
              onPress={() => Alert.alert('Edit Profile', 'Profile editing coming soon')}
            />
            
            <List.Item
              title="Change Password"
              description="Update your account password"
              left={(props) => <List.Icon {...props} icon="lock" />}
              onPress={() => Alert.alert('Change Password', 'Password change coming soon')}
            />
            
            <List.Item
              title="Phone Number"
              description={user?.phone || 'Not set'}
              left={(props) => <List.Icon {...props} icon="phone" />}
              onPress={() => Alert.alert('Phone Number', 'Phone number editing coming soon')}
            />
            
            <List.Item
              title="Dark Theme"
              description="Toggle between light and dark mode"
              left={(props) => <List.Icon {...props} icon="theme-light-dark" />}
              right={() => (
                <Switch
                  value={theme.dark}
                  onValueChange={toggleTheme}
                />
              )}
            />
          </Card.Content>
        </Card>

        {/* Notification Settings */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              Notifications
            </Text>
            
            <List.Item
              title="Push Notifications"
              description="Receive notifications on your device"
              left={(props) => <List.Icon {...props} icon="bell" />}
              right={() => (
                <Switch
                  value={settings.pushNotifications}
                  onValueChange={(value) => 
                    setSettings(prev => ({ ...prev, pushNotifications: value }))
                  }
                />
              )}
            />
            
            <List.Item
              title="Email Updates"
              description="Receive updates via email"
              left={(props) => <List.Icon {...props} icon="email" />}
              right={() => (
                <Switch
                  value={settings.emailUpdates}
                  onValueChange={(value) => 
                    setSettings(prev => ({ ...prev, emailUpdates: value }))
                  }
                />
              )}
            />
            
            <List.Item
              title="In-App Notifications"
              description="Show notifications within the app"
              left={(props) => <List.Icon {...props} icon="message" />}
              right={() => (
                <Switch
                  value={settings.notifications}
                  onValueChange={(value) => 
                    setSettings(prev => ({ ...prev, notifications: value }))
                  }
                />
              )}
            />
          </Card.Content>
        </Card>

        {/* Business Settings */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              Business Settings
            </Text>
            
            <List.Item
              title="Mess Information"
              description="Update your mess details"
              left={(props) => <List.Icon {...props} icon="store" />}
              onPress={() => Alert.alert('Mess Info', 'Mess information editing coming soon')}
            />
            
            <List.Item
              title="Operating Hours"
              description="Set your business hours"
              left={(props) => <List.Icon {...props} icon="clock" />}
              onPress={() => Alert.alert('Hours', 'Operating hours editing coming soon')}
            />
            
            <List.Item
              title="Delivery Settings"
              description="Configure delivery options"
              left={(props) => <List.Icon {...props} icon="truck" />}
              onPress={() => Alert.alert('Delivery', 'Delivery settings coming soon')}
            />
          </Card.Content>
        </Card>

        {/* Support & Help */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              Support & Help
            </Text>
            
            <List.Item
              title="Help Center"
              description="Get help and support"
              left={(props) => <List.Icon {...props} icon="help-circle" />}
              onPress={() => Alert.alert('Help', 'Help center coming soon')}
            />
            
            <List.Item
              title="Contact Support"
              description="Get in touch with our team"
              left={(props) => <List.Icon {...props} icon="headset" />}
              onPress={() => Alert.alert('Support', 'Contact support coming soon')}
            />
            
            <List.Item
              title="About MESSY"
              description="Learn more about the app"
              left={(props) => <List.Icon {...props} icon="information" />}
              onPress={() => Alert.alert('About', 'About MESSY coming soon')}
            />
          </Card.Content>
        </Card>

        {/* Sign Out */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <List.Item
              title="Sign Out"
              description="Sign out of your account"
              left={(props) => <List.Icon {...props} icon="logout" color={theme.colors.error} />}
              onPress={handleSignOut}
              titleStyle={{ color: theme.colors.error }}
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
  },
  header: {
    marginBottom: 24,
    marginTop: 26,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  sectionCard: {
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    marginBottom: 8,
  },
});