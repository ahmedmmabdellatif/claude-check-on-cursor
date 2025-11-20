import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Modal, Platform } from 'react-native';
import { Copy, X, Terminal, ChevronDown, ChevronUp } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { Typography } from './Typography';
import { COLORS, SPACING, BORDER_RADIUS, FONTS } from '../../constants/theme';

export interface LogEntry {
    timestamp: number;
    message: string;
    type: 'info' | 'success' | 'error' | 'warning';
    data?: any;
}

interface LogViewerProps {
    logs: LogEntry[];
    visible: boolean;
    onClose: () => void;
}

export const LogViewer: React.FC<LogViewerProps> = ({ logs, visible, onClose }) => {
    const scrollViewRef = useRef<ScrollView>(null);

    useEffect(() => {
        if (visible && scrollViewRef.current) {
            setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [logs, visible]);

    const handleCopy = async () => {
        const text = logs.map(l => `[${new Date(l.timestamp).toLocaleTimeString()}] ${l.type.toUpperCase()}: ${l.message} ${l.data ? JSON.stringify(l.data, null, 2) : ''}`).join('\n');
        await Clipboard.setStringAsync(text);
    };

    if (!visible) return null;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.titleRow}>
                    <Terminal size={16} color={COLORS.primary.light} />
                    <Typography variant="label" color={COLORS.primary.light}>Process Logs</Typography>
                </View>
                <View style={styles.actions}>
                    <TouchableOpacity onPress={handleCopy} style={styles.actionButton}>
                        <Copy size={16} color={COLORS.text.secondary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={onClose} style={styles.actionButton}>
                        <X size={16} color={COLORS.text.secondary} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                ref={scrollViewRef}
                style={styles.logContainer}
                contentContainerStyle={styles.logContent}
            >
                {logs.length === 0 ? (
                    <Typography variant="caption" color={COLORS.text.tertiary} style={styles.emptyText}>
                        Waiting for activity...
                    </Typography>
                ) : (
                    logs.map((log, index) => (
                        <View key={index} style={styles.logEntry}>
                            <Typography variant="caption" color={COLORS.text.tertiary} style={styles.timestamp}>
                                {new Date(log.timestamp).toLocaleTimeString()}
                            </Typography>
                            <View style={styles.messageContainer}>
                                <Typography
                                    variant="caption"
                                    color={
                                        log.type === 'error' ? COLORS.status.error :
                                            log.type === 'success' ? COLORS.status.success :
                                                log.type === 'warning' ? COLORS.status.warning :
                                                    COLORS.text.primary
                                    }
                                    style={styles.message}
                                >
                                    {log.message}
                                </Typography>
                                {log.data && (
                                    <View style={styles.dataBlock}>
                                        <Typography variant="caption" color={COLORS.text.tertiary} style={styles.code}>
                                            {JSON.stringify(log.data, null, 2)}
                                        </Typography>
                                    </View>
                                )}
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: SPACING.m,
        backgroundColor: '#0F172A', // Darker background for terminal feel
        borderRadius: BORDER_RADIUS.m,
        borderWidth: 1,
        borderColor: COLORS.background.tertiary,
        overflow: 'hidden',
        maxHeight: 300,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.s,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderBottomWidth: 1,
        borderBottomColor: COLORS.background.tertiary,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.s,
    },
    actions: {
        flexDirection: 'row',
        gap: SPACING.s,
    },
    actionButton: {
        padding: 4,
    },
    logContainer: {
        padding: SPACING.s,
    },
    logContent: {
        paddingBottom: SPACING.s,
    },
    emptyText: {
        textAlign: 'center',
        fontStyle: 'italic',
        marginTop: SPACING.s,
    },
    logEntry: {
        marginBottom: SPACING.xs,
        flexDirection: 'row',
        gap: SPACING.s,
    },
    timestamp: {
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        fontSize: 10,
        minWidth: 50,
    },
    messageContainer: {
        flex: 1,
    },
    message: {
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        fontSize: 11,
    },
    dataBlock: {
        marginTop: 4,
        padding: 4,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 4,
    },
    code: {
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        fontSize: 10,
    },
});
