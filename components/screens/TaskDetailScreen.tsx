// TaskDetailScreen.tsx - Detailed view for a journey task with tracking inputs

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { ArrowLeft, CheckCircle, Circle, ExternalLink } from 'lucide-react-native';
import { ScreenLayout } from '../ScreenLayout';
import { Typography } from '../ui/Typography';
import { Card } from '../ui/Card';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import { JourneyTask, JourneyTaskProgress } from '../../app/types/journey';
import { ProgramForTracking, TrackableExercise } from '../../shared/programTrackingSchema';
import { getJourneyProgress, updateTaskTrackedData, toggleTaskCompletion } from '../../app/lib/journeyProgress';

interface TaskDetailScreenProps {
  task: JourneyTask;
  program: ProgramForTracking;
  programId: string;
  onBack: () => void;
}

export const TaskDetailScreen: React.FC<TaskDetailScreenProps> = ({
  task,
  program,
  programId,
  onBack
}) => {
  const [progress, setProgress] = useState<JourneyTaskProgress | null>(null);
  const [trackedData, setTrackedData] = useState<JourneyTaskProgress['trackedData']>({});
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgress();
  }, [task.id]);

  const loadProgress = async () => {
    try {
      const allProgress = await getJourneyProgress(programId);
      const taskProgress = allProgress[task.id];
      if (taskProgress) {
        setProgress(taskProgress);
        setCompleted(taskProgress.completed);
        setTrackedData(taskProgress.trackedData || {});
      }
    } catch (error) {
      console.error('[TaskDetailScreen] Error loading progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCompletion = async () => {
    try {
      const newCompleted = await toggleTaskCompletion(programId, task.id);
      setCompleted(newCompleted);
    } catch (error) {
      console.error('[TaskDetailScreen] Error toggling completion:', error);
    }
  };

  const handleUpdateTrackedData = async (field: string, value: number | undefined) => {
    const newData = { ...trackedData, [field]: value };
    setTrackedData(newData);
    await updateTaskTrackedData(programId, task.id, newData);
  };

  const renderWorkoutDetail = () => {
    // Find the workout section from the program
    const day = program.schedule.logicalDays[task.dayIndex];
    if (!day) return null;

    const workoutSection = day.sections.find(
      s => s.type === 'workout' && s.id === task.ref.sourceId.split(':')[1]
    ) as any;

    if (!workoutSection || !workoutSection.exercises) {
      return (
        <Card variant="outlined" style={styles.emptyCard}>
          <Typography variant="body" color={COLORS.text.secondary}>
            Exercise details not available
          </Typography>
        </Card>
      );
    }

    return (
      <View style={styles.exerciseList}>
        {workoutSection.exercises.map((exercise: TrackableExercise, idx: number) => (
          <Card key={exercise.id || idx} variant="default" style={styles.exerciseCard}>
            <View style={styles.exerciseHeader}>
              <Typography variant="h4" style={styles.exerciseName}>
                {exercise.name}
              </Typography>
              {exercise.mediaLinks && exercise.mediaLinks.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    // TODO: Open media link
                    console.log('Open media:', exercise.mediaLinks?.[0]);
                  }}
                >
                  <ExternalLink size={18} color={COLORS.primary.light} />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.exerciseMeta}>
              {exercise.sets && (
                <View style={styles.metaItem}>
                  <Typography variant="caption" color={COLORS.text.secondary}>
                    Sets: {exercise.sets}
                  </Typography>
                </View>
              )}
              {exercise.reps && (
                <View style={styles.metaItem}>
                  <Typography variant="caption" color={COLORS.text.secondary}>
                    Reps: {exercise.reps}
                  </Typography>
                </View>
              )}
              {exercise.tempo && (
                <View style={styles.metaItem}>
                  <Typography variant="caption" color={COLORS.text.secondary}>
                    Tempo: {exercise.tempo}
                  </Typography>
                </View>
              )}
              {exercise.restSeconds && (
                <View style={styles.metaItem}>
                  <Typography variant="caption" color={COLORS.text.secondary}>
                    Rest: {exercise.restSeconds}s
                  </Typography>
                </View>
              )}
            </View>

            {/* Tracking inputs */}
            <View style={styles.trackingInputs}>
              {exercise.trackingTemplate.trackWeightKg && (
                <View style={styles.inputGroup}>
                  <Typography variant="caption" color={COLORS.text.secondary} style={styles.inputLabel}>
                    Weight (kg)
                  </Typography>
                  <TextInput
                    style={styles.input}
                    value={trackedData.weightKg?.toString() || ''}
                    onChangeText={(text) => {
                      const val = text ? parseFloat(text) : undefined;
                      handleUpdateTrackedData('weightKg', val);
                    }}
                    keyboardType="decimal-pad"
                    placeholder="0.0"
                    placeholderTextColor={COLORS.text.tertiary}
                  />
                </View>
              )}
              {exercise.trackingTemplate.trackReps && (
                <View style={styles.inputGroup}>
                  <Typography variant="caption" color={COLORS.text.secondary} style={styles.inputLabel}>
                    Reps Completed
                  </Typography>
                  <TextInput
                    style={styles.input}
                    value={trackedData.reps?.toString() || ''}
                    onChangeText={(text) => {
                      const val = text ? parseInt(text) : undefined;
                      handleUpdateTrackedData('reps', val);
                    }}
                    keyboardType="number-pad"
                    placeholder="0"
                    placeholderTextColor={COLORS.text.tertiary}
                  />
                </View>
              )}
              {exercise.trackingTemplate.trackSets && (
                <View style={styles.inputGroup}>
                  <Typography variant="caption" color={COLORS.text.secondary} style={styles.inputLabel}>
                    Sets Completed
                  </Typography>
                  <TextInput
                    style={styles.input}
                    value={trackedData.sets?.toString() || ''}
                    onChangeText={(text) => {
                      const val = text ? parseInt(text) : undefined;
                      handleUpdateTrackedData('sets', val);
                    }}
                    keyboardType="number-pad"
                    placeholder="0"
                    placeholderTextColor={COLORS.text.tertiary}
                  />
                </View>
              )}
              {exercise.trackingTemplate.trackRpe && (
                <View style={styles.inputGroup}>
                  <Typography variant="caption" color={COLORS.text.secondary} style={styles.inputLabel}>
                    RPE (1-10)
                  </Typography>
                  <TextInput
                    style={styles.input}
                    value={trackedData.rpe?.toString() || ''}
                    onChangeText={(text) => {
                      const val = text ? parseFloat(text) : undefined;
                      if (val !== undefined && val >= 1 && val <= 10) {
                        handleUpdateTrackedData('rpe', val);
                      }
                    }}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor={COLORS.text.tertiary}
                  />
                </View>
              )}
            </View>
          </Card>
        ))}
      </View>
    );
  };

  const renderCardioDetail = () => {
    const day = program.schedule.logicalDays[task.dayIndex];
    if (!day) return null;

    const cardioSection = day.sections.find(
      s => s.type === 'cardio'
    ) as any;

    if (!cardioSection || !cardioSection.sessions) {
      return (
        <Card variant="outlined" style={styles.emptyCard}>
          <Typography variant="body" color={COLORS.text.secondary}>
            Cardio details not available
          </Typography>
        </Card>
      );
    }

    const session = cardioSection.sessions[0]; // Use first session for now

    return (
      <Card variant="default" style={styles.detailCard}>
        <View style={styles.detailRow}>
          <Typography variant="body" color={COLORS.text.secondary}>
            Duration (minutes)
          </Typography>
          <Typography variant="body">
            {session.durationMinutes || 'N/A'}
          </Typography>
        </View>
        {session.intensity && (
          <View style={styles.detailRow}>
            <Typography variant="body" color={COLORS.text.secondary}>
              Intensity
            </Typography>
            <Typography variant="body">{session.intensity}</Typography>
          </View>
        )}
        {session.heartRateRange && (
          <View style={styles.detailRow}>
            <Typography variant="body" color={COLORS.text.secondary}>
              Heart Rate
            </Typography>
            <Typography variant="body">{session.heartRateRange}</Typography>
          </View>
        )}

        {/* Tracking inputs */}
        <View style={styles.trackingInputs}>
          {session.trackingTemplate.trackDuration && (
            <View style={styles.inputGroup}>
              <Typography variant="caption" color={COLORS.text.secondary} style={styles.inputLabel}>
                Duration (minutes)
              </Typography>
              <TextInput
                style={styles.input}
                value={trackedData.duration?.toString() || ''}
                onChangeText={(text) => {
                  const val = text ? parseFloat(text) : undefined;
                  handleUpdateTrackedData('duration', val);
                }}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={COLORS.text.tertiary}
              />
            </View>
          )}
          {session.trackingTemplate.trackDistance && (
            <View style={styles.inputGroup}>
              <Typography variant="caption" color={COLORS.text.secondary} style={styles.inputLabel}>
                Distance (km)
              </Typography>
              <TextInput
                style={styles.input}
                value={trackedData.distance?.toString() || ''}
                onChangeText={(text) => {
                  const val = text ? parseFloat(text) : undefined;
                  handleUpdateTrackedData('distance', val);
                }}
                keyboardType="decimal-pad"
                placeholder="0.0"
                placeholderTextColor={COLORS.text.tertiary}
              />
            </View>
          )}
          {session.trackingTemplate.trackRpe && (
            <View style={styles.inputGroup}>
              <Typography variant="caption" color={COLORS.text.secondary} style={styles.inputLabel}>
                RPE (1-10)
              </Typography>
              <TextInput
                style={styles.input}
                value={trackedData.rpe?.toString() || ''}
                onChangeText={(text) => {
                  const val = text ? parseFloat(text) : undefined;
                  if (val !== undefined && val >= 1 && val <= 10) {
                    handleUpdateTrackedData('rpe', val);
                  }
                }}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={COLORS.text.tertiary}
              />
            </View>
          )}
        </View>
      </Card>
    );
  };

  const renderNutritionDetail = () => {
    const day = program.schedule.logicalDays[task.dayIndex];
    if (!day) return null;

    const nutritionSection = day.sections.find(
      s => s.type === 'nutrition'
    ) as any;

    if (!nutritionSection || !nutritionSection.meals) {
      return (
        <Card variant="outlined" style={styles.emptyCard}>
          <Typography variant="body" color={COLORS.text.secondary}>
            Meal plan details not available
          </Typography>
        </Card>
      );
    }

    return (
      <View style={styles.mealList}>
        {nutritionSection.meals.map((meal: any, idx: number) => (
          <Card key={meal.id || idx} variant="default" style={styles.mealCard}>
            <Typography variant="h4" style={styles.mealLabel}>
              {meal.label}
            </Typography>
            {meal.options && meal.options.length > 0 && (
              <View style={styles.optionsList}>
                {meal.options.map((option: any, optIdx: number) => (
                  <View key={option.id || optIdx} style={styles.option}>
                    <Typography variant="body" style={styles.optionLabel}>
                      {option.label}
                    </Typography>
                    {option.items && option.items.length > 0 && (
                      <View style={styles.itemsList}>
                        {option.items.map((item: any, itemIdx: number) => (
                          <Typography
                            key={itemIdx}
                            variant="caption"
                            color={COLORS.text.secondary}
                            style={styles.item}
                          >
                            • {item.name} {item.amount ? `(${item.amount})` : ''}
                          </Typography>
                        ))}
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
            {meal.trackingTemplate.trackPortionMultiplier && (
              <View style={styles.inputGroup}>
                <Typography variant="caption" color={COLORS.text.secondary} style={styles.inputLabel}>
                  Portion (0.5x, 1x, 1.5x, etc.)
                </Typography>
                <TextInput
                  style={styles.input}
                  value={trackedData.portionMultiplier?.toString() || ''}
                  onChangeText={(text) => {
                    const val = text ? parseFloat(text) : undefined;
                    handleUpdateTrackedData('portionMultiplier', val);
                  }}
                  keyboardType="decimal-pad"
                  placeholder="1.0"
                  placeholderTextColor={COLORS.text.tertiary}
                />
              </View>
            )}
          </Card>
        ))}
      </View>
    );
  };

  const renderRehabWarmupDetail = () => {
    const day = program.schedule.logicalDays[task.dayIndex];
    if (!day) return null;

    const section = day.sections.find(
      s => (s.type === 'rehab' || s.type === 'warmup') && s.id === task.ref.sourceId
    ) as any;

    if (!section || !section.exercises) {
      return (
        <Card variant="outlined" style={styles.emptyCard}>
          <Typography variant="body" color={COLORS.text.secondary}>
            Exercise details not available
          </Typography>
        </Card>
      );
    }

    return (
      <View style={styles.exerciseList}>
        {section.exercises.map((exercise: TrackableExercise, idx: number) => (
          <Card key={exercise.id || idx} variant="default" style={styles.exerciseCard}>
            <Typography variant="h4" style={styles.exerciseName}>
              {exercise.name}
            </Typography>
            {exercise.sets && exercise.reps && (
              <View style={styles.exerciseMeta}>
                <Typography variant="caption" color={COLORS.text.secondary}>
                  {exercise.sets} sets × {exercise.reps} reps
                </Typography>
              </View>
            )}
            {exercise.mediaLinks && exercise.mediaLinks.length > 0 && (
              <TouchableOpacity
                style={styles.mediaLink}
                onPress={() => {
                  console.log('Open media:', exercise.mediaLinks?.[0]);
                }}
              >
                <ExternalLink size={16} color={COLORS.primary.light} />
                <Typography variant="caption" color={COLORS.primary.light}>
                  View video
                </Typography>
              </TouchableOpacity>
            )}
          </Card>
        ))}
      </View>
    );
  };

  const renderDetail = () => {
    switch (task.category) {
      case 'workout':
        return renderWorkoutDetail();
      case 'cardio':
        return renderCardioDetail();
      case 'nutrition':
        return renderNutritionDetail();
      case 'rehab':
      case 'mobility':
      case 'stretching':
      case 'warmup':
        return renderRehabWarmupDetail();
      default:
        return (
          <Card variant="outlined" style={styles.emptyCard}>
            <Typography variant="body" color={COLORS.text.secondary}>
              {task.description || 'No additional details available'}
            </Typography>
          </Card>
        );
    }
  };

  if (loading) {
    return (
      <ScreenLayout>
        <View style={styles.container}>
          <Typography variant="body" color={COLORS.text.secondary}>
            Loading...
          </Typography>
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <ArrowLeft color={COLORS.text.primary} size={24} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Typography variant="h2">{task.title}</Typography>
            {task.description && (
              <Typography variant="caption" color={COLORS.text.secondary}>
                {task.description}
              </Typography>
            )}
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Completion toggle */}
          <Card variant="glass" style={styles.completionCard}>
            <TouchableOpacity
              onPress={handleToggleCompletion}
              style={styles.completionButton}
            >
              {completed ? (
                <CheckCircle size={24} color={COLORS.primary.light} />
              ) : (
                <Circle size={24} color={COLORS.text.tertiary} />
              )}
              <Typography variant="body" style={{ marginLeft: SPACING.s }}>
                {completed ? 'Completed' : 'Mark as completed'}
              </Typography>
            </TouchableOpacity>
          </Card>

          {/* Task details */}
          {renderDetail()}
        </ScrollView>
      </View>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.m,
    gap: SPACING.s,
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerContent: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.m,
    paddingBottom: SPACING.xxl,
  },
  completionCard: {
    marginBottom: SPACING.m,
    padding: SPACING.m,
  },
  completionButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailCard: {
    padding: SPACING.m,
    marginBottom: SPACING.m,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.s,
  },
  exerciseList: {
    gap: SPACING.m,
  },
  exerciseCard: {
    padding: SPACING.m,
    marginBottom: SPACING.m,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.s,
  },
  exerciseName: {
    fontWeight: '600',
    flex: 1,
  },
  exerciseMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.s,
    marginBottom: SPACING.s,
  },
  metaItem: {
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    backgroundColor: COLORS.background.tertiary,
    borderRadius: BORDER_RADIUS.s,
  },
  trackingInputs: {
    marginTop: SPACING.m,
    gap: SPACING.m,
  },
  inputGroup: {
    gap: SPACING.xs,
  },
  inputLabel: {
    marginBottom: SPACING.xs / 2,
  },
  input: {
    backgroundColor: COLORS.background.secondary,
    borderWidth: 1,
    borderColor: COLORS.background.tertiary,
    borderRadius: BORDER_RADIUS.s,
    padding: SPACING.s,
    color: COLORS.text.primary,
    fontSize: 16,
  },
  mealList: {
    gap: SPACING.m,
  },
  mealCard: {
    padding: SPACING.m,
    marginBottom: SPACING.m,
  },
  mealLabel: {
    fontWeight: '600',
    marginBottom: SPACING.s,
  },
  optionsList: {
    gap: SPACING.s,
    marginTop: SPACING.s,
  },
  option: {
    marginBottom: SPACING.s,
  },
  optionLabel: {
    fontWeight: '500',
    marginBottom: SPACING.xs,
  },
  itemsList: {
    marginLeft: SPACING.s,
  },
  item: {
    marginBottom: 2,
  },
  mediaLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.s,
  },
  emptyCard: {
    padding: SPACING.l,
    alignItems: 'center',
  },
});


