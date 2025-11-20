import React from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { CheckCircle2, Circle, ExternalLink, History } from 'lucide-react-native';
import { Card } from '../ui/Card';
import { Typography } from '../ui/Typography';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import { Exercise } from '../../constants/fitnessTypes';

interface ExerciseCardProps {
    exercise: Exercise;
    workoutName: string;
    index: number;
    onToggleSet: (setIndex: number) => void;
    onUpdateNote: (note: string) => void;
    setChecks: boolean[];
    note: string;
    history?: any[]; // TODO: Define proper history type
}

export const ExerciseCard: React.FC<ExerciseCardProps> = ({
    exercise,
    workoutName,
    index,
    onToggleSet,
    onUpdateNote,
    setChecks,
    note,
    history,
}) => {
    const numSets = exercise.sets || 0;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Typography variant="h3" style={styles.name}>{exercise.name}</Typography>
                {exercise.media_url && (
                    <TouchableOpacity style={styles.linkButton}>
                        <ExternalLink color={COLORS.primary.light} size={16} />
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.badges}>
                {exercise.sets && (
                    <View style={styles.badge}>
                        <Typography variant="caption" color={COLORS.text.primary}>{exercise.sets} sets</Typography>
                    </View>
                )}
                {exercise.reps && (
                    <View style={styles.badge}>
                        <Typography variant="caption" color={COLORS.text.primary}>{exercise.reps} reps</Typography>
                    </View>
                )}
                {exercise.rest_seconds && (
                    <View style={styles.badge}>
                        <Typography variant="caption" color={COLORS.text.primary}>{exercise.rest_seconds}s rest</Typography>
                    </View>
                )}
                {exercise.tempo && (
                    <View style={styles.badge}>
                        <Typography variant="caption" color={COLORS.text.primary}>{exercise.tempo}</Typography>
                    </View>
                )}
            </View>

            {exercise.notes && (
                <Typography variant="caption" color={COLORS.text.secondary} style={styles.notes}>
                    {exercise.notes}
                </Typography>
            )}

            {numSets > 0 && (
                <View style={styles.setsContainer}>
                    {Array.from({ length: numSets }).map((_, i) => (
                        <TouchableOpacity
                            key={i}
                            onPress={() => onToggleSet(i)}
                            style={styles.setButton}
                            activeOpacity={0.7}
                        >
                            {setChecks[i] ? (
                                <CheckCircle2 color={COLORS.status.success} size={28} fill={COLORS.status.success} />
                            ) : (
                                <Circle color={COLORS.text.tertiary} size={28} />
                            )}
                            <Typography variant="caption" style={styles.setNumber}>{i + 1}</Typography>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            <TextInput
                style={styles.input}
                placeholder="Notes / Weight used..."
                placeholderTextColor={COLORS.text.tertiary}
                value={note}
                onChangeText={onUpdateNote}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: SPACING.l,
        backgroundColor: 'rgba(30, 41, 59, 0.3)',
        borderRadius: BORDER_RADIUS.m,
        padding: SPACING.m,
        borderWidth: 1,
        borderColor: COLORS.background.tertiary,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: SPACING.s,
    },
    name: {
        flex: 1,
        marginRight: SPACING.s,
    },
    linkButton: {
        padding: 4,
    },
    badges: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.s,
        marginBottom: SPACING.s,
    },
    badge: {
        backgroundColor: COLORS.background.tertiary,
        paddingHorizontal: SPACING.s,
        paddingVertical: 2,
        borderRadius: 4,
    },
    notes: {
        marginBottom: SPACING.m,
        fontStyle: 'italic',
    },
    setsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.m,
        marginBottom: SPACING.m,
    },
    setButton: {
        alignItems: 'center',
        gap: 4,
    },
    setNumber: {
        color: COLORS.text.tertiary,
    },
    input: {
        backgroundColor: COLORS.background.primary,
        borderRadius: BORDER_RADIUS.s,
        padding: SPACING.s,
        color: COLORS.text.primary,
        fontSize: 14,
        borderWidth: 1,
        borderColor: COLORS.background.tertiary,
    },
});
