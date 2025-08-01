import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Chrome as Home, Search, Calendar, User, Settings } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter, usePathname } from 'expo-router';

export default function CustomTabBar() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Define tabs for each role
  const customerTabs = [
    { name: 'home', title: 'Home', icon: Home, path: '/(tabs)/home' },
    { name: 'discover', title: 'Discovery', icon: Search, path: '/(tabs)/discover' },
    { name: 'subscriptions', title: 'My Plans', icon: Calendar, path: '/(tabs)/subscriptions' },
    { name: 'messages', title: 'Messages', icon: User, path: '/(tabs)/messages' },
  ];

  const messOwnerTabs = [
    { name: 'dashboard', title: 'My Messes', icon: Home, path: '/(tabs)/dashboard' },
    { name: 'menu', title: 'Menu', icon: Calendar, path: '/(tabs)/menu' },
    { name: 'subscribers', title: 'Subscribers', icon: User, path: '/(tabs)/subscribers' },
    { name: 'messages', title: 'Messages', icon: User, path: '/(tabs)/messages' },
    { name: 'profile', title: 'Profile', icon: Settings, path: '/(tabs)/profile' },
  ];

  const adminTabs = [
    { name: 'overview', title: 'Overview', icon: Home, path: '/(tabs)/overview' },
    { name: 'messes', title: 'Approval', icon: Search, path: '/(tabs)/messes' },
    { name: 'settings', title: 'Settings', icon: Settings, path: '/(tabs)/settings' },
  ];

  // Get the appropriate tabs based on user role
  const getTabsForRole = () => {
    switch (user?.role) {
      case 'customer':
        return customerTabs;
      case 'mess_owner':
        return messOwnerTabs;
      case 'admin':
        return adminTabs;
      default:
        return customerTabs; // Default to customer tabs
    }
  };

  const tabs = getTabsForRole();

  const handleTabPress = (path: string) => {
    router.push(path as any);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      {tabs.map((tab) => {
        const isActive = pathname === tab.path;
        return (
          <TouchableOpacity
            key={tab.name}
            style={styles.tab}
            onPress={() => handleTabPress(tab.path)}
          >
            <tab.icon
              size={24}
              color={isActive ? theme.colors.primary : theme.colors.onSurfaceVariant}
            />
            <Text
              style={[
                styles.tabText,
                {
                  color: isActive ? theme.colors.primary : theme.colors.onSurfaceVariant,
                },
              ]}
            >
              {tab.title}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 60,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabText: {
    fontSize: 12,
    marginTop: 2,
  },
}); 