import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { CircleCheck as CheckCircle, X as XCircle, ArrowLeft } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { Quote, QuoteItem, Client, BusinessProfile } from '@/types/database';

type QuoteWithDetails = Quote & {
  clients: Client;
  quote_items: QuoteItem[];
};

const LOGO_URL = 'https://pofgpoktfwwrpkgzwuwa.supabase.co/storage/v1/object/sign/logoassets/JobQuote-mainlogo.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8yZjIxYTE4My1kNTZmLTRhOTYtOTkxMi0yNGU4NTllYzUxYjciLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJsb2dvYXNzZXRzL0pvYlF1b3RlLW1haW5sb2dvLnBuZyIsImlhdCI6MTc1MDE3MzI5OSwiZXhwIjoxODQ0NzgxMjk5fQ.-iEcQYX1u7yDZjDssRq6szOYc3r8ziTlv2OTidRtQSs';

export default function QuoteApproval() {
  const { id, action } = useLocalSearchParams();
  const [quote, setQuote] = useState<QuoteWithDetails | null>(null);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [decision, setDecision] = useState<'approved' | 'rejected' | null>(null);

  useEffect(() => {
    if (id) {
      fetchQuote();
    }
  }, [id]);

  useEffect(() => {
    // Auto-handle action from URL if provided
    if (action === 'approve' && quote && !decision) {
      handleDecision(true);
    }
  }, [action, quote, decision]);

  const fetchQuote = async () => {
    const { data, error } = await supabase
      .from('quotes')
      .select(`
        *,
        clients (*),
        quote_items (*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching quote:', error);
      setLoading(false);
      return;
    }

    setQuote(data);

    // Fetch business profile
    if (data.user_id) {
      const { data: profileData } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('id', data.user_id)
        .single();

      if (profileData) {
        setBusinessProfile(profileData);
      }
    }

    setLoading(false);
  };

  const handleDecision = async (approved: boolean) => {
    if (!quote) return;

    setSubmitting(true);
    const status = approved ? 'approved' : 'rejected';

    try {
      const { error } = await supabase
        .from('quotes')
        .update({ status })
        .eq('id', quote.id);

      if (error) throw error;

      setDecision(status);

    } catch (error) {
      console.error('Error updating quote:', error);
      Alert.alert('Error', 'Failed to update quote status');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

  const getItemTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'labour':
      case 'labor':
        return '#4299e1';
      case 'material':
      case 'materials':
        return '#48bb78';
      case 'travel':
        return '#9f7aea';
      default:
        return '#718096';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2d3748" />
          <Text style={styles.loadingText}>Loading quote...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!quote) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Quote not found</Text>
          <Text style={styles.errorSubtext}>This quote may have been removed or the link is invalid.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (decision) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <Image 
            source={{ uri: LOGO_URL }} 
            style={styles.logo}
            resizeMode="contain"
          />
          
          {decision === 'approved' ? (
            <CheckCircle size={80} color="#48bb78" />
          ) : (
            <XCircle size={80} color="#e53e3e" />
          )}
          
          <Text style={styles.successTitle}>
            {decision === 'approved' ? 'Quote Approved!' : 'Quote Declined'}
          </Text>
          
          <Text style={styles.successMessage}>
            {decision === 'approved' 
              ? `Your approval has been given to ${businessProfile?.business_name || 'the business'} and they will be in touch with you shortly to schedule the work.`
              : `Your decision has been recorded. ${businessProfile?.business_name || 'The business'} will be notified of your decision.`
            }
          </Text>

          {businessProfile?.email && (
            <Text style={styles.contactInfo}>
              Questions? Contact us at {businessProfile.email}
            </Text>
          )}

          <TouchableOpacity 
            style={styles.doneButton}
            onPress={() => {
              // In a real app, this might close the browser tab or redirect
              Alert.alert('Thank you', 'You can now close this page.');
            }}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Image 
          source={{ uri: LOGO_URL }} 
          style={styles.headerLogo}
          resizeMode="contain"
        />
        <Text style={styles.headerTitle}>Quote Review</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Business Information */}
        {businessProfile && (
          <View style={styles.section}>
            <View style={styles.businessHeader}>
              <View style={styles.businessLogo}>
                <Text style={styles.businessLogoText}>
                  {businessProfile.business_name?.charAt(0) || 'B'}
                </Text>
              </View>
              <View style={styles.businessInfo}>
                <Text style={styles.businessName}>{businessProfile.business_name}</Text>
                {businessProfile.abn && (
                  <Text style={styles.businessDetail}>ABN: {businessProfile.abn}</Text>
                )}
                {businessProfile.email && (
                  <Text style={styles.businessDetail}>📧 {businessProfile.email}</Text>
                )}
                {businessProfile.phone && (
                  <Text style={styles.businessDetail}>📞 {businessProfile.phone}</Text>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Quote Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quote Details</Text>
          
          <View style={styles.quoteHeader}>
            <Text style={styles.quoteTitle}>{quote.job_title}</Text>
            <Text style={styles.quoteNumber}>Quote #{quote.id.slice(-6).toUpperCase()}</Text>
            <Text style={styles.clientName}>For: {quote.clients.name}</Text>
          </View>

          <Text style={styles.quoteDescription}>{quote.description}</Text>

          <View style={styles.totalCard}>
            <Text style={styles.totalAmount}>{formatCurrency(quote.total || 0)}</Text>
            <Text style={styles.totalLabel}>Total (Inc. GST)</Text>
          </View>
        </View>

        {/* Quote Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quote Breakdown</Text>
          
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, { flex: 3 }]}>Description</Text>
            <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'center' }]}>Qty</Text>
            <Text style={[styles.tableHeaderText, { flex: 1.5, textAlign: 'right' }]}>Rate</Text>
            <Text style={[styles.tableHeaderText, { flex: 1.5, textAlign: 'right' }]}>Total</Text>
          </View>

          {quote.quote_items.map((item, index) => (
            <View key={item.id} style={styles.tableRow}>
              <View style={{ flex: 3 }}>
                <Text style={styles.itemName}>{item.name}</Text>
                <View style={[styles.itemTypeBadge, { backgroundColor: getItemTypeColor(item.type || '') }]}>
                  <Text style={styles.itemTypeText}>{item.type || 'Other'}</Text>
                </View>
              </View>
              
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={styles.itemQuantity}>{item.quantity || item.qty || 1}</Text>
              </View>
              
              <View style={{ flex: 1.5, alignItems: 'flex-end' }}>
                <Text style={styles.itemPrice}>{formatCurrency(item.unit_price || item.cost || 0)}</Text>
              </View>
              
              <View style={{ flex: 1.5, alignItems: 'flex-end' }}>
                <Text style={styles.itemTotal}>
                  {formatCurrency(item.total || ((item.unit_price || item.cost || 0) * (item.quantity || item.qty || 1)))}
                </Text>
              </View>
            </View>
          ))}

          {/* Totals */}
          <View style={styles.totalsContainer}>
            <View style={styles.totalRow}>
              <Text style={styles.totalRowLabel}>Subtotal:</Text>
              <Text style={styles.totalRowValue}>{formatCurrency(quote.subtotal || 0)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalRowLabel}>GST (10%):</Text>
              <Text style={styles.totalRowValue}>{formatCurrency(quote.gst_amount || 0)}</Text>
            </View>
            <View style={styles.finalTotalRow}>
              <Text style={styles.finalTotalLabel}>Total:</Text>
              <Text style={styles.finalTotalValue}>{formatCurrency(quote.total || 0)}</Text>
            </View>
          </View>
        </View>

        {/* Payment Terms */}
        {businessProfile?.payment_terms && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Terms</Text>
            <Text style={styles.paymentTerms}>{businessProfile.payment_terms}</Text>
          </View>
        )}

        {/* Bank Details */}
        {businessProfile?.bank_name && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Details</Text>
            <View style={styles.bankDetails}>
              {businessProfile.bank_name && (
                <View style={styles.bankRow}>
                  <Text style={styles.bankLabel}>Bank:</Text>
                  <Text style={styles.bankValue}>{businessProfile.bank_name}</Text>
                </View>
              )}
              {businessProfile.bsb && (
                <View style={styles.bankRow}>
                  <Text style={styles.bankLabel}>BSB:</Text>
                  <Text style={styles.bankValue}>{businessProfile.bsb}</Text>
                </View>
              )}
              {businessProfile.account_number && (
                <View style={styles.bankRow}>
                  <Text style={styles.bankLabel}>Account:</Text>
                  <Text style={styles.bankValue}>{businessProfile.account_number}</Text>
                </View>
              )}
              {businessProfile.account_name && (
                <View style={styles.bankRow}>
                  <Text style={styles.bankLabel}>Name:</Text>
                  <Text style={styles.bankValue}>{businessProfile.account_name}</Text>
                </View>
              )}
              <View style={styles.bankRow}>
                <Text style={styles.bankLabel}>Reference:</Text>
                <Text style={styles.bankValue}>QTE-{quote.id.slice(-6).toUpperCase()}</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      {quote.status?.toLowerCase() !== 'approved' && quote.status?.toLowerCase() !== 'rejected' && (
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => handleDecision(false)}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <XCircle size={20} color="#FFFFFF" />
            )}
            <Text style={styles.actionButtonText}>Decline Quote</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.approveButton]}
            onPress={() => handleDecision(true)}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <CheckCircle size={20} color="#FFFFFF" />
            )}
            <Text style={styles.actionButtonText}>Approve Quote</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Already decided */}
      {(quote.status?.toLowerCase() === 'approved' || quote.status?.toLowerCase() === 'rejected') && (
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>
            This quote has already been {quote.status?.toLowerCase()}.
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#4a5568',
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 24,
    color: '#e53e3e',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 16,
    color: '#4a5568',
    textAlign: 'center',
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 40,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2d3748',
    marginTop: 20,
    marginBottom: 16,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 18,
    color: '#4a5568',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  contactInfo: {
    fontSize: 16,
    color: '#2d3748',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 32,
  },
  doneButton: {
    backgroundColor: '#2d3748',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerLogo: {
    width: 40,
    height: 40,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d3748',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 16,
  },
  businessHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  businessLogo: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#2d3748',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  businessLogoText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  businessInfo: {
    flex: 1,
  },
  businessName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 4,
  },
  businessDetail: {
    fontSize: 14,
    color: '#4a5568',
    marginBottom: 2,
  },
  quoteHeader: {
    marginBottom: 16,
  },
  quoteTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 4,
  },
  quoteNumber: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 4,
  },
  clientName: {
    fontSize: 16,
    color: '#2d3748',
    fontWeight: '600',
  },
  quoteDescription: {
    fontSize: 16,
    color: '#4a5568',
    lineHeight: 22,
    marginBottom: 20,
  },
  totalCard: {
    backgroundColor: '#f7fafc',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  totalAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 4,
  },
  totalLabel: {
    fontSize: 14,
    color: '#718096',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#e2e8f0',
    marginBottom: 8,
  },
  tableHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4a5568',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f7fafc',
    alignItems: 'center',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2d3748',
    marginBottom: 6,
  },
  itemTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  itemTypeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  itemQuantity: {
    fontSize: 16,
    color: '#2d3748',
    textAlign: 'center',
  },
  itemPrice: {
    fontSize: 16,
    color: '#2d3748',
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
  },
  totalsContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: '#e2e8f0',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalRowLabel: {
    fontSize: 16,
    color: '#4a5568',
  },
  totalRowValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2d3748',
  },
  finalTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  finalTotalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3748',
  },
  finalTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3748',
  },
  paymentTerms: {
    fontSize: 16,
    color: '#4a5568',
    lineHeight: 22,
  },
  bankDetails: {
    backgroundColor: '#f7fafc',
    borderRadius: 8,
    padding: 16,
  },
  bankRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  bankLabel: {
    fontSize: 14,
    color: '#4a5568',
    fontWeight: '500',
  },
  bankValue: {
    fontSize: 14,
    color: '#2d3748',
    fontWeight: '600',
  },
  actionContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
  },
  rejectButton: {
    backgroundColor: '#e53e3e',
  },
  approveButton: {
    backgroundColor: '#48bb78',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  statusContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  statusText: {
    fontSize: 16,
    color: '#4a5568',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});