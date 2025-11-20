import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Utensils, Droplet, Pill, Clock } from 'lucide-react-native';
import { Card } from '../ui/Card';
import { Typography } from '../ui/Typography';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import { UniversalFitnessPlan } from '../../constants/fitnessTypes';

interface NutritionSectionProps {
    plan: UniversalFitnessPlan;
}

export const NutritionSection: React.FC<NutritionSectionProps> = ({ plan }) => {
    const meals = plan.nutrition_plan || [];
    const water = plan.water_intake;
    const supplements = plan.supplements || [];

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Typography variant="h2" style={styles.title}>Nutrition & Health</Typography>

            {/* Water Intake */}
            {water && (
                <Card style={styles.waterCard}>
                    <View style={styles.waterHeader}>
                        <View style={styles.iconBox}>
                            <Droplet color={COLORS.status.info} size={24} fill={COLORS.status.info} />
                        </View>
                        <View>
                            <Typography variant="h3">Hydration</Typography>
                            <Typography variant="body" color={COLORS.text.secondary}>
                                Daily Target: <Typography variant="body" style={{ fontWeight: 'bold', color: COLORS.status.info }}>
                                    {water.recommended_liters_per_day}L
                                </Typography>
                            </Typography>
                        </View>
                    </View>
                    {water.notes && (
                        <Typography variant="caption" style={styles.notes}>{water.notes}</Typography>
                    )}
                </Card>
            )}

            {/* Meals */}
            {meals.length > 0 && (
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Utensils color={COLORS.primary.light} size={20} />
                        <Typography variant="h3">Meals</Typography>
                    </View>

                    {meals.map((meal, idx) => (
                        <Card key={idx} style={styles.mealCard}>
                            <View style={styles.mealHeader}>
                                <Typography variant="h3">{meal.name}</Typography>
                                {meal.time && (
                                    <View style={styles.timeTag}>
                                        <Clock size={12} color={COLORS.text.tertiary} />
                                        <Typography variant="caption">{meal.time}</Typography>
                                    </View>
                                )}
                            </View>

                            {meal.items?.map((item, iIdx) => (
                                <View key={iIdx} style={styles.mealItem}>
                                    <View style={styles.dot} />
                                    <View style={{ flex: 1 }}>
                                        <Typography variant="body">
                                            {item.name}
                                            {item.quantity && <Typography variant="body" color={COLORS.text.secondary}> ({item.quantity})</Typography>}
                                        </Typography>

                                        {/* Macros if available */}
                                        {(item.calories_kcal || item.protein_g || item.carbs_g || item.fats_g) && (
                                            <View style={styles.macros}>
                                                {item.calories_kcal && <Typography variant="caption" color={COLORS.text.tertiary}>{item.calories_kcal} kcal</Typography>}
                                                {item.protein_g && <Typography variant="caption" color={COLORS.text.tertiary}>P: {item.protein_g}g</Typography>}
                                                {item.carbs_g && <Typography variant="caption" color={COLORS.text.tertiary}>C: {item.carbs_g}g</Typography>}
                                                {item.fats_g && <Typography variant="caption" color={COLORS.text.tertiary}>F: {item.fats_g}g</Typography>}
                                            </View>
                                        )}
                                    </View>
                                </View>
                            ))}
                        </Card>
                    ))}
                </View>
            )}

            {/* Supplements */}
            {supplements.length > 0 && (
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Pill color={COLORS.primary.light} size={20} />
                        <Typography variant="h3">Supplements</Typography>
                    </View>

                    <Card>
                        {supplements.map((supp, idx) => (
                            <View key={idx} style={[styles.suppItem, idx < supplements.length - 1 && styles.borderBottom]}>
                                <Typography variant="body" style={{ fontWeight: '600' }}>{supp.name}</Typography>
                                {supp.dosage && <Typography variant="caption" color={COLORS.text.secondary}>Dosage: {supp.dosage}</Typography>}
                                {supp.timing && <Typography variant="caption" color={COLORS.text.secondary}>Timing: {supp.timing}</Typography>}
                            </View>
                        ))}
                    </Card>
                </View>
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
    waterCard: {
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderColor: 'rgba(59, 130, 246, 0.2)',
        borderWidth: 1,
        marginBottom: SPACING.l,
    },
    waterHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.m,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    notes: {
        marginTop: SPACING.s,
        color: COLORS.text.secondary,
    },
    section: {
        marginBottom: SPACING.l,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.s,
        marginBottom: SPACING.m,
    },
    mealCard: {
        marginBottom: SPACING.m,
    },
    mealHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.m,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.background.tertiary,
        paddingBottom: SPACING.s,
    },
    timeTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: COLORS.background.tertiary,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    mealItem: {
        flexDirection: 'row',
        marginBottom: SPACING.s,
        alignItems: 'flex-start',
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: COLORS.primary.DEFAULT,
        marginTop: 8,
        marginRight: SPACING.s,
    },
    macros: {
        flexDirection: 'row',
        gap: SPACING.m,
        marginTop: 2,
    },
    suppItem: {
        paddingVertical: SPACING.s,
    },
    borderBottom: {
        borderBottomWidth: 1,
        borderBottomColor: COLORS.background.tertiary,
    },
});
