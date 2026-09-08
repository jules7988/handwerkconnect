import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { supabase } from '@/lib/supabase';

export default function Index() {
  const [target, setTarget] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;

      if (!user) {
        setTarget('/(public)/welcome');
        return;
      }

      const { data: prof } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!prof?.role) {
        setTarget('/(public)/welcome');
        return;
      }

setTarget(
  prof.role === 'azubi'
    ? '/azubi/profile'
    : '/company'
);
    };

    run();
  }, []);

  if (!target) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
        <Text>Lade...</Text>
      </View>
    );
  }

  return <Redirect href={target as any} />;
}