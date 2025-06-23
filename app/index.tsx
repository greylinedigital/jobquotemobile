import { useEffect } from 'react';
import { router } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { supabase } from '@/lib/supabase';

export default function Index() {
  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('Checking authentication status...');
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth check error:', error);
          router.replace('/(auth)/login');
          return;
        }
        
        console.log('Session check result:', { hasSession: !!session, userId: session?.user?.id });
        
        if (session && session.user) {
          console.log('User is authenticated, navigating to tabs');
          router.replace('/(tabs)');
        } else {
          console.log('No session found, navigating to login');
          router.replace('/(auth)/login');
        }
      } catch (error) {
        console.error('Unexpected auth check error:', error);
        router.replace('/(auth)/login');
      }
    };

    checkAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, { hasSession: !!session });
      
      if (event === 'SIGNED_OUT' || !session) {
        console.log('User signed out, navigating to login');
        router.replace('/(auth)/login');
      } else if (event === 'SIGNED_IN' && session) {
        console.log('User signed in, navigating to tabs');
        router.replace('/(tabs)');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#F6A623" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});