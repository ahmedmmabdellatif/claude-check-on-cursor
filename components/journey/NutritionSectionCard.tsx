// NutritionSectionCard.tsx - Renders nutrition section with trackable meals

import React, { useState } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { Utensils, CheckCircle, Circle } from 'lucide-react-native';
import { Card } from '../ui/Card';
import { Typography } from '../ui/Typography';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import { NutritionSection } from '../../shared/programTrackingSchema';

interface NutritionSectionCardProps {
  section: NutritionSection;
}

export const NutritionSectionCard: React.FC<NutritionSectionCardProps> = ({ section }) => {
  return (
    <Card variant="outlined" style={styles.card}>
      <View style={styles.header}>
        <Utensils color={COLORS.primary.light} size={20} />
        <Typography variant="h3" style={{ flex: 1 }}>{section.title}</Typography>
      </View>

      {section.notes && (
        <Typography variant="body" color={COLORS.text.secondary} style={styles.notes}>
          {section.notes}
        </Typography>
      )}

      <View style={styles.meals}>
        {section.meals.map((meal) => (
          <MealCard key={meal.id} meal={meal} />
        ))}
      </View>
    </Card>
  );
};

const MealCard: React.FC<{ meal: NutritionSection['meals'][0] }> = ({ meal }) => {
  const [completed, setCompleted] = useState(false);
  const [portion, setPortion] = useState('1.0');

  const template = meal.trackingTemplate || {};

  return (
    <Card variant="default" style={styles.mealCard}>
      <Typography variant="label" style={styles.mealLabel}>{meal.label}</Typography>

      {meal.options.map((option) => (
        <View key={option.id} style={styles.option}>
          <Typography variant="caption" color={COLORS.text.secondary} style={styles.optionLabel}>
            {option.label}:
          </Typography>
          {option.items.map((item, idx) => (
            <Typography key={idx} variant="body" color={COLORS.text.secondary}>
              • {item.name} {item.amount ? `(${item.amount})` : ''}
            </Typography>
          ))}
        </View>
      ))}

      <View style={styles.tracking}>
        {template.trackCompletedCheckbox && (
          <TouchableOpacity
            onPress={() => setCompleted(!completed)}
            style={styles.checkboxRow}
          >
            {completed ? (
              <CheckCircle size={20} color={COLORS.primary.light} />
            ) : (
              <Circle size={20} color={COLORS.text.secondary} />
            )}
            <Typography variant="body">Completed</Typography>
          </TouchableOpacity>
        )}

        {template.trackPortionMultiplier && (
          <View style={styles.inputRow}>
            <Typography variant="caption" color={COLORS.text.secondary}>Portion (0.5x, 1x, 1.5x)</Typography>
            <TextInput
              style={styles.input}
              value={portion}
              onChangeText={setPortion}
              placeholder="1.0"
              keyboardType="decimal-pad"
              placeholderTextColor={COLORS.text.tertiary}
            />
          </View>
        )}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: SPACING.m,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
    marginBottom: SPACING.s,
  },
  notes: {
    marginBottom: SPACING.s,
    fontStyle: 'italic',
  },
  meals: {
    gap: SPACING.s,
    marginTop: SPACING.s,
  },
  mealCard: {
    padding: SPACING.s,
  },
  mealLabel: {
    marginBottom: SPACING.xs,
    fontWeight: '600',
  },
  option: {
    marginBottom: SPACING.xs,
  },
  optionLabel: {
    fontWeight: '600',
    marginBottom: 2,
  },
  tracking: {
    marginTop: SPACING.s,
    paddingTop: SPACING.s,
    borderTopWidth: 1,
    borderTopColor: COLORS.background.tertiary,
    gap: SPACING.s,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.s,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.background.tertiary,
    borderRadius: BORDER_RADIUS.s,
    paddingHorizontal: SPACING.s,
    paddingVertical: SPACING.xs,
    color: COLORS.text.primary,
    backgroundColor: COLORS.background.secondary,
    minWidth: 80,
    textAlign: 'right',
  },
});

