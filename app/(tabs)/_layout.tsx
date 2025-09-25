import { Tabs } from 'expo-router';
export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerTitle: '', tabBarStyle: { height: 60 } }}>
      <Tabs.Screen name="feed" options={{ title: 'Feed' }} />
    </Tabs>
  );
}
