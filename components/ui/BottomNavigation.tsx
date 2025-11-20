import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Home, FileText, Settings } from 'lucide-react-native';
import { Typography } from './Typography';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants/theme';

export type Tab = 'upload' | 'domains' | 'settings';

interface BottomNavigationProps {
    currentTab: Tab;
    onTabChange: (tab: Tab) => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({ currentTab, onTabChange }) => {
    const tabs = [
        { id: 'upload', label: 'Home', icon: Home },
        { id: 'domains', label: 'Domains', icon: FileText },
        { id: 'settings', label: 'Settings', icon: Settings },
    ] as const;

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                {tabs.map((tab) => {
                    const isActive = currentTab === tab.id;
                    const Icon = tab.icon;

                    return (
                        <TouchableOpacity
                            key={tab.id}
                            onPress={() => onTabChange(tab.id as Tab)}
                            style={styles.tab}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.iconContainer, isActive && styles.activeIconContainer]}>
                                <Icon
                                    size={24}
                                    color={isActive ? COLORS.primary.light : COLORS.text.secondary}
                                />
                            </View>
                            <Typography
                                variant="caption"
                                style={{
                                    color: isActive ? COLORS.primary.light : COLORS.text.secondary,
                                    fontWeight: isActive ? '600' : '400',
                                    marginTop: 4,
                                }}
                            >
                                {tab.label}
                            </Typography>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: COLORS.background.secondary,
        borderTopWidth: 1,
        borderTopColor: COLORS.background.tertiary,
        paddingBottom: Platform.OS === 'ios' ? 20 : 0,
    },
    content: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: SPACING.s,
    },
    tab: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: SPACING.m,
    },
    iconContainer: {
        padding: 8,
        borderRadius: BORDER_RADIUS.round,
    },
    activeIconContainer: {
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
    },
});
