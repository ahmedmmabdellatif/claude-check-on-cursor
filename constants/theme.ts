export const COLORS = {
    background: {
        primary: "#0F172A", // Slate 900
        secondary: "#1E293B", // Slate 800
        tertiary: "#334155", // Slate 700
        overlay: "rgba(15, 23, 42, 0.8)",
    },
    text: {
        primary: "#F8FAFC", // Slate 50
        secondary: "#94A3B8", // Slate 400
        tertiary: "#64748B", // Slate 500
        accent: "#8B5CF6", // Violet 500
    },
    primary: {
        DEFAULT: "#8B5CF6", // Violet 500
        light: "#A78BFA", // Violet 400
        dark: "#7C3AED", // Violet 600
    },
    secondary: {
        DEFAULT: "#06B6D4", // Cyan 500
        light: "#22D3EE", // Cyan 400
    },
    status: {
        success: "#10B981", // Emerald 500
        warning: "#F59E0B", // Amber 500
        error: "#EF4444", // Red 500
        info: "#3B82F6", // Blue 500
    },
    gradients: {
        primary: ["#0F172A", "#1E293B", "#334155"] as const,
        card: ["rgba(30, 41, 59, 0.7)", "rgba(30, 41, 59, 0.4)"] as const,
        accent: ["#8B5CF6", "#06B6D4"] as const,
    }
};

export const SPACING = {
    xs: 4,
    s: 8,
    m: 16,
    l: 24,
    xl: 32,
    xxl: 48,
};

export const BORDER_RADIUS = {
    s: 4,
    m: 8,
    l: 12,
    xl: 16,
    full: 9999,
};

export const FONTS = {
    // Assuming default system fonts for now, can be customized later
    regular: "System",
    medium: "System",
    bold: "System",
    sizes: {
        xs: 12,
        s: 14,
        m: 16,
        l: 18,
        xl: 20,
        xxl: 24,
        xxxl: 32,
    }
};
