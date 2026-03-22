
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform, LogBox } from 'react-native';

// Suppress expected auth-flow warnings from showing as LogBox popups
LogBox.ignoreLogs(['[Auth] Login failed', '[Security]', 'Non-serializable']);

import { useColorScheme } from '@/hooks/use-color-scheme';
import { LanguageProvider } from '../context/LanguageContext';
import { AuthProvider } from '../context/AuthContext';


export const unstable_settings = {
  anchor: '(tabs)',
};

function OnboardingGate() {
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    (async () => {
      try {
        // If user is already in a protected/authenticated route, don't redirect
        const currentSegment = segments[0];
        if (currentSegment === '(tabs)' || currentSegment === 'admin') return;

        // Check if already authenticated via stored token
        let token: string | null = null;
        try {
          token = Platform.OS === 'web'
            ? (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('authToken') : null)
            : await SecureStore.getItemAsync('authToken');
        } catch {}

        // If already logged in, skip onboarding entirely
        if (token) return;

        // Check if onboarding has been seen
        let seen: string | null = 'true'; // Default to seen to avoid loop on read error
        try {
          seen = Platform.OS === 'web'
            ? (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('onboarded') : 'true')
            : await SecureStore.getItemAsync('onboarded');
        } catch {}

        if (!seen && (!currentSegment || currentSegment === 'login')) {
          router.replace('/onboarding');
        }
      } catch {}
    })();
  }, []);

  return null;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <LanguageProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <OnboardingGate />
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
            <Stack.Screen name="admin" options={{ headerShown: false }} />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}
