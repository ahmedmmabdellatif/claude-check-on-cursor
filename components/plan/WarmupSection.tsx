// WarmupSection.tsx - Shows warmup_protocols and warmup-related education

import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { Zap, BookOpen, ExternalLink } from 'lucide-react-native';
import { Card } from '../ui/Card';
import { Typography } from '../ui/Typography';
import { COLORS, SPACING } from '../../constants/theme';
import { UniversalFitnessPlan } from '../../constants/fitnessTypes';
import { getArray, getString } from '../../utils/safe';

interface WarmupSectionProps {
  plan: UniversalFitnessPlan;
}

export const WarmupSection: React.FC<WarmupSectionProps> = ({ plan }) => {
  const warmupProtocols = getArray(plan.warmup_protocols);
  const education = getArray(plan.education_and_guidelines);
  const warmupEducation = education.filter((item: any) => {
    const text = getString(typeof item === 'string' ? item : (item.text || item.content || ''));
    return text.toLowerCase().includes('warm') || text.toLowerCase().includes('warmup');
  });

  if (warmupProtocols.length === 0 && warmupEducation.length === 0) {
    return (
      <View style={styles.container}>
        <Card variant="outlined" style={styles.emptyCard}>
          <Typography variant="h3" style={{ marginBottom: SPACING.s }}>No Warmup Data</Typography>
          <Typography variant="body" color={COLORS.text.secondary}>
            No warmup protocols found in this plan.
          </Typography>
        </Card>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Typography variant="h2" style={styles.title}>Warmup Protocols</Typography>

      {/* Warmup Protocols */}
      {warmupProtocols.map((protocol, idx) => (
        <Card key={idx} variant="outlined" style={styles.protocolCard}>
          <View style={styles.header}>
            <Zap color={COLORS.primary.light} size={20} />
            <Typography variant="h3" style={{ flex: 1 }}>
              {getString(protocol.name || protocol.title) || `Warmup ${idx + 1}`}
            </Typography>
            {getString(protocol.video_url) && (
              <TouchableOpacity 
                onPress={() => Linking.openURL(getString(protocol.video_url))}
                style={styles.videoButton}
              >
                <ExternalLink size={18} color={COLORS.primary.light} />
              </TouchableOpacity>
            )}
          </View>
          {getString(protocol.description) && (
            <Typography variant="body" color={COLORS.text.secondary} style={styles.description}>
              {getString(protocol.description)}
            </Typography>
          )}
          {getArray(protocol.exercises).length > 0 && (
            <View style={styles.exercisesList}>
              {getArray(protocol.exercises).map((ex: any, exIdx: number) => (
                <View key={exIdx} style={styles.exerciseItem}>
                  <Typography variant="body">• {getString(ex.name || ex)}</Typography>
                </View>
              ))}
            </View>
          )}
        </Card>
      ))}

      {/* Warmup Education */}
      {warmupEducation.length > 0 && (
        <Card variant="outlined" style={styles.educationCard}>
          <View style={styles.header}>
            <BookOpen color={COLORS.primary.light} size={20} />
            <Typography variant="h3">Warmup Guidelines</Typography>
          </View>
          {warmupEducation.map((item, idx) => (
            <View key={idx} style={styles.educationItem}>
              <Typography variant="body" color={COLORS.text.secondary}>
                {getString(typeof item === 'string' ? item : (item.text || item.content || ''))}
              </Typography>
            </View>
          ))}
        </Card>
      )}
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
  protocolCard: {
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
  educationCard: {
    marginTop: SPACING.m,
  },
  educationItem: {
    marginBottom: SPACING.m,
  },
  videoButton: {
    padding: 4,
  },
});

