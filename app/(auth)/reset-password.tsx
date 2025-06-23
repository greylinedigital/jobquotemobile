import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Eye, EyeOff } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

const LOGO_URL = 'https://pofgpoktfwwrpkgzwuwa.supabase.co/storage/v1/object/sign/logoassets/JobQuote-mainlogo.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8yZjIxYTE4My1kNTZmLTRhOTYtOTkxMi0yNGU4NTllYzUxYjciLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJsb2dvYXNzZXRzL0pvYlF1b3RlLW1haW5sb2dvLnBuZyIsImlhdCI6MTc1MDE3MzI5OSwiZXhwIjoxODQ0NzgxMjk5fQ.-iEcQYX1u7yDZjDssRq6szOYc3r8ziTlv2OTidRtQSs';

export default function ResetPassword() {
  const { access_token, refresh_token, type } = useLocalSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const handlePasswordReset = async () => {
      console.log('Reset password params:', { access_token, refresh_token, type });

      if (type === 'recovery' && access_token && refresh_token) {
        try {
          // Set the session using the tokens from the URL
          const { data, error } = await supabase.auth.setSession({
            access_token: access_token as string,
            refresh_token: refresh_token as string,
          });

          if (error) {
            console.error('Error setting session:', error);
            Alert.alert('Error', 'Invalid or expired reset link. Please request a new password reset.');
            router.replace('/(auth)/login');
            return;
          }

          console.log('Session set successfully:', data);
          setIsValidSession(true);
        } catch (error) {
          console.error('Unexpected error setting session:', error);
          Alert.alert('Error', 'An error occurred. Please try again.');
          router.replace('/(auth)/login');
        }
      } else {
        console.log('Invalid reset parameters, redirecting to login');
        Alert.alert('Error', 'Invalid reset link. Please request a new password reset.');
        router.replace('/(auth)/login');
      }

      setCheckingSession(false);
    };

    handlePasswordReset();
  }, [access_token, refresh_token, type]);

  const handleResetPassword = async () => {
    if (!password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        console.error('Error updating password:', error);
        Alert.alert('Error', error.message);
        return;
      }

      Alert.alert(
        'Success!',
        'Your password has been updated successfully. You can now sign in with your new password.',
        [
          {
            text: 'Sign In',
            onPress: () => router.replace('/(auth)/login'),
          },
        ]
      );
    } catch (error) {
      console.error('Unexpected error updating password:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F6A623" />
        <Text style={styles.loadingText}>Verifying reset link...</Text>
      </View>
    );
  }

  if (!isValidSession) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Invalid or expired reset link</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace('/(auth)/login')}
        >
          <Text style={styles.backButtonText}>Back to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerBackButton}
            onPress={() => router.replace('/(auth)/login')}
          >
            <ChevronLeft size={24} color="#333" />
          </TouchableOpacity>
        </View>

        <View style={styles.logoContainer}>
          <Image 
            source={{ uri: LOGO_URL }} 
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.tagline}>Professional Quoting for Tradies</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.title}>Reset Your Password</Text>
          <Text style={styles.subtitle}>Enter your new password below</Text>
          
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="New Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              placeholderTextColor="#999"
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff size={20} color="#666" />
              ) : (
                <Eye size={20} color="#666" />
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              placeholderTextColor="#999"
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <EyeOff size={20} color="#666" />
              ) : (
                <Eye size={20} color="#666" />
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.passwordHint}>
            Password must be at least 6 characters long
          </Text>
          
          <TouchableOpacity
            style={[styles.resetButton, loading && styles.resetButtonDisabled]}
            onPress={handleResetPassword}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.resetButtonText}>Update Password</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 18,
    color: '#DC3545',
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#F6A623',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerBackButton: {
    padding: 8,
    alignSelf: 'flex-start',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
    paddingTop: 20,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  tagline: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  formContainer: {
    paddingHorizontal: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: 12,
    marginBottom: 16,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#333',
  },
  eyeButton: {
    padding: 16,
  },
  passwordHint: {
    fontSize: 12,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  resetButton: {
    backgroundColor: '#F6A623',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  resetButtonDisabled: {
    opacity: 0.6,
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});