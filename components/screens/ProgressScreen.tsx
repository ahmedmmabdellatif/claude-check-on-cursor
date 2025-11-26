// ProgressScreen.tsx
// Progress & Adherence Intelligence view

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { ChevronLeft, TrendingUp } from 'lucide-react-native';
import { ScreenLayout } from '../ScreenLayout';
import { Typography } from '../ui/Typography';
import { Card } from '../ui/Card';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import { ProgramForTracking } from '../../shared/programTrackingSchema';
import { JourneyTimeline, JourneyProgress } from '../../app/types/journey';
import { loadJourneyTimeline } from '../../app/lib/journeyStorage';
import { getJourneyProgress } from '../../app/lib/journeyProgress';
import { calcAdherenceSummary } from '../../app/lib/calcAdherence';
import { AdherenceCalendar } from '../progress/AdherenceCalendar';
import { CategorySummarySection } from '../progress/CategorySummarySection';

interface ProgressScreenProps {
  program: ProgramForTracking | null;
  programId: string | null;
  onBack: () => void;
}

export const ProgressScreen: React.FC<ProgressScreenProps> = ({ program, programId, onBack }) => {
  const [timeline, setTimeline] = useState<JourneyTimeline | null>(null);
  const [progress, setProgress] = useState<JourneyProgress>({});
  const [loading, setLoading] = useState(true);
  const [adherenceSummary, setAdherenceSummary] = useState<ReturnType<typeof calcAdherenceSummary> | null>(null);

  // Load timeline and progress
  useEffect(() => {
    if (!programId) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        const [loadedTimeline, loadedProgress] = await Promise.all([
          loadJourneyTimeline(programId),
          getJourneyProgress(programId),
        ]);

        setTimeline(loadedTimeline);
        setProgress(loadedProgress);
      } catch (error) {
        console.error('[ProgressScreen] Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [programId]);

  // Calculate adherence when timeline or progress changes
  useEffect(() => {
    if (timeline && progress) {
      const summary = calcAdherenceSummary(timeline, progress);
      setAdherenceSummary(summary);
    }
  }, [timeline, progress]);

  if (loading) {
    return (
      <ScreenLayout>
        <View style={styles.container}>
          <Typography variant="body" color={COLORS.text.secondary}>
            Loading progress...
          </Typography>
        </View>
      </ScreenLayout>
    );
  }

  if (!program || !programId || !timeline) {
    return (
      <ScreenLayout>
        <View style={styles.container}>
          <Card variant="outlined" style={styles.emptyCard}>
            <Typography variant="h3" style={{ marginBottom: SPACING.s }}>
              No Progress Data Yet
            </Typography>
            <Typography variant="body" color={COLORS.text.secondary} style={{ marginBottom: SPACING.m, textAlign: 'center' }}>
              Complete some tasks in the Journey tab to see your progress here.
            </Typography>
            <Typography variant="caption" color={COLORS.text.tertiary} style={{ marginBottom: SPACING.m, textAlign: 'center' }}>
              If you haven't uploaded a plan yet, go to Home to get started.
            </Typography>
            <TouchableOpacity
              onPress={onBack}
              style={styles.ctaButton}
            >
              <Typography variant="body" color={COLORS.primary.light}>
                Go to Documents
              </Typography>
            </TouchableOpacity>
          </Card>
        </View>
      </ScreenLayout>
    );
  }

  if (!adherenceSummary) {
    return (
      <ScreenLayout>
        <View style={styles.container}>
          <Typography variant="body" color={COLORS.text.secondary}>
            Calculating adherence...
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
            <ChevronLeft color={COLORS.text.primary} size={24} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Typography variant="h2">Progress & Adherence</Typography>
            <Typography variant="caption" color={COLORS.text.secondary}>
              {timeline.title}
            </Typography>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Overview Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <TrendingUp color={COLORS.primary.light} size={20} />
              <Typography variant="h3" style={styles.sectionTitle}>
                Overview
              </Typography>
            </View>

            {/* Overall Completion */}
            <Card variant="glass" style={styles.overviewCard}>
              <Typography variant="caption" color={COLORS.text.secondary} style={styles.overviewLabel}>
                Overall Completion
              </Typography>
              <Typography variant="h1" color={COLORS.primary.light} style={styles.overviewValue}>
                {Math.round(adherenceSummary.overallCompletionRate * 100)}%
              </Typography>
            </Card>

            {/* Recent Windows */}
            <View style={styles.metricsRow}>
              <Card variant="glass" style={styles.metricCard}>
                <Typography variant="caption" color={COLORS.text.secondary}>
                  Last 7 Days
                </Typography>
                <Typography variant="h3" color={COLORS.primary.light}>
                  {Math.round(adherenceSummary.last7DaysCompletionRate * 100)}%
                </Typography>
              </Card>
              <Card variant="glass" style={styles.metricCard}>
                <Typography variant="caption" color={COLORS.text.secondary}>
                  Last 30 Days
                </Typography>
                <Typography variant="h3" color={COLORS.primary.light}>
                  {Math.round(adherenceSummary.last30DaysCompletionRate * 100)}%
                </Typography>
              </Card>
            </View>

            {/* Streaks */}
            <Card variant="glass" style={styles.streakCard}>
              <View style={styles.streakRow}>
                <View style={styles.streakItem}>
                  <Typography variant="caption" color={COLORS.text.secondary}>
                    Current Streak
                  </Typography>
                  <Typography variant="h3" color={COLORS.status.success}>
                    {adherenceSummary.streakInfo.currentStreakDays} days
                  </Typography>
                </View>
                <View style={styles.streakItem}>
                  <Typography variant="caption" color={COLORS.text.secondary}>
                    Best Streak
                  </Typography>
                  <Typography variant="h3" color={COLORS.primary.light}>
                    {adherenceSummary.streakInfo.bestStreakDays} days
                  </Typography>
                </View>
              </View>
              <Typography variant="caption" color={COLORS.text.tertiary} style={styles.streakNote}>
                {adherenceSummary.streakInfo.streakThreshold * 100}% completion required
              </Typography>
            </Card>

            {/* Red Flags */}
            {adherenceSummary.redFlags.length > 0 && (
              <Card variant="outlined" style={styles.redFlagCard}>
                <Typography variant="caption" color={COLORS.status.error} style={{ marginBottom: SPACING.xs }}>
                  ⚠️ {adherenceSummary.redFlags.length} day(s) with low adherence
                </Typography>
                <Typography variant="caption" color={COLORS.text.secondary}>
                  Consider reviewing these days to identify patterns.
                </Typography>
              </Card>
            )}
          </View>

          {/* Calendar Section */}
          <View style={styles.section}>
            <Typography variant="h3" style={styles.sectionTitle}>
              Calendar View
            </Typography>
            <AdherenceCalendar dayMetrics={adherenceSummary.dayMetrics} />
          </View>

          {/* Category Breakdown */}
          <View style={styles.section}>
            <CategorySummarySection categorySummary={adherenceSummary.categorySummary} />
          </View>
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
    paddingBottom: SPACING.xxl,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
    paddingHorizontal: SPACING.m,
    marginBottom: SPACING.m,
  },
  sectionTitle: {
    textTransform: 'capitalize',
  },
  overviewCard: {
    marginHorizontal: SPACING.m,
    marginBottom: SPACING.m,
    padding: SPACING.l,
    alignItems: 'center',
  },
  overviewLabel: {
    marginBottom: SPACING.xs,
  },
  overviewValue: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: SPACING.s,
    paddingHorizontal: SPACING.m,
    marginBottom: SPACING.m,
  },
  metricCard: {
    flex: 1,
    padding: SPACING.m,
    alignItems: 'center',
  },
  streakCard: {
    marginHorizontal: SPACING.m,
    marginBottom: SPACING.m,
    padding: SPACING.m,
  },
  streakRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.xs,
  },
  streakItem: {
    alignItems: 'center',
  },
  streakNote: {
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  redFlagCard: {
    marginHorizontal: SPACING.m,
    padding: SPACING.m,
    borderColor: COLORS.status.error + '40',
    backgroundColor: COLORS.status.error + '10',
  },
  emptyCard: {
    padding: SPACING.xl,
    alignItems: 'center',
    margin: SPACING.m,
  },
  ctaButton: {
    padding: SPACING.m,
    backgroundColor: COLORS.primary.main + '20',
    borderRadius: BORDER_RADIUS.m,
    marginTop: SPACING.s,
  },
});

