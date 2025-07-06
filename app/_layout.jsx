import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './contexts/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="dashboard" options={{ headerShown: false }} />
        <Stack.Screen name="ingredients" options={{ headerShown: false }} />
        <Stack.Screen name="add-ingredient" options={{ headerShown: false }} />
        <Stack.Screen name="edit-ingredient" options={{ headerShown: false }} />
        <Stack.Screen name="add-movement" options={{ headerShown: false }} />
        <Stack.Screen name="movements" options={{ headerShown: false }} />
        <Stack.Screen name="low-stock" options={{ headerShown: false }} />
        <Stack.Screen name="analytics" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
        <Stack.Screen name="users" options={{ headerShown: false }} />
      </Stack>
    </AuthProvider>
  );
}
