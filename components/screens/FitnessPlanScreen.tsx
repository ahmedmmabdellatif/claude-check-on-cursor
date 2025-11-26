// TODO: legacy view, can be removed after verifying new PlanViewerScreen
// This file is kept for reference but should not be used in the main flow.
// Use components/screens/PlanViewerScreen.tsx instead.

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Platform, Text } from 'react-native';
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
    console.log('[JsonSection] Rendering with data:', data ? 'DATA EXISTS' : 'NO DATA');
    console.log('[JsonSection] Data keys:', data ? Object.keys(data) : 'N/A');
    console.log('[JsonSection] Data type:', typeof data);

    const handleCopy = async () => {
        try {
            const jsonString = JSON.stringify(data, null, 2);
            await Clipboard.setStringAsync(jsonString);
            console.log('[JsonSection] Copied', jsonString.length, 'characters to clipboard');
        } catch (e) {
            console.error('[JsonSection] Failed to copy JSON', e);
        }
    };

    if (!data) {
        console.log('[JsonSection] Data is null/undefined');
        return (
            <Card variant="outlined">
                <Typography variant="body" color={COLORS.status.error} align="center">
                    ERROR: No data received by JsonSection
                </Typography>
            </Card>
        );
    }

    const jsonString = JSON.stringify(data, null, 2);
    const dataKeys = Object.keys(data);

    console.log('[JsonSection] JSON string length:', jsonString.length);
    console.log('[JsonSection] First 200 chars:', jsonString.substring(0, 200));

    return (
        <View style={{ gap: SPACING.m }}>
            {/* Debug Info */}
            <Card variant="glass">
                <Typography variant="label" style={{ marginBottom: SPACING.s }}>Data Summary</Typography>
                <Text style={{ color: COLORS.text.primary, fontSize: 12 }}>
                    Keys: {dataKeys.join(', ')}
                </Text>
                <Text style={{ color: COLORS.text.secondary, fontSize: 12, marginTop: 4 }}>
                    JSON Size: {jsonString.length} characters
                </Text>
            </Card>

            {/* Copy Button - More Prominent */}
            <Card variant="glass" style={{ marginBottom: SPACING.s }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View>
                        <Typography variant="label">Raw JSON Data</Typography>
                        <Typography variant="caption" color={COLORS.text.secondary}>
                            {jsonString.length.toLocaleString()} characters
                        </Typography>
                    </View>
                    <TouchableOpacity
                        onPress={handleCopy}
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 6,
                            backgroundColor: COLORS.primary.main,
                            paddingHorizontal: SPACING.m,
                            paddingVertical: SPACING.s,
                            borderRadius: BORDER_RADIUS.s
                        }}
                    >
                        <Copy size={18} color="#FFFFFF" />
                        <Typography variant="body" style={{ color: '#FFFFFF', fontWeight: 'bold' }}>
                            Copy JSON
                        </Typography>
                    </TouchableOpacity>
                </View>
            </Card>

            {/* JSON Display - Formatted JSON */}
            <Card variant="outlined" style={{ backgroundColor: '#0F172A', minHeight: 300, maxHeight: 600 }}>
                <View style={{ padding: SPACING.s, borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.1)' }}>
                    <Typography variant="caption" color={COLORS.text.secondary}>
                        Scroll to view full JSON ({jsonString.length.toLocaleString()} characters)
                    </Typography>
                </View>
                <ScrollView 
                    horizontal 
                    nestedScrollEnabled
                    showsHorizontalScrollIndicator={true}
                    showsVerticalScrollIndicator={true}
                    style={{ flex: 1 }}
                >
                    <ScrollView nestedScrollEnabled style={{ padding: SPACING.m }}>
                        <Text
                            style={{
                                fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
                                color: '#E2E8F0',
                                fontSize: 11,
                                lineHeight: 16
                            }}
                            selectable={true}
                        >
                            {jsonString}
                        </Text>
                    </ScrollView>
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

    console.log('[FitnessPlanScreen] Plan received:', plan ? 'YES' : 'NO');
    console.log('[FitnessPlanScreen] Active section:', activeSection);

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
                console.log('[FitnessPlanScreen] Rendering JsonSection with plan');
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
