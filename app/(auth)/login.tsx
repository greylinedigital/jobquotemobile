import React, { useState } from 'react';
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
  Modal,
  ActivityIndicator,
} from 'react-native';
import { router, Link } from 'expo-router';
import { X, Mail, Clock } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

const LOGO_URL = 'https://pofgpoktfwwrpkgzwuwa.supabase.co/storage/v1/object/sign/logoassets/JobQuote-mainlogo.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8yZjIxYTE4My1kNTZmLTRhOTYtOTkxMi0yNGU4NTllYzUxYjciLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJsb2dvYXNzZXRzL0pvYlF1b3RlLW1haW5sb2dvLnBuZyIsImlhdCI6MTc1MDE3MzI5OSwiZXhwIjoxODQ0NzgxMjk5fQ.-iEcQYX1u7yDZjDssRq6szOYc3r8ziTlv2OTidRtQSs';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Forgot password modal state
  const [forgotPasswordModalVisible, setForgotPasswordModalVisible] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [sendingReset, setSendingReset] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);
  const [cooldownTime, setCooldownTime] = useState(0);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      Alert.alert('Login Failed', error.message);
    } else {
      router.replace('/(tabs)');
    }
    setLoading(false);
  };

  const handleForgotPassword = async () => {
    if (!resetEmail.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(resetEmail.trim())) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    // Check if we're in cooldown period
    if (rateLimited && cooldownTime > 0) {
      Alert.alert(
        'Please Wait', 
        `You can try again in ${Math.ceil(cooldownTime / 60)} minutes. This helps prevent spam and protects your account.`
      );
      return;
    }

    setSendingReset(true);

    try {
      console.log('Sending password reset email to:', resetEmail);

      // Use Supabase's default reset flow
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim());

      if (error) {
        console.error('Password reset error:', error);
        
        // Handle specific error types
        if (error.message.includes('rate limit') || error.message.includes('too many requests')) {
          setRateLimited(true);
          setCooldownTime(300); // 5 minutes cooldown
          
          // Start countdown timer
          const timer = setInterval(() => {
            setCooldownTime(prev => {
              if (prev <= 1) {
                clearInterval(timer);
                setRateLimited(false);
                return 0;
              }
              return prev - 1;
            });
          }, 1000);

          Alert.alert(
            'Rate Limit Exceeded', 
            'Too many password reset attempts. Please wait 5 minutes before trying again. This security measure helps protect your account.'
          );
        } else if (error.message.includes('User not found')) {
          Alert.alert(
            'Email Not Found', 
            'No account found with this email address. Please check your email or create a new account.'
          );
        } else {
          Alert.alert('Error', error.message);
        }
      } else {
        setResetEmailSent(true);
        console.log('Password reset email sent successfully to:', resetEmail);
      }
    } catch (error) {
      console.error('Unexpected error during password reset:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setSendingReset(false);
    }
  };

  const closeForgotPasswordModal = () => {
    setForgotPasswordModalVisible(false);
    setResetEmail('');
    setResetEmailSent(false);
    setSendingReset(false);
    // Don't reset rate limiting state when closing modal
  };

  const openForgotPasswordModal = () => {
    setResetEmail(email); // Pre-fill with login email if available
    setForgotPasswordModalVisible(true);
  };

  const formatCooldownTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.logoContainer}>
          <Image 
            source={{ uri: LOGO_URL }} 
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.tagline}>Professional Quoting for Tradies</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.title}>Welcome Back</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor="#999"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholderTextColor="#999"
          />

          {/* Forgot Password Link */}
          <TouchableOpacity
            style={styles.forgotPasswordContainer}
            onPress={openForgotPasswordModal}
          >
            <Text style={styles.forgotPasswordText}>Forgot your password?</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.loginButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>
          
          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>Don't have an account? </Text>
            <Link href="/(auth)/register" style={styles.signupLink}>
              <Text style={styles.signupLinkText}>Sign Up</Text>
            </Link>
          </View>
        </View>
      </ScrollView>

      {/* Forgot Password Modal */}
      <Modal
        visible={forgotPasswordModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={closeForgotPasswordModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Close Button */}
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={closeForgotPasswordModal}
            >
              <X size={24} color="#666" />
            </TouchableOpacity>

            {!resetEmailSent ? (
              <>
                {/* Reset Password Form */}
                <View style={styles.modalIconContainer}>
                  {rateLimited ? (
                    <Clock size={48} color="#DC3545" />
                  ) : (
                    <Mail size={48} color="#F6A623" />
                  )}
                </View>

                <Text style={styles.modalTitle}>
                  {rateLimited ? 'Please Wait' : 'Reset Password'}
                </Text>
                
                {rateLimited ? (
                  <View style={styles.rateLimitContainer}>
                    <Text style={styles.rateLimitTitle}>Rate Limit Active</Text>
                    <Text style={styles.rateLimitText}>
                      Too many password reset attempts. Please wait before trying again.
                    </Text>
                    <View style={styles.cooldownContainer}>
                      <Text style={styles.cooldownText}>
                        Try again in: {formatCooldownTime(cooldownTime)}
                      </Text>
                    </View>
                    <Text style={styles.rateLimitHint}>
                      This security measure helps protect your account from unauthorized access attempts.
                    </Text>
                  </View>
                ) : (
                  <>
                    <Text style={styles.modalSubtitle}>
                      Enter your email address and we'll send you a secure link to reset your password.
                    </Text>

                    <View style={styles.modalInputContainer}>
                      <TextInput
                        style={styles.modalInput}
                        placeholder="Enter your email address"
                        value={resetEmail}
                        onChangeText={setResetEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        placeholderTextColor="#999"
                        autoFocus={true}
                      />
                    </View>

                    <TouchableOpacity
                      style={[styles.resetButton, sendingReset && styles.resetButtonDisabled]}
                      onPress={handleForgotPassword}
                      disabled={sendingReset}
                    >
                      {sendingReset ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.resetButtonText}>Send Reset Link</Text>
                      )}
                    </TouchableOpacity>
                  </>
                )}

                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={closeForgotPasswordModal}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                {/* Success State */}
                <View style={styles.modalIconContainer}>
                  <View style={styles.successIcon}>
                    <Mail size={32} color="#FFFFFF" />
                  </View>
                </View>

                <Text style={styles.modalTitle}>Check Your Email</Text>
                <Text style={styles.modalSubtitle}>
                  We've sent a password reset link to{'\n'}
                  <Text style={styles.emailText}>{resetEmail}</Text>
                </Text>

                <Text style={styles.instructionText}>
                  Click the link in the email to reset your password. The link will take you to a secure Supabase form where you can enter your new password.
                </Text>

                <TouchableOpacity
                  style={styles.doneButton}
                  onPress={closeForgotPasswordModal}
                >
                  <Text style={styles.doneButtonText}>Done</Text>
                </TouchableOpacity>

                {!rateLimited && (
                  <TouchableOpacity
                    style={styles.resendButton}
                    onPress={handleForgotPassword}
                    disabled={sendingReset}
                  >
                    {sendingReset ? (
                      <ActivityIndicator size="small" color="#F6A623" />
                    ) : (
                      <Text style={styles.resendButtonText}>Resend Email</Text>
                    )}
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logo: {
    width: 150,
    height: 150,
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
    marginBottom: 30,
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    marginBottom: 16,
    color: '#333',
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#F6A623',
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: '#F6A623',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  signupText: {
    fontSize: 16,
    color: '#666',
  },
  signupLink: {
    marginLeft: 4,
  },
  signupLinkText: {
    fontSize: 16,
    color: '#F6A623',
    fontWeight: '600',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
    zIndex: 1,
  },
  modalIconContainer: {
    marginBottom: 24,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#28A745',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  emailText: {
    fontWeight: '600',
    color: '#F6A623',
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  modalInputContainer: {
    width: '100%',
    marginBottom: 24,
  },
  modalInput: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#333',
    width: '100%',
  },
  resetButton: {
    backgroundColor: '#F6A623',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  resetButtonDisabled: {
    opacity: 0.6,
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    paddingVertical: 8,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  doneButton: {
    backgroundColor: '#F6A623',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resendButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resendButtonText: {
    color: '#F6A623',
    fontSize: 16,
    fontWeight: '600',
  },
  // Rate Limiting Styles
  rateLimitContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  rateLimitTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#DC3545',
    marginBottom: 8,
  },
  rateLimitText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  cooldownContainer: {
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FED7D7',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  cooldownText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#DC3545',
    textAlign: 'center',
  },
  rateLimitHint: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 18,
  },
});