import { Stack } from 'expo-router';

export default function QuoteApprovalLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="success" />
    </Stack>
  );
}