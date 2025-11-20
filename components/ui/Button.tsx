import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, BORDER_RADIUS, SPACING, FONTS } from '../../constants/theme';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 's' | 'm' | 'l';
    icon?: React.ReactNode;
    loading?: boolean;
    disabled?: boolean;
    style?: ViewStyle;
    textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
    title,
    onPress,
    variant = 'primary',
    size = 'm',
    icon,
    loading,
    disabled,
    style,
    textStyle,
}) => {
    const isPrimary = variant === 'primary';

    const content = (
        <View style={[styles.contentContainer, sizeStyles[size]]}>
            {loading ? (
                <ActivityIndicator color={isPrimary ? '#FFF' : COLORS.primary.DEFAULT} size="small" />
            ) : (
                <>
                    {icon && <View style={styles.iconContainer}>{icon}</View>}
                    <Text style={[
                        styles.text,
                        textStyles[variant],
                        textSizeStyles[size],
                        textStyle
                    ]}>
                        {title}
                    </Text>
                </>
            )}
        </View>
    );

    if (isPrimary && !disabled && !loading) {
        return (
            <TouchableOpacity
                onPress={onPress}
                disabled={disabled || loading}
                activeOpacity={0.8}
                style={[styles.container, style]}
            >
                <LinearGradient
                    colors={COLORS.gradients.accent}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.gradient, { borderRadius: BORDER_RADIUS.m }]}
                >
                    {content}
                </LinearGradient>
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.7}
            style={[
                styles.container,
                baseStyles[variant],
                disabled && styles.disabled,
                style
            ]}
        >
            {content}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: BORDER_RADIUS.m,
        overflow: 'hidden',
    },
    gradient: {
        width: '100%',
    },
    contentContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconContainer: {
        marginRight: SPACING.s,
    },
    text: {
        fontWeight: '600',
        textAlign: 'center',
    },
    disabled: {
        opacity: 0.5,
    },
});

const sizeStyles = StyleSheet.create({
    s: {
        paddingVertical: SPACING.xs,
        paddingHorizontal: SPACING.s,
    },
    m: {
        paddingVertical: SPACING.s + 4,
        paddingHorizontal: SPACING.m,
    },
    l: {
        paddingVertical: SPACING.m,
        paddingHorizontal: SPACING.l,
    },
});

const textSizeStyles = StyleSheet.create({
    s: { fontSize: FONTS.sizes.xs },
    m: { fontSize: FONTS.sizes.m },
    l: { fontSize: FONTS.sizes.l },
});

const baseStyles = StyleSheet.create({
    primary: {
        backgroundColor: COLORS.primary.DEFAULT, // Fallback if gradient fails
    },
    secondary: {
        backgroundColor: COLORS.background.tertiary,
    },
    outline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: COLORS.primary.DEFAULT,
    },
    ghost: {
        backgroundColor: 'transparent',
    },
});

const textStyles = StyleSheet.create({
    primary: { color: '#FFFFFF' },
    secondary: { color: COLORS.text.primary },
    outline: { color: COLORS.primary.DEFAULT },
    ghost: { color: COLORS.text.secondary },
});
