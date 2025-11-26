// OverviewSection.tsx - Shows meta, profile, and key assessment info

import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { User, Target, Calendar, Activity, MapPin } from 'lucide-react-native';
import { Card } from '../ui/Card';
import { Typography } from '../ui/Typography';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import { UniversalFitnessPlan } from '../../constants/fitnessTypes';
import { getObject, getString, getNumber, getArray } from '../../utils/safe';

interface OverviewSectionProps {
  plan: UniversalFitnessPlan;
}

export const OverviewSection: React.FC<OverviewSectionProps> = ({ plan }) => {
  const meta = getObject(plan.meta);
  const profile = getObject(plan.profile);
  const assessment = getObject(plan.assessment_and_background);
  const healthStatus = getObject(assessment.health_status);
  const fitnessStatus = getObject(assessment.fitness_status);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Plan Header */}
      <Card variant="glass" style={styles.heroCard}>
        <Typography variant="h1" style={styles.planName}>
          {getString(meta.plan_name || meta.title) || 'Fitness Plan'}
        </Typography>
        {getString(meta.coach_name) && (
          <Typography variant="body" color={COLORS.text.secondary}>
            Coach: {getString(meta.coach_name)}
          </Typography>
        )}
        {getString(meta.duration_weeks) && (
          <Typography variant="caption" color={COLORS.text.secondary}>
            Duration: {getString(meta.duration_weeks)} weeks
          </Typography>
        )}
      </Card>

      {/* Profile Info */}
      <Card variant="outlined" style={styles.profileCard}>
        <Typography variant="h3" style={styles.sectionTitle}>Profile</Typography>
        <View style={styles.profileGrid}>
          {getString(profile.trainee_name) && (
            <View style={styles.profileItem}>
              <User color={COLORS.primary.light} size={18} />
              <View>
                <Typography variant="caption" color={COLORS.text.secondary}>Name</Typography>
                <Typography variant="body">{getString(profile.trainee_name)}</Typography>
              </View>
            </View>
          )}
          {(getNumber(profile.age) > 0 || getString(profile.age)) && (
            <View style={styles.profileItem}>
              <Calendar color={COLORS.primary.light} size={18} />
              <View>
                <Typography variant="caption" color={COLORS.text.secondary}>Age</Typography>
                <Typography variant="body">{getNumber(profile.age) > 0 ? getNumber(profile.age) : getString(profile.age)}</Typography>
              </View>
            </View>
          )}
          {getString(profile.gender) && (
            <View style={styles.profileItem}>
              <User color={COLORS.primary.light} size={18} />
              <View>
                <Typography variant="caption" color={COLORS.text.secondary}>Gender</Typography>
                <Typography variant="body">{getString(profile.gender)}</Typography>
              </View>
            </View>
          )}
          {(getNumber(profile.height_cm) > 0 || getString(profile.height_cm)) && (
            <View style={styles.profileItem}>
              <Activity color={COLORS.primary.light} size={18} />
              <View>
                <Typography variant="caption" color={COLORS.text.secondary}>Height</Typography>
                <Typography variant="body">{getNumber(profile.height_cm) > 0 ? `${getNumber(profile.height_cm)}cm` : getString(profile.height_cm)}</Typography>
              </View>
            </View>
          )}
          {(getNumber(profile.weight_kg) > 0 || getString(profile.weight_kg)) && (
            <View style={styles.profileItem}>
              <Activity color={COLORS.primary.light} size={18} />
              <View>
                <Typography variant="caption" color={COLORS.text.secondary}>Weight</Typography>
                <Typography variant="body">{getNumber(profile.weight_kg) > 0 ? `${getNumber(profile.weight_kg)}kg` : getString(profile.weight_kg)}</Typography>
              </View>
            </View>
          )}
          {getString(profile.location) && (
            <View style={styles.profileItem}>
              <MapPin color={COLORS.primary.light} size={18} />
              <View>
                <Typography variant="caption" color={COLORS.text.secondary}>Location</Typography>
                <Typography variant="body">{getString(profile.location)}</Typography>
              </View>
            </View>
          )}
        </View>

        {/* Goals */}
        {getArray(profile.goals).length > 0 && (
          <View style={styles.goalsContainer}>
            <View style={styles.goalsHeader}>
              <Target color={COLORS.primary.light} size={18} />
              <Typography variant="label">Goals</Typography>
            </View>
            <View style={styles.tags}>
              {getArray(profile.goals).map((goal, i) => (
                <View key={i} style={styles.tag}>
                  <Typography variant="caption" color={COLORS.primary.light}>
                    {getString(goal)}
                  </Typography>
                </View>
              ))}
            </View>
          </View>
        )}
        {/* Profile Notes */}
        {getArray(profile.notes).length > 0 && (
          <View style={styles.notesSection}>
            <Typography variant="label">Notes</Typography>
            {getArray(profile.notes).map((note, i) => (
              <Typography key={i} variant="body" color={COLORS.text.secondary}>
                • {getString(note)}
              </Typography>
            ))}
          </View>
        )}
      </Card>

      {/* Key Notes from Assessment */}
      {(getArray(healthStatus.injuries).length > 0 || 
        getArray(healthStatus.medical_conditions).length > 0 || 
        getString(fitnessStatus.experience_level) ||
        getString(fitnessStatus.training_history)) && (
        <Card variant="outlined" style={styles.notesCard}>
          <Typography variant="h3" style={styles.sectionTitle}>Key Notes</Typography>
          {getArray(healthStatus.injuries).length > 0 && (
            <View style={styles.notesSection}>
              <Typography variant="label" color={COLORS.status.warn}>Injuries</Typography>
              {getArray(healthStatus.injuries).map((injury: any, i: number) => (
                <Typography key={i} variant="body" color={COLORS.text.secondary}>
                  • {getString(injury)}
                </Typography>
              ))}
            </View>
          )}
          {getArray(healthStatus.medical_conditions).length > 0 && (
            <View style={styles.notesSection}>
              <Typography variant="label" color={COLORS.status.warn}>Medical Conditions</Typography>
              {getArray(healthStatus.medical_conditions).map((condition: any, i: number) => (
                <Typography key={i} variant="body" color={COLORS.text.secondary}>
                  • {getString(condition)}
                </Typography>
              ))}
            </View>
          )}
          {getString(fitnessStatus.experience_level) && (
            <View style={styles.notesSection}>
              <Typography variant="label">Experience Level</Typography>
              <Typography variant="body" color={COLORS.text.secondary}>
                {getString(fitnessStatus.experience_level)}
              </Typography>
            </View>
          )}
          {getString(fitnessStatus.training_history) && (
            <View style={styles.notesSection}>
              <Typography variant="label">Training History</Typography>
              <Typography variant="body" color={COLORS.text.secondary}>
                {getString(fitnessStatus.training_history)}
              </Typography>
            </View>
          )}
        </Card>
      )}

      {/* Quick Stats */}
      <View style={styles.statsRow}>
        <Card variant="default" style={styles.statCard}>
          <Activity color={COLORS.primary.main} size={24} />
          <Typography variant="h2">{getArray(plan.workouts).length}</Typography>
          <Typography variant="caption" color={COLORS.text.secondary}>Workouts</Typography>
        </Card>
        <Card variant="default" style={styles.statCard}>
          <Activity color={COLORS.secondary.main} size={24} />
          <Typography variant="h2">{getArray(plan.nutrition_plan).length}</Typography>
          <Typography variant="caption" color={COLORS.text.secondary}>Meals</Typography>
        </Card>
        <Card variant="default" style={styles.statCard}>
          <Activity color={COLORS.text.tertiary} size={24} />
          <Typography variant="h2">{getArray(getObject(plan.debug).pages).length}</Typography>
          <Typography variant="caption" color={COLORS.text.secondary}>Pages</Typography>
        </Card>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: SPACING.m,
    paddingBottom: SPACING.xxl,
  },
  heroCard: {
    marginBottom: SPACING.m,
  },
  planName: {
    marginBottom: SPACING.xs,
    color: COLORS.primary.light,
  },
  profileCard: {
    marginBottom: SPACING.m,
  },
  sectionTitle: {
    marginBottom: SPACING.m,
  },
  profileGrid: {
    gap: SPACING.m,
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
  },
  goalsContainer: {
    marginTop: SPACING.m,
    paddingTop: SPACING.m,
    borderTopWidth: 1,
    borderTopColor: COLORS.background.tertiary,
  },
  goalsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
    marginBottom: SPACING.s,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.s,
  },
  tag: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    paddingHorizontal: SPACING.s,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.s,
  },
  notesCard: {
    marginBottom: SPACING.m,
  },
  notesSection: {
    marginBottom: SPACING.m,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.m,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: SPACING.xs,
  },
});

