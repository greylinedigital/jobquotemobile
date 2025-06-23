import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  SafeAreaView,
  Alert,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Plus, Zap, FileText, Receipt, Edit } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { Quote, Client, Invoice } from '@/types/database';

type QuoteWithClient = Quote & {
  clients: Client;
  invoices?: Invoice[];
};

export default function QuotesTab() {
  const [quotes, setQuotes] = useState<QuoteWithClient[]>([]);
  const [loading, setLoading] = useState(true);

  // Use useFocusEffect to refresh quotes when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchQuotes();
    }, [])
  );

  const fetchQuotes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('quotes')
      .select(`
        *,
        clients (*),
        invoices (*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching quotes:', error);
    } else {
      setQuotes(data || []);
    }
    setLoading(false);
  };

  const createInvoice = async (quote: QuoteWithClient) => {
    try {
      // Generate invoice number
      const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
      
      // Calculate due date (7 days from now)
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 7);

      const { data, error } = await supabase
        .from('invoices')
        .insert({
          quote_id: quote.id,
          invoice_number: invoiceNumber,
          total: quote.total,
          due_date: dueDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
          status: 'Unpaid',
        })
        .select()
        .single();

      if (error) throw error;

      Alert.alert(
        'Invoice Created',
        `Invoice ${invoiceNumber} has been created successfully!`,
        [
          {
            text: 'View Invoice',
            onPress: () => {
              router.push(`/invoice-view/${data.id}`);
            }
          },
          {
            text: 'OK',
            onPress: () => {
              // Refresh the quotes list to show updated button
              fetchQuotes();
            }
          }
        ]
      );

    } catch (error) {
      console.error('Error creating invoice:', error);
      Alert.alert('Error', 'Failed to create invoice. Please try again.');
    }
  };

  const handleInvoiceAction = (quote: QuoteWithClient) => {
    const hasInvoice = quote.invoices && quote.invoices.length > 0;
    
    if (hasInvoice) {
      // Navigate to existing invoice
      router.push(`/invoice-view/${quote.invoices![0].id}`);
    } else {
      // Create new invoice
      createInvoice(quote);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'draft':
        return '#6C757D';
      case 'sent':
        return '#17A2B8';
      case 'approved':
        return '#28A745';
      case 'rejected':
        return '#DC3545';
      default:
        return '#6C757D';
    }
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const renderQuote = ({ item }: { item: QuoteWithClient }) => {
    const hasInvoice = item.invoices && item.invoices.length > 0;
    
    return (
      <View style={styles.quoteCard}>
        <TouchableOpacity
          onPress={() => router.push(`/quote-preview/${item.id}`)}
          style={styles.quoteContent}
        >
          <View style={styles.quoteHeader}>
            <View style={styles.quoteHeaderLeft}>
              <Text style={styles.quoteTitle}>{item.job_title}</Text>
              <Text style={styles.clientName}>{item.clients.name}</Text>
              <Text style={styles.quoteDescription} numberOfLines={2}>
                {item.description}
              </Text>
            </View>
            <View style={styles.quoteHeaderRight}>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                <Text style={styles.statusText}>{(item.status || 'DRAFT').toUpperCase()}</Text>
              </View>
              <Text style={styles.quoteTotal}>{formatCurrency(item.total || 0)}</Text>
              <Text style={styles.quoteDate}>{formatDate(item.created_at)}</Text>
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.quoteActions}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => router.push(`/quote-preview/${item.id}`)}
          >
            <Edit size={16} color="#666" />
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>

          {/* Show action buttons for sent/approved quotes */}
          {(item.status?.toLowerCase() === 'sent' || item.status?.toLowerCase() === 'approved') && (
            <TouchableOpacity 
              style={styles.invoiceButton}
              onPress={(e) => {
                e.stopPropagation();
                handleInvoiceAction(item);
              }}
            >
              <Receipt size={16} color="#FFFFFF" />
              <Text style={styles.invoiceButtonText}>
                {hasInvoice ? 'View Invoice' : 'Create Invoice'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Quotes</Text>
        <TouchableOpacity
          style={styles.fastQuoteButton}
          onPress={() => router.push('/fast-quote')}
        >
          <Zap size={20} color="#FFFFFF" />
          <Text style={styles.fastQuoteText}>Fast Quote</Text>
        </TouchableOpacity>
      </View>

      {quotes.length === 0 && !loading ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No Quotes Yet</Text>
          <Text style={styles.emptySubtitle}>
            Create your first quote with AI assistance
          </Text>
          <TouchableOpacity
            style={styles.createFirstButton}
            onPress={() => router.push('/fast-quote')}
          >
            <Plus size={20} color="#FFFFFF" />
            <Text style={styles.createFirstText}>Create First Quote</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={quotes}
          renderItem={renderQuote}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContainer, { paddingBottom: 40 }]}
          refreshing={loading}
          onRefresh={fetchQuotes}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  fastQuoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F6A623',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  fastQuoteText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 4,
  },
  listContainer: {
    padding: 20,
  },
  quoteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  quoteContent: {
    padding: 16,
  },
  quoteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  quoteHeaderLeft: {
    flex: 1,
    marginRight: 16,
  },
  quoteHeaderRight: {
    alignItems: 'flex-end',
  },
  quoteTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  clientName: {
    fontSize: 14,
    color: '#F6A623',
    fontWeight: '600',
    marginBottom: 4,
  },
  quoteDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  quoteTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  quoteDate: {
    fontSize: 12,
    color: '#999',
  },
  quoteActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F8F9FA',
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  editButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  invoiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#28A745',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  invoiceButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  createFirstButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F6A623',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  createFirstText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});