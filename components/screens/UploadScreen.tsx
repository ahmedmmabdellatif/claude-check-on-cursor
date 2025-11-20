import React from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Upload, FileText, AlertCircle, CheckCircle, Terminal } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import { ScreenLayout } from '../ScreenLayout';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Typography } from '../ui/Typography';
import { LogViewer, LogEntry } from '../ui/LogViewer';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants/theme';

interface UploadScreenProps {
    onPickDocument: () => void;
    onUpload: () => void;
    selectedFile: DocumentPicker.DocumentPickerAsset | null;
    isLoading: boolean;
    error: string;
    logs: LogEntry[];
    showLogs: boolean;
    onToggleLogs: () => void;
}

export const UploadScreen: React.FC<UploadScreenProps> = ({
    onPickDocument,
    onUpload,
    selectedFile,
    isLoading,
    error,
    logs,
    showLogs,
    onToggleLogs
}) => {
    return (
        <ScreenLayout>
            <View style={styles.header}>
                <Typography variant="h1">Parser Home</Typography>
                <Typography variant="body" color={COLORS.text.secondary}>
                    AI-Powered Document Analysis
                </Typography>
            </View>

            {/* Version Card (System Maintained) */}
            <Card variant="glass" style={styles.versionCard}>
                <View style={styles.versionHeader}>
                    <View style={styles.badge}>
                        <Typography variant="caption" style={{ color: COLORS.primary.main, fontWeight: 'bold' }}>
                            v1.0.0 Beta
                        </Typography>
                    </View>
                    <Typography variant="caption" color={COLORS.text.secondary}>
                        Updated: 20 Nov 2025
                    </Typography>
                </View>
                <Typography variant="body" style={{ marginTop: SPACING.s }}>
                    • Universal Fitness Parser v3 Integration
                </Typography>
                <Typography variant="body">
                    • Enhanced Debugging & Logging
                </Typography>
                <Typography variant="body">
                    • New "Dark Premium" UI
                </Typography>
            </Card>

            {/* Debug Card (Live Logs) */}
            <Card variant="outlined" style={styles.debugCard}>
                <TouchableOpacity onPress={onToggleLogs} style={styles.debugHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.s }}>
                        <Terminal size={16} color={COLORS.text.secondary} />
                        <Typography variant="h3">System Logs</Typography>
                    </View>
                    <Typography variant="caption" color={COLORS.primary.light}>
                        {showLogs ? 'Hide' : 'Show'}
                    </Typography>
                </TouchableOpacity>

                {showLogs && (
                    <View style={{ height: 200, marginTop: SPACING.s }}>
                        <LogViewer logs={logs} />
                    </View>
                )}
            </Card>

            {/* PDF Upload Section */}
            <Card style={styles.uploadCard}>
                <Typography variant="h2" style={{ marginBottom: SPACING.m }}>Select Document</Typography>

                {selectedFile ? (
                    <View style={styles.fileInfo}>
                        <FileText color={COLORS.primary.main} size={32} />
                        <View style={{ flex: 1 }}>
                            <Typography variant="body" style={{ fontWeight: 'bold' }}>
                                {selectedFile.name}
                            </Typography>
                            <Typography variant="caption" color={COLORS.text.secondary}>
                                {(selectedFile.size ? (selectedFile.size / 1024 / 1024).toFixed(2) : '0')} MB
                            </Typography>
                        </View>
                        <TouchableOpacity onPress={onPickDocument}>
                            <Typography variant="caption" color={COLORS.primary.light}>Change</Typography>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <TouchableOpacity
                        style={styles.uploadPlaceholder}
                        onPress={onPickDocument}
                        activeOpacity={0.7}
                    >
                        <Upload color={COLORS.text.secondary} size={32} />
                        <Typography variant="body" color={COLORS.text.secondary} style={{ marginTop: SPACING.s }}>
                            Tap to select PDF
                        </Typography>
                    </TouchableOpacity>
                )}

                <Button
                    title={isLoading ? "Parsing..." : "Send to OpenAI for Parsing"}
                    onPress={onUpload}
                    disabled={!selectedFile || isLoading}
                    loading={isLoading}
                    style={{ marginTop: SPACING.l }}
                />

                {error ? (
                    <View style={styles.statusBoxError}>
                        <AlertCircle size={16} color={COLORS.status.error} />
                        <Typography variant="caption" color={COLORS.status.error} style={{ flex: 1 }}>
                            {error}
                        </Typography>
                    </View>
                ) : isLoading ? (
                    <View style={styles.statusBox}>
                        <ActivityIndicator size="small" color={COLORS.primary.light} />
                        <Typography variant="caption" color={COLORS.primary.light}>
                            Processing document... check logs above.
                        </Typography>
                    </View>
                ) : null}
            </Card>
        </ScreenLayout>
    );
};

const styles = StyleSheet.create({
    header: {
        marginBottom: SPACING.l,
    },
    versionCard: {
        marginBottom: SPACING.m,
    },
    versionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.xs,
    },
    badge: {
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    debugCard: {
        marginBottom: SPACING.m,
        padding: SPACING.s,
    },
    debugHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    uploadCard: {
        padding: SPACING.l,
    },
    uploadPlaceholder: {
        borderWidth: 2,
        borderColor: COLORS.background.tertiary,
        borderStyle: 'dashed',
        borderRadius: BORDER_RADIUS.m,
        height: 120,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(30, 41, 59, 0.3)',
    },
    fileInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.m,
        padding: SPACING.m,
        backgroundColor: COLORS.background.tertiary,
        borderRadius: BORDER_RADIUS.m,
    },
    statusBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.s,
        marginTop: SPACING.m,
        padding: SPACING.s,
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        borderRadius: BORDER_RADIUS.s,
    },
    statusBoxError: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.s,
        marginTop: SPACING.m,
        padding: SPACING.s,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderRadius: BORDER_RADIUS.s,
    },
});
