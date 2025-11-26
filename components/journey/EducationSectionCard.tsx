// EducationSectionCard.tsx - Renders education section

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BookOpen } from 'lucide-react-native';
import { Card } from '../ui/Card';
import { Typography } from '../ui/Typography';
import { COLORS, SPACING } from '../../constants/theme';
import { EducationSection } from '../../shared/programTrackingSchema';

interface EducationSectionCardProps {
  section: EducationSection;
}

export const EducationSectionCard: React.FC<EducationSectionCardProps> = ({ section }) => {
  return (
    <Card variant="outlined" style={styles.card}>
      <View style={styles.header}>
        <BookOpen color={COLORS.primary.light} size={20} />
        <Typography variant="h3" style={{ flex: 1 }}>{section.title}</Typography>
      </View>

      {section.notes && (
        <Typography variant="body" color={COLORS.text.secondary} style={styles.notes}>
          {section.notes}
        </Typography>
      )}

      <View style={styles.items}>
        {section.items.map((item, idx) => (
          <View key={idx} style={styles.item}>
            {item.title && (
              <Typography variant="label" style={styles.itemTitle}>{item.title}</Typography>
            )}
            <Typography variant="body" color={COLORS.text.secondary}>
              {item.text}
            </Typography>
          </View>
        ))}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: SPACING.m,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
    marginBottom: SPACING.s,
  },
  notes: {
    marginBottom: SPACING.s,
    fontStyle: 'italic',
  },
  items: {
    gap: SPACING.m,
    marginTop: SPACING.s,
  },
  item: {
    gap: SPACING.xs,
  },
  itemTitle: {
    marginBottom: SPACING.xs,
  },
});

