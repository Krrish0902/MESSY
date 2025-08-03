import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, FAB, Dialog, Portal, TextInput, SegmentedButtons, Chip } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';
import { Database } from '../../types/database';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';

type WeeklyMenu = Database['public']['Tables']['weekly_menu']['Row'];

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
const MEALS = ['breakfast', 'lunch', 'dinner'] as const;

export default function MenuTab() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [weeklyMenu, setWeeklyMenu] = useState<WeeklyMenu | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingDay, setEditingDay] = useState<typeof DAYS[number]>('monday');
  const [editingMeal, setEditingMeal] = useState<typeof MEALS[number]>('breakfast');

  // Form state for editing menu items
  const [editItems, setEditItems] = useState<string[]>(['']);

  useEffect(() => {
    if (user?.role === 'mess_owner') {
      fetchWeeklyMenu();
    }
  }, [user]);

  const fetchWeeklyMenu = async () => {
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
          .from('weekly_menu')
          .select('*')
          .eq('mess_id', messId)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
          throw error;
        }
        
        setWeeklyMenu(data);
      } else {
        setWeeklyMenu(null);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveWeeklyMenu = async () => {
    if (!weeklyMenu) return;

    setSaving(true);
    try {
      // Remove id field if it's empty (for new records)
      const menuToSave = { ...weeklyMenu };
      if (!menuToSave.id || menuToSave.id === '') {
        delete (menuToSave as any).id;
      }

      const { error } = await supabase
        .from('weekly_menu')
        .upsert(menuToSave);

      if (error) throw error;

      Alert.alert('Success', 'Weekly menu saved successfully!');
      setShowEditDialog(false);
      fetchWeeklyMenu();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEditMenu = (day: typeof DAYS[number], meal: typeof MEALS[number]) => {
    setEditingDay(day);
    setEditingMeal(meal);
    
    const fieldName = `${day}_${meal}_items` as keyof WeeklyMenu;
    const currentItems = weeklyMenu?.[fieldName] as string[] || [];
    setEditItems(currentItems.length > 0 ? currentItems : ['']);
    
    setShowEditDialog(true);
  };

  const handleSaveEdit = () => {
    if (!weeklyMenu) return;

    const fieldName = `${editingDay}_${editingMeal}_items` as keyof WeeklyMenu;
    const filteredItems = editItems.filter(item => item.trim() !== '');
    
    setWeeklyMenu({
      ...weeklyMenu,
      [fieldName]: filteredItems
    });
    
    setShowEditDialog(false);
  };

  const addEditItem = () => {
    setEditItems([...editItems, '']);
  };

  const removeEditItem = (index: number) => {
    setEditItems(editItems.filter((_, i) => i !== index));
  };

  const updateEditItem = (index: number, value: string) => {
    setEditItems(editItems.map((item, i) => i === index ? value : item));
  };

  const getMealTypeColor = (mealType: string) => {
    switch (mealType) {
      case 'breakfast': return theme.colors.primary;
      case 'lunch': return theme.colors.secondary;
      case 'dinner': return theme.colors.tertiary;
      default: return theme.colors.onSurfaceVariant;
    }
  };

  const getDayDisplayName = (day: string) => {
    return day.charAt(0).toUpperCase() + day.slice(1);
  };

  const getMealDisplayName = (meal: string) => {
    return meal.charAt(0).toUpperCase() + meal.slice(1);
  };

  const getMenuItems = (day: typeof DAYS[number], meal: typeof MEALS[number]) => {
    if (!weeklyMenu) return [];
    const fieldName = `${day}_${meal}_items` as keyof WeeklyMenu;
    return weeklyMenu[fieldName] as string[] || [];
  };

  if (loading) {
    return <LoadingSpinner message="Loading weekly menu..." />;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.onBackground }]}>
            Weekly Menu
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
            Set your menu for the entire week
          </Text>
        </View>

        {error && (
          <ErrorMessage message={error} onRetry={fetchWeeklyMenu} />
        )}

        {!weeklyMenu ? (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
                No weekly menu created yet
              </Text>
              <Text style={[styles.emptySubtext, { color: theme.colors.onSurfaceVariant }]}>
                Create your weekly menu to start serving customers
              </Text>
              <Button 
                mode="contained" 
                onPress={async () => {
                  try {
                    if (!user?.id) return;
                    const { data: messes } = await supabase
                      .from('messes')
                      .select('id')
                      .eq('owner_id', user?.id)
                      .eq('status', 'approved')
                      .single();
                    
                    if (messes) {
                      const initialMenu: Omit<WeeklyMenu, 'id' | 'created_at' | 'updated_at'> = {
                        mess_id: messes.id,
                        monday_breakfast_items: [],
                        monday_lunch_items: [],
                        monday_dinner_items: [],
                        tuesday_breakfast_items: [],
                        tuesday_lunch_items: [],
                        tuesday_dinner_items: [],
                        wednesday_breakfast_items: [],
                        wednesday_lunch_items: [],
                        wednesday_dinner_items: [],
                        thursday_breakfast_items: [],
                        thursday_lunch_items: [],
                        thursday_dinner_items: [],
                        friday_breakfast_items: [],
                        friday_lunch_items: [],
                        friday_dinner_items: [],
                        saturday_breakfast_items: [],
                        saturday_lunch_items: [],
                        saturday_dinner_items: [],
                        sunday_breakfast_items: [],
                        sunday_lunch_items: [],
                        sunday_dinner_items: [],
                      };
                      setWeeklyMenu(initialMenu as WeeklyMenu);
                    }
                  } catch (err: any) {
                    Alert.alert('Error', err.message);
                  }
                }}
                style={styles.createButton}
              >
                Create Weekly Menu
              </Button>
            </Card.Content>
          </Card>
        ) : (
          <View style={styles.weeklyGrid}>
            {DAYS.map((day) => (
              <Card key={day} style={styles.dayCard}>
                <Card.Content>
                  <Text style={[styles.dayTitle, { color: theme.colors.onSurface }]}>
                    {getDayDisplayName(day)}
                  </Text>
                  
                  {MEALS.map((meal) => {
                    const items = getMenuItems(day, meal);
                    return (
                      <View key={meal} style={styles.mealSection}>
                        <View style={styles.mealHeader}>
                          <Chip 
                            mode="outlined"
                            style={{ backgroundColor: getMealTypeColor(meal) + '20' }}
                            textStyle={{ color: getMealTypeColor(meal) }}
                          >
                            {getMealDisplayName(meal)}
                          </Chip>
                          <Button 
                            mode="text" 
                            onPress={() => handleEditMenu(day, meal)}
                            style={styles.editButton}
                          >
                            Edit
                          </Button>
                        </View>
                        
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
                            No items set
                          </Text>
                        )}
                      </View>
                    );
                  })}
                </Card.Content>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>

      {weeklyMenu && (
        <FAB
          icon="content-save"
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          onPress={handleSaveWeeklyMenu}
        />
      )}

      {/* Edit Menu Dialog */}
      <Portal>
        <Dialog visible={showEditDialog} onDismiss={() => setShowEditDialog(false)}>
          <Dialog.Title>
            Edit {getDayDisplayName(editingDay)} - {getMealDisplayName(editingMeal)}
          </Dialog.Title>
          <Dialog.Content>
            <ScrollView>
              <Text style={styles.sectionTitle}>Menu Items</Text>
              
              {editItems.map((item, index) => (
                <View key={index} style={styles.editItemRow}>
                  <TextInput
                    label={`Item ${index + 1}`}
                    value={item}
                    onChangeText={(text) => updateEditItem(index, text)}
                    style={styles.editInput}
                  />
                  <Button 
                    mode="outlined" 
                    onPress={() => removeEditItem(index)}
                    style={styles.removeButton}
                    disabled={editItems.length === 1}
                  >
                    Remove
                  </Button>
                </View>
              ))}

              <Button 
                mode="outlined" 
                onPress={addEditItem}
                style={styles.addButton}
              >
                Add Item
              </Button>
            </ScrollView>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowEditDialog(false)}>Cancel</Button>
            <Button 
              mode="contained" 
              onPress={handleSaveEdit}
            >
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
  createButton: {
    marginTop: 16,
  },
  weeklyGrid: {
    marginTop: 16,
  },
  dayCard: {
    marginBottom: 16,
    elevation: 2,
  },
  dayTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  mealSection: {
    marginBottom: 12,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  editButton: {
    marginLeft: 8,
  },
  menuItems: {
    marginLeft: 16,
  },
  menuItem: {
    fontSize: 14,
    marginBottom: 4,
  },
  emptyMeal: {
    fontSize: 14,
    marginLeft: 16,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  editItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  editInput: {
    flex: 1,
    marginRight: 8,
  },
  removeButton: {
    marginLeft: 8,
  },
  addButton: {
    marginTop: 8,
  },
}); 