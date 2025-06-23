import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  Switch,
  Image,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { supabase, testSupabaseConnection } from '@/lib/supabase';
import { BusinessProfile } from '@/types/database';
import CountryPicker from '@/components/CountryPicker';
import { ChevronDown, ChevronUp, Upload, Building2, CreditCard, FileText, LogOut, CircleAlert as AlertCircle, Wifi, WifiOff } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

// Simple controlled input component that maintains focus
const ControlledInput = React.memo(({ 
  value, 
  onChangeText, 
  placeholder, 
  style, 
  keyboardType, 
  autoCapitalize, 
  multiline, 
  numberOfLines 
}: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  style?: any;
  keyboardType?: any;
  autoCapitalize?: any;
  multiline?: boolean;
  numberOfLines?: number;
}) => {
  return (
    <TextInput
      style={style}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      keyboardType={keyboardType}
      autoCapitalize={autoCapitalize}
      placeholderTextColor="#999"
      multiline={multiline}
      numberOfLines={numberOfLines}
      textAlignVertical={multiline ? 'top' : 'center'}
    />
  );
});

// Toast component
const Toast = ({ visible, message, onHide }: { visible: boolean; message: string; onHide: () => void }) => {
  const translateY = useRef(new Animated.Value(100)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(2000),
        Animated.timing(translateY, {
          toValue: 100,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onHide();
      });
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View 
      style={[
        styles.toast,
        {
          transform: [{ translateY }],
        },
      ]}
    >
      <Text style={styles.toastText}>{message}</Text>
    </Animated.View>
  );
};

// Connection status component
const ConnectionStatus = ({ isConnected, onRetry }: { isConnected: boolean | null; onRetry: () => void }) => {
  if (isConnected === null) return null;

  return (
    <View style={[styles.connectionStatus, isConnected ? styles.connected : styles.disconnected]}>
      {isConnected ? (
        <>
          <Wifi size={16} color="#28A745" />
          <Text style={styles.connectionText}>Connected to Supabase</Text>
        </>
      ) : (
        <>
          <WifiOff size={16} color="#DC3545" />
          <Text style={styles.connectionTextError}>Connection failed</Text>
          <TouchableOpacity onPress={onRetry} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

export default function SettingsTab() {
  // Profile state
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Toast state
  const [showToast, setShowToast] = useState(false);
  
  // Accordion states
  const [businessOpen, setBusinessOpen] = useState(true);
  const [bankOpen, setBankOpen] = useState(false);
  const [quotingOpen, setQuotingOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  
  // Form state - using simple state variables
  const [formData, setFormData] = useState({
    businessName: '',
    abn: '',
    phone: '',
    email: '',
    country: 'Australia',
    paymentTerms: '',
    quoteFooterNotes: '',
    bankName: '',
    bsb: '',
    accountNumber: '',
    accountName: '',
    hourlyRate: '120',
    gstEnabled: true,
    logoUrl: '',
  });

  useEffect(() => {
    checkConnectionAndFetchProfile();
  }, []);

  const checkConnectionAndFetchProfile = async () => {
    try {
      setError(null);
      console.log('Testing Supabase connection...');
      
      const isConnected = await testSupabaseConnection();
      setConnectionStatus(isConnected);
      
      if (isConnected) {
        await fetchProfile();
      } else {
        setError('Unable to connect to the database. Please check your internet connection and try again.');
        setLoading(false);
      }
    } catch (error) {
      console.error('Connection check failed:', error);
      setConnectionStatus(false);
      setError('Network error: Unable to reach the server. Please check your connection.');
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('User not authenticated. Please log in again.');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('id', user.id);

      if (error) {
        console.error('Error fetching profile:', error);
        setError(`Failed to load profile: ${error.message}`);
      } else if (data && data.length > 0) {
        const profileData = data[0];
        setProfile(profileData);
        setFormData({
          businessName: profileData.business_name || '',
          abn: profileData.abn || '',
          phone: profileData.phone || '',
          email: profileData.email || '',
          country: profileData.country || 'Australia',
          paymentTerms: profileData.payment_terms || '',
          quoteFooterNotes: profileData.quote_footer_notes || '',
          bankName: profileData.bank_name || '',
          bsb: profileData.bsb || '',
          accountNumber: profileData.account_number || '',
          accountName: profileData.account_name || '',
          hourlyRate: (profileData.hourly_rate || 120).toString(),
          gstEnabled: profileData.gst_enabled ?? true,
          logoUrl: profileData.logo_url || '',
        });
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error);
      setError('Network error: Failed to fetch profile data.');
    } finally {
      setLoading(false);
    }
  };

  // Simple update function for form fields
  const updateField = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          Alert.alert('Error', 'User not authenticated');
          return;
        }

        // Create a unique filename
        const fileExt = asset.uri.split('.').pop() || 'jpg';
        const fileName = `${user.id}-logo-${Date.now()}.${fileExt}`;
        
        // Convert image to blob for upload
        const response = await fetch(asset.uri);
        const blob = await response.blob();
        
        // Upload to Supabase storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('business-logos')
          .upload(fileName, blob, {
            cacheControl: '3600',
            upsert: true,
            contentType: `image/${fileExt}`
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          Alert.alert('Error', 'Failed to upload logo. Please try again.');
          return;
        }

        // Get the public URL
        const { data: { publicUrl } } = supabase.storage
          .from('business-logos')
          .getPublicUrl(fileName);

        updateField('logoUrl', publicUrl);
        Alert.alert('Success', 'Logo uploaded successfully!');
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to process image. Please try again.');
    }
  };

  const saveSettings = async () => {
    // Validate hourly rate
    const rate = parseFloat(formData.hourlyRate);
    if (isNaN(rate) || rate < 30 || rate > 300) {
      Alert.alert('Error', 'Please enter a valid hourly rate between $30 and $300');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('User not authenticated. Please log in again.');
        return;
      }

      const profileData = {
        business_name: formData.businessName || null,
        abn: formData.abn || null,
        phone: formData.phone || null,
        email: formData.email || null,
        country: formData.country,
        payment_terms: formData.paymentTerms || null,
        quote_footer_notes: formData.quoteFooterNotes || null,
        bank_name: formData.bankName || null,
        bsb: formData.bsb || null,
        account_number: formData.accountNumber || null,
        account_name: formData.accountName || null,
        hourly_rate: rate,
        gst_enabled: formData.gstEnabled,
        logo_url: formData.logoUrl || null,
      };

      if (profile) {
        const { error } = await supabase
          .from('business_profiles')
          .update(profileData)
          .eq('id', user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('business_profiles')
          .insert({
            id: user.id,
            ...profileData
          });

        if (error) throw error;
      }

      setShowToast(true);
      await fetchProfile();
    } catch (error) {
      console.error('Error saving settings:', error);
      setError(`Failed to save settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: performSignOut,
        },
      ]
    );
  };

  const performSignOut = async () => {
    setSigningOut(true);
    
    try {
      console.log('Starting sign out process...');
      
      // Clear any local state first
      setProfile(null);
      setFormData({
        businessName: '',
        abn: '',
        phone: '',
        email: '',
        country: 'Australia',
        paymentTerms: '',
        quoteFooterNotes: '',
        bankName: '',
        bsb: '',
        accountNumber: '',
        accountName: '',
        hourlyRate: '120',
        gstEnabled: true,
        logoUrl: '',
      });

      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Supabase sign out error:', error);
        Alert.alert('Error', `Failed to sign out: ${error.message}`);
        return;
      }

      console.log('Successfully signed out from Supabase');
      
      // Small delay to ensure state is cleared
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Navigate to login screen and reset the navigation stack
      router.replace('/(auth)/login');
      
      console.log('Navigated to login screen');
      
    } catch (error) {
      console.error('Unexpected sign out error:', error);
      Alert.alert('Error', 'An unexpected error occurred while signing out. Please try again.');
    } finally {
      setSigningOut(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F6A623" />
          <Text style={styles.loadingText}>Loading settings...</Text>
          <ConnectionStatus 
            isConnected={connectionStatus} 
            onRetry={checkConnectionAndFetchProfile}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (error && !profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <AlertCircle size={48} color="#DC3545" />
          <Text style={styles.errorTitle}>Connection Error</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={checkConnectionAndFetchProfile}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
          <ConnectionStatus 
            isConnected={connectionStatus} 
            onRetry={checkConnectionAndFetchProfile}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={saveSettings}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ConnectionStatus 
        isConnected={connectionStatus} 
        onRetry={checkConnectionAndFetchProfile}
      />

      {error && (
        <View style={styles.errorBanner}>
          <AlertCircle size={16} color="#DC3545" />
          <Text style={styles.errorBannerText}>{error}</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Business Profile Section */}
        <View style={styles.accordionContainer}>
          <TouchableOpacity 
            style={styles.accordionHeader} 
            onPress={() => setBusinessOpen(!businessOpen)}
          >
            <View style={styles.accordionTitleContainer}>
              <Building2 size={20} color="#F6A623" />
              <Text style={styles.accordionTitle}>Business Profile</Text>
            </View>
            {businessOpen ? (
              <ChevronUp size={20} color="#666" />
            ) : (
              <ChevronDown size={20} color="#666" />
            )}
          </TouchableOpacity>
          
          {businessOpen && (
            <View style={styles.accordionContent}>
              <View style={styles.logoSection}>
                <TouchableOpacity style={styles.logoContainer} onPress={pickImage}>
                  {formData.logoUrl ? (
                    <Image source={{ uri: formData.logoUrl }} style={styles.logoImage} />
                  ) : (
                    <View style={styles.logoPlaceholder}>
                      <Upload size={24} color="#666" />
                      <Text style={styles.logoText}>Upload Logo</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Business Name</Text>
              <ControlledInput
                style={styles.input}
                placeholder="Custom Automotive Electrical & Air Conditioning"
                value={formData.businessName}
                onChangeText={(text) => updateField('businessName', text)}
              />

              <Text style={styles.inputLabel}>Country</Text>
              <CountryPicker
                selectedCountry={formData.country}
                onCountrySelect={(country) => updateField('country', country)}
                placeholder="Select your country"
              />

              <Text style={styles.inputLabel}>ABN</Text>
              <ControlledInput
                style={styles.input}
                placeholder="1234567890"
                value={formData.abn}
                onChangeText={(text) => updateField('abn', text)}
                keyboardType="numeric"
              />

              <Text style={styles.inputLabel}>Phone Number</Text>
              <ControlledInput
                style={styles.input}
                placeholder="+61435097261"
                value={formData.phone}
                onChangeText={(text) => updateField('phone', text)}
                keyboardType="phone-pad"
              />

              <Text style={styles.inputLabel}>Business Contact Email</Text>
              <ControlledInput
                style={styles.input}
                placeholder="CAE@CAE.com"
                value={formData.email}
                onChangeText={(text) => updateField('email', text)}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Text style={styles.inputHint}>
                This will appear on your quotes and invoices as your contact email.
              </Text>

              <Text style={styles.inputLabel}>Payment Terms / Notes</Text>
              <ControlledInput
                style={[styles.input, styles.textArea]}
                placeholder="Payment due within 7 days of job completion."
                value={formData.paymentTerms}
                onChangeText={(text) => updateField('paymentTerms', text)}
                multiline
                numberOfLines={3}
              />

              <Text style={styles.inputLabel}>Quote Footer Notes</Text>
              <ControlledInput
                style={[styles.input, styles.textArea]}
                placeholder="add optional notes"
                value={formData.quoteFooterNotes}
                onChangeText={(text) => updateField('quoteFooterNotes', text)}
                multiline
                numberOfLines={3}
              />
              <Text style={styles.inputHint}>
                Optional notes that will appear at the bottom of your quotes
              </Text>
            </View>
          )}
        </View>

        {/* Bank Details Section */}
        <View style={styles.accordionContainer}>
          <TouchableOpacity 
            style={styles.accordionHeader} 
            onPress={() => setBankOpen(!bankOpen)}
          >
            <View style={styles.accordionTitleContainer}>
              <CreditCard size={20} color="#F6A623" />
              <Text style={styles.accordionTitle}>Bank Details</Text>
            </View>
            {bankOpen ? (
              <ChevronUp size={20} color="#666" />
            ) : (
              <ChevronDown size={20} color="#666" />
            )}
          </TouchableOpacity>
          
          {bankOpen && (
            <View style={styles.accordionContent}>
              <Text style={styles.inputLabel}>Bank Name</Text>
              <ControlledInput
                style={styles.input}
                placeholder="Test"
                value={formData.bankName}
                onChangeText={(text) => updateField('bankName', text)}
              />

              <View style={styles.rowInputs}>
                <View style={styles.halfInput}>
                  <Text style={styles.inputLabel}>BSB</Text>
                  <ControlledInput
                    style={styles.input}
                    placeholder="123456"
                    value={formData.bsb}
                    onChangeText={(text) => updateField('bsb', text)}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.halfInput}>
                  <Text style={styles.inputLabel}>Account Number</Text>
                  <ControlledInput
                    style={styles.input}
                    placeholder="12345678"
                    value={formData.accountNumber}
                    onChangeText={(text) => updateField('accountNumber', text)}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>Account Name</Text>
              <ControlledInput
                style={styles.input}
                placeholder="Your Business"
                value={formData.accountName}
                onChangeText={(text) => updateField('accountName', text)}
              />
              <Text style={styles.inputHint}>
                Account holder name for bank transfers
              </Text>
            </View>
          )}
        </View>

        {/* Quoting Preferences Section */}
        <View style={styles.accordionContainer}>
          <TouchableOpacity 
            style={styles.accordionHeader} 
            onPress={() => setQuotingOpen(!quotingOpen)}
          >
            <View style={styles.accordionTitleContainer}>
              <FileText size={20} color="#F6A623" />
              <Text style={styles.accordionTitle}>Quoting Preferences</Text>
            </View>
            {quotingOpen ? (
              <ChevronUp size={20} color="#666" />
            ) : (
              <ChevronDown size={20} color="#666" />
            )}
          </TouchableOpacity>
          
          {quotingOpen && (
            <View style={styles.accordionContent}>
              <Text style={styles.inputLabel}>Hourly Labour Rate ($)</Text>
              <ControlledInput
                style={styles.input}
                placeholder="120"
                value={formData.hourlyRate}
                onChangeText={(text) => updateField('hourlyRate', text)}
                keyboardType="numeric"
              />
              <Text style={styles.inputHint}>
                This rate will be used for labour items in all your quotes (between $30-$300)
              </Text>

              <View style={styles.switchContainer}>
                <View style={styles.switchLabelContainer}>
                  <Text style={styles.switchLabel}>Apply GST</Text>
                  <Text style={styles.switchSubLabel}>
                    Automatically add 10% GST to quote totals
                  </Text>
                </View>
                <Switch
                  value={formData.gstEnabled}
                  onValueChange={(value) => updateField('gstEnabled', value)}
                  trackColor={{ false: '#E9ECEF', true: '#F6A623' }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>
          )}
        </View>

        {/* Account Section */}
        <View style={styles.accordionContainer}>
          <TouchableOpacity 
            style={styles.accordionHeader} 
            onPress={() => setAccountOpen(!accountOpen)}
          >
            <View style={styles.accordionTitleContainer}>
              <LogOut size={20} color="#F6A623" />
              <Text style={styles.accordionTitle}>Account</Text>
            </View>
            {accountOpen ? (
              <ChevronUp size={20} color="#666" />
            ) : (
              <ChevronDown size={20} color="#666" />
            )}
          </TouchableOpacity>
          
          {accountOpen && (
            <View style={styles.accordionContent}>
              <View style={styles.signOutContainer}>
                <Text style={styles.signOutLabel}>Sign Out</Text>
                <Text style={styles.signOutSubLabel}>Sign out of your account</Text>
                
                <TouchableOpacity
                  style={[styles.signOutButton, signingOut && styles.signOutButtonDisabled]}
                  onPress={handleSignOut}
                  disabled={signingOut}
                >
                  {signingOut ? (
                    <ActivityIndicator size={16} color="#DC3545" />
                  ) : (
                    <LogOut size={16} color="#DC3545" />
                  )}
                  <Text style={styles.signOutButtonText}>
                    {signingOut ? 'Signing Out...' : 'Sign Out'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Toast */}
      <Toast
        visible={showToast}
        message="Settings updated successfully"
        onHide={() => setShowToast(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#DC3545',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    margin: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorBannerText: {
    color: '#DC3545',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    margin: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  connected: {
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
  },
  disconnected: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  connectionText: {
    color: '#28A745',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  connectionTextError: {
    color: '#DC3545',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  retryButton: {
    backgroundColor: '#F6A623',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#F6A623',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    minWidth: 80,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  accordionContainer: {
    backgroundColor: '#FFFFFF',
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  accordionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accordionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 12,
  },
  accordionContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
  },
  logoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  logoPlaceholder: {
    width: '100%',
    height: '100%',
    borderWidth: 2,
    borderColor: '#E9ECEF',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  logoText: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    lineHeight: 16,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 8,
  },
  switchLabelContainer: {
    flex: 1,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  switchSubLabel: {
    fontSize: 14,
    color: '#666',
  },
  signOutContainer: {
    paddingVertical: 8,
  },
  signOutLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  signOutSubLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#DC3545',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
    minWidth: 120,
    justifyContent: 'center',
  },
  signOutButtonDisabled: {
    opacity: 0.6,
  },
  signOutButtonText: {
    color: '#DC3545',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  toast: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: '#28A745',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});