import React, { useMemo } from 'react';
import { Tabs } from 'expo-router';
import { Chrome as Home, Search, Calendar, User, Settings } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

export default function TabLayout() {
  const { theme } = useTheme();
  const { user } = useAuth();

  // Memoize the valid screens for the current user role
  const validScreens = useMemo(() => {
    if (!user) return [];
    
    const screensByRole = {
      customer: ['home', 'discover', 'subscriptions', 'messages', 'profile'],
      mess_owner: ['dashboard', 'menu', 'subscribers', 'messages', 'profile'],
      admin: ['overview', 'messes', 'settings'],
    };

    return screensByRole[user.role as keyof typeof screensByRole] || screensByRole.customer;
  }, [user]);

  const isValidScreen = (screenName: string) => {
    return validScreens.includes(screenName);
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outline,
        },
        headerShown: false,
      }}
    >
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
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ size, color }) => <User size={size} color={color} />,
          href: isValidScreen('messages') ? '/(tabs)/messages' : null,
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
        name="subscribers"
        options={{
          title: 'Subscribers',
          tabBarIcon: ({ size, color }) => <User size={size} color={color} />,
          href: isValidScreen('subscribers') ? '/(tabs)/subscribers' : null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ size, color }) => <Settings size={size} color={color} />,
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