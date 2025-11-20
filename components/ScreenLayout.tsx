import React from 'react';
import { View, StyleSheet, ViewStyle, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants/theme';

interface ScreenLayoutProps {
    children: React.ReactNode;
    style?: ViewStyle;
    noPadding?: boolean;
}

export const ScreenLayout: React.FC<ScreenLayoutProps> = ({ children, style, noPadding }) => {
    const insets = useSafeAreaInsets();

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient
                colors={COLORS.gradients.primary}
                style={styles.gradient}
            >
                <View
                    style={[
                        styles.content,
                        {
                            paddingTop: insets.top,
                            paddingBottom: insets.bottom,
                            paddingHorizontal: noPadding ? 0 : 16
                        },
                        style
                    ]}
                >
                    {children}
                </View>
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background.primary,
    },
    gradient: {
        flex: 1,
    },
    content: {
        flex: 1,
    },
});
