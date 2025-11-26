// TrackableExerciseCard.tsx - Renders a single trackable exercise with inputs

import React, { useState } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, Linking } from 'react-native';
import { CheckCircle, Circle, ExternalLink } from 'lucide-react-native';
import { Card } from '../ui/Card';
import { Typography } from '../ui/Typography';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import { TrackableExercise } from '../../shared/programTrackingSchema';

interface TrackableExerciseCardProps {
  exercise: TrackableExercise;
}

export const TrackableExerciseCard: React.FC<TrackableExerciseCardProps> = ({ exercise }) => {
  const [completed, setCompleted] = useState(false);
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [sets, setSets] = useState('');
  const [rpe, setRpe] = useState('');

  const template = exercise.trackingTemplate || {};

  return (
    <Card variant="default" style={styles.card}>
      <View style={styles.header}>
        <Typography variant="label" style={styles.exerciseName}>
          {exercise.name}
        </Typography>
        {exercise.mediaLinks && exercise.mediaLinks.length > 0 && (
          <TouchableOpacity
            onPress={() => exercise.mediaLinks && exercise.mediaLinks[0] && Linking.openURL(exercise.mediaLinks[0])}
            style={styles.mediaButton}
          >
            <ExternalLink size={16} color={COLORS.primary.light} />
          </TouchableOpacity>
        )}
      </View>

      {/* Exercise Details */}
      <View style={styles.details}>
        {exercise.sets !== null && (
          <View style={styles.detailItem}>
            <Typography variant="caption" color={COLORS.text.secondary}>Sets</Typography>
            <Typography variant="body">{exercise.sets}</Typography>
          </View>
        )}
        {exercise.reps && (
          <View style={styles.detailItem}>
            <Typography variant="caption" color={COLORS.text.secondary}>Reps</Typography>
            <Typography variant="body">{exercise.reps}</Typography>
          </View>
        )}
        {exercise.tempo && (
          <View style={styles.detailItem}>
            <Typography variant="caption" color={COLORS.text.secondary}>Tempo</Typography>
            <Typography variant="body">{exercise.tempo}</Typography>
          </View>
        )}
        {exercise.restSeconds && (
          <View style={styles.detailItem}>
            <Typography variant="caption" color={COLORS.text.secondary}>Rest</Typography>
            <Typography variant="body">{exercise.restSeconds}s</Typography>
          </View>
        )}
        {exercise.equipment && (
          <View style={styles.detailItem}>
            <Typography variant="caption" color={COLORS.text.secondary}>Equipment</Typography>
            <Typography variant="body">{exercise.equipment}</Typography>
          </View>
        )}
      </View>

      {/* Tracking Inputs */}
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

        {template.trackWeightKg && (
          <View style={styles.inputRow}>
            <Typography variant="caption" color={COLORS.text.secondary}>Weight (kg)</Typography>
            <TextInput
              style={styles.input}
              value={weight}
              onChangeText={setWeight}
              placeholder="0"
              keyboardType="numeric"
              placeholderTextColor={COLORS.text.tertiary}
            />
          </View>
        )}

        {template.trackSets && (
          <View style={styles.inputRow}>
            <Typography variant="caption" color={COLORS.text.secondary}>Sets Completed</Typography>
            <TextInput
              style={styles.input}
              value={sets}
              onChangeText={setSets}
              placeholder="0"
              keyboardType="numeric"
              placeholderTextColor={COLORS.text.tertiary}
            />
          </View>
        )}

        {template.trackReps && (
          <View style={styles.inputRow}>
            <Typography variant="caption" color={COLORS.text.secondary}>Reps Completed</Typography>
            <TextInput
              style={styles.input}
              value={reps}
              onChangeText={setReps}
              placeholder="0"
              keyboardType="numeric"
              placeholderTextColor={COLORS.text.tertiary}
            />
          </View>
        )}

        {template.trackRpe && (
          <View style={styles.inputRow}>
            <Typography variant="caption" color={COLORS.text.secondary}>RPE (1-10)</Typography>
            <TextInput
              style={styles.input}
              value={rpe}
              onChangeText={setRpe}
              placeholder="0"
              keyboardType="numeric"
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
    padding: SPACING.s,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  exerciseName: {
    flex: 1,
    fontWeight: '600',
  },
  mediaButton: {
    padding: 4,
  },
  details: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.m,
    marginTop: SPACING.xs,
    marginBottom: SPACING.s,
  },
  detailItem: {
    gap: 2,
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

