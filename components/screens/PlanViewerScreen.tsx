// PlanViewerScreen.tsx - Main plan viewer with journey view and legacy sections
// Uses ProgramForTracking for journey view, falls back to UniversalFitnessPlan for legacy view

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { ArrowLeft, Info, Activity, Utensils, Heart, Zap, BookOpen, Terminal, ArrowRight, Calendar } from 'lucide-react-native';
import { ScreenLayout } from '../ScreenLayout';
import { Typography } from '../ui/Typography';
import { Card } from '../ui/Card';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import { UniversalFitnessPlan } from '../../constants/fitnessTypes';
import { ProgramForTracking } from '../../shared/programTrackingSchema';

// Import journey view
import { JourneyView } from '../journey/JourneyView';

// Import legacy section components
import { OverviewSection } from '../plan/OverviewSection';
import { RehabSection } from '../plan/RehabSection';
import { WarmupSection } from '../plan/WarmupSection';
import { StretchingSection } from '../plan/StretchingSection';
import { WorkoutsSection } from '../plan/WorkoutsSection';
import { CardioSection } from '../plan/CardioSection';
import { NutritionSection } from '../plan/NutritionSection';
import { EducationSection } from '../plan/EducationSection';
import { DebugSection } from '../plan/DebugSection';

interface PlanViewerScreenProps {
  plan: UniversalFitnessPlan;
  normalizedPlan?: ProgramForTracking;
  onBack: () => void;
}

type Tab = 'journey' | 'overview' | 'rehab' | 'warmup' | 'stretching' | 'workouts' | 'cardio' | 'nutrition' | 'education' | 'debug';

export const PlanViewerScreen: React.FC<PlanViewerScreenProps> = ({ plan, normalizedPlan, onBack }) => {
  const [activeTab, setActiveTab] = useState<Tab>(normalizedPlan ? 'journey' : 'overview');

  const renderContent = () => {
    switch (activeTab) {
      case 'journey':
        if (normalizedPlan) {
          return <JourneyView program={normalizedPlan} />;
        }
        // Fallback to overview if no normalized plan
        return <OverviewSection plan={plan} />;
      case 'overview':
        return <OverviewSection plan={plan} />;
      case 'rehab':
        return <RehabSection plan={plan} />;
      case 'warmup':
        return <WarmupSection plan={plan} />;
      case 'stretching':
        return <StretchingSection plan={plan} />;
      case 'workouts':
        return <WorkoutsSection plan={plan} />;
      case 'cardio':
        return <CardioSection plan={plan} />;
      case 'nutrition':
        return <NutritionSection plan={plan} />;
      case 'education':
        return <EducationSection plan={plan} />;
      case 'debug':
        return <DebugSection plan={plan} />;
      default:
        return normalizedPlan ? <JourneyView program={normalizedPlan} /> : <OverviewSection plan={plan} />;
    }
  };

  const tabs: { id: Tab; label: string; icon: any }[] = [
    ...(normalizedPlan ? [{ id: 'journey' as Tab, label: 'Journey', icon: Calendar }] : []),
    { id: 'overview', label: 'Overview', icon: Info },
    { id: 'rehab', label: 'Rehab', icon: Zap },
    { id: 'warmup', label: 'Warmup', icon: Activity },
    { id: 'stretching', label: 'Stretch', icon: ArrowRight },
    { id: 'workouts', label: 'Workouts', icon: Activity },
    { id: 'cardio', label: 'Cardio', icon: Heart },
    { id: 'nutrition', label: 'Nutrition', icon: Utensils },
    { id: 'education', label: 'Education', icon: BookOpen },
    { id: 'debug', label: 'Debug', icon: Terminal },
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
                       onPress={() => setActiveTab(tab.id)}
                       style={[
                         styles.sidebarTab,
                         activeTab === tab.id && styles.activeSidebarTab
                       ]}
                     >
                       <tab.icon size={20} color={activeTab === tab.id ? COLORS.primary.light : COLORS.text.secondary} />
                       <Typography
                         variant="caption"
                         color={activeTab === tab.id ? COLORS.primary.light : COLORS.text.secondary}
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
                 {activeTab === 'journey' ? (
                   renderContent()
                 ) : (
                   <ScrollView contentContainerStyle={styles.contentScroll}>
                     {renderContent()}
                   </ScrollView>
                 )}
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
});

