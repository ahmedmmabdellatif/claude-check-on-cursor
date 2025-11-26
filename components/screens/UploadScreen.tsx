import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { Upload, FileText, AlertCircle, CheckCircle, Terminal, Copy, Check } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as Clipboard from 'expo-clipboard';
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
    isPolling?: boolean;
    jobStatus?: {
        status: 'pending' | 'processing' | 'done' | 'error';
        progress: {
            processedPages: number;
            totalPages: number;
            processedChunks: number;
            totalChunks: number;
        };
    } | null;
    parsingStartTime?: number | null;
    error: string;
    logs: LogEntry[];
    showLogs: boolean;
    onToggleLogs: () => void;
    backendLogs: Array<{ timestamp: string; level: 'info' | 'error' | 'warn' | 'success'; message: string; source?: string }>;
}

export const UploadScreen: React.FC<UploadScreenProps> = ({
    onPickDocument,
    onUpload,
    selectedFile,
    isLoading,
    isPolling = false,
    jobStatus = null,
    parsingStartTime = null,
    error,
    logs,
    showLogs,
    onToggleLogs,
    backendLogs
}) => {
    const [copied, setCopied] = useState(false);
    const [elapsedTime, setElapsedTime] = useState<number>(0);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const [versionCardExpanded, setVersionCardExpanded] = useState(false);

    // Update elapsed time every second when timer is active and processing
    useEffect(() => {
        if (parsingStartTime && (isPolling || isLoading)) {
            // Update immediately
            setElapsedTime(Date.now() - parsingStartTime);
            
            // Then update every second while processing
            intervalRef.current = setInterval(() => {
                setElapsedTime(Date.now() - parsingStartTime);
            }, 1000);

            return () => {
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                }
            };
        } else if (parsingStartTime && !isPolling && !isLoading) {
            // Processing stopped - set final time and stop updating
            setElapsedTime(Date.now() - parsingStartTime);
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        } else {
            // No timer active
            setElapsedTime(0);
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        }
    }, [parsingStartTime, isPolling, isLoading]);

    // Format elapsed time as MM:SS or HH:MM:SS
    const formatElapsedTime = (ms: number): string => {
        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    // Debug: log when backendLogs changes
    useEffect(() => {
        console.log('[UploadScreen] backendLogs changed:', backendLogs.length, 'logs');
    }, [backendLogs]);

    const handleCopyBackendLogs = async () => {
        try {
            const logsText = backendLogs.length > 0 
                ? backendLogs.map(log => {
                    const time = new Date(log.timestamp).toLocaleTimeString();
                    const source = log.source ? `[${log.source}] ` : '';
                    return `[${time}] ${log.level.toUpperCase()} ${source}${log.message}`;
                }).join('\n')
                : 'No backend logs available';
            await Clipboard.setStringAsync(logsText);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            Alert.alert('Error', 'Failed to copy logs to clipboard');
        }
    };

    return (
        <ScreenLayout>
            <ScrollView 
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true}
            >
                <View style={styles.header}>
                    <Typography variant="h1">Parser Home</Typography>
                    <Typography variant="body" color={COLORS.text.secondary}>
                        AI-Powered Document Analysis
                    </Typography>
                </View>

                {/* Version Card (System Maintained) - UPDATE THIS AFTER EACH CHANGE */}
            {/* Changes listed in reverse chronological order (most recent first) */}
            <Card variant="glass" style={styles.versionCard}>
                <TouchableOpacity 
                    onPress={() => setVersionCardExpanded(!versionCardExpanded)}
                    style={styles.versionHeader}
                    activeOpacity={0.7}
                >
                    <View style={styles.badge}>
                        <Typography variant="caption" style={{ color: COLORS.primary.main, fontWeight: 'bold' }}>
                            v1.3.0 Beta
                        </Typography>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.s }}>
                        <Typography variant="caption" color={COLORS.text.secondary}>
                            Updated: {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })} {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })} UTC
                        </Typography>
                        <Typography variant="caption" color={COLORS.primary.light}>
                            {versionCardExpanded ? '▼' : '▶'}
                        </Typography>
                    </View>
                </TouchableOpacity>
                
                {versionCardExpanded && (
                    <View>
                        <Typography variant="body" style={{ marginTop: SPACING.s, fontWeight: 'bold', color: COLORS.primary.light }}>
                            Latest Changes (Most Recent First):
                        </Typography>
                        <Typography variant="body" style={{ marginTop: SPACING.xs, fontStyle: 'italic' }}>
                            • Upload Timeout Fix: Increased from 60s to 5 minutes for large PDFs over mobile/Wi-Fi
                        </Typography>
                        <Typography variant="body">
                            • Parsing Timer: Real-time elapsed time counter during PDF processing
                        </Typography>
                        <Typography variant="body">
                            • Progress Bar: Visual progress indicator with percentage display
                        </Typography>
                        <Typography variant="body">
                            • Parallel Chunk Processing: 2 chunks processed simultaneously (~2x faster)
                        </Typography>
                        <Typography variant="body">
                            • Extended Job Timeout: Increased from 15 to 40 minutes for large PDFs
                        </Typography>
                        <Typography variant="body">
                            • Frontend Polling: Extended timeout to 40 minutes with better error messages
                        </Typography>
                        <Typography variant="body">
                            • Async Job Architecture: Background processing with real-time progress updates
                        </Typography>
                        <Typography variant="body">
                            • Worker v5.3+max_output: Added max_output_tokens: 6000
                        </Typography>
                        <Typography variant="body">
                            • Enhanced JSON Section: Fixed empty card, added header & scrolling
                        </Typography>
                        <Typography variant="body">
                            • Backend Logs Card: Always visible with copy button
                        </Typography>
                        <Typography variant="body">
                            • Fixed Scrolling: All pages now properly scrollable
                        </Typography>
                        <View style={{ marginTop: SPACING.s, paddingTop: SPACING.s, borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.1)' }}>
                            <Typography variant="caption" color={COLORS.text.secondary}>
                                Architecture: Async Chunked Processing (2 parallel chunks) + Worker v5.3+max_output
                            </Typography>
                        </View>
                    </View>
                )}
            </Card>

            {/* Backend Logs Card - ALWAYS SHOW FOR DEBUGGING */}
            <Card variant="outlined" style={styles.backendLogsCard}>
                <View style={styles.backendLogsHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.s }}>
                        <Terminal size={16} color={COLORS.primary.light} />
                        <Typography variant="h3">Backend Logs</Typography>
                        <Typography variant="caption" color={COLORS.text.secondary}>
                            ({backendLogs.length} logs)
                        </Typography>
                    </View>
                    <TouchableOpacity 
                        onPress={handleCopyBackendLogs}
                        style={styles.copyButton}
                    >
                        {copied ? (
                            <Check size={16} color={COLORS.status.success} />
                        ) : (
                            <Copy size={16} color={COLORS.primary.light} />
                        )}
                    </TouchableOpacity>
                </View>
                {backendLogs.length > 0 ? (
                    <ScrollView 
                        style={styles.backendLogsContent}
                        nestedScrollEnabled
                    >
                        {backendLogs.map((log, index) => {
                            const time = new Date(log.timestamp).toLocaleTimeString();
                            const source = log.source ? `[${log.source}] ` : '';
                            return (
                                <Typography 
                                    key={index} 
                                    variant="caption" 
                                    style={[
                                        styles.logLine,
                                        log.level === 'error' && { color: COLORS.status.error },
                                        log.level === 'warn' && { color: COLORS.status.warning },
                                        log.level === 'success' && { color: COLORS.status.success },
                                    ]}
                                >
                                    [{time}] {log.level.toUpperCase()} {source}{log.message}
                                </Typography>
                            );
                        })}
                    </ScrollView>
                ) : (
                    <Typography variant="caption" color={COLORS.text.secondary} style={{ padding: SPACING.s }}>
                        No backend logs available yet. Upload a PDF to see logs.
                    </Typography>
                )}
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
                        <LogViewer logs={logs} visible={true} onClose={onToggleLogs} />
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
                    <TouchableOpacity style={styles.dropZone} onPress={onPickDocument}>
                        <Upload color={COLORS.text.secondary} size={48} />
                        <Typography variant="body" color={COLORS.text.secondary} style={{ marginTop: SPACING.s }}>
                            Tap to select PDF
                        </Typography>
                    </TouchableOpacity>
                )}

                {error ? (
                    <View style={styles.errorContainer}>
                        <AlertCircle color={COLORS.status.error} size={20} />
                        <Typography variant="caption" color={COLORS.status.error} style={{ flex: 1 }}>
                            {error}
                        </Typography>
                    </View>
                ) : null}

                <Button
                    title={isLoading || isPolling ? (isPolling ? "Processing..." : "Uploading...") : "Upload & Parse"}
                    onPress={onUpload}
                    disabled={!selectedFile || isLoading || isPolling}
                    variant="primary"
                    style={{ marginTop: SPACING.m }}
                />

                {/* Elapsed Time Counter - Always visible when timer is active */}
                {parsingStartTime && (
                    <View style={{ marginTop: SPACING.m, alignItems: 'center', padding: SPACING.s, backgroundColor: COLORS.background.secondary, borderRadius: BORDER_RADIUS.m }}>
                        <Typography variant="caption" color={COLORS.text.secondary} style={{ marginBottom: SPACING.xs }}>
                            Processing Time
                        </Typography>
                        <Typography variant="body" color={COLORS.primary.light} style={{ fontWeight: 'bold', fontSize: 18 }}>
                            {formatElapsedTime(Math.max(0, elapsedTime))}
                        </Typography>
                        {!isPolling && !isLoading && parsingStartTime && (
                            <Typography variant="caption" color={COLORS.text.tertiary} style={{ marginTop: SPACING.xs }}>
                                {error ? 'Stopped' : 'Completed'}
                            </Typography>
                        )}
                    </View>
                )}

                {isPolling && (
                    <View style={{ marginTop: SPACING.m, alignItems: 'center', padding: SPACING.m, backgroundColor: COLORS.background.secondary, borderRadius: BORDER_RADIUS.m }}>
                        <ActivityIndicator size="small" color={COLORS.primary.main} />
                        <Typography variant="body" style={{ marginTop: SPACING.xs, textAlign: 'center', fontWeight: 'bold' }}>
                            Processing PDF in background...
                        </Typography>
                        
                        {/* Progress Bar - Always show if we have totalPages */}
                        {jobStatus && jobStatus.progress.totalPages > 0 ? (
                            <View style={{ width: '100%', marginTop: SPACING.m }}>
                                <View style={styles.progressBarContainer}>
                                    <View 
                                        style={[
                                            styles.progressBarFill, 
                                            { width: `${Math.min(100, Math.max(0, Math.round((jobStatus.progress.processedPages / jobStatus.progress.totalPages) * 100)))}%` }
                                        ]} 
                                    />
                                </View>
                                <Typography variant="caption" color={COLORS.primary.light} style={{ marginTop: SPACING.xs, textAlign: 'center', fontWeight: 'bold' }}>
                                    {Math.round((jobStatus.progress.processedPages / jobStatus.progress.totalPages) * 100)}% Complete
                                </Typography>
                            </View>
                        ) : (
                            <Typography variant="caption" color={COLORS.text.secondary} style={{ marginTop: SPACING.m, textAlign: 'center' }}>
                                Initializing...
                            </Typography>
                        )}
                        
                        {/* Progress Details */}
                        {jobStatus && (
                            <Typography variant="caption" color={COLORS.text.secondary} style={{ marginTop: SPACING.s }}>
                                Pages: {jobStatus.progress.processedPages}/{jobStatus.progress.totalPages || '?'} • Chunks: {jobStatus.progress.processedChunks}/{jobStatus.progress.totalChunks || '?'}
                            </Typography>
                        )}
                        
                    </View>
                )}
            </Card>
            </ScrollView>
        </ScreenLayout>
    );
};

const styles = StyleSheet.create({
    scrollContent: {
        paddingBottom: SPACING.xl,
        flexGrow: 1,
    },
    header: {
        marginBottom: SPACING.l,
    },
    versionCard: {
        marginBottom: SPACING.m,
        padding: SPACING.m,
    },
    versionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.s,
        paddingVertical: SPACING.xs,
    },
    badge: {
        backgroundColor: 'rgba(187, 134, 252, 0.1)',
        paddingHorizontal: SPACING.s,
        paddingVertical: SPACING.xs,
        borderRadius: BORDER_RADIUS.s,
    },
    debugCard: {
        marginBottom: SPACING.m,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    debugHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    uploadCard: {
        minHeight: 200,
    },
    dropZone: {
        height: 150,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderStyle: 'dashed',
        borderRadius: BORDER_RADIUS.m,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
    },
    fileInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.m,
        padding: SPACING.m,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: BORDER_RADIUS.m,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.s,
        marginTop: SPACING.m,
        padding: SPACING.s,
        backgroundColor: 'rgba(207, 102, 121, 0.1)',
        borderRadius: BORDER_RADIUS.s,
    },
    backendLogsCard: {
        marginBottom: SPACING.m,
        borderColor: 'rgba(187, 134, 252, 0.3)',
    },
    backendLogsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.s,
    },
    copyButton: {
        padding: SPACING.xs,
        borderRadius: BORDER_RADIUS.s,
        backgroundColor: 'rgba(187, 134, 252, 0.1)',
    },
    backendLogsContent: {
        maxHeight: 250,
    },
    logLine: {
        fontFamily: 'monospace',
        fontSize: 11,
        color: COLORS.text.secondary,
        marginBottom: SPACING.xs,
        lineHeight: 16,
    },
    progressBarContainer: {
        width: '100%',
        height: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: BORDER_RADIUS.s,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: COLORS.primary.main,
        borderRadius: BORDER_RADIUS.s,
    },
});
