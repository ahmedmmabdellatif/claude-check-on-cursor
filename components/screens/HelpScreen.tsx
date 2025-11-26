// HelpScreen.tsx
// In-app help and onboarding for coaches

import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { ChevronLeft, HelpCircle, Upload, Calendar, TrendingUp, Terminal, Bug } from 'lucide-react-native';
import { ScreenLayout } from '../ScreenLayout';
import { Typography } from '../ui/Typography';
import { Card } from '../ui/Card';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants/theme';

interface HelpScreenProps {
  onBack: () => void;
}

export const HelpScreen: React.FC<HelpScreenProps> = ({ onBack }) => {
  return (
    <ScreenLayout>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <ChevronLeft color={COLORS.text.primary} size={24} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <HelpCircle color={COLORS.primary.light} size={24} />
            <Typography variant="h2" style={{ marginLeft: SPACING.s }}>
              Help & How-To
            </Typography>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* How to Use the App */}
          <Card variant="glass" style={styles.section}>
            <Typography variant="h3" style={styles.sectionTitle}>
              How to Use the App
            </Typography>
            
            <View style={styles.step}>
              <View style={styles.stepHeader}>
                <View style={styles.stepNumber}>
                  <Typography variant="body" style={{ fontWeight: '600', color: COLORS.primary.light }}>
                    1
                  </Typography>
                </View>
                <Upload size={20} color={COLORS.primary.light} />
                <Typography variant="body" style={{ fontWeight: '600', marginLeft: SPACING.s }}>
                  Upload a Client PDF
                </Typography>
              </View>
              <Typography variant="body" color={COLORS.text.secondary} style={styles.stepContent}>
                Go to the <strong>Home</strong> tab and tap "Pick Document" to select a fitness plan PDF from your device. Then tap "Upload & Parse" to start processing.
              </Typography>
            </View>

            <View style={styles.step}>
              <View style={styles.stepHeader}>
                <View style={styles.stepNumber}>
                  <Typography variant="body" style={{ fontWeight: '600', color: COLORS.primary.light }}>
                    2
                  </Typography>
                </View>
                <Terminal size={20} color={COLORS.primary.light} />
                <Typography variant="body" style={{ fontWeight: '600', marginLeft: SPACING.s }}>
                  Wait for Parsing
                </Typography>
              </View>
              <Typography variant="body" color={COLORS.text.secondary} style={styles.stepContent}>
                The app will process your PDF in the background. You can check progress in the <strong>Logs</strong> tab. Large PDFs may take several minutes - please keep the app open during processing.
              </Typography>
            </View>

            <View style={styles.step}>
              <View style={styles.stepHeader}>
                <View style={styles.stepNumber}>
                  <Typography variant="body" style={{ fontWeight: '600', color: COLORS.primary.light }}>
                    3
                  </Typography>
                </View>
                <Calendar size={20} color={COLORS.primary.light} />
                <Typography variant="body" style={{ fontWeight: '600', marginLeft: SPACING.s }}>
                  Use the Journey Tab
                </Typography>
              </View>
              <Typography variant="body" color={COLORS.text.secondary} style={styles.stepContent}>
                Once parsing is complete, go to the <strong>Journey</strong> tab to see daily tasks organized by day. Tap tasks to mark them as completed or add tracking data (weight, reps, etc.).
              </Typography>
            </View>

            <View style={styles.step}>
              <View style={styles.stepHeader}>
                <View style={styles.stepNumber}>
                  <Typography variant="body" style={{ fontWeight: '600', color: COLORS.primary.light }}>
                    4
                  </Typography>
                </View>
                <TrendingUp size={20} color={COLORS.primary.light} />
                <Typography variant="body" style={{ fontWeight: '600', marginLeft: SPACING.s }}>
                  Monitor Progress
                </Typography>
              </View>
              <Typography variant="body" color={COLORS.text.secondary} style={styles.stepContent}>
                Check the <strong>Progress</strong> tab to see adherence metrics, completion rates, streaks, and a calendar view of your progress over time.
              </Typography>
            </View>

            <View style={styles.step}>
              <View style={styles.stepHeader}>
                <View style={styles.stepNumber}>
                  <Typography variant="body" style={{ fontWeight: '600', color: COLORS.primary.light }}>
                    5
                  </Typography>
                </View>
                <Bug size={20} color={COLORS.primary.light} />
                <Typography variant="body" style={{ fontWeight: '600', marginLeft: SPACING.s }}>
                  Troubleshooting (if needed)
                </Typography>
              </View>
              <Typography variant="body" color={COLORS.text.secondary} style={styles.stepContent}>
                If something looks wrong, go to the <strong>Logs</strong> tab and tap "Mapping Debug" to inspect the parsing results, timeline mapping, and progress storage.
              </Typography>
            </View>
          </Card>

          {/* What to Do if Something Looks Wrong */}
          <Card variant="glass" style={styles.section}>
            <Typography variant="h3" style={styles.sectionTitle}>
              Troubleshooting
            </Typography>
            
            <View style={styles.troubleshootingItem}>
              <Typography variant="body" style={{ fontWeight: '600', marginBottom: SPACING.xs }}>
                Parsing is taking too long
              </Typography>
              <Typography variant="body" color={COLORS.text.secondary}>
                Large PDFs (50+ pages) can take 10-30 minutes to parse. Check the <strong>Logs</strong> tab to see real-time progress. Do not close the app during processing.
              </Typography>
            </View>

            <View style={styles.troubleshootingItem}>
              <Typography variant="body" style={{ fontWeight: '600', marginBottom: SPACING.xs }}>
                Tasks are missing or incorrect
              </Typography>
              <Typography variant="body" color={COLORS.text.secondary}>
                Go to <strong>Logs → Mapping Debug</strong> to inspect what was parsed from the PDF. You can see the raw data, how it was organized, and the journey timeline.
              </Typography>
            </View>

            <View style={styles.troubleshootingItem}>
              <Typography variant="body" style={{ fontWeight: '600', marginBottom: SPACING.xs }}>
                Progress data seems wrong
              </Typography>
              <Typography variant="body" color={COLORS.text.secondary}>
                In <strong>Logs → Mapping Debug</strong>, you can reset progress for the current program. This will clear all task completions but keep the parsed plan intact.
              </Typography>
            </View>

            <View style={styles.troubleshootingItem}>
              <Typography variant="body" style={{ fontWeight: '600', marginBottom: SPACING.xs }}>
                Everything is broken
              </Typography>
              <Typography variant="body" color={COLORS.text.secondary}>
                Use the "Reset All Local Data" option in <strong>Logs → Mapping Debug</strong>. This will clear all app data and return you to a fresh state. You'll need to re-upload your PDF.
              </Typography>
            </View>
          </Card>

          {/* Limitations */}
          <Card variant="outlined" style={styles.section}>
            <Typography variant="h3" style={styles.sectionTitle}>
              Important Limitations
            </Typography>
            
            <View style={styles.limitationItem}>
              <Typography variant="body" color={COLORS.text.secondary}>
                • The app currently handles <strong>one program at a time</strong>. Uploading a new PDF will replace the current program.
              </Typography>
            </View>
            
            <View style={styles.limitationItem}>
              <Typography variant="body" color={COLORS.text.secondary}>
                • <strong>Do not close the app</strong> during PDF parsing. The process runs in the background but requires the app to stay open.
              </Typography>
            </View>
            
            <View style={styles.limitationItem}>
              <Typography variant="body" color={COLORS.text.secondary}>
                • Parsing quality depends on the PDF structure. Well-formatted fitness plans work best.
              </Typography>
            </View>
          </Card>
        </ScrollView>
      </View>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.m,
    gap: SPACING.s,
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  scrollContent: {
    padding: SPACING.m,
    paddingBottom: SPACING.xxl,
  },
  section: {
    padding: SPACING.m,
    marginBottom: SPACING.m,
  },
  sectionTitle: {
    marginBottom: SPACING.m,
    color: COLORS.primary.light,
  },
  step: {
    marginBottom: SPACING.l,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary.main + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.s,
  },
  stepContent: {
    marginLeft: 44, // Align with step number + icon
    lineHeight: 22,
  },
  troubleshootingItem: {
    marginBottom: SPACING.m,
    paddingBottom: SPACING.m,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background.tertiary,
  },
  limitationItem: {
    marginBottom: SPACING.s,
  },
});

