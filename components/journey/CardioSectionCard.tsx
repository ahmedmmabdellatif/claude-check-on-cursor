// CardioSectionCard.tsx - Renders cardio section with trackable sessions

import React, { useState } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { Heart, CheckCircle, Circle } from 'lucide-react-native';
import { Card } from '../ui/Card';
import { Typography } from '../ui/Typography';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import { CardioSection } from '../../shared/programTrackingSchema';

interface CardioSectionCardProps {
  section: CardioSection;
}

export const CardioSectionCard: React.FC<CardioSectionCardProps> = ({ section }) => {
  return (
    <Card variant="outlined" style={styles.card}>
      <View style={styles.header}>
        <Heart color={COLORS.primary.light} size={20} />
        <Typography variant="h3" style={{ flex: 1 }}>{section.title}</Typography>
      </View>

      {section.notes && (
        <Typography variant="body" color={COLORS.text.secondary} style={styles.notes}>
          {section.notes}
        </Typography>
      )}

      <View style={styles.sessions}>
        {section.sessions.map((session, idx) => (
          <CardioSessionCard key={idx} session={session} />
        ))}
      </View>
    </Card>
  );
};

const CardioSessionCard: React.FC<{ session: CardioSection['sessions'][0] }> = ({ session }) => {
  const [completed, setCompleted] = useState(false);
  const [duration, setDuration] = useState('');
  const [distance, setDistance] = useState('');
  const [rpe, setRpe] = useState('');

  const template = session.trackingTemplate || {};

  return (
    <Card variant="default" style={styles.sessionCard}>
      <Typography variant="label" style={styles.sessionName}>{session.name}</Typography>

      <View style={styles.sessionDetails}>
        {session.durationMinutes !== null && (
          <View style={styles.detailItem}>
            <Typography variant="caption" color={COLORS.text.secondary}>Duration</Typography>
            <Typography variant="body">{session.durationMinutes} min</Typography>
          </View>
        )}
        {session.intensity && (
          <View style={styles.detailItem}>
            <Typography variant="caption" color={COLORS.text.secondary}>Intensity</Typography>
            <Typography variant="body">{session.intensity}</Typography>
          </View>
        )}
        {session.heartRateRange && (
          <View style={styles.detailItem}>
            <Typography variant="caption" color={COLORS.text.secondary}>Heart Rate</Typography>
            <Typography variant="body">{session.heartRateRange}</Typography>
          </View>
        )}
      </View>

      <View style={styles.tracking}>
        {template.trackCompletedCheckbox && (
          <TouchableOpacity
            onPress={() => setCompleted(!completed)}
            style={styles.checkboxRow}
          >
            {completed ? (
              <CheckCircle size={20} color={COLORS.primary.light} />
            ) : (
              <Circle size={20} color={COLORS.text.secondary} />
            )}
            <Typography variant="body">Completed</Typography>
          </TouchableOpacity>
        )}

        {template.trackDuration && (
          <View style={styles.inputRow}>
            <Typography variant="caption" color={COLORS.text.secondary}>Duration (min)</Typography>
            <TextInput
              style={styles.input}
              value={duration}
              onChangeText={setDuration}
              placeholder="0"
              keyboardType="numeric"
              placeholderTextColor={COLORS.text.tertiary}
            />
          </View>
        )}

        {template.trackDistance && (
          <View style={styles.inputRow}>
            <Typography variant="caption" color={COLORS.text.secondary}>Distance (km)</Typography>
            <TextInput
              style={styles.input}
              value={distance}
              onChangeText={setDistance}
              placeholder="0"
              keyboardType="numeric"
              placeholderTextColor={COLORS.text.tertiary}
            />
          </View>
        )}

        {template.trackRpe && (
          <View style={styles.inputRow}>
            <Typography variant="caption" color={COLORS.text.secondary}>RPE (1-10)</Typography>
            <TextInput
              style={styles.input}
              value={rpe}
              onChangeText={setRpe}
              placeholder="0"
              keyboardType="numeric"
              placeholderTextColor={COLORS.text.tertiary}
            />
          </View>
        )}
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
  sessions: {
    gap: SPACING.s,
    marginTop: SPACING.s,
  },
  sessionCard: {
    padding: SPACING.s,
  },
  sessionName: {
    marginBottom: SPACING.xs,
    fontWeight: '600',
  },
  sessionDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.m,
    marginBottom: SPACING.s,
  },
  detailItem: {
    gap: 2,
  },
  tracking: {
    marginTop: SPACING.s,
    paddingTop: SPACING.s,
    borderTopWidth: 1,
    borderTopColor: COLORS.background.tertiary,
    gap: SPACING.s,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.s,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.background.tertiary,
    borderRadius: BORDER_RADIUS.s,
    paddingHorizontal: SPACING.s,
    paddingVertical: SPACING.xs,
    color: COLORS.text.primary,
    backgroundColor: COLORS.background.secondary,
    minWidth: 80,
    textAlign: 'right',
  },
});

