// CardioSection.tsx - Shows cardio_sessions with weekly progression

import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Heart, TrendingUp } from 'lucide-react-native';
import { Card } from '../ui/Card';
import { Typography } from '../ui/Typography';
import { COLORS, SPACING } from '../../constants/theme';
import { UniversalFitnessPlan } from '../../constants/fitnessTypes';
import { getArray, getString, getObject } from '../../utils/safe';

interface CardioSectionProps {
  plan: UniversalFitnessPlan;
}

export const CardioSection: React.FC<CardioSectionProps> = ({ plan }) => {
  const cardioSessions = getArray(plan.cardio_sessions);

  if (cardioSessions.length === 0) {
    return (
      <View style={styles.container}>
        <Card variant="outlined" style={styles.emptyCard}>
          <Typography variant="h3" style={{ marginBottom: SPACING.s }}>No Cardio Data</Typography>
          <Typography variant="body" color={COLORS.text.secondary}>
            No cardio sessions found in this plan.
          </Typography>
        </Card>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Typography variant="h2" style={styles.title}>Cardio Sessions</Typography>

      {cardioSessions.map((session, idx) => {
        const weeklyProg = getObject(session.weekly_progression);
        return (
          <Card key={idx} variant="outlined" style={styles.sessionCard}>
            <View style={styles.header}>
              <Heart color={COLORS.primary.light} size={20} />
              <Typography variant="h3">
                {getString(session.name || session.type) || `Cardio Session ${idx + 1}`}
              </Typography>
            </View>

            {/* Base Info */}
            {getString(session.duration) && (
              <View style={styles.infoRow}>
                <Typography variant="label">Duration</Typography>
                <Typography variant="body" color={COLORS.text.secondary}>
                  {getString(session.duration)}
                </Typography>
              </View>
            )}
            {getString(session.frequency) && (
              <View style={styles.infoRow}>
                <Typography variant="label">Frequency</Typography>
                <Typography variant="body" color={COLORS.text.secondary}>
                  {getString(session.frequency)}
                </Typography>
              </View>
            )}
            {getString(session.intensity) && (
              <View style={styles.infoRow}>
                <Typography variant="label">Intensity</Typography>
                <Typography variant="body" color={COLORS.text.secondary}>
                  {getString(session.intensity)}
                </Typography>
              </View>
            )}
            {getString(session.heart_rate) && (
              <View style={styles.infoRow}>
                <Typography variant="label">Heart Rate</Typography>
                <Typography variant="body" color={COLORS.text.secondary}>
                  {getString(session.heart_rate)}
                </Typography>
              </View>
            )}

            {/* Weekly Progression */}
            {Object.keys(weeklyProg).length > 0 && (
              <View style={styles.progressionContainer}>
                <View style={styles.progressionHeader}>
                  <TrendingUp color={COLORS.primary.light} size={18} />
                  <Typography variant="label">Weekly Progression</Typography>
                </View>
                {Object.entries(weeklyProg)
                  .sort(([a], [b]) => {
                    const numA = parseInt(a.replace(/\D/g, '')) || 0;
                    const numB = parseInt(b.replace(/\D/g, '')) || 0;
                    return numA - numB;
                  })
                  .map(([week, data]: [string, any]) => (
                    <View key={week} style={styles.weekRow}>
                      <Typography variant="body" style={styles.weekLabel}>
                        Week {week}:
                      </Typography>
                      <Typography variant="body" color={COLORS.text.secondary} style={{ flex: 1 }}>
                        {typeof data === 'string' ? getString(data) : (typeof data === 'object' ? JSON.stringify(data) : String(data))}
                      </Typography>
                    </View>
                  ))}
              </View>
            )}

            {getString(session.notes) && (
              <Typography variant="body" color={COLORS.text.secondary} style={styles.notes}>
                {getString(session.notes)}
              </Typography>
            )}
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
  sessionCard: {
    marginBottom: SPACING.m,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
    marginBottom: SPACING.m,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  progressionContainer: {
    marginTop: SPACING.m,
    paddingTop: SPACING.m,
    borderTopWidth: 1,
    borderTopColor: COLORS.background.tertiary,
  },
  progressionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
    marginBottom: SPACING.s,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: SPACING.xs,
    gap: SPACING.s,
  },
  weekLabel: {
    fontWeight: '600',
    minWidth: 80,
  },
  notes: {
    marginTop: SPACING.m,
    fontStyle: 'italic',
  },
});

