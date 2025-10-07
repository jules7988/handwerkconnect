import { DarkTheme as NavigationDarkTheme, Theme } from '@react-navigation/native';

export const AppDarkTheme: Theme = {
  ...NavigationDarkTheme,
  colors: {
    ...NavigationDarkTheme.colors,
    primary: '#22c55e',
    background: '#0b0f14',
    card: '#121821',
    text: '#e6edf3',
    border: '#1f2937',
    notification: '#22c55e'
  },
};
