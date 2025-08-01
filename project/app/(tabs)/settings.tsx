import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, Switch, List, Divider, Dialog, Portal, TextInput } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function SettingsTab() {
  const { user, signOut } = useAuth();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [showSystemDialog, setShowSystemDialog] = useState(false);
  const [systemSettings, setSystemSettings] = useState({
    autoApproveMesses: false,
    requireMessApproval: true,
    maxDeliveryRadius: '10',
    defaultMessCommission: '15',
    systemMaintenance: false,
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

  const handleSystemSettingsUpdate = () => {
    Alert.alert('Success', 'System settings updated successfully');
    setShowSystemDialog(false);
  };

  const handleDatabaseBackup = () => {
    setLoading(true);
    // Simulate backup process
    setTimeout(() => {
      Alert.alert('Success', 'Database backup completed successfully');
      setLoading(false);
    }, 2000);
  };

  const handleSystemMaintenance = () => {
    Alert.alert(
      'System Maintenance',
      'This will put the system in maintenance mode. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Enable Maintenance', 
          style: 'destructive',
          onPress: () => {
            setSystemSettings(prev => ({ ...prev, systemMaintenance: true }));
            Alert.alert('Maintenance Mode', 'System is now in maintenance mode');
          }
        },
      ]
    );
  };

  if (loading) {
    return <LoadingSpinner message="Processing..." />;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.onBackground }]}>
            System Settings
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
            Configure system parameters and manage admin functions
          </Text>
        </View>

        {/* System Configuration */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              System Configuration
            </Text>
            
            <List.Item
              title="Auto-approve new messes"
              description="Automatically approve mess registrations without manual review"
              left={(props) => <List.Icon {...props} icon="check-circle" />}
              right={() => (
                <Switch
                  value={systemSettings.autoApproveMesses}
                  onValueChange={(value) => 
                    setSystemSettings(prev => ({ ...prev, autoApproveMesses: value }))
                  }
                />
              )}
            />
            
            <List.Item
              title="Require mess approval"
              description="Require admin approval for all new mess registrations"
              left={(props) => <List.Icon {...props} icon="shield-check" />}
              right={() => (
                <Switch
                  value={systemSettings.requireMessApproval}
                  onValueChange={(value) => 
                    setSystemSettings(prev => ({ ...prev, requireMessApproval: value }))
                  }
                />
              )}
            />
            
            <List.Item
              title="System maintenance mode"
              description="Put system in maintenance mode (restricts user access)"
              left={(props) => <List.Icon {...props} icon="wrench" />}
              right={() => (
                <Switch
                  value={systemSettings.systemMaintenance}
                  onValueChange={handleSystemMaintenance}
                />
              )}
            />
          </Card.Content>
        </Card>

        {/* Business Rules */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              Business Rules
            </Text>
            
            <List.Item
              title="Maximum delivery radius"
              description={`${systemSettings.maxDeliveryRadius} km`}
              left={(props) => <List.Icon {...props} icon="map-marker-radius" />}
              onPress={() => setShowSystemDialog(true)}
            />
            
            <List.Item
              title="Default mess commission"
              description={`${systemSettings.defaultMessCommission}%`}
              left={(props) => <List.Icon {...props} icon="percent" />}
              onPress={() => setShowSystemDialog(true)}
            />
          </Card.Content>
        </Card>

        {/* System Operations */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              System Operations
            </Text>
            
            <List.Item
              title="Database backup"
              description="Create a backup of the current database"
              left={(props) => <List.Icon {...props} icon="database" />}
              onPress={handleDatabaseBackup}
            />
            
            <List.Item
              title="System logs"
              description="View system activity and error logs"
              left={(props) => <List.Icon {...props} icon="file-document" />}
              onPress={() => Alert.alert('Logs', 'System logs feature coming soon')}
            />
            
            <List.Item
              title="Performance metrics"
              description="View system performance and usage statistics"
              left={(props) => <List.Icon {...props} icon="chart-line" />}
              onPress={() => Alert.alert('Metrics', 'Performance metrics feature coming soon')}
            />
          </Card.Content>
        </Card>

        {/* Admin Account */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              Admin Account
            </Text>
            
            <List.Item
              title="Profile information"
              description={`${user?.full_name} (${user?.email})`}
              left={(props) => <List.Icon {...props} icon="account" />}
              onPress={() => Alert.alert('Profile', 'Profile management coming soon')}
            />
            
            <List.Item
              title="Change password"
              description="Update your admin password"
              left={(props) => <List.Icon {...props} icon="lock" />}
              onPress={() => Alert.alert('Password', 'Password change feature coming soon')}
            />
            
            <Divider style={styles.divider} />
            
            <List.Item
              title="Sign out"
              description="Sign out of the admin panel"
              left={(props) => <List.Icon {...props} icon="logout" color={theme.colors.error} />}
              onPress={handleSignOut}
              titleStyle={{ color: theme.colors.error }}
            />
          </Card.Content>
        </Card>

        {/* System Info */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              System Information
            </Text>
            
            <List.Item
              title="App version"
              description="1.0.0"
              left={(props) => <List.Icon {...props} icon="information" />}
            />
            
            <List.Item
              title="Database version"
              description="PostgreSQL 15"
              left={(props) => <List.Icon {...props} icon="database" />}
            />
            
            <List.Item
              title="Last updated"
              description={new Date().toLocaleDateString()}
              left={(props) => <List.Icon {...props} icon="calendar" />}
            />
          </Card.Content>
        </Card>
      </ScrollView>

      {/* System Settings Dialog */}
      <Portal>
        <Dialog visible={showSystemDialog} onDismiss={() => setShowSystemDialog(false)}>
          <Dialog.Title>System Settings</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Maximum delivery radius (km)"
              value={systemSettings.maxDeliveryRadius}
              onChangeText={(text) => setSystemSettings(prev => ({ ...prev, maxDeliveryRadius: text }))}
              keyboardType="numeric"
              style={styles.dialogInput}
            />
            <TextInput
              label="Default mess commission (%)"
              value={systemSettings.defaultMessCommission}
              onChangeText={(text) => setSystemSettings(prev => ({ ...prev, defaultMessCommission: text }))}
              keyboardType="numeric"
              style={styles.dialogInput}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowSystemDialog(false)}>Cancel</Button>
            <Button mode="contained" onPress={handleSystemSettingsUpdate}>
              Save
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
  sectionCard: {
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  divider: {
    marginVertical: 8,
  },
  dialogInput: {
    marginBottom: 16,
  },
}); 