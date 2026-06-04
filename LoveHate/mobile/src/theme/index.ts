export const Colors = {
  love: '#ff4d6d',
  loveDeep: '#c9184a',
  loveLight: '#ff8fa3',
  hate: '#845ec2',
  hateDeep: '#6a3bbc',
  hateLight: '#b08cdb',
  warm: '#ffc09f',
  ice: '#a2d2ff',
  gold: '#ffd700',
  goldDeep: '#f59e0b',
  bg: '#0a0a14',
  bgSecondary: '#0f0f1e',
  surface: '#161628',
  surfaceLight: '#1e1e36',
  surfaceHover: '#262648',
  text: '#f0f0f5',
  textSecondary: '#9ca3af',
  textMuted: '#6b7280',
  border: '#2a2a4a',
  borderLight: 'rgba(255,255,255,0.08)',
  success: '#4ade80',
  successDeep: '#16a34a',
  error: '#f87171',
  errorDeep: '#dc2626',
  white: '#ffffff',
  overlay: 'rgba(0,0,0,0.6)',
}

export const Gradients = {
  love: ['#ff4d6d', '#ff8fa3'] as const,
  hate: ['#845ec2', '#b08cdb'] as const,
  gold: ['#ffd700', '#f59e0b'] as const,
  warmBg: ['#1a0a14', '#0a0a14'] as const,
  coldBg: ['#0a0a1e', '#0a1028'] as const,
  surfaceCard: ['#1e1e36', '#161628'] as const,
  heroLove: ['#ff4d6d', '#845ec2'] as const,
  heroHate: ['#845ec2', '#4338ca'] as const,
  success: ['#4ade80', '#16a34a'] as const,
}

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
}

export const FontSizes = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 18,
  xl: 22,
  xxl: 28,
  xxxl: 36,
  hero: 44,
}

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  full: 9999,
}

export const Shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  cardHover: {
    shadowColor: '#ff4d6d',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
  },
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  glow: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  }),
}
