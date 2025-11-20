import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { User, Target, Calendar, Activity, TrendingUp } from 'lucide-react-native';
import { Card } from '../ui/Card';
import { Typography } from '../ui/Typography';
import { COLORS, SPACING } from '../../constants/theme';
import { FitnessPlanFields } from '../../constants/fitnessTypes';

interface OverviewSectionProps {
    plan: FitnessPlanFields;
}

export const OverviewSection: React.FC<OverviewSectionProps> = ({ plan }) => {
    const meta = plan.meta || {};
    const goals = plan.goals || {};
    const profile = plan.profile || {};

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Typography variant="h2" style={styles.title}>Plan Overview</Typography>

            <Card variant="glass" style={styles.heroCard}>
                <Typography variant="label" color={COLORS.primary.light}>Current Plan</Typography>
                <Typography variant="h1" style={styles.planName}>
                    {meta.plan_name || "Fitness Plan"}
                </Typography>
                <View style={styles.metaRow}>
                    {meta.coach_name && (
                        <View style={styles.metaItem}>
                            <User color={COLORS.text.secondary} size={16} />
                            <Typography variant="caption">Coach: {meta.coach_name}</Typography>
                        </View>
                    )}
                    {meta.duration_weeks && (
                        <View style={styles.metaItem}>
                            <Calendar color={COLORS.text.secondary} size={16} />
                            <Typography variant="caption">{meta.duration_weeks} Weeks</Typography>
                        </View>
                    )}
                </View>
            </Card>

            <View style={styles.grid}>
                <Card style={styles.gridItem}>
                    <View style={styles.iconBox}>
                        <Target color={COLORS.status.info} size={24} />
                    </View>
                    <Typography variant="label" style={styles.gridLabel}>Primary Goal</Typography>
                    <Typography variant="body" style={styles.gridValue}>
                        {goals.primary || "General Fitness"}
                    </Typography>
                </Card>

                <Card style={styles.gridItem}>
                    <View style={[styles.iconBox, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                        <Activity color={COLORS.status.success} size={24} />
                    </View>
                    <Typography variant="label" style={styles.gridLabel}>Level</Typography>
                    <Typography variant="body" style={styles.gridValue}>
                        {meta.target_level || "Intermediate"}
                    </Typography>
                </Card>
            </View>

            {goals.secondary && goals.secondary.length > 0 && (
                <Card>
                    <View style={styles.sectionHeader}>
                        <TrendingUp color={COLORS.primary.DEFAULT} size={20} />
                        <Typography variant="h3">Secondary Goals</Typography>
                    </View>
                    <View style={styles.tags}>
                        {goals.secondary.map((goal, idx) => (
                            <View key={idx} style={styles.tag}>
                                <Typography variant="caption" color={COLORS.primary.light}>
                                    {goal}
                                </Typography>
                            </View>
                        ))}
                    </View>
                </Card>
            )}

            {(profile.injuries?.length ?? 0) > 0 && (
                <Card style={styles.warningCard}>
                    <Typography variant="label" color={COLORS.status.error}>Injuries & Constraints</Typography>
                    {profile.injuries?.map((injury, idx) => (
                        <Typography key={idx} variant="body" color={COLORS.text.secondary}>
                            • {injury}
                        </Typography>
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
    heroCard: {
        marginBottom: SPACING.m,
    },
    planName: {
        marginVertical: SPACING.s,
        color: COLORS.primary.light,
    },
    metaRow: {
        flexDirection: 'row',
        gap: SPACING.l,
        marginTop: SPACING.s,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
    },
    grid: {
        flexDirection: 'row',
        gap: SPACING.m,
        marginBottom: SPACING.m,
    },
    gridItem: {
        flex: 1,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.s,
    },
    gridLabel: {
        color: COLORS.text.tertiary,
        marginBottom: 4,
    },
    gridValue: {
        fontWeight: '600',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.s,
        marginBottom: SPACING.m,
    },
    tags: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.s,
    },
    tag: {
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.2)',
    },
    warningCard: {
        borderColor: 'rgba(239, 68, 68, 0.3)',
        borderWidth: 1,
        backgroundColor: 'rgba(239, 68, 68, 0.05)',
    },
});
