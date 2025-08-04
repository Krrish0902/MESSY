import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, TextInput, Divider, List, Chip, FAB, Dialog, Portal, SegmentedButtons, IconButton } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';
import { Database } from '../../types/database';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';

type MealPricing = Database['public']['Tables']['meal_pricing']['Row'];
type SubscriptionPlan = Database['public']['Tables']['subscription_plans']['Row'];

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
const MEALS = ['breakfast', 'lunch', 'dinner'] as const;

export default function MealPricingPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  
  const [mealPricing, setMealPricing] = useState<MealPricing | null>(null);
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  // Form state for meal pricing
  const [showPricingForm, setShowPricingForm] = useState(false);
  const [breakfastPrice, setBreakfastPrice] = useState('');
  const [lunchPrice, setLunchPrice] = useState('');
  const [dinnerPrice, setDinnerPrice] = useState('');

  // Form state for plan creation
  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [planName, setPlanName] = useState('');
  const [planDescription, setPlanDescription] = useState('');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [selectedMeals, setSelectedMeals] = useState<string[]>([]);
  const [durationType, setDurationType] = useState<'weekly' | 'monthly'>('monthly');

  useEffect(() => {
    if (user?.role === 'mess_owner') {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      await Promise.all([fetchMealPricing(), fetchSubscriptionPlans()]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMealPricing = async () => {
    try {
      const { data: messes } = await supabase
        .from('messes')
        .select('id')
        .eq('owner_id', user?.id)
        .eq('status', 'approved');

      if (messes && messes.length > 0) {
        const messId = messes[0].id;
        
        const { data, error } = await supabase
          .from('meal_pricing')
          .select('*')
          .eq('mess_id', messId)
          .single();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }
        
        if (data) {
          setMealPricing(data);
          setBreakfastPrice(data.breakfast_price.toString());
          setLunchPrice(data.lunch_price.toString());
          setDinnerPrice(data.dinner_price.toString());
        } else {
          setBreakfastPrice('0');
          setLunchPrice('0');
          setDinnerPrice('0');
        }
      }
    } catch (err: any) {
      throw err;
    }
  };

  const fetchSubscriptionPlans = async () => {
    try {
      const { data: messes } = await supabase
        .from('messes')
        .select('id')
        .eq('owner_id', user?.id)
        .eq('status', 'approved');

      if (messes && messes.length > 0) {
        const messId = messes[0].id;
        
        const { data, error } = await supabase
          .from('subscription_plans')
          .select('*')
          .eq('mess_id', messId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setSubscriptionPlans(data || []);
      }
    } catch (err: any) {
      throw err;
    }
  };

  const handleSavePricing = async () => {
    if (!user?.id) return;

    setSaving(true);
    try {
      const { data: messes } = await supabase
        .from('messes')
        .select('id')
        .eq('owner_id', user?.id)
        .eq('status', 'approved')
        .single();

      if (!messes) {
        throw new Error('No approved mess found');
      }

      const pricingData = {
        mess_id: messes.id,
        breakfast_price: parseFloat(breakfastPrice) || 0,
        lunch_price: parseFloat(lunchPrice) || 0,
        dinner_price: parseFloat(dinnerPrice) || 0,
      };

      const { error } = await supabase
        .from('meal_pricing')
        .upsert(pricingData);

      if (error) throw error;

      Alert.alert('Success', 'Meal pricing saved successfully!');
      setShowPricingForm(false);
      fetchMealPricing();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const calculatePlanPrice = () => {
    const breakfast = parseFloat(breakfastPrice) || 0;
    const lunch = parseFloat(lunchPrice) || 0;
    const dinner = parseFloat(dinnerPrice) || 0;
    
    let totalPrice = 0;
    selectedDays.forEach(day => {
      selectedMeals.forEach(meal => {
        switch(meal) {
          case 'breakfast':
            totalPrice += breakfast;
            break;
          case 'lunch':
            totalPrice += lunch;
            break;
          case 'dinner':
            totalPrice += dinner;
            break;
        }
      });
    });
    
    const durationWeeks = durationType === 'weekly' ? 1 : 4;
    return totalPrice * durationWeeks;
  };

  const handleCreatePlan = () => {
    setEditingPlan(null);
    setPlanName('');
    setPlanDescription('');
    setSelectedDays([]);
    setSelectedMeals([]);
    setDurationType('monthly');
    setShowPlanDialog(true);
  };

  const handleEditPlan = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setPlanName(plan.name);
    setPlanDescription(plan.description || '');
    setSelectedDays(plan.days_of_week);
    setSelectedMeals(plan.meals_included);
    setDurationType(plan.duration_type);
    setShowPlanDialog(true);
  };

  const handleSavePlan = async () => {
    if (!user?.id || !planName.trim() || selectedDays.length === 0 || selectedMeals.length === 0) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    setSaving(true);
    try {
      const { data: messes } = await supabase
        .from('messes')
        .select('id')
        .eq('owner_id', user?.id)
        .eq('status', 'approved')
        .single();

      if (!messes) {
        throw new Error('No approved mess found');
      }

      const planData = {
        mess_id: messes.id,
        name: planName.trim(),
        description: planDescription.trim(),
        days_of_week: selectedDays,
        meals_included: selectedMeals,
        total_price: calculatePlanPrice(),
        duration_type: durationType,
        duration_weeks: durationType === 'weekly' ? 1 : 4,
      };

      if (editingPlan) {
        const { error } = await supabase
          .from('subscription_plans')
          .update(planData)
          .eq('id', editingPlan.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('subscription_plans')
          .insert(planData);
        if (error) throw error;
      }

      Alert.alert('Success', `Plan ${editingPlan ? 'updated' : 'created'} successfully!`);
      setShowPlanDialog(false);
      fetchSubscriptionPlans();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    Alert.alert(
      'Delete Plan',
      'Are you sure you want to delete this plan?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('subscription_plans')
                .delete()
                .eq('id', planId);
              
              if (error) throw error;
              
              Alert.alert('Success', 'Plan deleted successfully!');
              fetchSubscriptionPlans();
            } catch (err: any) {
              Alert.alert('Error', err.message);
            }
          }
        }
      ]
    );
  };

  const toggleDay = (day: string) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const toggleMeal = (meal: string) => {
    setSelectedMeals(prev => 
      prev.includes(meal) 
        ? prev.filter(m => m !== meal)
        : [...prev, meal]
    );
  };

  const getDayDisplayName = (day: string) => {
    return day.charAt(0).toUpperCase() + day.slice(1);
  };

  const getMealDisplayName = (meal: string) => {
    return meal.charAt(0).toUpperCase() + meal.slice(1);
  };

  const validatePrices = () => {
    const breakfast = parseFloat(breakfastPrice) || 0;
    const lunch = parseFloat(lunchPrice) || 0;
    const dinner = parseFloat(dinnerPrice) || 0;
    
    return breakfast >= 0 && lunch >= 0 && dinner >= 0;
  };

  const getPlanDetails = (plan: SubscriptionPlan) => {
    const daysText = plan.days_of_week.length === 7 ? 'All days' : `${plan.days_of_week.length} days`;
    const mealsText = plan.meals_included.length === 3 ? 'All meals' : `${plan.meals_included.length} meals`;
    return `${daysText} • ${mealsText} • ${plan.duration_type}`;
  };

  if (loading) {
    return <LoadingSpinner message="Loading meal pricing..." />;
  }

  if (user?.role !== 'mess_owner') {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          Only mess owners can access meal pricing
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.onBackground }]}>
            Meal Pricing & Plans
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
            Set your meal prices and create subscription plans
          </Text>
        </View>

        {error && (
          <ErrorMessage message={error} onRetry={fetchData} />
        )}

        {/* Meal Pricing Section */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.pricingHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                Meal Prices
              </Text>
              <IconButton
                icon={showPricingForm ? "chevron-up" : "pencil"}
                onPress={() => setShowPricingForm(!showPricingForm)}
                size={20}
              />
            </View>
            
            {!showPricingForm ? (
              // Display current prices
              <View style={styles.currentPricing}>
                <View style={styles.priceRow}>
                  <Text style={[styles.priceLabel, { color: theme.colors.onSurfaceVariant }]}>
                    Breakfast
                  </Text>
                  <Text style={[styles.priceValue, { color: theme.colors.primary }]}>
                    ₹{mealPricing?.breakfast_price || 0}
                  </Text>
                </View>
                <View style={styles.priceRow}>
                  <Text style={[styles.priceLabel, { color: theme.colors.onSurfaceVariant }]}>
                    Lunch
                  </Text>
                  <Text style={[styles.priceValue, { color: theme.colors.primary }]}>
                    ₹{mealPricing?.lunch_price || 0}
                  </Text>
                </View>
                <View style={styles.priceRow}>
                  <Text style={[styles.priceLabel, { color: theme.colors.onSurfaceVariant }]}>
                    Dinner
                  </Text>
                  <Text style={[styles.priceValue, { color: theme.colors.primary }]}>
                    ₹{mealPricing?.dinner_price || 0}
                  </Text>
                </View>
                <View style={styles.priceRow}>
                  <Text style={[styles.priceLabel, { color: theme.colors.onSurface }]}>
                    Total per day
                  </Text>
                  <Text style={[styles.priceValue, { color: theme.colors.primary, fontWeight: 'bold' }]}>
                    ₹{(mealPricing?.breakfast_price || 0) + (mealPricing?.lunch_price || 0) + (mealPricing?.dinner_price || 0)}
                  </Text>
                </View>
              </View>
            ) : (
              // Edit pricing form
              <>
                <Divider style={styles.divider} />
                
                <TextInput
                  label="Breakfast Price"
                  value={breakfastPrice}
                  onChangeText={setBreakfastPrice}
                  keyboardType="numeric"
                  mode="outlined"
                  style={styles.input}
                  left={<TextInput.Affix text="₹" />}
                />
                
                <TextInput
                  label="Lunch Price"
                  value={lunchPrice}
                  onChangeText={setLunchPrice}
                  keyboardType="numeric"
                  mode="outlined"
                  style={styles.input}
                  left={<TextInput.Affix text="₹" />}
                />
                
                <TextInput
                  label="Dinner Price"
                  value={dinnerPrice}
                  onChangeText={setDinnerPrice}
                  keyboardType="numeric"
                  mode="outlined"
                  style={styles.input}
                  left={<TextInput.Affix text="₹" />}
                />

                <View style={styles.priceSummary}>
                  <Text style={[styles.summaryTitle, { color: theme.colors.onSurface }]}>
                    Price Summary
                  </Text>
                  <Text style={[styles.summaryText, { color: theme.colors.onSurfaceVariant }]}>
                    Breakfast: ₹{parseFloat(breakfastPrice) || 0}
                  </Text>
                  <Text style={[styles.summaryText, { color: theme.colors.onSurfaceVariant }]}>
                    Lunch: ₹{parseFloat(lunchPrice) || 0}
                  </Text>
                  <Text style={[styles.summaryText, { color: theme.colors.onSurfaceVariant }]}>
                    Dinner: ₹{parseFloat(dinnerPrice) || 0}
                  </Text>
                  <Text style={[styles.totalText, { color: theme.colors.primary }]}>
                    Total per day: ₹{(parseFloat(breakfastPrice) || 0) + (parseFloat(lunchPrice) || 0) + (parseFloat(dinnerPrice) || 0)}
                  </Text>
                </View>

                <View style={styles.pricingActions}>
                  <Button
                    mode="outlined"
                    onPress={() => setShowPricingForm(false)}
                    style={styles.cancelButton}
                  >
                    Cancel
                  </Button>
                  <Button
                    mode="contained"
                    onPress={handleSavePricing}
                    disabled={!validatePrices() || saving}
                    loading={saving}
                    style={styles.saveButton}
                  >
                    Save Pricing
                  </Button>
                </View>
              </>
            )}
          </Card.Content>
        </Card>

        {/* Subscription Plans Section */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.plansHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                Subscription Plans
              </Text>
              <Button
                mode="contained"
                onPress={handleCreatePlan}
                icon="plus"
                compact
              >
                Create Plan
              </Button>
            </View>
            <Divider style={styles.divider} />
            
            {subscriptionPlans.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyIcon, { color: theme.colors.onSurfaceVariant }]}>
                  📋
                </Text>
                <Text style={[styles.emptyTitle, { color: theme.colors.onSurface }]}>
                  No Plans Created
                </Text>
                <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
                  Create your first subscription plan to start serving customers
                </Text>
                <Button
                  mode="contained"
                  onPress={handleCreatePlan}
                  icon="plus"
                  style={styles.createFirstButton}
                >
                  Create Your First Plan
                </Button>
              </View>
            ) : (
              subscriptionPlans.map((plan) => (
                <Card key={plan.id} style={styles.planCard}>
                  <Card.Content>
                    <View style={styles.planHeader}>
                      <View style={styles.planInfo}>
                        <Text style={[styles.planName, { color: theme.colors.onSurface }]}>
                          {plan.name}
                        </Text>
                        <Text style={[styles.planDescription, { color: theme.colors.onSurfaceVariant }]}>
                          {plan.description || getPlanDetails(plan)}
                        </Text>
                      </View>
                      <Text style={[styles.planPrice, { color: theme.colors.primary }]}>
                        ₹{plan.total_price}
                      </Text>
                    </View>
                    
                    <View style={styles.planDetails}>
                      <Chip mode="outlined" style={styles.planChip}>
                        {plan.duration_type}
                      </Chip>
                      <Chip mode="outlined" style={styles.planChip}>
                        {plan.days_of_week.length} days
                      </Chip>
                      <Chip mode="outlined" style={styles.planChip}>
                        {plan.meals_included.length} meals
                      </Chip>
                    </View>
                    
                    <View style={styles.planActions}>
                      <Button
                        mode="outlined"
                        onPress={() => handleEditPlan(plan)}
                        icon="pencil"
                        compact
                      >
                        Edit
                      </Button>
                      <Button
                        mode="outlined"
                        onPress={() => handleDeletePlan(plan.id)}
                        icon="delete"
                        compact
                        textColor={theme.colors.error}
                      >
                        Delete
                      </Button>
                    </View>
                  </Card.Content>
                </Card>
              ))
            )}
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Plan Creation/Edit Dialog */}
      <Portal>
        <Dialog visible={showPlanDialog} onDismiss={() => setShowPlanDialog(false)}>
          <Dialog.Title>
            {editingPlan ? 'Edit Plan' : 'Create New Plan'}
          </Dialog.Title>
          <Dialog.Content>
            <ScrollView>
              <TextInput
                label="Plan Name"
                value={planName}
                onChangeText={setPlanName}
                mode="outlined"
                style={styles.dialogInput}
              />
              
              <TextInput
                label="Description (Optional)"
                value={planDescription}
                onChangeText={setPlanDescription}
                mode="outlined"
                multiline
                numberOfLines={3}
                style={styles.dialogInput}
              />

              <Text style={[styles.dialogSectionTitle, { color: theme.colors.onSurface }]}>
                Select Days
              </Text>
              <View style={styles.chipContainer}>
                {DAYS.map((day) => (
                  <Chip
                    key={day}
                    selected={selectedDays.includes(day)}
                    onPress={() => toggleDay(day)}
                    style={styles.chip}
                    mode="outlined"
                  >
                    {getDayDisplayName(day)}
                  </Chip>
                ))}
              </View>

              <Text style={[styles.dialogSectionTitle, { color: theme.colors.onSurface }]}>
                Select Meals
              </Text>
              <View style={styles.chipContainer}>
                {MEALS.map((meal) => (
                  <Chip
                    key={meal}
                    selected={selectedMeals.includes(meal)}
                    onPress={() => toggleMeal(meal)}
                    style={styles.chip}
                    mode="outlined"
                  >
                    {getMealDisplayName(meal)}
                  </Chip>
                ))}
              </View>

              <Text style={[styles.dialogSectionTitle, { color: theme.colors.onSurface }]}>
                Duration
              </Text>
              <SegmentedButtons
                value={durationType}
                onValueChange={setDurationType as any}
                buttons={[
                  { value: 'weekly', label: 'Weekly' },
                  { value: 'monthly', label: 'Monthly' }
                ]}
                style={styles.segmentedButtons}
              />

              {selectedDays.length > 0 && selectedMeals.length > 0 && (
                <View style={styles.pricePreview}>
                  <Text style={[styles.previewTitle, { color: theme.colors.onSurface }]}>
                    Price Preview
                  </Text>
                  <Text style={[styles.previewText, { color: theme.colors.primary }]}>
                    Total Price: ₹{calculatePlanPrice()}
                  </Text>
                  <Text style={[styles.previewSubtext, { color: theme.colors.onSurfaceVariant }]}>
                    {selectedDays.length} days × {selectedMeals.length} meals × {durationType === 'weekly' ? '1 week' : '4 weeks'}
                  </Text>
                </View>
              )}
            </ScrollView>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowPlanDialog(false)}>Cancel</Button>
            <Button 
              mode="contained" 
              onPress={handleSavePlan}
              loading={saving}
              disabled={!planName.trim() || selectedDays.length === 0 || selectedMeals.length === 0}
            >
              {editingPlan ? 'Update' : 'Create'}
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
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  divider: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  priceSummary: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    marginBottom: 4,
  },
  totalText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
  },
  saveButton: {
    marginTop: 8,
  },
  infoCard: {
    marginBottom: 16,
    elevation: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    marginBottom: 4,
  },
  errorText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 50,
  },
  plansHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  planActions: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  dialogInput: {
    marginBottom: 16,
  },
  dialogSectionTitle: {
    marginBottom: 8,
    marginTop: 16,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  pricePreview: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  previewText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  previewSubtext: {
    fontSize: 14,
  },
  pricingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  currentPricing: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 16,
  },
  priceValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  pricingActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 50,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  createFirstButton: {
    marginTop: 20,
  },
  planCard: {
    marginBottom: 12,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  planInfo: {
    flex: 1,
    marginRight: 10,
  },
  planName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  planDescription: {
    fontSize: 14,
  },
  planPrice: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  planDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  planChip: {
    marginRight: 8,
    marginBottom: 8,
  },
}); 