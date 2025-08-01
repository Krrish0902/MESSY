import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Searchbar, Button, Chip } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';
import { Database } from '../../types/database';
import { LocationService } from '../../services/LocationService';
import MessCard from '../../components/customer/MessCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';

type Mess = Database['public']['Tables']['messes']['Row'];

export default function DiscoverTab() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [messes, setMesses] = useState<Mess[]>([]);
  const [filteredMesses, setFilteredMesses] = useState<Mess[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMesses();
    getCurrentLocation();
  }, []);

  useEffect(() => {
    filterMesses();
  }, [messes, searchQuery, selectedFilter, userLocation]);

  const fetchMesses = async () => {
    try {
      const { data, error } = await supabase
        .from('messes')
        .select('*')
        .eq('status', 'approved')
        .order('rating_average', { ascending: false });

      if (error) throw error;
      setMesses(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = async () => {
    const location = await LocationService.getCurrentLocation();
    if (location) {
      setUserLocation({
        latitude: location.latitude,
        longitude: location.longitude,
      });
    }
  };

  const filterMesses = () => {
    let filtered = messes;

    // Text search
    if (searchQuery) {
      filtered = filtered.filter(mess =>
        mess.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mess.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mess.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Distance filter
    if (selectedFilter !== 'all' && userLocation) {
      const maxDistance = parseInt(selectedFilter);
      filtered = filtered.filter(mess => {
        const distance = LocationService.calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          mess.location.latitude,
          mess.location.longitude
        );
        return distance <= maxDistance;
      });
    }

    // Sort by distance if location is available
    if (userLocation) {
      filtered.sort((a, b) => {
        const distanceA = LocationService.calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          a.location.latitude,
          a.location.longitude
        );
        const distanceB = LocationService.calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          b.location.latitude,
          b.location.longitude
        );
        return distanceA - distanceB;
      });
    }

    setFilteredMesses(filtered);
  };

  const handleMessPress = (mess: Mess) => {
    // Navigate to mess details
    console.log('Navigate to mess details:', mess.id);
  };

  const handleSubscribe = (mess: Mess) => {
    // Navigate to subscription flow
    console.log('Navigate to subscription for mess:', mess.id);
  };

  if (loading) {
    return <LoadingSpinner message="Finding messes near you..." />;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Searchbar
          placeholder="Search messes..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
        
        <View style={styles.filters}>
          <Chip
            selected={selectedFilter === 'all'}
            onPress={() => setSelectedFilter('all')}
            style={styles.filterChip}
          >
            All
          </Chip>
          <Chip
            selected={selectedFilter === '2'}
            onPress={() => setSelectedFilter('2')}
            style={styles.filterChip}
          >
            Within 2km
          </Chip>
          <Chip
            selected={selectedFilter === '5'}
            onPress={() => setSelectedFilter('5')}
            style={styles.filterChip}
          >
            Within 5km
          </Chip>
          <Chip
            selected={selectedFilter === '10'}
            onPress={() => setSelectedFilter('10')}
            style={styles.filterChip}
          >
            Within 10km
          </Chip>
        </View>
      </View>

      {error && (
        <ErrorMessage message={error} onRetry={fetchMesses} />
      )}

      <FlatList
        data={filteredMesses}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MessCard
            mess={item}
            userLocation={userLocation}
            onPress={() => handleMessPress(item)}
            onSubscribe={() => handleSubscribe(item)}
          />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  searchbar: {
    marginBottom: 16,
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  list: {
    paddingBottom: 16,
  },
});