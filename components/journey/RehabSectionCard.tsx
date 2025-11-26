// RehabSectionCard.tsx - Renders rehab section

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Target } from 'lucide-react-native';
import { Card } from '../ui/Card';
import { Typography } from '../ui/Typography';
import { COLORS, SPACING } from '../../constants/theme';
import { RehabSection } from '../../shared/programTrackingSchema';
import { TrackableExerciseCard } from './TrackableExerciseCard';

interface RehabSectionCardProps {
  section: RehabSection;
}

export const RehabSectionCard: React.FC<RehabSectionCardProps> = ({ section }) => {
  return (
    <Card variant="outlined" style={styles.card}>
      <View style={styles.header}>
        <Target color={COLORS.primary.light} size={20} />
        <Typography variant="h3" style={{ flex: 1 }}>{section.title}</Typography>
      </View>

      <Typography variant="caption" color={COLORS.text.secondary} style={styles.targetArea}>
        Target Area: {section.targetArea}
      </Typography>

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
  targetArea: {
    marginBottom: SPACING.xs,
    fontWeight: '600',
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

