import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { ChevronDown, ChevronUp, Play } from 'lucide-react-native';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Typography } from '../ui/Typography';
import { ExerciseCard } from './ExerciseCard';
import { COLORS, SPACING } from '../../constants/theme';
import { Workout } from '../../constants/fitnessTypes';

interface WorkoutsSectionProps {
    workouts: Workout[];
}

export const WorkoutsSection: React.FC<WorkoutsSectionProps> = ({ workouts }) => {
    const [collapsed, setCollapsed] = useState<Record<number, boolean>>({});

    // Placeholder state for exercise interactions
    // In a real app, this would be lifted up or managed via context/store
    const [setChecks, setSetChecks] = useState<Record<string, boolean>>({});
    const [notes, setNotes] = useState<Record<string, string>>({});

    const toggleCollapse = (index: number) => {
        setCollapsed(prev => ({ ...prev, [index]: !prev[index] }));
    };

    const handleToggleSet = (workoutName: string, exerciseName: string, setIndex: number) => {
        const key = `${workoutName}::${exerciseName}::${setIndex}`;
        setSetChecks(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleUpdateNote = (workoutName: string, exerciseName: string, note: string) => {
        const key = `${workoutName}::${exerciseName}`;
        setNotes(prev => ({ ...prev, [key]: note }));
    };

    if (!workouts || workouts.length === 0) {
        return (
            <View style={styles.container}>
                <Card variant="outlined" style={styles.emptyContainer}>
                    <Typography variant="h3" style={{ marginBottom: SPACING.s }}>No Workouts Found</Typography>
                    <Typography variant="body" color={COLORS.text.secondary}>
                        The parser didn't find any structured workouts in this plan. Check the "Debug" tab to see the raw text extracted.
                    </Typography>
                </Card>
            </View>
        );
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Typography variant="h2" style={styles.title}>Workouts</Typography>

            {workouts.map((workout, wIdx) => {
                const isCollapsed = collapsed[wIdx];
                const exercises = workout.exercises || [];

                return (
                    <Card key={wIdx} style={styles.workoutCard}>
                        <TouchableOpacity
                            style={styles.workoutHeader}
                            onPress={() => toggleCollapse(wIdx)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.headerLeft}>
                                <Typography variant="h3">{workout.name}</Typography>
                                {workout.day_label && (
                                    <Typography variant="caption" color={COLORS.primary.light}>
                                        {workout.day_label}
                                    </Typography>
                                )}
                            </View>
                            <View style={styles.headerRight}>
                                <Button
                                    title="Start"
                                    onPress={() => { }}
                                    size="s"
                                    icon={<Play size={12} color="#FFF" />}
                                    style={styles.startButton}
                                />
                                {isCollapsed ? (
                                    <ChevronDown color={COLORS.text.secondary} size={20} />
                                ) : (
                                    <ChevronUp color={COLORS.text.secondary} size={20} />
                                )}
                            </View>
                        </TouchableOpacity>

                        {!isCollapsed && (
                            <View style={styles.exercisesList}>
                                {exercises.map((exercise, eIdx) => (
                                    <ExerciseCard
                                        key={eIdx}
                                        exercise={exercise}
                                        workoutName={workout.name}
                                        index={eIdx}
                                        onToggleSet={(sIdx) => handleToggleSet(workout.name, exercise.name, sIdx)}
                                        onUpdateNote={(text) => handleUpdateNote(workout.name, exercise.name, text)}
                                        setChecks={Array.from({ length: exercise.sets || 0 }).map((_, i) =>
                                            setChecks[`${workout.name}::${exercise.name}::${i}`] || false
                                        )}
                                        note={notes[`${workout.name}::${exercise.name}`] || ''}
                                    />
                                ))}
                            </View>
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
    emptyContainer: {
        padding: SPACING.xl,
        alignItems: 'center',
    },
    title: {
        marginBottom: SPACING.m,
    },
    workoutCard: {
        padding: 0, // Custom padding for header
        marginBottom: SPACING.l,
    },
    workoutHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.m,
        backgroundColor: 'rgba(30, 41, 59, 0.5)',
    },
    headerLeft: {
        flex: 1,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.s,
    },
    startButton: {
        marginRight: SPACING.s,
    },
    exercisesList: {
        padding: SPACING.m,
    },
});
