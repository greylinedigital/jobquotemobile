import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
  Animated,
  Modal,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, ChevronDown, Plus, Zap, User, FileText, Edit, DollarSign } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { Client, BusinessProfile } from '@/types/database';
import { detectJobType, generateTradeSpecificItems, generateProfessionalSummary } from '@/lib/helpers/tradeDetection';

interface QuoteItem {
  name: string;
  type: string;
  qty: number;
  cost: number;
}

interface AIQuoteResponse {
  job_title: string;
  summary: string;
  items: QuoteItem[];
  total: number;
  gst: number;
}

const LOGO_URL = 'https://pofgpoktfwwrpkgzwuwa.supabase.co/storage/v1/object/sign/logoassets/JobQuote-mainlogo.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8yZjIxYTE4My1kNTZmLTRhOTYtOTkxMi0yNGU4NTllYzUxYjciLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJsb2dvYXNzZXRzL0pvYlF1b3RlLW1haW5sb2dvLnBuZyIsImlhdCI6MTc1MDE3MzI5OSwiZXhwIjoxODQ0NzgxMjk5fQ.-iEcQYX1u7yDZjDssRq6szOYc3r8ziTlv2OTidRtQSs';

// Floating Label Input Component
const FloatingLabelInput = ({ 
  label, 
  value, 
  onChangeText, 
  placeholder, 
  multiline = false, 
  numberOfLines = 1,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  style,
  ...props 
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
  numberOfLines?: number;
  keyboardType?: any;
  autoCapitalize?: any;
  style?: any;
  [key: string]: any;
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const animatedValue = new Animated.Value(value ? 1 : 0);

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: isFocused || value ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused, value]);

  const labelStyle = {
    position: 'absolute' as const,
    left: 16,
    top: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [multiline ? 20 : 16, 8],
    }),
    fontSize: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 12],
    }),
    color: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: ['#999', '#F6A623'],
    }),
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 4,
    zIndex: 1,
  };

  return (
    <View style={[styles.floatingInputContainer, style]}>
      <Animated.Text style={labelStyle}>{label}</Animated.Text>
      <TextInput
        style={[
          styles.floatingInput,
          multiline && styles.floatingInputMultiline,
          isFocused && styles.floatingInputFocused,
        ]}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={isFocused ? placeholder : ''}
        placeholderTextColor="#999"
        multiline={multiline}
        numberOfLines={numberOfLines}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        textAlignVertical={multiline ? 'top' : 'center'}
        {...props}
      />
    </View>
  );
};

export default function FastQuote() {
  const { clientId } = useLocalSearchParams();
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [showClientPicker, setShowClientPicker] = useState(false);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  
  // Hourly rate editing state
  const [hourlyRateModalVisible, setHourlyRateModalVisible] = useState(false);
  const [tempHourlyRate, setTempHourlyRate] = useState('120');
  const [currentHourlyRate, setCurrentHourlyRate] = useState(120);
  const [savingRate, setSavingRate] = useState(false);

  useEffect(() => {
    fetchClients();
    fetchBusinessProfile();
  }, []);

  useEffect(() => {
    if (clientId && clients.length > 0) {
      const client = clients.find(c => c.id === clientId);
      if (client) {
        setSelectedClient(client);
      }
    }
  }, [clientId, clients]);

  const fetchClients = async () => {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching clients:', error);
    } else {
      setClients(data || []);
    }
  };

  const fetchBusinessProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('business_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!error && data) {
      setBusinessProfile(data);
      const rate = data.hourly_rate || 120;
      setCurrentHourlyRate(rate);
      setTempHourlyRate(rate.toString());
    }
  };

  const updateHourlyRate = async () => {
    const rate = parseFloat(tempHourlyRate);
    if (isNaN(rate) || rate < 30 || rate > 300) {
      Alert.alert('Error', 'Please enter a valid hourly rate between $30 and $300');
      return;
    }

    setSavingRate(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('business_profiles')
        .update({ hourly_rate: rate })
        .eq('id', user.id);

      if (error) throw error;

      setCurrentHourlyRate(rate);
      setBusinessProfile(prev => prev ? { ...prev, hourly_rate: rate } : null);
      setHourlyRateModalVisible(false);
      
      Alert.alert('Success', `Hourly rate updated to $${rate}/hr`);
    } catch (error) {
      console.error('Error updating hourly rate:', error);
      Alert.alert('Error', 'Failed to update hourly rate');
    } finally {
      setSavingRate(false);
    }
  };

  // Enhanced fallback quote generation with multi-trade support and user's hourly rate
  const generateFallbackQuote = (description: string): AIQuoteResponse => {
    const tradeCategory = detectJobType(description);
    
    // Use current hourly rate from state
    const userHourlyRate = currentHourlyRate;
    
    let jobTitle = 'Professional Service';
    let items: QuoteItem[] = [];
    
    if (tradeCategory) {
      // Generate trade-specific job title
      jobTitle = generateJobTitle(description, tradeCategory);
      
      // Generate trade-specific items with user's hourly rate
      items = generateTradeSpecificItems(description, tradeCategory, userHourlyRate);
      
      console.log(`Detected trade: ${tradeCategory.category} - ${tradeCategory.subcategory}`);
      console.log(`Using hourly rate: $${userHourlyRate}`);
    } else {
      // Fallback for unrecognized trades - use user's hourly rate
      jobTitle = 'Professional Trade Service';
      
      const baseHours = 2;
      
      items = [
        {
          name: 'Professional Service',
          type: 'labour',
          qty: baseHours,
          cost: userHourlyRate,
        },
        {
          name: 'Materials & Supplies',
          type: 'materials',
          qty: 1,
          cost: baseHours * 30, // Reasonable material cost
        },
        {
          name: 'Service Call-Out',
          type: 'other',
          qty: 1,
          cost: 65,
        }
      ];
    }

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + (item.qty * item.cost), 0);
    const gst = subtotal * 0.1;
    const total = subtotal + gst;

    return {
      job_title: jobTitle,
      summary: tradeCategory ? 
        generateProfessionalSummary(description, tradeCategory) :
        'Professional trade service completed to industry standards with quality workmanship and materials.',
      items,
      total,
      gst,
    };
  };

  const generateJobTitle = (description: string, tradeCategory: any): string => {
    const lowerDesc = description.toLowerCase();
    
    // Extract quantities for more specific titles
    const quantityMatch = description.match(/(\d+)/);
    const quantity = quantityMatch ? quantityMatch[1] : '';
    
    switch (tradeCategory.category) {
      case 'electrical':
        if (lowerDesc.includes('power point') || lowerDesc.includes('outlet')) {
          return quantity ? `${quantity} Power Point Installation` : 'Power Point Installation';
        }
        if (lowerDesc.includes('light') || lowerDesc.includes('downlight')) {
          return quantity ? `${quantity} LED Downlight Installation` : 'LED Lighting Installation';
        }
        if (lowerDesc.includes('switchboard')) return 'Switchboard Upgrade';
        if (lowerDesc.includes('solar')) return 'Solar Panel Installation';
        if (lowerDesc.includes('ev charger')) return 'EV Charger Installation';
        return 'Electrical Installation';
        
      case 'plumbing':
        if (lowerDesc.includes('hot water')) return 'Hot Water System Installation';
        if (lowerDesc.includes('toilet')) return 'Toilet Installation';
        if (lowerDesc.includes('tap') || lowerDesc.includes('mixer')) return 'Tap Installation';
        return 'Plumbing Service';
        
      case 'automotive':
        if (lowerDesc.includes('dual battery')) return 'Dual Battery System Installation';
        if (lowerDesc.includes('light bar')) return 'LED Light Bar Installation';
        if (lowerDesc.includes('dash cam')) return 'Dash Camera Installation';
        if (lowerDesc.includes('uhf')) return 'UHF Radio Installation';
        return '4WD Modification Service';
        
      case 'carpentry':
        if (lowerDesc.includes('deck')) return 'Timber Decking Installation';
        if (lowerDesc.includes('pergola')) return 'Pergola Construction';
        return 'Carpentry Service';
        
      case 'handyman':
        if (lowerDesc.includes('shelf') || lowerDesc.includes('shelves')) {
          return quantity ? `${quantity} Shelf Installation` : 'Shelf Installation';
        }
        return 'Handyman Service';
        
      case 'painting':
        if (lowerDesc.includes('interior')) return 'Interior Painting';
        if (lowerDesc.includes('exterior')) return 'Exterior Painting';
        return 'Professional Painting Service';
        
      case 'landscaping':
        if (lowerDesc.includes('fence')) return 'Fencing Installation';
        if (lowerDesc.includes('garden')) return 'Garden Landscaping';
        return 'Landscaping Service';
        
      case 'concrete':
        if (lowerDesc.includes('driveway')) return 'Concrete Driveway';
        return 'Concrete Work';
        
      case 'tiling':
        return 'Tiling Installation';
        
      case 'roofing':
        return 'Roofing Service';
        
      case 'hvac':
        return 'Air Conditioning Installation';
        
      case 'renovation':
        if (lowerDesc.includes('bathroom')) return 'Bathroom Renovation';
        if (lowerDesc.includes('kitchen')) return 'Kitchen Renovation';
        return 'Renovation Service';
        
      default:
        return tradeCategory.subcategory.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) + ' Service';
    }
  };

  const generateQuote = async () => {
    if (!selectedClient) {
      Alert.alert('Error', 'Please select a client');
      return;
    }

    if (!jobDescription.trim()) {
      Alert.alert('Error', 'Please describe the work needed');
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Generate quote using enhanced trade detection with user's hourly rate
      const aiQuote = generateFallbackQuote(jobDescription.trim());

      // Calculate totals
      const subtotal = aiQuote.items.reduce((sum, item) => sum + (item.qty * item.cost), 0);
      const gstEnabled = businessProfile?.gst_enabled ?? true;
      const gst_amount = gstEnabled ? subtotal * 0.1 : 0;
      const total = subtotal + gst_amount;

      console.log('Generated quote:', {
        itemCount: aiQuote.items.length,
        subtotal,
        gst_amount,
        total,
        gstEnabled,
        userHourlyRate: currentHourlyRate
      });

      // Insert quote
      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .insert({
          user_id: user.id,
          client_id: selectedClient.id,
          job_title: aiQuote.job_title,
          description: aiQuote.summary,
          status: 'Draft',
          subtotal,
          gst_amount,
          total,
        })
        .select()
        .single();

      if (quoteError) throw quoteError;

      // Insert quote items
      const quoteItems = aiQuote.items.map(item => ({
        quote_id: quote.id,
        type: item.type,
        name: item.name,
        quantity: item.qty,
        unit_price: item.cost,
        total: item.qty * item.cost,
      }));

      if (quoteItems.length > 0) {
        const { error: itemsError } = await supabase.from('quote_items').insert(quoteItems);
        if (itemsError) throw itemsError;
      }

      // Navigate to quote preview
      router.push(`/quote-preview/${quote.id}`);

    } catch (error) {
      console.error('Error generating quote:', error);
      Alert.alert('Error', 'Failed to generate quote. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Fast Quote</Text>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoContainer}>
          <Image 
            source={{ uri: LOGO_URL }} 
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Client Info Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <User size={20} color="#F6A623" />
            <Text style={styles.sectionTitle}>Client Information</Text>
          </View>
          
          <View style={styles.sectionContent}>
            <View style={styles.clientSelectorContainer}>
              <TouchableOpacity
                style={styles.clientSelector}
                onPress={() => setShowClientPicker(!showClientPicker)}
              >
                <Text style={[styles.clientSelectorText, !selectedClient && styles.placeholder]}>
                  {selectedClient ? selectedClient.name : 'Choose a client...'}
                </Text>
                <ChevronDown size={20} color="#666" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.addClientButton}
                onPress={() => router.push('/(tabs)/clients')}
              >
                <Plus size={16} color="#F6A623" />
              </TouchableOpacity>
            </View>

            {showClientPicker && (
              <View style={styles.clientPicker}>
                {clients.map((client) => (
                  <TouchableOpacity
                    key={client.id}
                    style={styles.clientOption}
                    onPress={() => {
                      setSelectedClient(client);
                      setShowClientPicker(false);
                    }}
                  >
                    <Text style={styles.clientOptionText}>{client.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {selectedClient && (
              <View style={styles.selectedClientInfo}>
                <Text style={styles.selectedClientName}>{selectedClient.name}</Text>
                <Text style={styles.selectedClientEmail}>{selectedClient.email}</Text>
                {selectedClient.phone && (
                  <Text style={styles.selectedClientPhone}>{selectedClient.phone}</Text>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Job Description Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <FileText size={20} color="#F6A623" />
            <Text style={styles.sectionTitle}>Job Description</Text>
          </View>
          
          <View style={styles.sectionContent}>
            <FloatingLabelInput
              label="Describe the work needed"
              value={jobDescription}
              onChangeText={setJobDescription}
              placeholder="e.g., 'install dual battery system', 'renovate bathroom', 'install 6 LED downlights', 'concrete driveway 20m²'"
              multiline
              numberOfLines={6}
              style={styles.jobDescriptionContainer}
            />
            
            <Text style={styles.hint}>
              Be specific about trade type, quantities, and location. Our AI supports electrical, plumbing, carpentry, automotive, painting, landscaping, and many other trades.
            </Text>

            {/* Hourly Rate Section with Edit Button */}
            <View style={styles.rateSection}>
              <View style={styles.rateHeader}>
                <DollarSign size={20} color="#F6A623" />
                <Text style={styles.rateSectionTitle}>Your Hourly Rate</Text>
                <TouchableOpacity
                  style={styles.editRateButton}
                  onPress={() => setHourlyRateModalVisible(true)}
                >
                  <Edit size={16} color="#F6A623" />
                  <Text style={styles.editRateText}>Edit</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.rateInfo}>
                <Text style={styles.rateInfoText}>
                  ${currentHourlyRate}/hr
                </Text>
                <Text style={styles.rateInfoSubtext}>
                  This rate will be used for labour items in your quotes
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Fixed Generate Button */}
      <View style={styles.fixedButtonContainer}>
        <TouchableOpacity
          style={[styles.generateButton, loading && styles.generateButtonDisabled]}
          onPress={generateQuote}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Zap size={20} color="#FFFFFF" />
          )}
          <Text style={styles.generateButtonText}>
            {loading ? 'GENERATING...' : 'GENERATE QUOTE'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Hourly Rate Edit Modal */}
      <Modal
        visible={hourlyRateModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setHourlyRateModalVisible(false)}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Hourly Rate</Text>
            <TouchableOpacity 
              onPress={updateHourlyRate}
              disabled={savingRate}
            >
              <Text style={[styles.saveButton, savingRate && styles.saveButtonDisabled]}>
                {savingRate ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.modalDescription}>
              Set your hourly labour rate. This will be used for all labour items in your quotes and saved to your business profile.
            </Text>
            
            <View style={styles.rateInputContainer}>
              <Text style={styles.inputLabel}>Hourly Rate</Text>
              <View style={styles.currencyInputContainer}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  style={styles.rateInput}
                  value={tempHourlyRate}
                  onChangeText={setTempHourlyRate}
                  placeholder="120"
                  keyboardType="numeric"
                  placeholderTextColor="#999"
                  autoFocus
                />
                <Text style={styles.perHourText}>/hr</Text>
              </View>
              <Text style={styles.rateHint}>
                Enter a rate between $30 and $300 per hour
              </Text>
            </View>

            <View style={styles.ratePreview}>
              <Text style={styles.previewTitle}>Preview</Text>
              <Text style={styles.previewText}>
                2 hours of work = ${(parseFloat(tempHourlyRate) * 2 || 0).toFixed(2)}
              </Text>
              <Text style={styles.previewText}>
                4 hours of work = ${(parseFloat(tempHourlyRate) * 4 || 0).toFixed(2)}
              </Text>
              <Text style={styles.previewText}>
                8 hours of work = ${(parseFloat(tempHourlyRate) * 8 || 0).toFixed(2)}
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F8F9FA' 
  },
  header: {
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingVertical: 16,
    backgroundColor: '#FFFFFF', 
    borderBottomWidth: 1, 
    borderBottomColor: '#E9ECEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  backButton: { 
    marginRight: 16 
  },
  headerTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#333' 
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120, // Space for fixed button
  },
  logoContainer: { 
    alignItems: 'center', 
    paddingVertical: 30,
  },
  logo: {
    width: 80, 
    height: 80,
  },
  sectionContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 12,
  },
  sectionContent: {
    padding: 20,
  },
  clientSelectorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  clientSelector: {
    flex: 1,
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    backgroundColor: '#F8F9FA', 
    borderWidth: 1, 
    borderColor: '#E9ECEF', 
    borderRadius: 12,
    paddingHorizontal: 16, 
    paddingVertical: 16,
    marginRight: 12,
  },
  clientSelectorText: { 
    fontSize: 16, 
    color: '#333', 
    flex: 1 
  },
  placeholder: { 
    color: '#999' 
  },
  addClientButton: {
    backgroundColor: '#FFFFFF', 
    borderWidth: 2, 
    borderColor: '#F6A623', 
    borderRadius: 50,
    width: 40, 
    height: 40, 
    justifyContent: 'center', 
    alignItems: 'center',
  },
  clientPicker: {
    backgroundColor: '#F8F9FA', 
    borderRadius: 12, 
    marginBottom: 16,
    maxHeight: 200,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  clientOption: {
    paddingHorizontal: 16, 
    paddingVertical: 12,
    borderBottomWidth: 1, 
    borderBottomColor: '#E9ECEF',
  },
  clientOptionText: { 
    fontSize: 16, 
    color: '#333' 
  },
  selectedClientInfo: {
    backgroundColor: '#F0F7FF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E3F2FD',
  },
  selectedClientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  selectedClientEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  selectedClientPhone: {
    fontSize: 14,
    color: '#666',
  },
  jobDescriptionContainer: {
    marginBottom: 12,
  },
  floatingInputContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  floatingInput: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#333',
    paddingTop: 24, // Space for floating label
  },
  floatingInputMultiline: {
    minHeight: 120,
    textAlignVertical: 'top',
    paddingTop: 28, // More space for floating label in multiline
  },
  floatingInputFocused: {
    borderColor: '#F6A623',
    shadowColor: '#F6A623',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  hint: { 
    fontSize: 12, 
    color: '#666', 
    lineHeight: 16,
    fontStyle: 'italic',
    marginBottom: 16,
  },
  rateSection: {
    backgroundColor: '#FFF5E6',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#F6A623',
  },
  rateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  rateSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  editRateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F6A623',
  },
  editRateText: {
    color: '#F6A623',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  rateInfo: {
    alignItems: 'flex-start',
  },
  rateInfoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F6A623',
    marginBottom: 4,
  },
  rateInfoSubtext: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  fixedButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 32, // Extra padding for iOS
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  generateButton: {
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    backgroundColor: '#F6A623', 
    borderRadius: 12, 
    paddingVertical: 16,
    shadowColor: '#F6A623',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  generateButtonDisabled: { 
    opacity: 0.6 
  },
  generateButtonText: {
    color: '#FFFFFF', 
    fontSize: 16, 
    fontWeight: 'bold', 
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  cancelButton: {
    fontSize: 16,
    color: '#666',
  },
  saveButton: {
    fontSize: 16,
    color: '#F6A623',
    fontWeight: '600',
  },
  saveButtonDisabled: {
    color: '#CCC',
  },
  modalContent: {
    padding: 20,
  },
  modalDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
    marginBottom: 24,
  },
  rateInputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  currencyInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  currencySymbol: {
    fontSize: 20,
    color: '#666',
    marginRight: 8,
  },
  rateInput: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 20,
    color: '#333',
    textAlign: 'center',
  },
  perHourText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
  },
  rateHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
  },
  ratePreview: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 16,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  previewText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
});