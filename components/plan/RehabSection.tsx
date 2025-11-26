// RehabSection.tsx - Shows mobility_and_rehab grouped by target_area

import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { Activity, Target, ExternalLink } from 'lucide-react-native';
import { Card } from '../ui/Card';
import { Typography } from '../ui/Typography';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import { UniversalFitnessPlan } from '../../constants/fitnessTypes';
import { getArray, getString, getObject } from '../../utils/safe';

interface RehabSectionProps {
  plan: UniversalFitnessPlan;
}

export const RehabSection: React.FC<RehabSectionProps> = ({ plan }) => {
  const rehabItems = getArray(plan.mobility_and_rehab);
  const allWorkouts = getArray(plan.workouts);
  const rehabWorkouts = allWorkouts.filter((w: any) => {
    const name = getString(w.name).toLowerCase();
    return name.includes('rehab') || name.includes('mobility') || 
           getArray(w.exercises).some((e: any) => getString(e.name).toLowerCase().includes('rehab'));
  });

  // Group by target_area
  const groupedByArea: Record<string, any[]> = {};
  rehabItems.forEach((item: any) => {
    const area = getString(item.target_area || item.area) || 'General';
    if (!groupedByArea[area]) {
      groupedByArea[area] = [];
    }
    groupedByArea[area].push(item);
  });

  if (rehabItems.length === 0 && rehabWorkouts.length === 0) {
    return (
      <View style={styles.container}>
        <Card variant="outlined" style={styles.emptyCard}>
          <Typography variant="h3" style={{ marginBottom: SPACING.s }}>No Rehab Data</Typography>
          <Typography variant="body" color={COLORS.text.secondary}>
            No mobility or rehab routines found in this plan.
          </Typography>
        </Card>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Typography variant="h2" style={styles.title}>Mobility & Rehab</Typography>

      {/* Grouped by Target Area */}
      {Object.entries(groupedByArea).map(([area, items]) => (
        <Card key={area} variant="outlined" style={styles.areaCard}>
          <View style={styles.areaHeader}>
            <Target color={COLORS.primary.light} size={20} />
            <Typography variant="h3">{area}</Typography>
          </View>
          {items.map((item, idx) => (
            <View key={idx} style={styles.item}>
              <View style={styles.itemHeader}>
                {getString(item.name) && (
                  <Typography variant="label">{getString(item.name)}</Typography>
                )}
                {getString(item.video_url) && (
                  <TouchableOpacity 
                    onPress={() => Linking.openURL(getString(item.video_url))}
                    style={styles.videoButton}
                  >
                    <ExternalLink size={16} color={COLORS.primary.light} />
                  </TouchableOpacity>
                )}
              </View>
              {getString(item.description) && (
                <Typography variant="body" color={COLORS.text.secondary} style={styles.description}>
                  {getString(item.description)}
                </Typography>
              )}
              {getString(item.purpose) && (
                <Typography variant="caption" color={COLORS.text.secondary} style={styles.purpose}>
                  Purpose: {getString(item.purpose)}
                </Typography>
              )}
              {getString(item.frequency) && (
                <Typography variant="caption" color={COLORS.text.secondary}>
                  Frequency: {getString(item.frequency)}
                </Typography>
              )}
              {getArray(item.exercises).length > 0 && (
                <View style={styles.exercisesList}>
                  {getArray(item.exercises).map((ex: any, exIdx: number) => (
                    <View key={exIdx} style={styles.exerciseItem}>
                      <Activity color={COLORS.primary.light} size={16} />
                      <Typography variant="body">{getString(ex.name || ex)}</Typography>
                    </View>
                  ))}
                </View>
              )}
              {getArray(item.steps).length > 0 && (
                <View style={styles.stepsList}>
                  <Typography variant="caption" color={COLORS.text.secondary} style={styles.stepsLabel}>
                    Steps:
                  </Typography>
                  {getArray(item.steps).map((step: any, stepIdx: number) => (
                    <Typography key={stepIdx} variant="body" color={COLORS.text.secondary}>
                      {stepIdx + 1}. {getString(step)}
                    </Typography>
                  ))}
                </View>
              )}
            </View>
          ))}
        </Card>
      ))}

      {/* Rehab Workouts */}
      {rehabWorkouts.length > 0 && (
        <Card variant="outlined" style={styles.workoutsCard}>
          <Typography variant="h3" style={styles.sectionTitle}>Rehab Workouts</Typography>
          {rehabWorkouts.map((workout, idx) => (
            <View key={idx} style={styles.workoutItem}>
              <Typography variant="label">{getString(workout.name)}</Typography>
              {getString(workout.notes) && (
                <Typography variant="body" color={COLORS.text.secondary}>
                  {getString(workout.notes)}
                </Typography>
              )}
            </View>
          ))}
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
  emptyCard: {
    padding: SPACING.l,
    alignItems: 'center',
  },
  areaCard: {
    marginBottom: SPACING.m,
  },
  areaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
    marginBottom: SPACING.m,
  },
  item: {
    marginBottom: SPACING.m,
    paddingBottom: SPACING.m,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background.tertiary,
  },
  exercisesList: {
    marginTop: SPACING.s,
    gap: SPACING.xs,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  workoutsCard: {
    marginTop: SPACING.m,
  },
  sectionTitle: {
    marginBottom: SPACING.m,
  },
  workoutItem: {
    marginBottom: SPACING.m,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  videoButton: {
    padding: 4,
  },
  description: {
    marginBottom: SPACING.xs,
  },
  purpose: {
    marginTop: SPACING.xs,
    fontStyle: 'italic',
  },
  stepsList: {
    marginTop: SPACING.s,
    gap: SPACING.xs,
  },
  stepsLabel: {
    marginBottom: SPACING.xs,
    fontWeight: '600',
  },
});

