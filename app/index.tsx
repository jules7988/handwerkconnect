import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { supabase } from '../src/lib/supabase';

export default function Index() {
  const [target, setTarget] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;

      if (!user) {
        setTarget('/auth/welcome');
        return;
      }

      const { data: prof, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (error) {
        setTarget('/auth/welcome');
        return;
      }

      setTarget(prof.role === 'azubi' ? '/azubi/profile' : '/company/profile');
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
