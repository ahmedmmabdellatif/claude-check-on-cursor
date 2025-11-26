// AdherenceCalendar.tsx
// Calendar view with color-coded adherence per day

import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Typography } from '../ui/Typography';
import { Card } from '../ui/Card';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import { DayAdherenceMetrics, JourneyTaskCategory } from '../../app/types/journey';

interface AdherenceCalendarProps {
  dayMetrics: DayAdherenceMetrics[];
  onDayPress?: (day: DayAdherenceMetrics) => void;
}

const ADHERENCE_COLORS = {
  none: COLORS.background.tertiary,
  low: COLORS.status.error,
  medium: COLORS.status.warning,
  high: COLORS.status.success,
};

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const AdherenceCalendar: React.FC<AdherenceCalendarProps> = ({ dayMetrics, onDayPress }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDay, setSelectedDay] = useState<DayAdherenceMetrics | null>(null);

  // Get metrics for a specific date
  const getMetricsForDate = (dateKey: string): DayAdherenceMetrics | undefined => {
    return dayMetrics.find(d => d.dateKey === dateKey);
  };

  // Get first day of month and number of days
  const getMonthData = () => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { firstDay, lastDay, daysInMonth, startingDayOfWeek };
  };

  const { daysInMonth, startingDayOfWeek } = getMonthData();

  // Navigate months
  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Format date key for a day
  const getDateKey = (day: number): string => {
    const date = new Date(currentYear, currentMonth, day);
    return date.toISOString().split('T')[0];
  };

  const handleDayPress = (day: number) => {
    const dateKey = getDateKey(day);
    const metrics = getMetricsForDate(dateKey);
    if (metrics) {
      setSelectedDay(metrics);
      if (onDayPress) {
        onDayPress(metrics);
      }
    }
  };

  // Render calendar grid
  const renderCalendarGrid = () => {
    const cells: React.ReactNode[] = [];
    
    // Day names header
    DAY_NAMES.forEach(dayName => {
      cells.push(
        <View key={`header-${dayName}`} style={styles.dayHeader}>
          <Typography variant="caption" color={COLORS.text.tertiary}>
            {dayName}
          </Typography>
        </View>
      );
    });

    // Empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      cells.push(<View key={`empty-${i}`} style={styles.dayCell} />);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = getDateKey(day);
      const metrics = getMetricsForDate(dateKey);
      const adherenceLevel = metrics?.adherenceLevel || 'none';
      const color = ADHERENCE_COLORS[adherenceLevel];
      const hasData = !!metrics;

      cells.push(
        <TouchableOpacity
          key={`day-${day}`}
          style={[styles.dayCell, hasData && { backgroundColor: color + '40' }]}
          onPress={() => handleDayPress(day)}
          disabled={!hasData}
        >
          <Typography
            variant="caption"
            style={{
              color: hasData ? COLORS.text.primary : COLORS.text.tertiary,
              fontWeight: hasData ? '600' : '400',
            }}
          >
            {day}
          </Typography>
          {hasData && metrics.completionRate > 0 && (
            <View style={[styles.completionDot, { backgroundColor: color }]} />
          )}
        </TouchableOpacity>
      );
    }

    return cells;
  };

  return (
    <View style={styles.container}>
      {/* Month Header */}
      <View style={styles.monthHeader}>
        <TouchableOpacity onPress={goToPreviousMonth} style={styles.navButton}>
          <ChevronLeft size={20} color={COLORS.text.secondary} />
        </TouchableOpacity>
        <Typography variant="h3">
          {MONTH_NAMES[currentMonth]} {currentYear}
        </Typography>
        <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}>
          <ChevronRight size={20} color={COLORS.text.secondary} />
        </TouchableOpacity>
      </View>

      {/* Calendar Grid */}
      <View style={styles.calendarGrid}>
        {renderCalendarGrid()}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: ADHERENCE_COLORS.none }]} />
          <Typography variant="caption" color={COLORS.text.secondary}>
            None
          </Typography>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: ADHERENCE_COLORS.low }]} />
          <Typography variant="caption" color={COLORS.text.secondary}>
            Low
          </Typography>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: ADHERENCE_COLORS.medium }]} />
          <Typography variant="caption" color={COLORS.text.secondary}>
            Medium
          </Typography>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: ADHERENCE_COLORS.high }]} />
          <Typography variant="caption" color={COLORS.text.secondary}>
            High
          </Typography>
        </View>
      </View>

      {/* Day Detail Modal */}
      <Modal
        visible={!!selectedDay}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedDay(null)}
      >
        <View style={styles.modalOverlay}>
          <Card variant="glass" style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Typography variant="h3">Day Details</Typography>
              <TouchableOpacity onPress={() => setSelectedDay(null)}>
                <Typography variant="body" color={COLORS.primary.light}>
                  Close
                </Typography>
              </TouchableOpacity>
            </View>

            {selectedDay && (
              <>
                <Typography variant="body" color={COLORS.text.secondary} style={styles.modalDate}>
                  {new Date(selectedDay.dateKey).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Typography>

                <View style={styles.modalStats}>
                  <View style={styles.statRow}>
                    <Typography variant="body">Completion Rate</Typography>
                    <Typography variant="h3" color={COLORS.primary.light}>
                      {Math.round(selectedDay.completionRate * 100)}%
                    </Typography>
                  </View>
                  <View style={styles.statRow}>
                    <Typography variant="body">Tasks Completed</Typography>
                    <Typography variant="body" color={COLORS.text.secondary}>
                      {selectedDay.completedTasks} / {selectedDay.plannedTasks}
                    </Typography>
                  </View>
                </View>

                {/* Category Breakdown */}
                {Object.keys(selectedDay.categories).length > 0 && (
                  <View style={styles.categoryBreakdown}>
                    <Typography variant="h4" style={styles.categoryTitle}>
                      By Category
                    </Typography>
                    {Object.entries(selectedDay.categories).map(([category, stats]) => (
                      <View key={category} style={styles.categoryRow}>
                        <Typography variant="body" style={{ textTransform: 'capitalize' }}>
                          {category}
                        </Typography>
                        <Typography variant="body" color={COLORS.text.secondary}>
                          {stats.completed} / {stats.planned} ({Math.round(stats.completionRate * 100)}%)
                        </Typography>
                      </View>
                    ))}
                  </View>
                )}
              </>
            )}
          </Card>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: SPACING.m,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.m,
  },
  navButton: {
    padding: SPACING.xs,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: SPACING.m,
  },
  dayHeader: {
    width: '14.28%',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BORDER_RADIUS.s,
    marginBottom: SPACING.xs,
    position: 'relative',
  },
  completionDot: {
    position: 'absolute',
    bottom: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: SPACING.s,
    borderTopWidth: 1,
    borderTopColor: COLORS.background.tertiary,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    padding: SPACING.l,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.m,
  },
  modalDate: {
    marginBottom: SPACING.m,
  },
  modalStats: {
    marginBottom: SPACING.m,
    gap: SPACING.s,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBreakdown: {
    marginTop: SPACING.m,
    paddingTop: SPACING.m,
    borderTopWidth: 1,
    borderTopColor: COLORS.background.tertiary,
  },
  categoryTitle: {
    marginBottom: SPACING.s,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
});

