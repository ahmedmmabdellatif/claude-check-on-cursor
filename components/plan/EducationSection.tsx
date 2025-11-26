// EducationSection.tsx - Shows education_and_guidelines with collapsible cards

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { BookOpen, ChevronDown, ChevronUp } from 'lucide-react-native';
import { Card } from '../ui/Card';
import { Typography } from '../ui/Typography';
import { COLORS, SPACING } from '../../constants/theme';
import { UniversalFitnessPlan } from '../../constants/fitnessTypes';
import { getArray, getString } from '../../utils/safe';

interface EducationSectionProps {
  plan: UniversalFitnessPlan;
}

export const EducationSection: React.FC<EducationSectionProps> = ({ plan }) => {
  const education = getArray(plan.education_and_guidelines);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  if (education.length === 0) {
    return (
      <View style={styles.container}>
        <Card variant="outlined" style={styles.emptyCard}>
          <Typography variant="h3" style={{ marginBottom: SPACING.s }}>No Education Content</Typography>
          <Typography variant="body" color={COLORS.text.secondary}>
            No educational content or guidelines found in this plan.
          </Typography>
        </Card>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Typography variant="h2" style={styles.title}>Education & Guidelines</Typography>

      {education.map((item, idx) => {
        const isExpanded = expandedItems.has(idx);
        const title = typeof item === 'object' ? getString(item.title || item.name) : '';
        const content = typeof item === 'string' ? getString(item) : getString(item.content || item.text || item.description || '');
        const isLong = content.length > 200;
        
        return (
          <Card key={idx} variant="outlined" style={styles.educationCard}>
            <TouchableOpacity 
              onPress={() => {
                if (isLong) {
                  const newExpanded = new Set(expandedItems);
                  if (isExpanded) {
                    newExpanded.delete(idx);
                  } else {
                    newExpanded.add(idx);
                  }
                  setExpandedItems(newExpanded);
                }
              }}
              style={styles.header}
              disabled={!isLong}
            >
              <BookOpen color={COLORS.primary.light} size={20} />
              <Typography variant="label" style={{ flex: 1 }}>
                {title || `Guideline ${idx + 1}`}
              </Typography>
              {isLong && (
                isExpanded ? <ChevronUp color={COLORS.text.secondary} size={18} /> : <ChevronDown color={COLORS.text.secondary} size={18} />
              )}
            </TouchableOpacity>
            <Typography variant="body" color={COLORS.text.secondary}>
              {isLong && !isExpanded ? `${content.substring(0, 200)}...` : content}
            </Typography>
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
  educationCard: {
    marginBottom: SPACING.m,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
    marginBottom: SPACING.s,
  },
});

