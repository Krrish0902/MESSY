import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, List, Switch, Divider, Avatar, Chip, Modal, Portal, TextInput, HelperText } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';
import LoadingSpinner from '../../components/common/LoadingSpinner';

interface ProfileFormData {
  full_name: string;
  email: string;
  phone: string;
}

export default function ProfileTab() {
  const { user, signOut, updateProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState<ProfileFormData>({
    full_name: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });
  const [formErrors, setFormErrors] = useState<Partial<ProfileFormData>>({});
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

  const handleEditProfile = () => {
    console.log('Opening edit profile modal');
    setProfileForm({
      full_name: user?.full_name || '',
      email: user?.email || '',
      phone: user?.phone || '',
    });
    setFormErrors({});
    setEditingProfile(true);
    console.log('Modal state set to:', true);
  };

  const validateForm = (): boolean => {
    const errors: Partial<ProfileFormData> = {};

    if (!profileForm.full_name.trim()) {
      errors.full_name = 'Full name is required';
    } else if (profileForm.full_name.trim().length < 2) {
      errors.full_name = 'Full name must be at least 2 characters';
    }

    if (!profileForm.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(profileForm.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (profileForm.phone && !/^[\+]?[1-9][\d]{0,15}$/.test(profileForm.phone.replace(/\s/g, ''))) {
      errors.phone = 'Please enter a valid phone number';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveProfile = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await updateProfile({
        full_name: profileForm.full_name.trim(),
        email: profileForm.email.trim(),
        phone: profileForm.phone.trim() || undefined,
        updated_at: new Date().toISOString(),
      });
      
      setEditingProfile(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error: any) {
      console.error('Profile update error:', error);
      Alert.alert('Error', error.message || 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingProfile(false);
    setFormErrors({});
  };

  if (loading) {
    return <LoadingSpinner message="Loading..." />;
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
              onPress={handleEditProfile}
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
              onPress={handleEditProfile}
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

      {/* Profile Edit Modal */}
      <Portal>
        <Modal
          visible={editingProfile}
          onDismiss={handleCancelEdit}
          contentContainerStyle={[
            styles.modalContainer, 
            { 
              backgroundColor: theme.colors.surface,
              shadowColor: theme.colors.onSurface,
            }
          ]}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
                Edit Profile
              </Text>
              <Button
                mode="text"
                onPress={handleCancelEdit}
                icon="close"
                compact
                theme={theme}
              >
                Close
              </Button>
            </View>

            <Divider style={[styles.divider, { backgroundColor: theme.colors.outline }]} />

            <View style={styles.formContainer}>
              <TextInput
                label="Full Name"
                value={profileForm.full_name}
                onChangeText={(text) => setProfileForm(prev => ({ ...prev, full_name: text }))}
                mode="outlined"
                style={styles.input}
                error={!!formErrors.full_name}
                disabled={loading}
                theme={theme}
              />
              {formErrors.full_name && (
                <HelperText type="error" visible={!!formErrors.full_name}>
                  {formErrors.full_name}
                </HelperText>
              )}

              <TextInput
                label="Email"
                value={profileForm.email}
                onChangeText={(text) => setProfileForm(prev => ({ ...prev, email: text }))}
                mode="outlined"
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
                error={!!formErrors.email}
                disabled={loading}
                theme={theme}
              />
              {formErrors.email && (
                <HelperText type="error" visible={!!formErrors.email}>
                  {formErrors.email}
                </HelperText>
              )}

              <TextInput
                label="Phone Number (Optional)"
                value={profileForm.phone}
                onChangeText={(text) => setProfileForm(prev => ({ ...prev, phone: text }))}
                mode="outlined"
                style={styles.input}
                keyboardType="phone-pad"
                error={!!formErrors.phone}
                disabled={loading}
                theme={theme}
              />
              {formErrors.phone && (
                <HelperText type="error" visible={!!formErrors.phone}>
                  {formErrors.phone}
                </HelperText>
              )}

              <View style={styles.modalActions}>
                <Button
                  mode="outlined"
                  onPress={handleCancelEdit}
                  style={styles.modalButton}
                  disabled={loading}
                  theme={theme}
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={handleSaveProfile}
                  style={styles.modalButton}
                  loading={loading}
                  disabled={loading}
                  theme={theme}
                >
                  Save Changes
                </Button>
              </View>
            </View>
          </View>
        </Modal>
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
  modalContainer: {
    margin: 20,
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
    alignSelf: 'center',
    minHeight: 400,
    elevation: 5,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalContent: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    marginBottom: 15,
  },
  formContainer: {
    marginTop: 10,
  },
  input: {
    marginBottom: 10,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    gap: 10,
  },
  modalButton: {
    flex: 1,
  },
});