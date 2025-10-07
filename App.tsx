import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import RootNavigator from './src/navigation';
import { AppDarkTheme } from './src/theme';
import { AppProvider } from './src/state/AppContext';

export default function App() {
  return (
    <AppProvider>
      <NavigationContainer theme={AppDarkTheme}>
        <RootNavigator />
      </NavigationContainer>
    </AppProvider>
  );
}
