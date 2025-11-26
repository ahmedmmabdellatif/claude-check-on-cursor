// DebugSection.tsx - Shows debug.pages with page_number, raw_text preview, and mapped keys
// Uses pagination to avoid slow UI with many pages

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Terminal, FileText, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Card } from '../ui/Card';
import { Typography } from '../ui/Typography';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import { UniversalFitnessPlan } from '../../constants/fitnessTypes';
import { getArray, getString, getObject } from '../../utils/safe';

interface DebugSectionProps {
  plan: UniversalFitnessPlan;
}

const ITEMS_PER_PAGE = 10;

export const DebugSection: React.FC<DebugSectionProps> = ({ plan }) => {
  const pages = getArray(getObject(plan.debug).pages);
  const [currentPage, setCurrentPage] = useState(0);
  const totalPages = Math.ceil(pages.length / ITEMS_PER_PAGE);
  const startIdx = currentPage * ITEMS_PER_PAGE;
  const endIdx = startIdx + ITEMS_PER_PAGE;
  const currentPages = pages.slice(startIdx, endIdx);

  if (pages.length === 0) {
    return (
      <View style={styles.container}>
        <Card variant="outlined" style={styles.emptyCard}>
          <Typography variant="h3" style={{ marginBottom: SPACING.s }}>No Debug Data</Typography>
          <Typography variant="body" color={COLORS.text.secondary}>
            No debug page data available.
          </Typography>
        </Card>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Typography variant="h2" style={styles.title}>Debug: Page Mapping</Typography>
      <Typography variant="caption" color={COLORS.text.secondary} style={styles.subtitle}>
        {pages.length} pages processed
      </Typography>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <View style={styles.pagination}>
          <TouchableOpacity 
            onPress={() => setCurrentPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
            style={[styles.pageButton, currentPage === 0 && styles.pageButtonDisabled]}
          >
            <ChevronLeft size={18} color={currentPage === 0 ? COLORS.text.tertiary : COLORS.primary.light} />
          </TouchableOpacity>
          <Typography variant="body" color={COLORS.text.secondary}>
            Page {currentPage + 1} of {totalPages}
          </Typography>
          <TouchableOpacity 
            onPress={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
            disabled={currentPage >= totalPages - 1}
            style={[styles.pageButton, currentPage >= totalPages - 1 && styles.pageButtonDisabled]}
          >
            <ChevronRight size={18} color={currentPage >= totalPages - 1 ? COLORS.text.tertiary : COLORS.primary.light} />
          </TouchableOpacity>
        </View>
      )}

      {currentPages.map((page, idx) => {
        const actualIdx = startIdx + idx;
        return (
          <Card key={actualIdx} variant="outlined" style={styles.pageCard}>
            <View style={styles.pageHeader}>
              <FileText color={COLORS.primary.light} size={18} />
              <Typography variant="label">Page {getNumber(page.page_number) || actualIdx + 1}</Typography>
            </View>

            {/* Mapped Keys */}
            {getArray(page.mapped_to).length > 0 && (
              <View style={styles.mappedContainer}>
                <Typography variant="caption" color={COLORS.text.secondary}>Mapped to:</Typography>
                <View style={styles.tags}>
                  {getArray(page.mapped_to).map((key: any, keyIdx: number) => (
                    <View key={keyIdx} style={styles.tag}>
                      <Typography variant="caption" color={COLORS.primary.light}>
                        {getString(key)}
                      </Typography>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Detected Elements */}
            {getArray(page.detected_elements).length > 0 && (
              <View style={styles.elementsContainer}>
                <Typography variant="caption" color={COLORS.text.secondary}>Detected:</Typography>
                <View style={styles.tags}>
                  {getArray(page.detected_elements).map((el: any, elIdx: number) => (
                    <View key={elIdx} style={[styles.tag, styles.elementTag]}>
                      <Typography variant="caption" color={COLORS.text.secondary}>
                        {getString(el)}
                      </Typography>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Raw Text Preview */}
            {getString(page.raw_text) && (
              <View style={styles.textPreview}>
                <Typography variant="caption" color={COLORS.text.secondary} style={styles.previewLabel}>
                  Raw Text (first 100 chars):
                </Typography>
                <View style={styles.textContainer}>
                  <Typography variant="caption" style={styles.monospace}>
                    {getString(page.raw_text).substring(0, 100)}
                    {getString(page.raw_text).length > 100 ? '...' : ''}
                  </Typography>
                </View>
              </View>
            )}

            {/* Notes */}
            {getString(page.notes) && (
              <View style={styles.notesContainer}>
                <Typography variant="caption" color={COLORS.text.secondary} style={styles.notesLabel}>
                  Notes:
                </Typography>
                <Typography variant="caption" color={COLORS.text.secondary}>
                  {getString(page.notes)}
                </Typography>
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
  title: {
    marginBottom: SPACING.xs,
  },
  subtitle: {
    marginBottom: SPACING.m,
  },
  emptyCard: {
    padding: SPACING.l,
    alignItems: 'center',
  },
  pageCard: {
    marginBottom: SPACING.m,
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
    marginBottom: SPACING.m,
  },
  mappedContainer: {
    marginBottom: SPACING.m,
  },
  elementsContainer: {
    marginBottom: SPACING.m,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  tag: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.s,
  },
  elementTag: {
    backgroundColor: 'rgba(100, 100, 100, 0.1)',
  },
  textPreview: {
    marginBottom: SPACING.m,
  },
  previewLabel: {
    marginBottom: SPACING.xs,
  },
  textContainer: {
    backgroundColor: COLORS.background.tertiary,
    padding: SPACING.s,
    borderRadius: BORDER_RADIUS.s,
  },
  monospace: {
    fontFamily: 'monospace',
    fontSize: 11,
  },
  notesContainer: {
    marginTop: SPACING.m,
    paddingTop: SPACING.m,
    borderTopWidth: 1,
    borderTopColor: COLORS.background.tertiary,
  },
  notesLabel: {
    marginBottom: SPACING.xs,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.m,
    marginBottom: SPACING.m,
    paddingVertical: SPACING.s,
  },
  pageButton: {
    padding: SPACING.xs,
  },
  pageButtonDisabled: {
    opacity: 0.3,
  },
});

