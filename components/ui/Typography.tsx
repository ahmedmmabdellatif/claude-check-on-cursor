import React from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';
import { COLORS, FONTS } from '../../constants/theme';

interface TypographyProps {
    children: React.ReactNode;
    variant?: 'h1' | 'h2' | 'h3' | 'body' | 'caption' | 'label';
    color?: string;
    style?: TextStyle;
    align?: 'left' | 'center' | 'right';
}

export const Typography: React.FC<TypographyProps> = ({
    children,
    variant = 'body',
    color,
    style,
    align = 'left',
}) => {
    const textColor = color || (variant === 'caption' ? COLORS.text.secondary : COLORS.text.primary);

    return (
        <Text style={[styles[variant], { color: textColor, textAlign: align }, style]}>
            {children}
        </Text>
    );
};

const styles = StyleSheet.create({
    h1: {
        fontSize: FONTS.sizes.xxxl,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    h2: {
        fontSize: FONTS.sizes.xxl,
        fontWeight: '700',
        marginBottom: 6,
    },
    h3: {
        fontSize: FONTS.sizes.xl,
        fontWeight: '600',
        marginBottom: 4,
    },
    body: {
        fontSize: FONTS.sizes.m,
        fontWeight: '400',
        lineHeight: 24,
    },
    label: {
        fontSize: FONTS.sizes.s,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    caption: {
        fontSize: FONTS.sizes.xs,
        fontWeight: '400',
    },
});
