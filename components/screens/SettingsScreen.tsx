import React from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Settings, Server, Database, Trash2, Info } from 'lucide-react-native';
import { ScreenLayout } from '../ScreenLayout';
import { Card } from '../ui/Card';
import { Typography } from '../ui/Typography';
import { Button } from '../ui/Button';
import { COLORS, SPACING } from '../../constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsScreenProps {
    onReset: () => Promise<void>;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onReset }) => {
    const handleReset = () => {
        Alert.alert(
            "Reset App Data",
            "Are you sure you want to delete all parsed documents? This cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete All",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const keys = await AsyncStorage.getAllKeys();
                            const appKeys = keys.filter(k => k.startsWith('parsed_doc_'));
                            
                            if (appKeys.length > 0) {
                                await AsyncStorage.multiRemove(appKeys);
                            }
                            
                            // Call onReset to refresh UI state
                            await onReset();
                            
                            Alert.alert("Success", "All data has been reset.");
                        } catch (e) {
                            console.error("Error clearing data:", e);
                            Alert.alert("Error", `Failed to clear data: ${e instanceof Error ? e.message : 'Unknown error'}`);
                        }
                    }
                }
            ]
        );
    };

    return (
        <ScreenLayout>
            <View style={styles.header}>
                <Typography variant="h2">Settings</Typography>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* System Info */}
                <Card style={styles.section}>
                    <View style={styles.row}>
                        <Info color={COLORS.primary.light} size={20} />
                        <Typography variant="h3">App Info</Typography>
                    </View>
                    <View style={styles.infoRow}>
                        <Typography variant="body" color={COLORS.text.secondary}>Version</Typography>
                        <Typography variant="body">1.0.0 (Beta)</Typography>
                    </View>
                    <View style={styles.infoRow}>
                        <Typography variant="body" color={COLORS.text.secondary}>Build</Typography>
                        <Typography variant="body">2025.11.20</Typography>
                    </View>
                </Card>

                {/* Configuration */}
                <Card style={styles.section}>
                    <View style={styles.row}>
                        <Server color={COLORS.secondary.main} size={20} />
                        <Typography variant="h3">Configuration</Typography>
                    </View>
                    <View style={styles.infoRow}>
                        <Typography variant="body" color={COLORS.text.secondary}>Backend URL</Typography>
                        <Typography variant="caption" color={COLORS.text.tertiary}>
                            {process.env.EXPO_PUBLIC_BACKEND_API_URL || 'http://localhost:4000'}
                        </Typography>
                    </View>
                    <View style={styles.infoRow}>
                        <Typography variant="body" color={COLORS.text.secondary}>Worker Status</Typography>
                        <Typography variant="caption" style={{ color: COLORS.status.success }}>Active</Typography>
                    </View>
                </Card>

                {/* Data Management */}
                <Card style={styles.section}>
                    <View style={styles.row}>
                        <Database color={COLORS.status.error} size={20} />
                        <Typography variant="h3">Data Management</Typography>
                    </View>
                    <Typography variant="body" color={COLORS.text.secondary} style={{ marginBottom: SPACING.m }}>
                        Clear all locally stored fitness plans and parsed documents.
                    </Typography>
                    <Button
                        title="Reset App Data"
                        onPress={handleReset}
                        variant="secondary"
                        icon={<Trash2 size={16} color={COLORS.status.error} />}
                        style={{ borderColor: COLORS.status.error, borderWidth: 1 }}
                    />
                </Card>
            </ScrollView>
        </ScreenLayout>
    );
};

const styles = StyleSheet.create({
    header: {
        marginBottom: SPACING.l,
    },
    content: {
        gap: SPACING.m,
    },
    section: {
        gap: SPACING.m,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.s,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: SPACING.xs,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.background.tertiary,
    },
});
