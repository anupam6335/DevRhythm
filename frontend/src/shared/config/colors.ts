/**
 * Color constants matching the light and dark themes.
 * Use these for inline styles or dynamic color manipulation.
 */

// Light mode colors (Zen Paper)
export const lightColors = {
  bgApp: '#ECEBE6',
  bgSurface: '#F6F5F1',
  bgElevated: '#FBFAF6',
  textPrimary: '#242424',
  textSecondary: '#575757',
  textMuted: '#6C6C6C',
  border: '#DAD8D2',
  borderInput: '#C9C6C0',
  divider: '#E6E4DE',
  hoverSurface: '#E8E6E0',
  primaryAction: '#3A3A3A',
  primaryActionHover: '#2A2A2A',
  primaryTextOnAction: '#F6F5F1',
  accentMoss: '#6C7A6E',
  accentSand: '#D6CFC4',
  shadow: 'rgba(0,0,0,0.06)',
  focusRing: '0 0 0 3px rgba(108,122,110,0.4)',
  codeBg: '#E8E6E0',
  codeText: '#242424',
  notesBg: '#F7F6F0',
  notesText: '#242424',
} as const;

// Dark mode colors (Zen Charcoal)
export const darkColors = {
  bgApp: '#1E1F1C',
  bgSurface: '#262723',
  bgElevated: '#2C2D28',
  textPrimary: '#E6E5DF',
  textSecondary: '#B7B6AF',
  textMuted: '#8C8B85',
  border: '#3A3B36',
  borderInput: '#3A3B36',
  divider: '#32332E',
  hoverSurface: '#2F302B',
  primaryAction: '#D8D7CF',
  primaryActionHover: '#E6E5DF',
  primaryTextOnAction: '#1E1F1C',
  accentMoss: '#7C8B7A',
  accentSand: '#5C5B55',
  shadow: 'rgba(0,0,0,0.35)',
  focusRing: '0 0 0 3px rgba(124,139,122,0.5)',
  codeBg: '#2A2B26',
  codeText: '#E6E5DF',
  notesBg: '#2C2D28',
  notesText: '#E6E5DF',
} as const;

// Heatmap colors (same for both themes)
export const heatmapColors = [
  '#ebedf0', // level 0
  '#9be9a8', // level 1
  '#40c463', // level 2
  '#30a14e', // level 3
  '#216e39', // level 4
] as const;

// Toast colors (from globals.css)
export const toastColors = {
  success: '#40c463',
  error: '#c44c4c',
  warning: '#d68b5c',
  info: '#6c7a6e',
} as const;

export const darkToastColors = {
  success: '#2e7d32',
  error: '#a33d3d',
  warning: '#b86b3f',
  info: '#7c8b7a',
} as const;