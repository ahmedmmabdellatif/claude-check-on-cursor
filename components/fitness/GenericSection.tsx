import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card } from '../ui/Card';
import { Typography } from '../ui/Typography';
import { COLORS, SPACING } from '../../constants/theme';

interface GenericItem {
    name?: string;
    type?: string;
    items?: any[];
    [key: string]: any;
}

interface GenericSectionProps {
    title: string;
    data: GenericItem[];
    emptyMessage?: string;
}

export const GenericSection: React.FC<GenericSectionProps> = ({
    title,
    data,
    emptyMessage = "No items found in this section."
}) => {
    if (!data || data.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Typography variant="body" color={COLORS.text.secondary}>{emptyMessage}</Typography>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Typography variant="h2" style={styles.title}>{title}</Typography>

            {data.map((item, index) => (
                <Card key={index} style={styles.card}>
                    <Typography variant="h3" style={{ marginBottom: SPACING.s }}>
                        {item.name || item.type || `Item ${index + 1}`}
                    </Typography>

                    {/* Render key-value pairs dynamically, excluding complex objects for now */}
                    {Object.entries(item).map(([key, value]) => {
                        if (key === 'name' || key === 'type') return null;
                        if (typeof value === 'object') return null; // Skip nested objects/arrays for simple view

                        return (
                            <View key={key} style={styles.row}>
                                <Typography variant="caption" color={COLORS.text.secondary} style={styles.label}>
                                    {key.replace(/_/g, ' ')}:
                                </Typography>
                                <Typography variant="body" style={{ flex: 1 }}>
                                    {String(value)}
                                </Typography>
                            </View>
                        );
                    })}

                    {/* Handle 'items' array if present (common in nutrition/supplements) */}
                    {Array.isArray(item.items) && item.items.length > 0 && (
                        <View style={styles.subList}>
                            {item.items.map((subItem: any, subIndex: number) => (
                                <View key={subIndex} style={styles.subItem}>
                                    <Typography variant="body">• {typeof subItem === 'string' ? subItem : (subItem.name || JSON.stringify(subItem))}</Typography>
                                </View>
                            ))}
                        </View>
                    )}
                </Card>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: SPACING.m,
        paddingBottom: SPACING.xxl,
    },
    emptyContainer: {
        padding: SPACING.xl,
        alignItems: 'center',
    },
    title: {
        marginBottom: SPACING.m,
    },
    card: {
        marginBottom: SPACING.m,
    },
    row: {
        flexDirection: 'row',
        marginBottom: 4,
    },
    label: {
        width: 100,
        textTransform: 'capitalize',
    },
    subList: {
        marginTop: SPACING.s,
        paddingTop: SPACING.s,
        borderTopWidth: 1,
        borderTopColor: COLORS.background.tertiary,
    },
    subItem: {
        marginBottom: 4,
    },
});
