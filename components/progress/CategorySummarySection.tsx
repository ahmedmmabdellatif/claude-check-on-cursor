// CategorySummarySection.tsx
// Category breakdown with completion stats

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Typography } from '../ui/Typography';
import { Card } from '../ui/Card';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import { JourneyTaskCategory, AdherenceSummary } from '../../app/types/journey';

interface CategorySummarySectionProps {
  categorySummary: AdherenceSummary['categorySummary'];
}

const CATEGORY_LABELS: Record<JourneyTaskCategory, string> = {
  workout: 'Workout',
  cardio: 'Cardio',
  rehab: 'Rehab',
  mobility: 'Mobility',
  stretching: 'Stretching',
  nutrition: 'Nutrition',
  education: 'Education',
  checkin: 'Check-in',
};

const CATEGORY_COLORS: Record<JourneyTaskCategory, string> = {
  workout: COLORS.primary.light,
  cardio: COLORS.secondary.light,
  rehab: COLORS.status.info,
  mobility: COLORS.status.warning,
  stretching: COLORS.status.success,
  nutrition: '#F59E0B',
  education: '#8B5CF6',
  checkin: COLORS.text.secondary,
};

export const CategorySummarySection: React.FC<CategorySummarySectionProps> = ({ categorySummary }) => {
  const categories = Object.entries(categorySummary) as [JourneyTaskCategory, { planned: number; completed: number; completionRate: number }][];

  if (categories.length === 0) {
    return (
      <Card variant="outlined" style={styles.emptyCard}>
        <Typography variant="body" color={COLORS.text.secondary}>
          No category data available yet.
        </Typography>
      </Card>
    );
  }

  return (
    <View style={styles.container}>
      <Typography variant="h3" style={styles.title}>
        Category Breakdown
      </Typography>
      
      {categories.map(([category, stats]) => {
        const label = CATEGORY_LABELS[category];
        const color = CATEGORY_COLORS[category];
        const percentage = Math.round(stats.completionRate * 100);

        return (
          <Card key={category} variant="glass" style={styles.categoryCard}>
            <View style={styles.categoryHeader}>
              <View style={styles.categoryInfo}>
                <View style={[styles.categoryDot, { backgroundColor: color }]} />
                <Typography variant="body" style={{ fontWeight: '600' }}>
                  {label}
                </Typography>
              </View>
              <Typography variant="h4" color={color}>
                {percentage}%
              </Typography>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBar,
                  { width: `${percentage}%`, backgroundColor: color },
                ]}
              />
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
              <Typography variant="caption" color={COLORS.text.secondary}>
                {stats.completed} of {stats.planned} tasks completed
              </Typography>
            </View>
          </Card>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: SPACING.m,
  },
  title: {
    marginBottom: SPACING.m,
  },
  categoryCard: {
    padding: SPACING.m,
    marginBottom: SPACING.s,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.s,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: COLORS.background.tertiary,
    borderRadius: BORDER_RADIUS.s,
    overflow: 'hidden',
    marginBottom: SPACING.xs,
  },
  progressBar: {
    height: '100%',
    borderRadius: BORDER_RADIUS.s,
  },
  statsRow: {
    marginTop: SPACING.xs,
  },
  emptyCard: {
    padding: SPACING.l,
    alignItems: 'center',
    margin: SPACING.m,
  },
});

