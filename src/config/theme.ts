export const theme = {
  colors: {
    olympiaNavy: '#071426',
    olympiaGold: '#D9A441',
    electricBlue: '#1264FF',
    royalBlue: '#1747B8',
    brightYellow: '#FFD21F',
    orange: '#FF6A00',
    coral: '#FF4D3D',
    black: '#080A0D',
    white: '#FFFFFF',
    warmWhite: '#FAF9F5',
  }
} as const;

export type ThemeColors = typeof theme.colors;
