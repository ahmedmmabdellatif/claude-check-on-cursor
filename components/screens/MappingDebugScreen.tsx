// MappingDebugScreen.tsx
// Mapping Acceptance & Debug Layer - Inspects all 4 layers of the pipeline

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Modal, Alert } from 'react-native';
import { ChevronLeft, ChevronDown, ChevronUp, AlertTriangle, CheckCircle, XCircle, RefreshCw } from 'lucide-react-native';
import { ScreenLayout } from '../ScreenLayout';
import { Typography } from '../ui/Typography';
import { Card } from '../ui/Card';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import { UniversalFitnessPlan } from '../../constants/fitnessTypes';
import { ProgramForTracking } from '../../shared/programTrackingSchema';
import { JourneyTimeline, JourneyTask, JourneyTaskCategory } from '../../app/types/journey';
import { loadJourneyTimeline } from '../../app/lib/journeyStorage';
import { getJourneyProgress, clearJourneyProgress } from '../../app/lib/journeyProgress';
import { resetAllLocalData } from '../../app/lib/dataReset';

interface MappingDebugScreenProps {
  program: ProgramForTracking | null;
  programId: string | null;
  workerJson: UniversalFitnessPlan | null; // Raw Worker JSON
  onBack: () => void;
}

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ title, children, defaultExpanded = false }) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  
  return (
    <Card variant="glass" style={styles.sectionCard}>
      <TouchableOpacity
        onPress={() => setExpanded(!expanded)}
        style={styles.sectionHeader}
      >
        <Typography variant="h4">{title}</Typography>
        {expanded ? (
          <ChevronUp size={20} color={COLORS.text.secondary} />
        ) : (
          <ChevronDown size={20} color={COLORS.text.secondary} />
        )}
      </TouchableOpacity>
      {expanded && <View style={styles.sectionContent}>{children}</View>}
    </Card>
  );
};

const JsonViewer: React.FC<{ data: any; maxLength?: number }> = ({ data, maxLength = 5000 }) => {
  const jsonString = JSON.stringify(data, null, 2);
  const truncated = jsonString.length > maxLength;
  const displayText = truncated ? jsonString.substring(0, maxLength) + '\n... (truncated)' : jsonString;

  return (
    <View style={styles.jsonContainer}>
      <ScrollView horizontal nestedScrollEnabled>
        <Typography
          variant="caption"
          style={styles.jsonText}
        >
          {displayText}
        </Typography>
      </ScrollView>
      {truncated && (
        <Typography variant="caption" color={COLORS.text.tertiary} style={{ marginTop: SPACING.xs }}>
          Showing first {maxLength} characters. Full JSON available in raw data.
        </Typography>
      )}
    </View>
  );
};

export const MappingDebugScreen: React.FC<MappingDebugScreenProps> = ({
  program,
  programId,
  workerJson,
  onBack,
}) => {
  const [timeline, setTimeline] = useState<JourneyTimeline | null>(null);
  const [progress, setProgress] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // Load timeline and progress
  useEffect(() => {
    if (!programId) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        const [loadedTimeline, loadedProgress] = await Promise.all([
          loadJourneyTimeline(programId),
          getJourneyProgress(programId),
        ]);

        setTimeline(loadedTimeline);
        setProgress(loadedProgress);
      } catch (error) {
        console.error('[MappingDebugScreen] Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [programId]);

  // Calculate bucket counts from Worker JSON
  const getBucketCounts = () => {
    if (!workerJson) return {};

    return {
      workouts: workerJson.workouts?.length || 0,
      cardio: workerJson.cardio_sessions?.length || 0,
      nutrition: workerJson.nutrition_plan?.length || 0,
      rehab: workerJson.mobility_and_rehab?.length || 0,
      warmup: workerJson.warmup_protocols?.length || 0,
      stretching: workerJson.stretching_routines?.length || 0,
      education: workerJson.education_and_guidelines?.length || 0,
      unclassified: workerJson.unclassified?.length || 0,
      other: workerJson.other_information?.length || 0,
    };
  };

  // Get unique page numbers for a bucket
  const getBucketPages = (bucketKey: string): number[] => {
    if (!workerJson || !workerJson.debug?.pages) return [];
    
    // Map bucket keys to their names in the debug.mapped_to array
    const bucketNameMap: Record<string, string> = {
      workouts: 'workouts',
      cardio: 'cardio_sessions',
      nutrition: 'nutrition_plan',
      rehab: 'mobility_and_rehab',
      warmup: 'warmup_protocols',
      stretching: 'stretching_routines',
      education: 'education_and_guidelines',
      unclassified: 'unclassified',
      other: 'other_information',
    };
    
    const mappedName = bucketNameMap[bucketKey] || bucketKey;
    const pages: number[] = [];
    
    workerJson.debug.pages.forEach((page) => {
      if (page.mapped_to?.some(mapped => mapped.includes(mappedName)) && !pages.includes(page.page_number)) {
        pages.push(page.page_number);
      }
    });
    
    return pages.sort((a, b) => a - b);
  };

  // Check consistency between timeline and progress
  const checkConsistency = () => {
    if (!timeline || !progress) return [];

    const issues: Array<{ dayIndex: number; issue: string }> = [];

    timeline.days.forEach((day) => {
      const timelineTaskIds = new Set(day.tasks.map(t => t.id));
      const progressTaskIds = new Set(Object.keys(progress));

      // Check for tasks in timeline but not in progress
      const missingInProgress: string[] = [];
      timelineTaskIds.forEach(taskId => {
        if (!progressTaskIds.has(taskId)) {
          missingInProgress.push(taskId);
        }
      });

      // Check for tasks in progress but not in timeline (orphaned)
      const orphanedInProgress: string[] = [];
      progressTaskIds.forEach(taskId => {
        if (!timelineTaskIds.has(taskId)) {
          orphanedInProgress.push(taskId);
        }
      });

      if (missingInProgress.length > 0 || orphanedInProgress.length > 0) {
        const issuesList: string[] = [];
        if (missingInProgress.length > 0) {
          issuesList.push(`${missingInProgress.length} task(s) missing in progress`);
        }
        if (orphanedInProgress.length > 0) {
          issuesList.push(`${orphanedInProgress.length} orphaned task(s) in progress`);
        }
        issues.push({
          dayIndex: day.dayIndex,
          issue: issuesList.join(', '),
        });
      }
    });

    return issues;
  };

  const handleResetProgress = () => {
    if (!programId) return;

    Alert.alert(
      'Reset Current Program Progress',
      'This will clear all task completions and tracking data for this program only. The parsed plan will remain intact. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearJourneyProgress(programId);
              const freshProgress = await getJourneyProgress(programId);
              setProgress(freshProgress);
              Alert.alert('Success', 'Progress has been reset for this program.');
            } catch (error) {
              Alert.alert('Error', 'Failed to reset progress.');
              console.error('[MappingDebugScreen] Error resetting progress:', error);
            }
          },
        },
      ]
    );
  };

  const handleResetAllData = () => {
    Alert.alert(
      'Reset All Local App Data',
      'This will clear ALL app data including:\n\n• All parsed documents\n• All journey timelines\n• All progress data\n\nYou will need to re-upload your PDF after this. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset All',
          style: 'destructive',
          onPress: async () => {
            try {
              await resetAllLocalData();
              Alert.alert(
                'Success',
                'All app data has been cleared. The app will return to a fresh state.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      // Navigate back - the parent should handle state reset
                      onBack();
                    },
                  },
                ]
              );
            } catch (error) {
              Alert.alert('Error', 'Failed to reset all data.');
              console.error('[MappingDebugScreen] Error resetting all data:', error);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <ScreenLayout>
        <View style={styles.container}>
          <Typography variant="body" color={COLORS.text.secondary}>
            Loading debug data...
          </Typography>
        </View>
      </ScreenLayout>
    );
  }

  if (!program || !programId || !workerJson) {
    return (
      <ScreenLayout>
        <View style={styles.container}>
          <Card variant="outlined" style={styles.emptyCard}>
            <Typography variant="h3" style={{ marginBottom: SPACING.s }}>
              No Program Available
            </Typography>
            <Typography variant="body" color={COLORS.text.secondary}>
              Please upload and parse a PDF first to view mapping debug information.
            </Typography>
          </Card>
        </View>
      </ScreenLayout>
    );
  }

  const bucketCounts = getBucketCounts();
  const consistencyIssues = checkConsistency();
  const totalPages = workerJson.debug?.pages?.length || 0;

  return (
    <ScreenLayout>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <ChevronLeft color={COLORS.text.primary} size={24} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Typography variant="h2">Mapping Debug</Typography>
            <Typography variant="caption" color={COLORS.text.secondary}>
              {programId}
            </Typography>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Layer 1: Raw Worker JSON */}
          <View style={styles.layer}>
            <Typography variant="h3" style={styles.layerTitle}>
              Layer 1: Raw Worker JSON
            </Typography>
            
            <Card variant="glass" style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Typography variant="body">Program ID:</Typography>
                <Typography variant="body" color={COLORS.primary.light}>
                  {programId}
                </Typography>
              </View>
              <View style={styles.summaryRow}>
                <Typography variant="body">Total Pages:</Typography>
                <Typography variant="body" color={COLORS.primary.light}>
                  {totalPages}
                </Typography>
              </View>
              <View style={styles.summaryRow}>
                <Typography variant="body">Bucket Counts:</Typography>
                <View style={styles.bucketList}>
                  {Object.entries(bucketCounts).map(([key, count]) => (
                    <Typography key={key} variant="caption" color={COLORS.text.secondary}>
                      {key}: {count}
                    </Typography>
                  ))}
                </View>
              </View>
            </Card>

            <CollapsibleSection title="Meta" defaultExpanded={false}>
              <JsonViewer data={workerJson.meta} />
            </CollapsibleSection>

            <CollapsibleSection title="Debug Pages" defaultExpanded={false}>
              <View style={styles.pagesList}>
                {workerJson.debug?.pages?.slice(0, 10).map((page, idx) => (
                  <Card key={idx} variant="outlined" style={styles.pageCard}>
                    <Typography variant="body" style={{ fontWeight: '600' }}>
                      Page {page.page_number}
                    </Typography>
                    <Typography variant="caption" color={COLORS.text.secondary}>
                      Mapped to: {page.mapped_to?.join(', ') || 'none'}
                    </Typography>
                    <Typography variant="caption" color={COLORS.text.tertiary} numberOfLines={2}>
                      {page.raw_text?.substring(0, 100)}...
                    </Typography>
                  </Card>
                ))}
                {workerJson.debug?.pages && workerJson.debug.pages.length > 10 && (
                  <Typography variant="caption" color={COLORS.text.tertiary}>
                    ... and {workerJson.debug.pages.length - 10} more pages
                  </Typography>
                )}
              </View>
            </CollapsibleSection>

            <CollapsibleSection title="Full JSON" defaultExpanded={false}>
              <JsonViewer data={workerJson} maxLength={10000} />
            </CollapsibleSection>
          </View>

          {/* Layer 2: Universal Buckets */}
          <View style={styles.layer}>
            <Typography variant="h3" style={styles.layerTitle}>
              Layer 2: Universal Buckets
            </Typography>

            {Object.entries(bucketCounts).map(([bucketKey, count]) => {
              const pages = getBucketPages(bucketKey);
              // Map bucket keys to actual Worker JSON keys
              const bucketKeyMap: Record<string, keyof UniversalFitnessPlan> = {
                workouts: 'workouts',
                cardio: 'cardio_sessions',
                nutrition: 'nutrition_plan',
                rehab: 'mobility_and_rehab',
                warmup: 'warmup_protocols',
                stretching: 'stretching_routines',
                education: 'education_and_guidelines',
                unclassified: 'unclassified',
                other: 'other_information',
              };
              const actualKey = bucketKeyMap[bucketKey] || bucketKey as keyof UniversalFitnessPlan;
              const bucketData = workerJson[actualKey] as any[];

              return (
                <Card key={bucketKey} variant="glass" style={styles.bucketCard}>
                  <View style={styles.bucketHeader}>
                    <View>
                      <Typography variant="body" style={{ fontWeight: '600', textTransform: 'capitalize' }}>
                        {bucketKey.replace(/_/g, ' ')}
                      </Typography>
                      <Typography variant="caption" color={COLORS.text.secondary}>
                        {count} items • {pages.length} page(s)
                      </Typography>
                    </View>
                  </View>
                  {bucketData && bucketData.length > 0 && (
                    <View style={styles.bucketItems}>
                      {bucketData.slice(0, 3).map((item, idx) => (
                        <View key={idx} style={styles.bucketItem}>
                          <Typography variant="caption" color={COLORS.text.secondary}>
                            {item.name || item.title || JSON.stringify(item).substring(0, 50)}...
                          </Typography>
                        </View>
                      ))}
                      {bucketData.length > 3 && (
                        <Typography variant="caption" color={COLORS.text.tertiary}>
                          ... and {bucketData.length - 3} more items
                        </Typography>
                      )}
                    </View>
                  )}
                </Card>
              );
            })}
          </View>

          {/* Layer 3: Journey Timeline */}
          <View style={styles.layer}>
            <Typography variant="h3" style={styles.layerTitle}>
              Layer 3: Journey Timeline
            </Typography>

            {!timeline ? (
              <Card variant="outlined" style={styles.warningCard}>
                <AlertTriangle size={20} color={COLORS.status.warning} />
                <Typography variant="body" color={COLORS.status.warning} style={{ marginLeft: SPACING.s }}>
                  No journey timeline found. Timeline may not have been generated yet.
                </Typography>
              </Card>
            ) : (
              <>
                <Card variant="glass" style={styles.summaryCard}>
                  <Typography variant="body">Total Days: {timeline.totalDays}</Typography>
                  <Typography variant="body">Title: {timeline.title}</Typography>
                  {timeline.startDateIso && (
                    <Typography variant="body">Start Date: {timeline.startDateIso}</Typography>
                  )}
                </Card>

                {timeline.days.map((day) => {
                  const taskCounts: Record<JourneyTaskCategory, number> = {
                    workout: 0,
                    cardio: 0,
                    rehab: 0,
                    mobility: 0,
                    stretching: 0,
                    nutrition: 0,
                    education: 0,
                    checkin: 0,
                  };

                  day.tasks.forEach(task => {
                    taskCounts[task.category]++;
                  });

                  const totalTasks = day.tasks.length;
                  const hasIssues = totalTasks === 0 && Object.values(bucketCounts).some(c => c > 0);
                  const dayIssues = consistencyIssues.filter(issue => issue.dayIndex === day.dayIndex);

                  return (
                    <TouchableOpacity
                      key={day.dayIndex}
                      onPress={() => setSelectedDay(day.dayIndex)}
                    >
                      <Card
                        variant="glass"
                        style={[
                          styles.dayCard,
                          hasIssues && styles.dayCardWarning,
                          dayIssues.length > 0 && styles.dayCardError,
                        ]}
                      >
                        <View style={styles.dayHeader}>
                          <Typography variant="body" style={{ fontWeight: '600' }}>
                            {day.label}
                          </Typography>
                          {hasIssues && (
                            <AlertTriangle size={16} color={COLORS.status.warning} />
                          )}
                          {dayIssues.length > 0 && (
                            <XCircle size={16} color={COLORS.status.error} />
                          )}
                        </View>
                        <Typography variant="caption" color={COLORS.text.secondary}>
                          Total Tasks: {totalTasks}
                        </Typography>
                        <View style={styles.categoryCounts}>
                          {Object.entries(taskCounts).map(([cat, count]) => {
                            if (count === 0) return null;
                            return (
                              <Typography key={cat} variant="caption" color={COLORS.text.tertiary}>
                                {cat}: {count}
                              </Typography>
                            );
                          })}
                        </View>
                        {dayIssues.length > 0 && (
                          <View style={styles.issueBadge}>
                            <Typography variant="caption" color={COLORS.status.error}>
                              ⚠️ {dayIssues[0].issue}
                            </Typography>
                          </View>
                        )}
                      </Card>
                    </TouchableOpacity>
                  );
                })}
              </>
            )}
          </View>

          {/* Layer 4: Progress Storage */}
          <View style={styles.layer}>
            <Typography variant="h3" style={styles.layerTitle}>
              Layer 4: Progress Storage
            </Typography>

            {Object.keys(progress).length === 0 ? (
              <Card variant="outlined" style={styles.infoCard}>
                <Typography variant="body" color={COLORS.text.secondary}>
                  No progress data found for this program.
                </Typography>
              </Card>
            ) : (
              <>
                {/* Summary */}
                <Card variant="glass" style={styles.summaryCard}>
                  <Typography variant="body" style={{ fontWeight: '600', marginBottom: SPACING.s }}>
                    Summary
                  </Typography>
                  <Typography variant="body">
                    Total Tasks with Progress: {Object.keys(progress).length}
                  </Typography>
                  <Typography variant="body">
                    Completed Tasks: {Object.values(progress).filter((p: any) => p.completed).length}
                  </Typography>
                  {timeline && (
                    <Typography variant="body">
                      Expected Tasks: {timeline.days.reduce((sum, day) => sum + day.tasks.length, 0)}
                    </Typography>
                  )}
                </Card>

                {/* Consistency Issues */}
                {consistencyIssues.length > 0 && (
                  <Card variant="outlined" style={styles.errorCard}>
                    <View style={styles.errorHeader}>
                      <XCircle size={20} color={COLORS.status.error} />
                      <Typography variant="body" color={COLORS.status.error} style={{ marginLeft: SPACING.s }}>
                        Consistency Issues Found
                      </Typography>
                    </View>
                    {consistencyIssues.map((issue, idx) => (
                      <Typography key={idx} variant="caption" color={COLORS.text.secondary} style={{ marginTop: SPACING.xs }}>
                        Day {issue.dayIndex + 1}: {issue.issue}
                      </Typography>
                    ))}
                  </Card>
                )}

                {/* Per-day completion */}
                {timeline && (
                  <CollapsibleSection title="Per-Day Completion" defaultExpanded={false}>
                    {timeline.days.map((day) => {
                      const dayTasks = day.tasks;
                      const completedCount = dayTasks.filter(t => progress[t.id]?.completed).length;
                      const completionRate = dayTasks.length > 0 ? completedCount / dayTasks.length : 0;

                      return (
                        <View key={day.dayIndex} style={styles.completionRow}>
                          <Typography variant="body">{day.label}</Typography>
                          <Typography variant="body" color={COLORS.primary.light}>
                            {completedCount}/{dayTasks.length} ({Math.round(completionRate * 100)}%)
                          </Typography>
                        </View>
                      );
                    })}
                  </CollapsibleSection>
                )}

                {/* Raw JSON */}
                <CollapsibleSection title="Raw Progress JSON" defaultExpanded={false}>
                  <JsonViewer data={progress} />
                </CollapsibleSection>

                {/* Debug Actions */}
                <Card variant="outlined" style={styles.actionsCard}>
                  <Typography variant="body" style={{ marginBottom: SPACING.m, fontWeight: '600' }}>
                    Data & Debug Actions
                  </Typography>
                  
                  <TouchableOpacity
                    onPress={handleResetProgress}
                    style={[styles.resetButton, { marginBottom: SPACING.s }]}
                  >
                    <RefreshCw size={16} color={COLORS.status.warning} />
                    <Typography variant="body" color={COLORS.status.warning} style={{ marginLeft: SPACING.xs }}>
                      Reset Current Program Progress
                    </Typography>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleResetAllData}
                    style={styles.resetButton}
                  >
                    <RefreshCw size={16} color={COLORS.status.error} />
                    <Typography variant="body" color={COLORS.status.error} style={{ marginLeft: SPACING.xs }}>
                      Reset All Local App Data
                    </Typography>
                  </TouchableOpacity>
                  
                  <Typography variant="caption" color={COLORS.text.tertiary} style={{ marginTop: SPACING.s }}>
                    Use these options to recover from data issues. Reset Progress only affects the current program. Reset All clears everything.
                  </Typography>
                </Card>
              </>
            )}
          </View>
        </ScrollView>
      </View>

      {/* Day Detail Modal */}
      <Modal
        visible={selectedDay !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedDay(null)}
      >
        <View style={styles.modalOverlay}>
          <Card variant="glass" style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Typography variant="h3">
                {selectedDay !== null && timeline ? timeline.days[selectedDay]?.label : 'Day Details'}
              </Typography>
              <TouchableOpacity onPress={() => setSelectedDay(null)}>
                <Typography variant="body" color={COLORS.primary.light}>
                  Close
                </Typography>
              </TouchableOpacity>
            </View>

            {selectedDay !== null && timeline && (
              <ScrollView>
                {timeline.days[selectedDay]?.tasks.map((task) => (
                  <Card key={task.id} variant="outlined" style={styles.taskCard}>
                    <Typography variant="body" style={{ fontWeight: '600' }}>
                      {task.title}
                    </Typography>
                    <Typography variant="caption" color={COLORS.text.secondary}>
                      Category: {task.category}
                    </Typography>
                    {task.ref && (
                      <Typography variant="caption" color={COLORS.text.tertiary}>
                        Source: {task.ref.sourceKind} ({task.ref.sourceId})
                      </Typography>
                    )}
                    {task.description && (
                      <Typography variant="caption" color={COLORS.text.secondary} style={{ marginTop: SPACING.xs }}>
                        {task.description}
                      </Typography>
                    )}
                  </Card>
                ))}
              </ScrollView>
            )}
          </Card>
        </View>
      </Modal>
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
  },
  scrollContent: {
    padding: SPACING.m,
    paddingBottom: SPACING.xxl,
  },
  layer: {
    marginBottom: SPACING.xl,
  },
  layerTitle: {
    marginBottom: SPACING.m,
    color: COLORS.primary.light,
  },
  summaryCard: {
    padding: SPACING.m,
    marginBottom: SPACING.s,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  bucketList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  sectionCard: {
    marginBottom: SPACING.s,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.m,
  },
  sectionContent: {
    padding: SPACING.m,
    paddingTop: 0,
  },
  jsonContainer: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: BORDER_RADIUS.s,
    padding: SPACING.s,
    maxHeight: 300,
  },
  jsonText: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: COLORS.text.primary,
  },
  pagesList: {
    gap: SPACING.s,
  },
  pageCard: {
    padding: SPACING.s,
  },
  bucketCard: {
    padding: SPACING.m,
    marginBottom: SPACING.s,
  },
  bucketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.s,
  },
  bucketItems: {
    gap: SPACING.xs,
  },
  bucketItem: {
    paddingVertical: SPACING.xs,
  },
  dayCard: {
    padding: SPACING.m,
    marginBottom: SPACING.s,
  },
  dayCardWarning: {
    borderColor: COLORS.status.warning,
    borderWidth: 1,
  },
  dayCardError: {
    borderColor: COLORS.status.error,
    borderWidth: 1,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  categoryCounts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  issueBadge: {
    marginTop: SPACING.xs,
    padding: SPACING.xs,
    backgroundColor: COLORS.status.error + '20',
    borderRadius: BORDER_RADIUS.s,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.m,
    borderColor: COLORS.status.warning,
  },
  errorCard: {
    padding: SPACING.m,
    marginBottom: SPACING.s,
    borderColor: COLORS.status.error,
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  infoCard: {
    padding: SPACING.m,
  },
  completionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background.tertiary,
  },
  actionsCard: {
    padding: SPACING.m,
    marginTop: SPACING.m,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.s,
    backgroundColor: COLORS.status.error + '20',
    borderRadius: BORDER_RADIUS.s,
  },
  emptyCard: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    padding: SPACING.l,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.m,
  },
  taskCard: {
    padding: SPACING.m,
    marginBottom: SPACING.s,
  },
});

