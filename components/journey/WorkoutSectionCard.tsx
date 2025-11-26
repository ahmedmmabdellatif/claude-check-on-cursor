// WorkoutSectionCard.tsx - Renders workout section with trackable exercises

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Activity } from 'lucide-react-native';
import { Card } from '../ui/Card';
import { Typography } from '../ui/Typography';
import { COLORS, SPACING } from '../../constants/theme';
import { WorkoutSection } from '../../shared/programTrackingSchema';
import { TrackableExerciseCard } from './TrackableExerciseCard';

interface WorkoutSectionCardProps {
  section: WorkoutSection;
}

export const WorkoutSectionCard: React.FC<WorkoutSectionCardProps> = ({ section }) => {
  return (
    <Card variant="outlined" style={styles.card}>
      <View style={styles.header}>
        <Activity color={COLORS.primary.light} size={20} />
        <Typography variant="h3" style={{ flex: 1 }}>{section.title}</Typography>
      </View>
      
      {section.muscleGroups.length > 0 && (
        <View style={styles.muscleGroups}>
          <Typography variant="caption" color={COLORS.text.secondary}>
            Target: {section.muscleGroups.join(', ')}
          </Typography>
        </View>
      )}

      {section.notes && (
        <Typography variant="body" color={COLORS.text.secondary} style={styles.notes}>
          {section.notes}
        </Typography>
      )}

      <View style={styles.exercises}>
        {section.exercises.map((exercise) => (
          <TrackableExerciseCard key={exercise.id} exercise={exercise} />
        ))}
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
  muscleGroups: {
    marginBottom: SPACING.s,
  },
  notes: {
    marginBottom: SPACING.s,
    fontStyle: 'italic',
  },
  exercises: {
    gap: SPACING.s,
    marginTop: SPACING.s,
  },
});

