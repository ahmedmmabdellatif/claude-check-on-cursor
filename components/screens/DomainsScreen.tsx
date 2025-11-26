import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { FileText, ChevronRight, Trash2, Activity, HelpCircle } from 'lucide-react-native';
import { ScreenLayout } from '../ScreenLayout';
import { Card } from '../ui/Card';
import { Typography } from '../ui/Typography';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants/theme';

interface DomainsScreenProps {
    documents: any[];
    onSelectDocument: (doc: any) => void;
    onDeleteDocument: (docId: string) => void;
    onSelectDomain: (domainId: string) => void;
    onOpenHelp?: () => void;
}

export const DomainsScreen: React.FC<DomainsScreenProps> = ({
    documents,
    onSelectDocument,
    onDeleteDocument,
    onSelectDomain,
    onOpenHelp
}) => {
    // Group documents by domain (currently only fitness_plan supported)
    const fitnessDocs = documents.filter(doc => doc.plan);

    return (
        <ScreenLayout>
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <Typography variant="h1">My Documents</Typography>
                    {onOpenHelp && (
                        <TouchableOpacity onPress={onOpenHelp} style={styles.helpButton}>
                            <HelpCircle size={24} color={COLORS.primary.light} />
                        </TouchableOpacity>
                    )}
                </View>
                <Typography variant="body" color={COLORS.text.secondary}>
                    Manage your parsed documents
                </Typography>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Domain Categories */}
                <View style={styles.domainGrid}>
                    <TouchableOpacity
                        style={styles.domainCard}
                        onPress={() => onSelectDomain('fitness')}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.iconBox, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
                            <Activity color={COLORS.primary.main} size={24} />
                        </View>
                        <Typography variant="h3" style={{ marginTop: SPACING.s }}>Fitness Plans</Typography>
                        <Typography variant="caption" color={COLORS.text.secondary}>
                            {fitnessDocs.length} documents
                        </Typography>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.domainCard}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.iconBox, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                            <FileText color={COLORS.status.info} size={24} />
                        </View>
                        <Typography variant="h3" style={{ marginTop: SPACING.s }}>Receipts</Typography>
                        <Typography variant="caption" color={COLORS.text.secondary}>Coming Soon</Typography>
                    </TouchableOpacity>
                </View>

                <Typography variant="h2" style={{ marginTop: SPACING.l, marginBottom: SPACING.m }}>
                    Recent Documents
                </Typography>

                {fitnessDocs.length === 0 ? (
                    <Card style={styles.emptyState}>
                        <FileText size={48} color={COLORS.text.tertiary} />
                        <Typography variant="body" color={COLORS.text.secondary} style={{ marginTop: SPACING.m }}>
                            No documents parsed yet.
                        </Typography>
                        <Typography variant="caption" color={COLORS.text.tertiary} style={{ textAlign: 'center', marginTop: SPACING.s }}>
                            Go to Home to upload a PDF.
                        </Typography>
                    </Card>
                ) : (
                    <View style={styles.docList}>
                        {fitnessDocs.map((doc, index) => (
                            <Card key={index} style={styles.docCard}>
                                <TouchableOpacity
                                    style={styles.docContent}
                                    onPress={() => onSelectDocument(doc)}
                                >
                                    <View style={styles.docIcon}>
                                        <FileText color={COLORS.primary.light} size={20} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Typography variant="body" style={{ fontWeight: '600' }}>
                                            {doc.name || 'Untitled Document'}
                                        </Typography>
                                        <Typography variant="caption" color={COLORS.text.secondary}>
                                            {new Date(doc.timestamp).toLocaleDateString()} • {new Date(doc.timestamp).toLocaleTimeString()}
                                        </Typography>
                                    </View>
                                    <ChevronRight color={COLORS.text.tertiary} size={20} />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.deleteBtn}
                                    onPress={() => onDeleteDocument(doc.id)}
                                >
                                    <Trash2 color={COLORS.status.error} size={18} />
                                </TouchableOpacity>
                            </Card>
                        ))}
                    </View>
                )}
            </ScrollView>
        </ScreenLayout>
    );
};

const styles = StyleSheet.create({
    header: {
        marginBottom: SPACING.l,
        paddingHorizontal: SPACING.m,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.xs,
    },
    helpButton: {
        padding: SPACING.xs,
    },
    content: {
        paddingBottom: SPACING.xl,
    },
    domainGrid: {
        flexDirection: 'row',
        gap: SPACING.m,
    },
    domainCard: {
        flex: 1,
        backgroundColor: COLORS.background.secondary,
        padding: SPACING.m,
        borderRadius: BORDER_RADIUS.m,
        borderWidth: 1,
        borderColor: COLORS.background.tertiary,
        alignItems: 'center',
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.s,
    },
    emptyState: {
        alignItems: 'center',
        padding: SPACING.xl,
        backgroundColor: 'rgba(30, 41, 59, 0.3)',
    },
    docList: {
        gap: SPACING.s,
    },
    docCard: {
        padding: 0,
        flexDirection: 'row',
        alignItems: 'center',
        overflow: 'hidden',
    },
    docContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.m,
        gap: SPACING.m,
    },
    docIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    deleteBtn: {
        padding: SPACING.m,
        borderLeftWidth: 1,
        borderLeftColor: COLORS.background.tertiary,
        height: '100%',
        justifyContent: 'center',
    },
});
