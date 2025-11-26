// JourneyView.tsx - Daily journey view with trackable tasks
// Uses ProgramForTracking schema for calendar-ready, tracking-first display

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Calendar, ChevronRight, CheckCircle, Circle } from 'lucide-react-native';
import { Card } from '../ui/Card';
import { Typography } from '../ui/Typography';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import { ProgramForTracking, ProgramDay, DaySection } from '../../shared/programTrackingSchema';
import { WorkoutSectionCard } from './WorkoutSectionCard';
import { CardioSectionCard } from './CardioSectionCard';
import { NutritionSectionCard } from './NutritionSectionCard';
import { RehabSectionCard } from './RehabSectionCard';
import { WarmupSectionCard } from './WarmupSectionCard';
import { EducationSectionCard } from './EducationSectionCard';
import { AdminSectionCard } from './AdminSectionCard';

interface JourneyViewProps {
  program: ProgramForTracking;
}

export const JourneyView: React.FC<JourneyViewProps> = ({ program }) => {
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);
  const days = program.schedule.logicalDays || [];

  if (days.length === 0) {
    return (
      <View style={styles.container}>
        <Card variant="outlined" style={styles.emptyCard}>
          <Typography variant="h3" style={{ marginBottom: SPACING.s }}>No Schedule Available</Typography>
          <Typography variant="body" color={COLORS.text.secondary}>
            This program doesn't have a daily schedule yet.
          </Typography>
        </Card>
      </View>
    );
  }

  const selectedDay = days[selectedDayIndex];

  const renderSection = (section: DaySection, sectionIndex: number) => {
    switch (section.type) {
      case 'workout':
        return <WorkoutSectionCard key={section.id} section={section} />;
      case 'cardio':
        return <CardioSectionCard key={section.id} section={section} />;
      case 'nutrition':
        return <NutritionSectionCard key={section.id} section={section} />;
      case 'rehab':
        return <RehabSectionCard key={section.id} section={section} />;
      case 'warmup':
        return <WarmupSectionCard key={section.id} section={section} />;
      case 'education':
        return <EducationSectionCard key={section.id} section={section} />;
      case 'admin':
        return <AdminSectionCard key={section.id} section={section} />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Day Selector */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.daySelector}
      >
        {days.map((day, index) => (
          <TouchableOpacity
            key={day.id}
            onPress={() => setSelectedDayIndex(index)}
            style={[
              styles.dayButton,
              selectedDayIndex === index && styles.dayButtonActive
            ]}
          >
            <Calendar 
              size={18} 
              color={selectedDayIndex === index ? COLORS.primary.light : COLORS.text.secondary} 
            />
            <Typography 
              variant="caption" 
              color={selectedDayIndex === index ? COLORS.primary.light : COLORS.text.secondary}
              style={styles.dayButtonText}
            >
              {day.label}
            </Typography>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Selected Day Content */}
      <ScrollView contentContainerStyle={styles.dayContent}>
        <View style={styles.dayHeader}>
          <Typography variant="h2">{selectedDay.label}</Typography>
          {selectedDay.tags.length > 0 && (
            <View style={styles.tags}>
              {selectedDay.tags.map((tag, idx) => (
                <View key={idx} style={styles.tag}>
                  <Typography variant="caption" color={COLORS.primary.light}>
                    {tag}
                  </Typography>
                </View>
              ))}
            </View>
          )}
        </View>

        {selectedDay.sections.map((section, sectionIndex) => 
          renderSection(section, sectionIndex)
        )}

        {selectedDay.sections.length === 0 && (
          <Card variant="outlined" style={styles.emptyCard}>
            <Typography variant="body" color={COLORS.text.secondary}>
              No sections scheduled for this day.
            </Typography>
          </Card>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  daySelector: {
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.s,
    gap: SPACING.s,
  },
  dayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.s,
    borderRadius: BORDER_RADIUS.m,
    backgroundColor: COLORS.background.secondary,
    borderWidth: 1,
    borderColor: COLORS.background.tertiary,
  },
  dayButtonActive: {
    backgroundColor: COLORS.primary.main + '20',
    borderColor: COLORS.primary.light,
  },
  dayButtonText: {
    fontWeight: '600',
  },
  dayContent: {
    padding: SPACING.m,
    paddingBottom: SPACING.xxl,
  },
  dayHeader: {
    marginBottom: SPACING.m,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginTop: SPACING.s,
  },
  tag: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    paddingHorizontal: SPACING.s,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.s,
  },
  emptyCard: {
    padding: SPACING.l,
    alignItems: 'center',
  },
});

