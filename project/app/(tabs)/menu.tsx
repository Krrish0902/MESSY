import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, FAB, Dialog, Portal, TextInput, SegmentedButtons, Chip } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';
import { Database } from '../../types/database';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';

type Menu = Database['public']['Tables']['menus']['Row'];

export default function MenuTab() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    meal_type: 'breakfast' as 'breakfast' | 'lunch' | 'dinner',
    items: [{ name: '', description: '', is_veg: true }],
    price: '',
  });

  useEffect(() => {
    if (user?.role === 'mess_owner') {
      fetchMenus();
    }
  }, [user]);

  const fetchMenus = async () => {
    try {
      // First get the user's mess
      const { data: messes } = await supabase
        .from('messes')
        .select('id')
        .eq('owner_id', user?.id)
        .eq('status', 'approved');

      if (messes && messes.length > 0) {
        const messId = messes[0].id;
        
        const { data, error } = await supabase
          .from('menus')
          .select('*')
          .eq('mess_id', messId)
          .order('date', { ascending: false })
          .order('meal_type', { ascending: true });

        if (error) throw error;
        setMenus(data || []);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMenu = async () => {
    if (!formData.items[0].name || !formData.price) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setCreating(true);
    try {
      // Get the user's mess
      const { data: messes } = await supabase
        .from('messes')
        .select('id')
        .eq('owner_id', user?.id)
        .eq('status', 'approved');

      if (!messes || messes.length === 0) {
        throw new Error('No approved mess found for this user');
      }

      const menuData = {
        mess_id: messes[0].id,
        date: formData.date,
        meal_type: formData.meal_type,
        items: formData.items,
        price: parseFloat(formData.price),
        is_available: true,
      };

      const { error } = await supabase
        .from('menus')
        .insert(menuData);

      if (error) throw error;

      Alert.alert('Success', 'Menu created successfully!');
      setShowCreateDialog(false);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        meal_type: 'breakfast',
        items: [{ name: '', description: '', is_veg: true }],
        price: '',
      });
      fetchMenus();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setCreating(false);
    }
  };

  const addMenuItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { name: '', description: '', is_veg: true }]
    }));
  };

  const removeMenuItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateMenuItem = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const getMealTypeColor = (mealType: string) => {
    switch (mealType) {
      case 'breakfast': return theme.colors.primary;
      case 'lunch': return theme.colors.secondary;
      case 'dinner': return theme.colors.tertiary;
      default: return theme.colors.onSurfaceVariant;
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading menus..." />;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.onBackground }]}>
            Menu Management
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
            Create and manage daily menus
          </Text>
        </View>

        {error && (
          <ErrorMessage message={error} onRetry={fetchMenus} />
        )}

        {menus.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
                No menus created yet
              </Text>
              <Text style={[styles.emptySubtext, { color: theme.colors.onSurfaceVariant }]}>
                Create your first menu to start serving customers
              </Text>
            </Card.Content>
          </Card>
        ) : (
          menus.map((menu) => (
            <Card key={menu.id} style={styles.menuCard}>
              <Card.Content>
                <View style={styles.menuHeader}>
                  <View style={styles.menuInfo}>
                    <Text style={[styles.menuDate, { color: theme.colors.onSurface }]}>
                      {new Date(menu.date).toLocaleDateString()}
                    </Text>
                                                              <Chip 
                       mode="outlined"
                     >
                       {menu.meal_type.toUpperCase()}
                     </Chip>
                   </View>
                   <View style={styles.menuStatus}>
                     <Chip 
                       mode={menu.is_available ? "flat" : "outlined"}
                     >
                       {menu.is_available ? 'Available' : 'Unavailable'}
                     </Chip>
                    <Text style={[styles.menuPrice, { color: theme.colors.primary }]}>
                      ₹{menu.price}
                    </Text>
                  </View>
                </View>

                <View style={styles.menuItems}>
                  {menu.items.map((item, index) => (
                    <View key={index} style={styles.menuItem}>
                      <Text style={[styles.itemName, { color: theme.colors.onSurface }]}>
                        {item.name}
                      </Text>
                      {item.description && (
                        <Text style={[styles.itemDescription, { color: theme.colors.onSurfaceVariant }]}>
                          {item.description}
                        </Text>
                      )}
                                             <Chip mode="outlined">
                         {item.is_veg ? 'Vegetarian' : 'Non-vegetarian'}
                       </Chip>
                    </View>
                  ))}
                </View>

                <View style={styles.menuActions}>
                  <Button mode="outlined" style={styles.actionButton}>
                    Edit
                  </Button>
                  <Button mode="outlined" style={styles.actionButton}>
                    {menu.is_available ? 'Make Unavailable' : 'Make Available'}
                  </Button>
                </View>
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => setShowCreateDialog(true)}
      />

      {/* Create Menu Dialog */}
      <Portal>
        <Dialog visible={showCreateDialog} onDismiss={() => setShowCreateDialog(false)}>
          <Dialog.Title>Create New Menu</Dialog.Title>
          <Dialog.Content>
            <ScrollView>
              <TextInput
                label="Date"
                value={formData.date}
                onChangeText={(text) => setFormData({ ...formData, date: text })}
                style={styles.input}
              />
              
              <SegmentedButtons
                value={formData.meal_type}
                onValueChange={(value) => setFormData({ ...formData, meal_type: value as any })}
                buttons={[
                  { value: 'breakfast', label: 'Breakfast' },
                  { value: 'lunch', label: 'Lunch' },
                  { value: 'dinner', label: 'Dinner' },
                ]}
                style={styles.mealTypeSelector}
              />

              <TextInput
                label="Price (₹)"
                value={formData.price}
                onChangeText={(text) => setFormData({ ...formData, price: text })}
                keyboardType="numeric"
                style={styles.input}
              />

              <Text style={styles.sectionTitle}>Menu Items</Text>
              
              {formData.items.map((item, index) => (
                <Card key={index} style={styles.itemCard}>
                  <Card.Content>
                    <TextInput
                      label="Item Name *"
                      value={item.name}
                      onChangeText={(text) => updateMenuItem(index, 'name', text)}
                      style={styles.input}
                    />
                    <TextInput
                      label="Description"
                      value={item.description}
                      onChangeText={(text) => updateMenuItem(index, 'description', text)}
                      multiline
                      numberOfLines={2}
                      style={styles.input}
                    />
                    <View style={styles.itemOptions}>
                      <SegmentedButtons
                        value={item.is_veg ? 'veg' : 'non-veg'}
                        onValueChange={(value) => updateMenuItem(index, 'is_veg', value === 'veg')}
                        buttons={[
                          { value: 'veg', label: 'Vegetarian' },
                          { value: 'non-veg', label: 'Non-veg' },
                        ]}
                        style={styles.vegSelector}
                      />
                      <Button 
                        mode="outlined" 
                        onPress={() => removeMenuItem(index)}
                        style={styles.removeButton}
                      >
                        Remove
                      </Button>
                    </View>
                  </Card.Content>
                </Card>
              ))}

              <Button 
                mode="outlined" 
                onPress={addMenuItem}
                style={styles.addButton}
              >
                Add Menu Item
              </Button>
            </ScrollView>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button 
              mode="contained" 
              onPress={handleCreateMenu}
              loading={creating}
              disabled={creating}
            >
              Create Menu
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
  menuCard: {
    marginBottom: 16,
    elevation: 2,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  menuInfo: {
    flex: 1,
  },
  menuDate: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  menuStatus: {
    alignItems: 'flex-end',
  },
  menuPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4,
  },
  menuItems: {
    marginBottom: 16,
  },
  menuItem: {
    marginBottom: 8,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  itemDescription: {
    fontSize: 14,
    marginBottom: 4,
  },
  menuActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  input: {
    marginBottom: 16,
  },
  mealTypeSelector: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  itemCard: {
    marginBottom: 12,
  },
  itemOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vegSelector: {
    flex: 1,
  },
  removeButton: {
    marginLeft: 8,
  },
  addButton: {
    marginTop: 8,
  },
}); 