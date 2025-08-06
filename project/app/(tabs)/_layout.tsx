import React from 'react';
import { Tabs } from 'expo-router';
import { Home, Search, Calendar, User, Settings, Bell, Users, Clock } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useRoleBasedNavigation } from '../../hooks/useRoleBasedNavigation';

export default function TabLayout() {
  const { theme } = useTheme();
  const { user, session } = useAuth();
  const { isValidScreen } = useRoleBasedNavigation();

  // Only show tabs if user is authenticated
  if (!user || !session) {
    return null;
  }

  return (
    <Tabs
      screenOptions={{

        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopWidth: 0.5,
          height: 60,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notifications',
          tabBarIcon: ({ size, color }) => <Bell size={size} color={color} />,
          href: isValidScreen('notifications') ? '/(tabs)/notifications' : null,
        }}
      />
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ size, color }) => <Home size={size} color={color} />,
          href: isValidScreen('home') ? '/(tabs)/home' : null,
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: 'Discovery',
          tabBarIcon: ({ size, color }) => <Search size={size} color={color} />,
          href: isValidScreen('discover') ? '/(tabs)/discover' : null,
        }}
      />
      <Tabs.Screen
        name="subscriptions"
        options={{
          title: 'My Plans',
          tabBarIcon: ({ size, color }) => <Calendar size={size} color={color} />,
          href: isValidScreen('subscriptions') ? '/(tabs)/subscriptions' : null,
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'My Messes',
          tabBarIcon: ({ size, color }) => <Home size={size} color={color} />,
          href: isValidScreen('dashboard') ? '/(tabs)/dashboard' : null,
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          title: 'Menu',
          tabBarIcon: ({ size, color }) => <Calendar size={size} color={color} />,
          href: isValidScreen('menu') ? '/(tabs)/menu' : null,
        }}
      />
      <Tabs.Screen
        name="meal-pricing"
        options={{
          title: 'Plans',
          tabBarIcon: ({ size, color }) => <Clock size={size} color={color} />,
          href: isValidScreen('meal-pricing') ? '/(tabs)/meal-pricing' : null,
        }}
      />
      <Tabs.Screen
        name="subscribers"
        options={{
          title: 'Subscribers',
          tabBarIcon: ({ size, color }) => <Users size={size} color={color} />,
          href: isValidScreen('subscribers') ? '/(tabs)/subscribers' : null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ size, color }) => <User size={size} color={color} />,
          href: isValidScreen('profile') ? '/(tabs)/profile' : null,
        }}
      />
      <Tabs.Screen
        name="overview"
        options={{
          title: 'Overview',
          tabBarIcon: ({ size, color }) => <Home size={size} color={color} />,
          href: isValidScreen('overview') ? '/(tabs)/overview' : null,
        }}
      />
      <Tabs.Screen
        name="messes"
        options={{
          title: 'Approval',
          tabBarIcon: ({ size, color }) => <Search size={size} color={color} />,
          href: isValidScreen('messes') ? '/(tabs)/messes' : null,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ size, color }) => <Settings size={size} color={color} />,
          href: isValidScreen('settings') ? '/(tabs)/settings' : null,
        }}
      />
    </Tabs>
  );
}