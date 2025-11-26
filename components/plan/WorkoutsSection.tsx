// WorkoutsSection.tsx - Shows weekly_schedule + workouts grouped by day

import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { Activity, Calendar, ExternalLink } from 'lucide-react-native';
import { Card } from '../ui/Card';
import { Typography } from '../ui/Typography';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import { UniversalFitnessPlan, Workout } from '../../constants/fitnessTypes';
import { getArray, getString, getNumber } from '../../utils/safe';

interface WorkoutsSectionProps {
  plan: UniversalFitnessPlan;
}

export const WorkoutsSection: React.FC<WorkoutsSectionProps> = ({ plan }) => {
  const workouts = getArray(plan.workouts);
  const weeklySchedule = getArray(plan.weekly_schedule);

  // Group workouts by day_label or create day groups from weekly_schedule
  const workoutsByDay: Record<string, any[]> = {};
  
  workouts.forEach((workout) => {
    const day = getString(workout.day_label || workout.day) || 'Unassigned';
    if (!workoutsByDay[day]) {
      workoutsByDay[day] = [];
    }
    workoutsByDay[day].push(workout);
  });

  // If weekly_schedule exists, use it to order days
  const orderedDays = weeklySchedule.length > 0 
    ? weeklySchedule.map((day: any) => getString(day.day_label || day.day || day))
    : Object.keys(workoutsByDay);

  if (workouts.length === 0) {
    return (
      <View style={styles.container}>
        <Card variant="outlined" style={styles.emptyCard}>
          <Typography variant="h3" style={{ marginBottom: SPACING.s }}>No Workouts Found</Typography>
          <Typography variant="body" color={COLORS.text.secondary}>
            No workouts found in this plan.
          </Typography>
        </Card>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Typography variant="h2" style={styles.title}>Workout Schedule</Typography>

      {orderedDays.map((day) => {
        const dayWorkouts = workoutsByDay[day] || [];
        if (dayWorkouts.length === 0) return null;

        return (
          <Card key={day} variant="outlined" style={styles.dayCard}>
            <View style={styles.dayHeader}>
              <Calendar color={COLORS.primary.light} size={20} />
              <Typography variant="h3">{day}</Typography>
            </View>

            {dayWorkouts.map((workout, workoutIdx) => (
              <View key={workoutIdx} style={styles.workoutCard}>
                <Typography variant="label" style={styles.workoutName}>
                  {getString(workout.name)}
                </Typography>
                {getString(workout.notes) && (
                  <Typography variant="body" color={COLORS.text.secondary} style={styles.workoutNotes}>
                    {getString(workout.notes)}
                  </Typography>
                )}

                {/* Exercises */}
                {getArray(workout.exercises).length > 0 && (
                  <View style={styles.exercisesContainer}>
                    {getArray(workout.exercises).map((exercise, exIdx) => (
                      <Card key={exIdx} variant="default" style={styles.exerciseCard}>
                        <View style={styles.exerciseHeader}>
                          <Activity color={COLORS.primary.light} size={16} />
                          <Typography variant="body" style={styles.exerciseName}>
                            {getString(exercise.name)}
                          </Typography>
                          {getString(exercise.media_link) && (
                            <TouchableOpacity 
                              onPress={() => Linking.openURL(getString(exercise.media_link))}
                              style={styles.mediaButton}
                            >
                              <ExternalLink size={14} color={COLORS.primary.light} />
                            </TouchableOpacity>
                          )}
                        </View>
                        <View style={styles.exerciseDetails}>
                          {(getNumber(exercise.sets) > 0 || getString(exercise.sets)) && (
                            <View style={styles.detailItem}>
                              <Typography variant="caption" color={COLORS.text.secondary}>Sets</Typography>
                              <Typography variant="body">{getNumber(exercise.sets) > 0 ? getNumber(exercise.sets) : getString(exercise.sets)}</Typography>
                            </View>
                          )}
                          {(getNumber(exercise.reps) > 0 || getString(exercise.reps)) && (
                            <View style={styles.detailItem}>
                              <Typography variant="caption" color={COLORS.text.secondary}>Reps</Typography>
                              <Typography variant="body">{getNumber(exercise.reps) > 0 ? getNumber(exercise.reps) : getString(exercise.reps)}</Typography>
                            </View>
                          )}
                          {getString(exercise.tempo) && (
                            <View style={styles.detailItem}>
                              <Typography variant="caption" color={COLORS.text.secondary}>Tempo</Typography>
                              <Typography variant="body">{getString(exercise.tempo)}</Typography>
                            </View>
                          )}
                          {getString(exercise.rest) && (
                            <View style={styles.detailItem}>
                              <Typography variant="caption" color={COLORS.text.secondary}>Rest</Typography>
                              <Typography variant="body">{getString(exercise.rest)}</Typography>
                            </View>
                          )}
                          {getString(exercise.equipment) && (
                            <View style={styles.detailItem}>
                              <Typography variant="caption" color={COLORS.text.secondary}>Equipment</Typography>
                              <Typography variant="body">{getString(exercise.equipment)}</Typography>
                            </View>
                          )}
                        </View>
                        {getArray(exercise.muscles).length > 0 && (
                          <View style={styles.musclesContainer}>
                            <Typography variant="caption" color={COLORS.text.secondary}>
                              Muscles: {getArray(exercise.muscles).map(m => getString(m)).join(', ')}
                            </Typography>
                          </View>
                        )}
                        {getString(exercise.instructions) && (
                          <Typography variant="caption" color={COLORS.text.secondary} style={styles.instructions}>
                            {getString(exercise.instructions)}
                          </Typography>
                        )}
                        {getString(exercise.notes) && (
                          <Typography variant="caption" color={COLORS.text.secondary} style={styles.exerciseNotes}>
                            Note: {getString(exercise.notes)}
                          </Typography>
                        )}
                      </Card>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </Card>
        );
      })}
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
  dayCard: {
    marginBottom: SPACING.m,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
    marginBottom: SPACING.m,
  },
  workoutCard: {
    marginBottom: SPACING.m,
    paddingBottom: SPACING.m,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background.tertiary,
  },
  workoutName: {
    marginBottom: SPACING.xs,
  },
  workoutNotes: {
    marginBottom: SPACING.s,
  },
  exercisesContainer: {
    gap: SPACING.s,
    marginTop: SPACING.s,
  },
  exerciseCard: {
    padding: SPACING.s,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  exerciseName: {
    flex: 1,
    fontWeight: '600',
  },
  mediaButton: {
    padding: 4,
  },
  exerciseDetails: {
    flexDirection: 'row',
    gap: SPACING.m,
    marginTop: SPACING.xs,
  },
  detailItem: {
    gap: 2,
  },
  instructions: {
    marginTop: SPACING.xs,
    fontStyle: 'italic',
  },
  musclesContainer: {
    marginTop: SPACING.xs,
  },
  exerciseNotes: {
    marginTop: SPACING.xs,
    fontStyle: 'italic',
  },
});

