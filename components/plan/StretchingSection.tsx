// StretchingSection.tsx - Shows stretching_routines

import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { ArrowRight, ExternalLink } from 'lucide-react-native';
import { Card } from '../ui/Card';
import { Typography } from '../ui/Typography';
import { COLORS, SPACING } from '../../constants/theme';
import { UniversalFitnessPlan } from '../../constants/fitnessTypes';
import { getArray, getString } from '../../utils/safe';

interface StretchingSectionProps {
  plan: UniversalFitnessPlan;
}

export const StretchingSection: React.FC<StretchingSectionProps> = ({ plan }) => {
  const stretchingRoutines = getArray(plan.stretching_routines);

  if (stretchingRoutines.length === 0) {
    return (
      <View style={styles.container}>
        <Card variant="outlined" style={styles.emptyCard}>
          <Typography variant="h3" style={{ marginBottom: SPACING.s }}>No Stretching Data</Typography>
          <Typography variant="body" color={COLORS.text.secondary}>
            No stretching routines found in this plan.
          </Typography>
        </Card>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Typography variant="h2" style={styles.title}>Stretching Routines</Typography>

      {stretchingRoutines.map((routine, idx) => (
        <Card key={idx} variant="outlined" style={styles.routineCard}>
          <View style={styles.header}>
            <ArrowRight color={COLORS.primary.light} size={20} />
            <Typography variant="h3" style={{ flex: 1 }}>
              {getString(routine.name || routine.title) || `Stretching Routine ${idx + 1}`}
            </Typography>
            {getString(routine.video_url) && (
              <TouchableOpacity 
                onPress={() => Linking.openURL(getString(routine.video_url))}
                style={styles.videoButton}
              >
                <ExternalLink size={18} color={COLORS.primary.light} />
              </TouchableOpacity>
            )}
          </View>
          {getString(routine.description) && (
            <Typography variant="body" color={COLORS.text.secondary} style={styles.description}>
              {getString(routine.description)}
            </Typography>
          )}
          {getString(routine.frequency) && (
            <Typography variant="caption" color={COLORS.text.secondary}>
              Frequency: {getString(routine.frequency)}
            </Typography>
          )}
          {getArray(routine.exercises).length > 0 && (
            <View style={styles.exercisesList}>
              {getArray(routine.exercises).map((ex: any, exIdx: number) => (
                <View key={exIdx} style={styles.exerciseItem}>
                  <Typography variant="body">• {getString(ex.name || ex)}</Typography>
                  {getString(ex.duration) && (
                    <Typography variant="caption" color={COLORS.text.secondary}>
                      {' '}({getString(ex.duration)})
                    </Typography>
                  )}
                </View>
              ))}
            </View>
          )}
          {getArray(routine.target_areas).length > 0 && (
            <View style={styles.targetAreas}>
              <Typography variant="caption" color={COLORS.text.secondary}>
                Target areas: {getArray(routine.target_areas).map(a => getString(a)).join(', ')}
              </Typography>
            </View>
          )}
        </Card>
      ))}
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
  routineCard: {
    marginBottom: SPACING.m,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
    marginBottom: SPACING.m,
  },
  description: {
    marginBottom: SPACING.m,
  },
  exercisesList: {
    marginTop: SPACING.s,
    gap: SPACING.xs,
  },
  exerciseItem: {
    marginLeft: SPACING.s,
  },
  targetAreas: {
    marginTop: SPACING.s,
    paddingTop: SPACING.s,
    borderTopWidth: 1,
    borderTopColor: COLORS.background.tertiary,
  },
  videoButton: {
    padding: 4,
  },
});

