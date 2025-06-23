import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Image,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { CircleCheck as CheckCircle, ArrowLeft, Mail, Phone } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { Quote, Client, BusinessProfile } from '@/types/database';

const LOGO_URL = 'https://pofgpoktfwwrpkgzwuwa.supabase.co/storage/v1/object/sign/logoassets/JobQuote-mainlogo.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8yZjIxYTE4My1kNTZmLTRhOTYtOTkxMi0yNGU4NTllYzUxYjciLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJsb2dvYXNzZXRzL0pvYlF1b3RlLW1haW5sb2dvLnBuZyIsImlhdCI6MTc1MDE3MzI5OSwiZXhwIjoxODQ0NzgxMjk5fQ.-iEcQYX1u7yDZjDssRq6szOYc3r8ziTlv2OTidRtQSs';

type QuoteWithDetails = Quote & {
  clients: Client;
};

export default function QuoteApprovalSuccess() {
  const { quoteId } = useLocalSearchParams();
  const [quote, setQuote] = useState<QuoteWithDetails | null>(null);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [approved, setApproved] = useState(false);

  useEffect(() => {
    if (quoteId) {
      fetchQuoteAndApprove();
    }
  }, [quoteId]);

  const fetchQuoteAndApprove = async () => {
    try {
      console.log('Fetching quote for approval:', quoteId);

      // Fetch quote with client details
      const { data: quoteData, error: quoteError } = await supabase
        .from('quotes')
        .select(`
          *,
          clients (*)
        `)
        .eq('id', quoteId)
        .single();

      if (quoteError) {
        console.error('Error fetching quote:', quoteError);
        setLoading(false);
        return;
      }

      setQuote(quoteData);

      // Fetch business profile
      if (quoteData.user_id) {
        const { data: profileData } = await supabase
          .from('business_profiles')
          .select('*')
          .eq('id', quoteData.user_id)
          .single();

        if (profileData) {
          setBusinessProfile(profileData);
        }
      }

      // Auto-approve the quote if it's not already approved
      if (quoteData.status?.toLowerCase() !== 'approved') {
        setApproving(true);
        await approveQuote(quoteData.id);
      } else {
        setApproved(true);
      }

    } catch (error) {
      console.error('Error in fetchQuoteAndApprove:', error);
    } finally {
      setLoading(false);
    }
  };

  const approveQuote = async (id: string) => {
    try {
      const { error } = await supabase
        .from('quotes')
        .update({ 
          status: 'approved',
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        console.error('Error approving quote:', error);
        return;
      }

      console.log('Quote approved successfully');
      setApproved(true);
    } catch (error) {
      console.error('Error in approveQuote:', error);
    } finally {
      setApproving(false);
    }
  };

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F6A623" />
          <Text style={styles.loadingText}>Loading quote...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!quote) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Quote Not Found</Text>
          <Text style={styles.errorText}>
            This quote may have been removed or the link is invalid.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo */}
        <Image 
          source={{ uri: LOGO_URL }} 
          style={styles.logo}
          resizeMode="contain"
        />

        {/* Success Icon and Status */}
        <View style={styles.statusContainer}>
          {approving ? (
            <>
              <ActivityIndicator size={60} color="#F6A623" />
              <Text style={styles.statusTitle}>Approving Quote...</Text>
              <Text style={styles.statusSubtitle}>
                Please wait while we process your approval
              </Text>
            </>
          ) : approved ? (
            <>
              <View style={styles.successIcon}>
                <CheckCircle size={60} color="#28A745" />
              </View>
              <Text style={styles.statusTitle}>Quote Approved! ✅</Text>
              <Text style={styles.statusSubtitle}>
                Your approval has been recorded successfully
              </Text>
            </>
          ) : (
            <>
              <View style={styles.successIcon}>
                <CheckCircle size={60} color="#28A745" />
              </View>
              <Text style={styles.statusTitle}>Already Approved</Text>
              <Text style={styles.statusSubtitle}>
                This quote has already been approved
              </Text>
            </>
          )}
        </View>

        {/* Quote Details */}
        <View style={styles.quoteCard}>
          <Text style={styles.quoteTitle}>{quote.job_title}</Text>
          <Text style={styles.quoteClient}>For: {quote.clients.name}</Text>
          <Text style={styles.quoteAmount}>{formatCurrency(quote.total || 0)}</Text>
          <Text style={styles.quoteAmountLabel}>Total (Inc. GST)</Text>
        </View>

        {/* Business Contact Info */}
        {businessProfile && (
          <View style={styles.contactCard}>
            <Text style={styles.contactTitle}>What happens next?</Text>
            <Text style={styles.contactDescription}>
              {businessProfile.business_name || 'The business'} will be notified of your approval and will contact you shortly to schedule the work.
            </Text>
            
            <View style={styles.contactInfo}>
              {businessProfile.email && (
                <View style={styles.contactRow}>
                  <Mail size={16} color="#666" />
                  <Text style={styles.contactText}>{businessProfile.email}</Text>
                </View>
              )}
              {businessProfile.phone && (
                <View style={styles.contactRow}>
                  <Phone size={16} color="#666" />
                  <Text style={styles.contactText}>{businessProfile.phone}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Footer Message */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Thank you for choosing our services! We look forward to working with you.
          </Text>
        </View>
      </View>
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
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#DC3545',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 40,
    alignItems: 'center',
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 40,
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  successIcon: {
    marginBottom: 20,
  },
  statusTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  statusSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  quoteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  quoteTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  quoteClient: {
    fontSize: 16,
    color: '#F6A623',
    fontWeight: '600',
    marginBottom: 16,
  },
  quoteAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#28A745',
    marginBottom: 4,
  },
  quoteAmountLabel: {
    fontSize: 14,
    color: '#666',
  },
  contactCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  contactDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
    marginBottom: 16,
  },
  contactInfo: {
    gap: 8,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 20,
  },
});