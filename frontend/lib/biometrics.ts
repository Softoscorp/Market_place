import { Capacitor } from '@capacitor/core';

// Dynamic import keeps web bundles lean — the plugin is only referenced on native.
async function loadPlugin() {
  if (!Capacitor.isNativePlatform()) return null;
  try {
    const mod = await import('@capgo/capacitor-native-biometric');
    return mod.NativeBiometric;
  } catch (e) {
    console.error('Biometric plugin unavailable:', e);
    return null;
  }
}

const SERVER = 'com.houseagent.app';

export async function isBiometricAvailable(): Promise<boolean> {
  const plugin = await loadPlugin();
  if (!plugin) return false;
  try {
    const result = await plugin.isAvailable({ useFallback: true });
    return result.isAvailable;
  } catch {
    return false;
  }
}

export async function saveBiometricCredentials(username: string, password: string): Promise<boolean> {
  const plugin = await loadPlugin();
  if (!plugin) return false;
  try {
    await plugin.setCredentials({
      username,
      password,
      server: SERVER,
      accessControl: 1, // BIOMETRY_CURRENT_SET
    });
    return true;
  } catch (e) {
    console.error('Failed to save biometric credentials', e);
    return false;
  }
}

export async function getBiometricCredentials(): Promise<{ username: string; password: string } | null> {
  const plugin = await loadPlugin();
  if (!plugin) return null;
  try {
    const creds = await plugin.getSecureCredentials({
      server: SERVER,
      reason: 'Sign in with your fingerprint or face',
      title: 'Sign in to House Agent',
      subtitle: 'Use your device biometrics to securely sign in',
      description: 'Confirm your identity to access your account.',
      negativeButtonText: 'Cancel',
    });
    return creds;
  } catch (e) {
    console.error('Failed to get biometric credentials', e);
    return null;
  }
}

export async function deleteBiometricCredentials(): Promise<boolean> {
  const plugin = await loadPlugin();
  if (!plugin) return false;
  try {
    await plugin.deleteCredentials({ server: SERVER });
    return true;
  } catch {
    return false;
  }
}

export async function hasBiometricCredentials(): Promise<boolean> {
  const plugin = await loadPlugin();
  if (!plugin) return false;
  try {
    const result = await plugin.isCredentialsSaved({ server: SERVER });
    return result.isSaved;
  } catch {
    return false;
  }
}
