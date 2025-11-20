import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, BORDER_RADIUS, SPACING } from '../../constants/theme';

interface CardProps {
    children: React.ReactNode;
    style?: ViewStyle;
    variant?: 'default' | 'outlined' | 'glass';
}

export const Card: React.FC<CardProps> = ({ children, style, variant = 'default' }) => {
    return (
        <View style={[styles.card, styles[variant], style]}>
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: BORDER_RADIUS.l,
        padding: SPACING.m,
        marginBottom: SPACING.m,
        overflow: 'hidden',
    },
    default: {
        backgroundColor: COLORS.background.secondary,
    },
    outlined: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: COLORS.background.tertiary,
    },
    glass: {
        backgroundColor: 'rgba(30, 41, 59, 0.6)', // Semi-transparent slate-800
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
});
