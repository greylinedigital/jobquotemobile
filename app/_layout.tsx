import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-url-polyfill/auto';
import React from 'react';

export default function RootLayout() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="fast-quote" options={{ headerShown: false }} />
        <Stack.Screen name="quote-preview" options={{ headerShown: false }} />
        <Stack.Screen name="invoice-view" options={{ headerShown: false }} />
        <Stack.Screen name="quote-approval" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}