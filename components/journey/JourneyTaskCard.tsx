// JourneyTaskCard.tsx - Renders a single trackable task card

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { CheckCircle, Circle, ChevronRight } from 'lucide-react-native';
import { Card } from '../ui/Card';
import { Typography } from '../ui/Typography';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import { JourneyTask, JourneyTaskCategory } from '../../app/types/journey';

interface JourneyTaskCardProps {
  task: JourneyTask;
  completed: boolean;
  onToggle: () => void;
  onPress?: () => void;
}

const categoryColors: Record<JourneyTaskCategory, string> = {
  workout: COLORS.primary.light,
  cardio: '#ef4444',
  rehab: '#f59e0b',
  mobility: '#8b5cf6',
  stretching: '#06b6d4',
  nutrition: '#10b981',
  education: '#6366f1',
  checkin: '#64748b',
};

const categoryLabels: Record<JourneyTaskCategory, string> = {
  workout: 'Workout',
  cardio: 'Cardio',
  rehab: 'Rehab',
  mobility: 'Mobility',
  stretching: 'Stretch',
  nutrition: 'Nutrition',
  education: 'Education',
  checkin: 'Check-in',
};

export const JourneyTaskCard: React.FC<JourneyTaskCardProps> = ({
  task,
  completed,
  onToggle,
  onPress
}) => {
  const categoryColor = categoryColors[task.category] || COLORS.text.secondary;
  const categoryLabel = categoryLabels[task.category] || task.category;

  return (
    <TouchableOpacity
      onPress={onPress || onToggle}
      activeOpacity={0.7}
    >
      <Card variant="default" style={[styles.card, completed && styles.cardCompleted]}>
        <View style={styles.content}>
          <TouchableOpacity
            onPress={onToggle}
            style={styles.checkbox}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {completed ? (
              <CheckCircle size={24} color={categoryColor} />
            ) : (
              <Circle size={24} color={COLORS.text.tertiary} />
            )}
          </TouchableOpacity>

          <View style={styles.textContainer}>
            <Typography variant="label" style={[styles.title, completed && styles.titleCompleted]}>
              {task.title}
            </Typography>
            
            {task.description && (
              <Typography variant="caption" color={COLORS.text.secondary} numberOfLines={2}>
                {task.description}
              </Typography>
            )}

            {task.meta && (
              <View style={styles.meta}>
                {task.meta.muscleGroups && task.meta.muscleGroups.length > 0 && (
                  <View style={styles.metaItem}>
                    <Typography variant="caption" color={COLORS.text.secondary}>
                      {task.meta.muscleGroups.join(', ')}
                    </Typography>
                  </View>
                )}
                {task.meta.durationMinutes && (
                  <View style={styles.metaItem}>
                    <Typography variant="caption" color={COLORS.text.secondary}>
                      {task.meta.durationMinutes} min
                    </Typography>
                  </View>
                )}
                {task.meta.sets && task.meta.reps && (
                  <View style={styles.metaItem}>
                    <Typography variant="caption" color={COLORS.text.secondary}>
                      {task.meta.sets}x{task.meta.reps}
                    </Typography>
                  </View>
                )}
              </View>
            )}

            <View style={styles.footer}>
              <View style={[styles.categoryTag, { backgroundColor: categoryColor + '20' }]}>
                <Typography variant="caption" style={{ color: categoryColor }}>
                  {categoryLabel}
                </Typography>
              </View>
              <Typography variant="caption" color={COLORS.text.tertiary}>
                {task.timeOfDay}
              </Typography>
            </View>
          </View>

          {onPress && (
            <ChevronRight size={20} color={COLORS.text.tertiary} />
          )}
        </View>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: SPACING.s,
  },
  cardCompleted: {
    opacity: 0.6,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.s,
  },
  checkbox: {
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
    gap: SPACING.xs,
  },
  title: {
    fontWeight: '600',
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
  },
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginTop: SPACING.xs / 2,
  },
  metaItem: {
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    backgroundColor: COLORS.background.tertiary,
    borderRadius: BORDER_RADIUS.s,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.xs / 2,
  },
  categoryTag: {
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.s,
  },
});

