import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { ArrowLeft, Activity, Utensils, FileText, Info, Heart, Zap, BookOpen, Pill, Terminal, Code, Copy } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { ScreenLayout } from '../ScreenLayout';
import { Typography } from '../ui/Typography';
import { Card } from '../ui/Card';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import { UniversalFitnessPlan } from '../../constants/fitnessTypes';
import { WorkoutsSection } from '../fitness/WorkoutsSection';
import { NutritionSection } from '../fitness/NutritionSection';
import { GenericSection } from '../fitness/GenericSection';

// Placeholder for new sections
const DebugSection = ({ pages }: { pages: any[] }) => (
    <View style={{ gap: SPACING.m }}>
        {pages.map((page, index) => (
            <Card key={index} variant="outlined">
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.s }}>
                    <Typography variant="label">Page {page.page_number}</Typography>
                    <View style={{ flexDirection: 'row', gap: 4, flexWrap: 'wrap', flex: 1, justifyContent: 'flex-end' }}>
                        {page.detected_elements?.map((el: any, i: number) => (
                            <View key={i} style={{ backgroundColor: COLORS.primary.light + '20', paddingHorizontal: 6, borderRadius: 4, marginBottom: 2 }}>
                                <Typography variant="caption" color={COLORS.primary.light}>
                                    {typeof el === 'string' ? el : (el.category || 'Element')}
                                </Typography>
                            </View>
                        ))}
                    </View>
                </View>
                <Typography variant="caption" color={COLORS.text.secondary} style={{ marginBottom: SPACING.s }}>
                    {page.notes}
                </Typography>
                <View style={{ backgroundColor: COLORS.background.tertiary, padding: SPACING.s, borderRadius: BORDER_RADIUS.s }}>
                    <Typography variant="caption" style={{ fontFamily: 'monospace' }}>
                        {page.raw_text?.substring(0, 150)}...
                    </Typography>
                </View>
            </Card>
        ))}
    </View>
);

const JsonSection = ({ data }: { data: any }) => {
    const handleCopy = async () => {
        await Clipboard.setStringAsync(JSON.stringify(data, null, 2));
    };

    return (
        <View style={{ gap: SPACING.s }}>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                <TouchableOpacity
                    onPress={handleCopy}
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        backgroundColor: COLORS.background.tertiary,
                        paddingHorizontal: SPACING.m,
                        paddingVertical: SPACING.s,
                        borderRadius: BORDER_RADIUS.s
                    }}
                >
                    <Copy size={16} color={COLORS.primary.light} />
                    <Typography variant="caption" color={COLORS.primary.light}>Copy JSON</Typography>
                </TouchableOpacity>
            </View>
            <Card variant="outlined" style={{ backgroundColor: '#0F172A' }}>
                <ScrollView horizontal>
                    <View>
                        <Typography variant="caption" style={{ fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', color: COLORS.text.secondary }}>
                            {JSON.stringify(data, null, 2)}
                        </Typography>
                    </View>
                </ScrollView>
            </Card>
        </View>
    );
};

interface FitnessPlanScreenProps {
    plan: UniversalFitnessPlan;
    onBack: () => void;
}

type Section = 'overview' | 'workouts' | 'nutrition' | 'cardio' | 'rehab' | 'supplements' | 'education' | 'debug' | 'json';

export const FitnessPlanScreen: React.FC<FitnessPlanScreenProps> = ({ plan, onBack }) => {
    const [activeSection, setActiveSection] = useState<Section>('overview');

    const renderSection = () => {
        switch (activeSection) {
            case 'workouts':
                return <WorkoutsSection workouts={plan.workouts || []} />;
            case 'nutrition':
                return <NutritionSection plan={plan} />;
            case 'cardio':
                return <GenericSection title="Cardio Sessions" data={plan.cardio_sessions || []} emptyMessage="No cardio sessions found." />;
            case 'rehab':
                return (
                    <View style={{ gap: SPACING.l }}>
                        <GenericSection title="Mobility & Rehab" data={plan.mobility_and_rehab || []} emptyMessage="No mobility or rehab routines found." />
                        <GenericSection title="Stretching Routines" data={plan.stretching_routines || []} emptyMessage="No stretching routines found." />
                    </View>
                );
            case 'supplements':
                return <GenericSection title="Supplements" data={plan.supplements || []} emptyMessage="No supplements found." />;
            case 'education':
                return (
                    <View style={{ gap: SPACING.l }}>
                        <GenericSection title="Education & Guidelines" data={plan.education_and_guidelines || []} emptyMessage="No educational content found." />
                        <GenericSection title="Other Information" data={plan.other_information || []} emptyMessage="No other information found." />
                    </View>
                );
            case 'debug':
                return <DebugSection pages={plan.debug?.pages || []} />;
            case 'json':
                return <JsonSection data={plan} />;
            case 'overview':
            default:
                return (
                    <View style={{ gap: SPACING.l }}>
                        {/* Profile Summary */}
                        <Card variant="glass">
                            <Typography variant="h2" style={{ marginBottom: SPACING.m }}>Profile</Typography>
                            <View style={styles.profileGrid}>
                                <View>
                                    <Typography variant="caption" color={COLORS.text.secondary}>Name</Typography>
                                    <Typography variant="body">{plan.profile?.trainee_name || plan.meta?.plan_name || 'N/A'}</Typography>
                                </View>
                                <View>
                                    <Typography variant="caption" color={COLORS.text.secondary}>Age</Typography>
                                    <Typography variant="body">{plan.profile?.age || '-'}</Typography>
                                </View>
                                <View>
                                    <Typography variant="caption" color={COLORS.text.secondary}>Weight</Typography>
                                    <Typography variant="body">{plan.profile?.weight_kg ? `${plan.profile.weight_kg}kg` : '-'}</Typography>
                                </View>
                                <View>
                                    <Typography variant="caption" color={COLORS.text.secondary}>Height</Typography>
                                    <Typography variant="body">{plan.profile?.height_cm ? `${plan.profile.height_cm}cm` : '-'}</Typography>
                                </View>
                            </View>
                            {plan.profile?.goals && plan.profile.goals.length > 0 && (
                                <View style={{ marginTop: SPACING.m }}>
                                    <Typography variant="caption" color={COLORS.text.secondary}>Goals</Typography>
                                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.s, marginTop: SPACING.xs }}>
                                        {plan.profile.goals.map((goal, i) => (
                                            <View key={i} style={styles.tag}>
                                                <Typography variant="caption" color={COLORS.primary.light}>{goal}</Typography>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            )}
                        </Card>

                        {/* Quick Stats */}
                        <View style={styles.statsRow}>
                            <Card variant="default" style={styles.statCard}>
                                <Activity color={COLORS.primary.main} size={24} />
                                <Typography variant="h2">{plan.workouts?.length || 0}</Typography>
                                <Typography variant="caption" color={COLORS.text.secondary}>Workouts</Typography>
                            </Card>
                            <Card variant="default" style={styles.statCard}>
                                <Utensils color={COLORS.secondary.main} size={24} />
                                <Typography variant="h2">{plan.nutrition_plan?.length || 0}</Typography>
                                <Typography variant="caption" color={COLORS.text.secondary}>Meals</Typography>
                            </Card>
                            <Card variant="default" style={styles.statCard}>
                                <FileText color={COLORS.text.tertiary} size={24} />
                                <Typography variant="h2">{plan.debug?.pages?.length || 0}</Typography>
                                <Typography variant="caption" color={COLORS.text.secondary}>Pages</Typography>
                            </Card>
                        </View>

                        {/* Meta Info */}
                        <Card variant="outlined">
                            <View style={{ flexDirection: 'row', gap: SPACING.m, alignItems: 'center' }}>
                                <Info color={COLORS.text.secondary} size={20} />
                                <View>
                                    <Typography variant="body">{plan.meta?.plan_name || 'Untitled Plan'}</Typography>
                                    <Typography variant="caption" color={COLORS.text.secondary}>
                                        Coach: {plan.meta?.coach_name || 'Unknown'}
                                    </Typography>
                                </View>
                            </View>
                        </Card>
                    </View>
                );
        }
    };

    const tabs: { id: Section; label: string; icon: any }[] = [
        { id: 'overview', label: 'Overview', icon: Info },
        { id: 'workouts', label: 'Workouts', icon: Activity },
        { id: 'nutrition', label: 'Nutrition', icon: Utensils },
        { id: 'cardio', label: 'Cardio', icon: Heart },
        { id: 'rehab', label: 'Rehab', icon: Zap },
        { id: 'supplements', label: 'Supps', icon: Pill },
        { id: 'education', label: 'Edu', icon: BookOpen },
        { id: 'debug', label: 'Debug', icon: Terminal },
        { id: 'json', label: 'JSON', icon: Code },
    ];

    return (
        <ScreenLayout>
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <ArrowLeft color={COLORS.text.primary} size={24} />
                </TouchableOpacity>
                <View>
                    <Typography variant="h2">{plan.meta?.plan_name || 'Fitness Plan'}</Typography>
                    <Typography variant="caption" color={COLORS.text.secondary}>
                        {plan.meta?.coach_name || 'AI Generated'}
                    </Typography>
                </View>
            </View>

            <View style={styles.mainContainer}>
                {/* Left Sidebar */}
                <View style={styles.sidebar}>
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sidebarContent}>
                        {tabs.map((tab) => (
                            <TouchableOpacity
                                key={tab.id}
                                onPress={() => setActiveSection(tab.id)}
                                style={[
                                    styles.sidebarTab,
                                    activeSection === tab.id && styles.activeSidebarTab
                                ]}
                            >
                                <tab.icon size={20} color={activeSection === tab.id ? COLORS.primary.light : COLORS.text.secondary} />
                                <Typography
                                    variant="caption"
                                    color={activeSection === tab.id ? COLORS.primary.light : COLORS.text.secondary}
                                    style={{ marginTop: 4, textAlign: 'center', fontSize: 10 }}
                                >
                                    {tab.label}
                                </Typography>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Main Content Area */}
                <View style={styles.contentArea}>
                    <ScrollView contentContainerStyle={styles.contentScroll}>
                        {renderSection()}
                    </ScrollView>
                </View>
            </View>
        </ScreenLayout>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.m,
        gap: SPACING.m,
    },
    backButton: {
        padding: SPACING.s,
        backgroundColor: COLORS.background.secondary,
        borderRadius: BORDER_RADIUS.round,
    },
    mainContainer: {
        flex: 1,
        flexDirection: 'row',
        gap: SPACING.m,
    },
    sidebar: {
        width: 70,
        backgroundColor: COLORS.background.secondary,
        borderRadius: BORDER_RADIUS.m,
        overflow: 'hidden',
    },
    sidebarContent: {
        paddingVertical: SPACING.s,
        gap: SPACING.s,
        alignItems: 'center',
    },
    sidebarTab: {
        width: 54,
        height: 54,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: BORDER_RADIUS.s,
        backgroundColor: 'transparent',
    },
    activeSidebarTab: {
        backgroundColor: COLORS.background.tertiary,
        borderWidth: 1,
        borderColor: COLORS.primary.main,
    },
    contentArea: {
        flex: 1,
    },
    contentScroll: {
        paddingBottom: SPACING.xl,
    },
    profileGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: SPACING.s,
    },
    tag: {
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        paddingHorizontal: SPACING.s,
        paddingVertical: 4,
        borderRadius: BORDER_RADIUS.s,
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
