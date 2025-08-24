import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Card, Avatar, Chip, Button } from 'react-native-paper';
import { useTheme } from '../../contexts/ThemeContext';
import { Database } from '../../types/database';
import { LocationService } from '../../services/LocationService';

type Mess = Database['public']['Tables']['messes']['Row'];

interface MessCardProps {
  mess: Mess;
  userLocation?: { latitude: number; longitude: number };
  onPress: () => void;
  onSubscribe: () => void;
}

export default function MessCard({ mess, userLocation, onPress, onSubscribe }: MessCardProps) {
  const { theme } = useTheme();

  const distance = userLocation ? LocationService.calculateDistance(
    userLocation.latitude,
    userLocation.longitude,
    mess.location.latitude,
    mess.location.longitude
  ) : null;

  return (
    <TouchableOpacity onPress={onPress}>
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <View style={styles.header}>
            <Avatar.Image
              size={48}
              source={{ uri: mess.images[0] || 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg' }}
            />
            <View style={styles.headerText}>
              <Text style={[styles.name, { color: theme.colors.onSurface }]}>
                {mess.name}
              </Text>
              <Text style={[styles.address, { color: theme.colors.onSurfaceVariant }]}>
                {mess.address}
              </Text>
              {distance && (
                <Text style={[styles.distance, { color: theme.colors.primary }]}>
                  {distance.toFixed(1)} km away
                </Text>
              )}
            </View>
            <View style={styles.rating}>
              <Text style={[styles.ratingText, { color: theme.colors.onSurface }]}>
                ⭐ {mess.rating_average.toFixed(1)}
              </Text>
              <Text style={[styles.ratingCount, { color: theme.colors.onSurfaceVariant }]}>
                ({mess.rating_count})
              </Text>
            </View>
          </View>

          <Text style={[styles.description, { color: theme.colors.onSurfaceVariant }]}>
            {mess.description}
          </Text>

          <View style={styles.tags}>
            <Chip size="small" style={styles.chip}>
              {mess.operating_hours.days.join(', ')}
            </Chip>
            <Chip size="small" style={styles.chip}>
              {mess.operating_hours.open_time} - {mess.operating_hours.close_time}
            </Chip>
            <Chip size="small" style={styles.chip}>
              {mess.delivery_radius} km radius
            </Chip>
            </View>
            <View style={styles.actions}>
            <Button mode="contained" onPress={onSubscribe} buttonColor="light-green-200">
              Subscribe
            </Button>
          </View>

        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: 8,
    elevation: 2,
    borderRadius: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerText: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  address: {
    fontSize: 14,
    marginBottom: 2,
  },
  distance: {
    fontSize: 12,
    fontWeight: '500',
  },
  rating: {
    alignItems: 'flex-end',
  },
  ratingText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  ratingCount: {
    fontSize: 12,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  chip: {
    marginRight: 8,
    marginBottom: 4,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
});