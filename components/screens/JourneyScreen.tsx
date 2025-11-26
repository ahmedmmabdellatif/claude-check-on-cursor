// JourneyScreen.tsx - Today/Journey view with trackable daily tasks

import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { ScreenLayout } from '../ScreenLayout';
import { Typography } from '../ui/Typography';
import { Card } from '../ui/Card';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import { ProgramForTracking } from '../../shared/programTrackingSchema';
import { JourneyTimeline, JourneyDay, JourneyTask, JourneyTaskTimeOfDay } from '../../app/types/journey';
import { buildJourneyTimeline } from '../../app/lib/buildJourneyTimeline';
import { getJourneyProgress, toggleTaskCompletion } from '../../app/lib/journeyProgress';
import { loadJourneyTimeline, saveJourneyTimeline } from '../../app/lib/journeyStorage';
import { JourneyTaskCard } from '../journey/JourneyTaskCard';
import { TaskDetailScreen } from './TaskDetailScreen';

interface JourneyScreenProps {
  program: ProgramForTracking | null;
  programId: string;
  onBack: () => void;
}

export const JourneyScreen: React.FC<JourneyScreenProps> = ({ program, programId, onBack }) => {
  const [timeline, setTimeline] = useState<JourneyTimeline | null>(null);
  const [progress, setProgress] = useState<Record<string, boolean>>({});
  const [currentDayIndex, setCurrentDayIndex] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<JourneyTask | null>(null);

  // Load or build timeline
  useEffect(() => {
    if (!program) {
      setLoading(false);
      return;
    }

    const initializeTimeline = async () => {
      try {
        // Try to load saved timeline
        let savedTimeline = await loadJourneyTimeline(programId);
        
        // If no saved timeline or program changed, build new one
        if (!savedTimeline || savedTimeline.programId !== programId) {
          savedTimeline = buildJourneyTimeline(program, programId, {
            startDateIso: new Date().toISOString().split('T')[0],
            totalWeeks: 4
          });
          await saveJourneyTimeline(programId, savedTimeline);
        }
        
        setTimeline(savedTimeline);
        
        // Calculate today's day index
        if (savedTimeline.startDateIso) {
          const startDate = new Date(savedTimeline.startDateIso);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          startDate.setHours(0, 0, 0, 0);
          const diffDays = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
          const dayIndex = Math.max(0, Math.min(diffDays, savedTimeline.totalDays - 1));
          setCurrentDayIndex(dayIndex);
        } else {
          setCurrentDayIndex(0);
        }
      } catch (error) {
        console.error('[JourneyScreen] Error initializing timeline:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeTimeline();
  }, [program, programId]);

  // Load progress
  useEffect(() => {
    if (!programId) return;

    const loadProgress = async () => {
      try {
        const progressData = await getJourneyProgress(programId);
        const completedMap: Record<string, boolean> = {};
        Object.entries(progressData).forEach(([taskId, taskProgress]) => {
          completedMap[taskId] = taskProgress.completed || false;
        });
        setProgress(completedMap);
      } catch (error) {
        console.error('[JourneyScreen] Error loading progress:', error);
      }
    };

    loadProgress();
  }, [programId]);

  // Handle task toggle
  const handleTaskToggle = async (taskId: string) => {
    try {
      const newCompleted = await toggleTaskCompletion(programId, taskId);
      setProgress(prev => ({
        ...prev,
        [taskId]: newCompleted
      }));
    } catch (error) {
      console.error('[JourneyScreen] Error toggling task:', error);
    }
  };

  // Group tasks by time of day
  const groupTasksByTime = (tasks: JourneyTask[]) => {
    const groups: Record<JourneyTaskTimeOfDay, JourneyTask[]> = {
      morning: [],
      midday: [],
      evening: [],
      anytime: []
    };
    
    tasks.forEach(task => {
      groups[task.timeOfDay].push(task);
    });
    
    return groups;
  };

  if (loading) {
    return (
      <ScreenLayout>
        <View style={styles.container}>
          <Typography variant="body" color={COLORS.text.secondary}>
            Loading journey...
          </Typography>
        </View>
      </ScreenLayout>
    );
  }

  if (!program || !timeline) {
    return (
      <ScreenLayout>
        <View style={styles.container}>
          <Card variant="outlined" style={styles.emptyCard}>
            <Typography variant="h3" style={{ marginBottom: SPACING.s }}>
              No Journey Available
            </Typography>
            <Typography variant="body" color={COLORS.text.secondary} style={{ textAlign: 'center', marginBottom: SPACING.m }}>
              Please upload and parse a fitness plan PDF first to view your daily journey.
            </Typography>
            <Typography variant="caption" color={COLORS.text.tertiary} style={{ textAlign: 'center' }}>
              Go to Home to upload a PDF, or Documents to select an existing plan.
            </Typography>
          </Card>
        </View>
      </ScreenLayout>
    );
  }

  const currentDay = timeline.days[currentDayIndex];
  if (!currentDay) {
    return (
      <ScreenLayout>
        <View style={styles.container}>
          <Typography variant="body" color={COLORS.text.secondary}>
            Invalid day index
          </Typography>
        </View>
      </ScreenLayout>
    );
  }

  const taskGroups = groupTasksByTime(currentDay.tasks);
  const totalTasks = currentDay.tasks.length;
  const completedTasks = currentDay.tasks.filter(t => progress[t.id]).length;

  // Show task detail screen if task is selected
  if (selectedTask) {
    return (
      <TaskDetailScreen
        task={selectedTask}
        program={program}
        programId={programId}
        onBack={() => setSelectedTask(null)}
      />
    );
  }

  return (
    <ScreenLayout>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <ChevronLeft color={COLORS.text.primary} size={24} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Typography variant="h2">{timeline.title}</Typography>
            <Typography variant="caption" color={COLORS.text.secondary}>
              {currentDay.label} {currentDay.dateIso ? `• ${currentDay.dateIso}` : ''}
            </Typography>
          </View>
        </View>

        {/* Progress Summary */}
        <Card variant="glass" style={styles.progressCard}>
          <View style={styles.progressRow}>
            <Calendar color={COLORS.primary.light} size={20} />
            <Typography variant="body" style={{ flex: 1 }}>
              {completedTasks} of {totalTasks} tasks completed
            </Typography>
            <Typography variant="h3" color={COLORS.primary.light}>
              {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%
            </Typography>
          </View>
        </Card>

        {/* Day Navigation */}
        {timeline.days.length > 1 && (
          <View style={styles.dayNavigation}>
            <TouchableOpacity
              onPress={() => setCurrentDayIndex(Math.max(0, currentDayIndex - 1))}
              disabled={currentDayIndex === 0}
              style={[styles.navButton, currentDayIndex === 0 && styles.navButtonDisabled]}
            >
              <ChevronLeft size={20} color={currentDayIndex === 0 ? COLORS.text.tertiary : COLORS.primary.light} />
            </TouchableOpacity>
            
            <View style={styles.daySelector}>
              {timeline.days.slice(Math.max(0, currentDayIndex - 2), currentDayIndex + 3).map((day, idx) => {
                const actualIndex = Math.max(0, currentDayIndex - 2) + idx;
                const isSelected = actualIndex === currentDayIndex;
                return (
                  <TouchableOpacity
                    key={day.dayIndex}
                    onPress={() => setCurrentDayIndex(actualIndex)}
                    style={[styles.dayButton, isSelected && styles.dayButtonActive]}
                  >
                    <Typography
                      variant="caption"
                      color={isSelected ? COLORS.primary.light : COLORS.text.secondary}
                      style={{ fontWeight: isSelected ? '600' : '400' }}
                    >
                      Day {day.dayIndex + 1}
                    </Typography>
                  </TouchableOpacity>
                );
              })}
            </View>
            
            <TouchableOpacity
              onPress={() => setCurrentDayIndex(Math.min(timeline.days.length - 1, currentDayIndex + 1))}
              disabled={currentDayIndex >= timeline.days.length - 1}
              style={[styles.navButton, currentDayIndex >= timeline.days.length - 1 && styles.navButtonDisabled]}
            >
              <ChevronRight size={20} color={currentDayIndex >= timeline.days.length - 1 ? COLORS.text.tertiary : COLORS.primary.light} />
            </TouchableOpacity>
          </View>
        )}

        {/* Tasks by Time of Day */}
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {(['morning', 'midday', 'evening', 'anytime'] as JourneyTaskTimeOfDay[]).map(timeOfDay => {
            const tasks = taskGroups[timeOfDay];
            if (tasks.length === 0) return null;

            return (
              <View key={timeOfDay} style={styles.timeSection}>
                <Typography variant="h3" style={styles.timeSectionTitle}>
                  {timeOfDay.charAt(0).toUpperCase() + timeOfDay.slice(1)}
                </Typography>
                {tasks.map(task => (
                  <JourneyTaskCard
                    key={task.id}
                    task={task}
                    completed={progress[task.id] || false}
                    onToggle={() => handleTaskToggle(task.id)}
                    onPress={() => setSelectedTask(task)}
                  />
                ))}
              </View>
            );
          })}

          {currentDay.tasks.length === 0 && (
            <Card variant="outlined" style={styles.emptyCard}>
              <Typography variant="body" color={COLORS.text.secondary}>
                No tasks scheduled for this day.
              </Typography>
            </Card>
          )}
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
  progressCard: {
    marginHorizontal: SPACING.m,
    marginBottom: SPACING.m,
    padding: SPACING.m,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
  },
  dayNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.m,
    marginBottom: SPACING.m,
    gap: SPACING.s,
  },
  navButton: {
    padding: SPACING.xs,
  },
  navButtonDisabled: {
    opacity: 0.3,
  },
  daySelector: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  dayButton: {
    paddingHorizontal: SPACING.s,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.s,
    backgroundColor: COLORS.background.secondary,
  },
  dayButtonActive: {
    backgroundColor: COLORS.primary.main + '20',
  },
  scrollContent: {
    padding: SPACING.m,
    paddingBottom: SPACING.xxl,
  },
  timeSection: {
    marginBottom: SPACING.l,
  },
  timeSectionTitle: {
    marginBottom: SPACING.s,
    textTransform: 'capitalize',
  },
  emptyCard: {
    padding: SPACING.l,
    alignItems: 'center',
  },
});

