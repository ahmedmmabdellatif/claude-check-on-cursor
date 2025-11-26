// NutritionSection.tsx - Shows nutrition_plan and food_sources

import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Utensils, Apple, Droplet } from 'lucide-react-native';
import { Card } from '../ui/Card';
import { Typography } from '../ui/Typography';
import { COLORS, SPACING } from '../../constants/theme';
import { UniversalFitnessPlan } from '../../constants/fitnessTypes';
import { getArray, getString, getNumber, getObject } from '../../utils/safe';

interface NutritionSectionProps {
  plan: UniversalFitnessPlan;
}

export const NutritionSection: React.FC<NutritionSectionProps> = ({ plan }) => {
  const meals = getArray(plan.nutrition_plan);
  const foodSources = getObject(plan.food_sources);

  // Calculate totals if available
  const totalCalories = meals.reduce((sum: number, meal: any) => 
    sum + getNumber(meal.calories), 0
  );
  const totalProtein = meals.reduce((sum: number, meal: any) => 
    sum + getNumber(meal.protein_g), 0
  );
  const totalCarbs = meals.reduce((sum: number, meal: any) => 
    sum + getNumber(meal.carbs_g), 0
  );
  const totalFats = meals.reduce((sum: number, meal: any) => 
    sum + getNumber(meal.fats_g), 0
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Typography variant="h2" style={styles.title}>Nutrition Plan</Typography>

      {/* Macros Summary */}
      {(totalCalories > 0 || totalProtein > 0 || totalCarbs > 0 || totalFats > 0) && (
        <Card variant="glass" style={styles.macrosCard}>
          <Typography variant="h3" style={styles.sectionTitle}>Daily Macros</Typography>
          <View style={styles.macrosGrid}>
            {totalCalories > 0 && (
              <View style={styles.macroItem}>
                <Typography variant="h2">{Math.round(totalCalories)}</Typography>
                <Typography variant="caption" color={COLORS.text.secondary}>Calories</Typography>
              </View>
            )}
            {totalProtein > 0 && (
              <View style={styles.macroItem}>
                <Typography variant="h2">{Math.round(totalProtein)}g</Typography>
                <Typography variant="caption" color={COLORS.text.secondary}>Protein</Typography>
              </View>
            )}
            {totalCarbs > 0 && (
              <View style={styles.macroItem}>
                <Typography variant="h2">{Math.round(totalCarbs)}g</Typography>
                <Typography variant="caption" color={COLORS.text.secondary}>Carbs</Typography>
              </View>
            )}
            {totalFats > 0 && (
              <View style={styles.macroItem}>
                <Typography variant="h2">{Math.round(totalFats)}g</Typography>
                <Typography variant="caption" color={COLORS.text.secondary}>Fats</Typography>
              </View>
            )}
          </View>
        </Card>
      )}

      {/* Meals */}
      {meals.length > 0 && (
        <View style={styles.mealsSection}>
          <Typography variant="h3" style={styles.sectionTitle}>Meals</Typography>
          {meals
            .sort((a: any, b: any) => getNumber(a.meal_number) - getNumber(b.meal_number))
            .map((meal, idx) => (
              <Card key={idx} variant="outlined" style={styles.mealCard}>
                <View style={styles.mealHeader}>
                  <Utensils color={COLORS.primary.light} size={18} />
                  <Typography variant="label">
                    {getString(meal.meal_name || meal.name) || `Meal ${getNumber(meal.meal_number) || idx + 1}`}
                  </Typography>
                </View>
                {(getNumber(meal.calories) > 0 || getString(meal.calories)) && (
                  <Typography variant="body" color={COLORS.text.secondary}>
                    {getNumber(meal.calories) > 0 ? `${Math.round(getNumber(meal.calories))} calories` : getString(meal.calories)}
                  </Typography>
                )}
                {(getNumber(meal.protein_g) > 0 || getNumber(meal.carbs_g) > 0 || getNumber(meal.fats_g) > 0) && (
                  <View style={styles.macrosRow}>
                    {getNumber(meal.protein_g) > 0 && (
                      <Typography variant="caption" color={COLORS.text.secondary}>
                        P: {Math.round(getNumber(meal.protein_g))}g
                      </Typography>
                    )}
                    {getNumber(meal.carbs_g) > 0 && (
                      <Typography variant="caption" color={COLORS.text.secondary}>
                        C: {Math.round(getNumber(meal.carbs_g))}g
                      </Typography>
                    )}
                    {getNumber(meal.fats_g) > 0 && (
                      <Typography variant="caption" color={COLORS.text.secondary}>
                        F: {Math.round(getNumber(meal.fats_g))}g
                      </Typography>
                    )}
                  </View>
                )}
                {getArray(meal.choices).length > 0 && (
                  <View style={styles.choicesContainer}>
                    <Typography variant="caption" color={COLORS.text.secondary}>Options:</Typography>
                    {getArray(meal.choices).map((choice: any, choiceIdx: number) => (
                      <Typography key={choiceIdx} variant="body" color={COLORS.text.secondary}>
                        • {getString(typeof choice === 'string' ? choice : (choice.name || choice))}
                      </Typography>
                    ))}
                  </View>
                )}
                {getArray(meal.ingredients).length > 0 && (
                  <View style={styles.ingredientsContainer}>
                    <Typography variant="caption" color={COLORS.text.secondary}>Ingredients:</Typography>
                    {getArray(meal.ingredients).map((ing: any, ingIdx: number) => (
                      <Typography key={ingIdx} variant="body" color={COLORS.text.secondary}>
                        • {getString(typeof ing === 'string' ? ing : (ing.name || ing))}
                      </Typography>
                    ))}
                  </View>
                )}
                {getString(meal.notes) && (
                  <Typography variant="caption" color={COLORS.text.secondary} style={styles.mealNotes}>
                    {getString(meal.notes)}
                  </Typography>
                )}
              </Card>
            ))}
        </View>
      )}

      {/* Food Sources */}
      {Object.keys(foodSources).length > 0 && (
        <Card variant="outlined" style={styles.foodSourcesCard}>
          <Typography variant="h3" style={styles.sectionTitle}>Food Sources</Typography>
          {Object.entries(foodSources).map(([category, items]: [string, any]) => (
            <View key={category} style={styles.categoryContainer}>
              <Typography variant="label" style={styles.categoryName}>{category}</Typography>
              {getArray(items).map((item: any, idx: number) => (
                <Typography key={idx} variant="body" color={COLORS.text.secondary}>
                  • {getString(typeof item === 'string' ? item : (item.name || item))}
                </Typography>
              ))}
            </View>
          ))}
        </Card>
      )}

      {meals.length === 0 && !foodSources && (
        <Card variant="outlined" style={styles.emptyCard}>
          <Typography variant="body" color={COLORS.text.secondary}>
            No nutrition data available.
          </Typography>
        </Card>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: SPACING.m,
    paddingBottom: SPACING.xxl,
  },
  title: {
    marginBottom: SPACING.m,
  },
  macrosCard: {
    marginBottom: SPACING.m,
  },
  sectionTitle: {
    marginBottom: SPACING.m,
  },
  macrosGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    gap: SPACING.m,
  },
  macroItem: {
    alignItems: 'center',
    gap: SPACING.xs,
  },
  mealsSection: {
    marginBottom: SPACING.m,
  },
  mealCard: {
    marginBottom: SPACING.m,
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
    marginBottom: SPACING.xs,
  },
  choicesContainer: {
    marginTop: SPACING.s,
    gap: SPACING.xs,
  },
  ingredientsContainer: {
    marginTop: SPACING.s,
    gap: SPACING.xs,
  },
  foodSourcesCard: {
    marginTop: SPACING.m,
  },
  categoryContainer: {
    marginBottom: SPACING.m,
  },
  categoryName: {
    marginBottom: SPACING.xs,
    textTransform: 'capitalize',
  },
  emptyCard: {
    padding: SPACING.l,
    alignItems: 'center',
  },
  macrosRow: {
    flexDirection: 'row',
    gap: SPACING.s,
    marginTop: SPACING.xs,
  },
  mealNotes: {
    marginTop: SPACING.s,
    fontStyle: 'italic',
  },
});

