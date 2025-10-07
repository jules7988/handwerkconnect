import { DefaultTheme } from '@react-navigation/native';
export const DarkTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#000000',
    text: '#ffffff',
    card: '#121212',
    primary: '#00c853'
  }
};
