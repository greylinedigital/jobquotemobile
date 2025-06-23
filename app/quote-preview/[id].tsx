import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch,
  Modal,
  Animated,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Send, CreditCard as Edit, FileText, Plus, Trash2, Receipt, ChevronDown, ChevronUp, RefreshCw, CircleCheck as CheckCircle, Clock, Mail } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { Quote, QuoteItem, Client, BusinessProfile, Invoice } from '@/types/database';

type QuoteWithDetails = Quote & {
  clients: Client;
  quote_items: QuoteItem[];
  invoices?: Invoice[];
};

export default function QuotePreview() {
  const { id } = useLocalSearchParams();
  const [quote, setQuote] = useState<QuoteWithDetails | null>(null);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const [isFinalized, setIsFinalized] = useState(false);
  const [creatingInvoice, setCreatingInvoice] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [resendCount, setResendCount] = useState(0);

  // Collapsible sections state
  const [jobDescriptionExpanded, setJobDescriptionExpanded] = useState(true);
  const [itemsExpanded, setItemsExpanded] = useState(true);
  const [businessInfoExpanded, setBusinessInfoExpanded] = useState(false);

  // Downpayment modal state
  const [downpaymentModalVisible, setDownpaymentModalVisible] = useState(false);
  const [downpaymentRequested, setDownpaymentRequested] = useState(false);
  const [downpaymentAmount, setDownpaymentAmount] = useState('');
  const [downpaymentPercentage, setDownpaymentPercentage] = useState('30');

  // Edit state
  const [editJobTitle, setEditJobTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editItems, setEditItems] = useState<QuoteItem[]>([]);

  useEffect(() => {
    if (id) {
      fetchQuote();
      fetchBusinessProfile();
    }
  }, [id]);

  const fetchQuote = async () => {
    const { data, error } = await supabase
      .from('quotes')
      .select(`
        *,
        clients (*),
        quote_items (*),
        invoices (*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      Alert.alert('Error', 'Failed to load quote');
      router.back();
    } else {
      setQuote(data);
      setEditJobTitle(data.job_title || '');
      setEditDescription(data.description || '');
      setEditItems(data.quote_items || []);
      setIsFinalized(data.status?.toLowerCase() === 'sent' || data.status?.toLowerCase() === 'approved');
      
      // Check if quote has been sent to determine resend count
      if (data.status?.toLowerCase() === 'sent' || data.status?.toLowerCase() === 'approved') {
        setResendCount(1); // Assume it's been sent once if status is 'sent'
      }
    }
    setLoading(false);
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
    }
  };

  const addNewItem = () => {
    const newItem: QuoteItem = {
      id: `temp-${Date.now()}`,
      quote_id: quote?.id || '',
      name: '',
      type: 'labour',
      quantity: 1,
      unit_price: 0,
      total: 0,
      created_at: new Date().toISOString(),
      qty: null,
      cost: null,
    };
    setEditItems([...editItems, newItem]);
  };

  const deleteItem = (index: number) => {
    const newItems = editItems.filter((_, i) => i !== index);
    setEditItems(newItems);
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...editItems];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Recalculate total for this item
    if (field === 'quantity' || field === 'unit_price') {
      const quantity = field === 'quantity' ? value : newItems[index].quantity || 1;
      const unitPrice = field === 'unit_price' ? value : newItems[index].unit_price || 0;
      newItems[index].total = quantity * unitPrice;
    }
    
    setEditItems(newItems);
  };

  const calculateDownpaymentAmount = () => {
    if (!quote?.total) return;
    const percentage = parseFloat(downpaymentPercentage) || 0;
    const amount = (quote.total * percentage) / 100;
    setDownpaymentAmount(amount.toFixed(2));
  };

  useEffect(() => {
    if (downpaymentRequested && quote?.total) {
      calculateDownpaymentAmount();
    }
  }, [downpaymentPercentage, quote?.total, downpaymentRequested]);

  const saveChanges = async () => {
    if (!quote) return;

    try {
      // Calculate totals
      const subtotal = editItems.reduce((sum, item) => 
        sum + ((item.unit_price || item.cost || 0) * (item.quantity || item.qty || 1)), 0
      );
      const gst_amount = subtotal * 0.1;
      const total = subtotal + gst_amount;

      // Update quote
      const { error: quoteError } = await supabase
        .from('quotes')
        .update({
          job_title: editJobTitle,
          description: editDescription,
          subtotal,
          gst_amount,
          total,
          updated_at: new Date().toISOString(),
        })
        .eq('id', quote.id);

      if (quoteError) throw quoteError;

      // Delete existing items and insert new ones
      const { error: deleteError } = await supabase
        .from('quote_items')
        .delete()
        .eq('quote_id', quote.id);

      if (deleteError) throw deleteError;

      // Insert new items (filter out temp items and create new ones)
      const itemsToInsert = editItems.map(item => ({
        quote_id: quote.id,
        name: item.name,
        type: item.type,
        quantity: item.quantity || item.qty || 1,
        unit_price: item.unit_price || item.cost || 0,
        total: (item.unit_price || item.cost || 0) * (item.quantity || item.qty || 1),
      }));

      if (itemsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('quote_items')
          .insert(itemsToInsert);

        if (insertError) throw insertError;
      }

      // Refresh quote data
      await fetchQuote();
      setIsEditing(false);
      Alert.alert('Success', 'Quote updated successfully');
    } catch (error) {
      console.error('Error saving changes:', error);
      Alert.alert('Error', 'Failed to save changes');
    }
  };

  const createInvoice = async () => {
    if (!quote) return;

    setCreatingInvoice(true);
    try {
      // Generate invoice number
      const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
      
      // Calculate due date (7 days from now)
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 7);

      // Calculate invoice total (include downpayment if requested)
      let invoiceTotal = quote.total || 0;
      if (downpaymentRequested && downpaymentAmount) {
        invoiceTotal = parseFloat(downpaymentAmount);
      }

      const { data, error } = await supabase
        .from('invoices')
        .insert({
          quote_id: quote.id,
          invoice_number: invoiceNumber,
          total: invoiceTotal,
          due_date: dueDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
          status: 'Unpaid',
        })
        .select()
        .single();

      if (error) throw error;

      // Navigate to invoice view
      router.push(`/invoice-view/${data.id}`);

    } catch (error) {
      console.error('Error creating invoice:', error);
      Alert.alert('Error', 'Failed to create invoice. Please try again.');
    } finally {
      setCreatingInvoice(false);
    }
  };

  const sendQuoteEmail = async () => {
    if (!quote || !businessProfile) {
      Alert.alert('Error', 'Quote or business profile not loaded');
      return;
    }

    setSending(true);

    try {
      // Prepare the complete quote data with business profile
      const quoteData = {
        ...quote,
        business_profile: businessProfile,
        downpayment_requested: downpaymentRequested,
        downpayment_amount: downpaymentRequested ? parseFloat(downpaymentAmount) : null,
      };

      const response = await fetch('/send-quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quote: quoteData,
        }),
      });

      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        throw new Error(`Invalid response format: ${response.text}`);
      }

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}: Failed to send quote`);
      }

      // Update quote status to sent only if it's the first send
      if (quote.status?.toLowerCase() !== 'sent') {
        const { error } = await supabase
          .from('quotes')
          .update({ status: 'sent' })
          .eq('id', quote.id);

        if (error) {
          throw error;
        }
        
        setIsFinalized(true);
      }
      
      // Increment resend count
      setResendCount(prev => prev + 1);
      
      const downpaymentText = downpaymentRequested 
        ? `\n\nDownpayment: $${downpaymentAmount} (${downpaymentPercentage}% of total)`
        : '';

      const resendText = resendCount > 0 ? ' (Resent)' : '';

      Alert.alert(
        'Success! 🎉', 
        `Quote sent successfully${resendText} to ${quote.clients.email}!\n\nThe client will receive a professional email with the quote details.${downpaymentText}${result.debug?.emailId ? `\n\nEmail ID: ${result.debug.emailId}` : ''}`,
        [
          {
            text: 'View Quotes',
            onPress: () => {
              router.push('/(tabs)/quotes');
            }
          },
          {
            text: 'OK',
            onPress: () => {
              fetchQuote();
            }
          }
        ]
      );
      
    } catch (error) {
      let errorMessage = 'Failed to send quote. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('RESEND_API_KEY')) {
          errorMessage = 'Email service not configured. Please contact support.';
        } else if (error.message.includes('domain')) {
          errorMessage = 'Email domain not verified. Please contact support.';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your internet connection and try again.';
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }
      
      Alert.alert('Email Error', errorMessage);
    } finally {
      setSending(false);
    }
  };

  const sendQuote = () => {
    if (!quote?.clients.email) {
      Alert.alert('Error', 'Client email not found');
      return;
    }

    const downpaymentText = downpaymentRequested 
      ? `\n\nDownpayment: $${downpaymentAmount} (${downpaymentPercentage}% of total)`
      : '';

    const resendText = resendCount > 0 ? ' again' : '';
    const resendWarning = resendCount >= 1 ? '\n\nNote: This quote has already been sent once.' : '';

    Alert.alert(
      `${resendCount > 0 ? 'Resend' : 'Send'} Quote`,
      `Send this quote${resendText} to ${quote.clients.name} at ${quote.clients.email}?\n\nThe client will receive a professional email with the quote details.${downpaymentText}${resendWarning}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: resendCount > 0 ? 'Resend' : 'Send',
          onPress: sendQuoteEmail,
        },
      ]
    );
  };

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

  const getItemTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'labour':
      case 'labor':
        return '#007BFF';
      case 'material':
      case 'materials':
        return '#28A745';
      case 'travel':
        return '#6F42C1';
      default:
        return '#6C757D';
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
      default:
        return '#6C757D';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'draft':
        return <FileText size={20} color="#FFFFFF" />;
      case 'sent':
        return <Mail size={20} color="#FFFFFF" />;
      case 'approved':
        return <CheckCircle size={20} color="#FFFFFF" />;
      default:
        return <Clock size={20} color="#FFFFFF" />;
    }
  };

  const hasInvoice = quote?.invoices && quote.invoices.length > 0;
  const showFloatingButton = !isEditing && !isFinalized && scrollY < 100;
  const canResend = isFinalized && resendCount < 2; // Allow one resend

  if (loading || !quote) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F6A623" />
          <Text style={styles.loadingText}>Loading quote...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quote Details</Text>
        {!isFinalized && (
          <TouchableOpacity 
            style={styles.editButton} 
            onPress={() => {
              if (isEditing) {
                saveChanges();
              } else {
                setIsEditing(true);
              }
            }}
          >
            <Edit size={20} color="#F6A623" />
            <Text style={styles.editButtonText}>{isEditing ? 'Save' : 'Edit'}</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView 
        style={styles.content}
        onScroll={(event) => setScrollY(event.nativeEvent.contentOffset.y)}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        {/* Client Info & Price Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.clientSection}>
            <Text style={styles.clientName}>{quote.clients.name}</Text>
            <Text style={styles.clientEmail}>{quote.clients.email}</Text>
            {quote.clients.phone && (
              <Text style={styles.clientPhone}>{quote.clients.phone}</Text>
            )}
          </View>
          
          <View style={styles.priceSection}>
            <Text style={styles.totalAmount}>{formatCurrency(quote.total || 0)}</Text>
            <Text style={styles.totalLabel}>Inc. GST</Text>
          </View>
        </View>

        {/* Status Timeline */}
        <View style={styles.timelineCard}>
          <Text style={styles.timelineTitle}>Quote Status</Text>
          <View style={styles.timeline}>
            {/* Draft */}
            <View style={styles.timelineItem}>
              <View style={[
                styles.timelineIcon, 
                { backgroundColor: '#28A745' }
              ]}>
                <FileText size={16} color="#FFFFFF" />
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineLabel}>Draft Created</Text>
                <Text style={styles.timelineDate}>
                  {new Date(quote.created_at).toLocaleDateString()}
                </Text>
              </View>
            </View>

            {/* Connector Line */}
            <View style={[
              styles.timelineConnector,
              { backgroundColor: isFinalized ? '#28A745' : '#E9ECEF' }
            ]} />

            {/* Sent */}
            <View style={styles.timelineItem}>
              <View style={[
                styles.timelineIcon,
                { backgroundColor: isFinalized ? '#17A2B8' : '#E9ECEF' }
              ]}>
                <Mail size={16} color="#FFFFFF" />
              </View>
              <View style={styles.timelineContent}>
                <Text style={[
                  styles.timelineLabel,
                  { color: isFinalized ? '#333' : '#999' }
                ]}>
                  Sent to Client
                </Text>
                {isFinalized && (
                  <Text style={styles.timelineDate}>
                    {new Date(quote.updated_at || quote.created_at).toLocaleDateString()}
                  </Text>
                )}
              </View>
            </View>

            {/* Connector Line */}
            <View style={[
              styles.timelineConnector,
              { backgroundColor: quote.status?.toLowerCase() === 'approved' ? '#28A745' : '#E9ECEF' }
            ]} />

            {/* Approved */}
            <View style={styles.timelineItem}>
              <View style={[
                styles.timelineIcon,
                { backgroundColor: quote.status?.toLowerCase() === 'approved' ? '#28A745' : '#E9ECEF' }
              ]}>
                <CheckCircle size={16} color="#FFFFFF" />
              </View>
              <View style={styles.timelineContent}>
                <Text style={[
                  styles.timelineLabel,
                  { color: quote.status?.toLowerCase() === 'approved' ? '#333' : '#999' }
                ]}>
                  Approved
                </Text>
                {quote.status?.toLowerCase() === 'approved' && (
                  <Text style={styles.timelineDate}>
                    {new Date(quote.updated_at || quote.created_at).toLocaleDateString()}
                  </Text>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Job Description Card */}
        <View style={styles.collapsibleCard}>
          <TouchableOpacity 
            style={styles.cardHeader}
            onPress={() => setJobDescriptionExpanded(!jobDescriptionExpanded)}
          >
            <View style={styles.cardHeaderLeft}>
              <FileText size={20} color="#F6A623" />
              <Text style={styles.cardTitle}>Job Description</Text>
            </View>
            {jobDescriptionExpanded ? (
              <ChevronUp size={20} color="#666" />
            ) : (
              <ChevronDown size={20} color="#666" />
            )}
          </TouchableOpacity>
          
          {jobDescriptionExpanded && (
            <View style={styles.cardContent}>
              {isEditing ? (
                <TextInput
                  style={styles.descriptionInput}
                  value={editDescription}
                  onChangeText={setEditDescription}
                  placeholder="Quote description"
                  multiline
                  numberOfLines={3}
                />
              ) : (
                <>
                  <Text style={styles.jobTitle}>{quote.job_title}</Text>
                  <Text style={styles.jobDescription}>{quote.description}</Text>
                </>
              )}
            </View>
          )}
        </View>

        {/* Quote Items Card */}
        <View style={styles.collapsibleCard}>
          <TouchableOpacity 
            style={styles.cardHeader}
            onPress={() => setItemsExpanded(!itemsExpanded)}
          >
            <View style={styles.cardHeaderLeft}>
              <Receipt size={20} color="#F6A623" />
              <Text style={styles.cardTitle}>Quote Items</Text>
              {isEditing && (
                <TouchableOpacity style={styles.addItemButton} onPress={addNewItem}>
                  <Plus size={16} color="#F6A623" />
                </TouchableOpacity>
              )}
            </View>
            {itemsExpanded ? (
              <ChevronUp size={20} color="#666" />
            ) : (
              <ChevronDown size={20} color="#666" />
            )}
          </TouchableOpacity>
          
          {itemsExpanded && (
            <View style={styles.cardContent}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, { flex: 3 }]}>Description</Text>
                <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'center' }]}>Qty</Text>
                <Text style={[styles.tableHeaderText, { flex: 1.5, textAlign: 'right' }]}>Rate</Text>
                <Text style={[styles.tableHeaderText, { flex: 1.5, textAlign: 'right' }]}>Total</Text>
                {isEditing && <Text style={[styles.tableHeaderText, { flex: 0.5 }]}></Text>}
              </View>

              {(isEditing ? editItems : quote.quote_items).map((item, index) => (
                <View key={item.id} style={styles.tableRow}>
                  <View style={{ flex: 3 }}>
                    {isEditing ? (
                      <>
                        <TextInput
                          style={styles.itemInput}
                          value={item.name || ''}
                          onChangeText={(text) => updateItem(index, 'name', text)}
                          placeholder="Item name"
                        />
                        <View style={styles.typeSelector}>
                          {['labour', 'materials', 'travel', 'other'].map((type) => (
                            <TouchableOpacity
                              key={type}
                              style={[
                                styles.typeOption,
                                item.type === type && styles.typeOptionSelected
                              ]}
                              onPress={() => updateItem(index, 'type', type)}
                            >
                              <Text style={[
                                styles.typeOptionText,
                                item.type === type && styles.typeOptionTextSelected
                              ]}>
                                {type}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </>
                    ) : (
                      <>
                        <Text style={styles.itemName}>{item.name}</Text>
                        <View style={[styles.itemTypeBadge, { backgroundColor: getItemTypeColor(item.type || '') }]}>
                          <Text style={styles.itemTypeText}>{item.type || 'Other'}</Text>
                        </View>
                      </>
                    )}
                  </View>
                  
                  <View style={{ flex: 1, alignItems: 'center' }}>
                    {isEditing ? (
                      <TextInput
                        style={styles.quantityInput}
                        value={String(item.quantity || item.qty || 1)}
                        onChangeText={(text) => updateItem(index, 'quantity', parseFloat(text) || 1)}
                        keyboardType="numeric"
                      />
                    ) : (
                      <Text style={styles.itemQuantity}>{item.quantity || item.qty || 1}</Text>
                    )}
                  </View>
                  
                  <View style={{ flex: 1.5, alignItems: 'flex-end' }}>
                    {isEditing ? (
                      <TextInput
                        style={styles.priceInput}
                        value={String(item.unit_price || item.cost || 0)}
                        onChangeText={(text) => updateItem(index, 'unit_price', parseFloat(text) || 0)}
                        keyboardType="numeric"
                      />
                    ) : (
                      <Text style={styles.itemPrice}>{formatCurrency(item.unit_price || item.cost || 0)}</Text>
                    )}
                  </View>
                  
                  <View style={{ flex: 1.5, alignItems: 'flex-end' }}>
                    <Text style={styles.itemTotal}>
                      {formatCurrency(item.total || ((item.unit_price || item.cost || 0) * (item.quantity || item.qty || 1)))}
                    </Text>
                  </View>

                  {isEditing && (
                    <View style={{ flex: 0.5, alignItems: 'center' }}>
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => deleteItem(index)}
                      >
                        <Trash2 size={16} color="#DC3545" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))}

              {/* Totals */}
              <View style={styles.totalsContainer}>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Subtotal:</Text>
                  <Text style={styles.totalValue}>{formatCurrency(quote.subtotal || 0)}</Text>
                </View>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>GST (10%):</Text>
                  <Text style={styles.totalValue}>{formatCurrency(quote.gst_amount || 0)}</Text>
                </View>
                <View style={styles.finalTotalRow}>
                  <Text style={styles.finalTotalLabel}>Total:</Text>
                  <Text style={styles.finalTotalValue}>{formatCurrency(quote.total || 0)}</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Business Information Card */}
        {businessProfile && (
          <View style={styles.collapsibleCard}>
            <TouchableOpacity 
              style={styles.cardHeader}
              onPress={() => setBusinessInfoExpanded(!businessInfoExpanded)}
            >
              <View style={styles.cardHeaderLeft}>
                <FileText size={20} color="#F6A623" />
                <Text style={styles.cardTitle}>Business Information</Text>
              </View>
              {businessInfoExpanded ? (
                <ChevronUp size={20} color="#666" />
              ) : (
                <ChevronDown size={20} color="#666" />
              )}
            </TouchableOpacity>
            
            {businessInfoExpanded && (
              <View style={styles.cardContent}>
                <View style={styles.businessInfo}>
                  <View style={styles.businessLogo}>
                    <Text style={styles.businessLogoText}>
                      {businessProfile.business_name?.charAt(0) || 'B'}
                    </Text>
                  </View>
                  <View style={styles.businessDetails}>
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
          </View>
        )}

        {/* Actions - Fixed spacing */}
        {isFinalized && (
          <View style={styles.actionsCard}>
            <Text style={styles.cardTitle}>Actions</Text>

            <View style={styles.actionsGrid}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.invoiceButton]}
                onPress={hasInvoice ? () => router.push(`/invoice-view/${quote.invoices![0].id}`) : createInvoice}
                disabled={creatingInvoice}
              >
                {creatingInvoice ? (
                  <ActivityIndicator size="small" color="#333" />
                ) : (
                  <Receipt size={20} color="#333" />
                )}
                <Text style={[styles.actionButtonText, { color: '#333' }]}>
                  {hasInvoice ? 'View Invoice' : 'Create Invoice'}
                </Text>
              </TouchableOpacity>

              {/* Resend Quote Button */}
              {canResend && (
                <TouchableOpacity 
                  style={[styles.actionButton, styles.resendButton]}
                  onPress={sendQuote}
                  disabled={sending}
                >
                  {sending ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <RefreshCw size={20} color="#FFFFFF" />
                  )}
                  <Text style={styles.actionButtonText}>
                    {sending ? 'Resending...' : 'Resend Quote'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Payment Details Toggle */}
            <View style={styles.paymentToggle}>
              <View style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>💰 Add Payment Details to Quote</Text>
                <Switch
                  value={showPaymentDetails}
                  onValueChange={setShowPaymentDetails}
                  trackColor={{ false: '#E9ECEF', true: '#F6A623' }}
                  thumbColor="#FFFFFF"
                />
              </View>
              
              {showPaymentDetails && businessProfile && (
                <View style={styles.paymentDetails}>
                  <Text style={styles.paymentTitle}>Bank Details</Text>
                  {businessProfile.bank_name && (
                    <Text style={styles.paymentDetail}>Bank: {businessProfile.bank_name}</Text>
                  )}
                  {businessProfile.bsb && (
                    <Text style={styles.paymentDetail}>BSB: {businessProfile.bsb}</Text>
                  )}
                  {businessProfile.account_number && (
                    <Text style={styles.paymentDetail}>Account: {businessProfile.account_number}</Text>
                  )}
                  {businessProfile.account_name && (
                    <Text style={styles.paymentDetail}>Name: {businessProfile.account_name}</Text>
                  )}
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Floating Send Button */}
      {showFloatingButton && (
        <Animated.View style={styles.floatingButtonContainer}>
          <TouchableOpacity 
            style={[styles.floatingSendButton, sending && styles.sendButtonDisabled]} 
            onPress={sendQuote}
            disabled={sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Send size={20} color="#FFFFFF" />
            )}
            <Text style={styles.floatingSendButtonText}>
              {sending ? 'SENDING...' : 'SEND QUOTE'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Bottom Action for non-floating state */}
      {!isFinalized && !isEditing && !showFloatingButton && (
        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.sendButton, sending && styles.sendButtonDisabled]} 
            onPress={sendQuote}
            disabled={sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Send size={20} color="#FFFFFF" />
            )}
            <Text style={styles.sendButtonText}>
              {sending ? 'SENDING...' : 'SEND QUOTE'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Downpayment Modal */}
      <Modal
        visible={downpaymentModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setDownpaymentModalVisible(false)}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Downpayment Options</Text>
            <TouchableOpacity onPress={() => setDownpaymentModalVisible(false)}>
              <Text style={styles.saveButton}>Done</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>Request downpayment from client</Text>
              <Switch
                value={downpaymentRequested}
                onValueChange={setDownpaymentRequested}
                trackColor={{ false: '#E9ECEF', true: '#F6A623' }}
                thumbColor="#FFFFFF"
              />
            </View>
            
            {downpaymentRequested && (
              <View style={styles.downpaymentDetails}>
                <View style={styles.percentageContainer}>
                  <Text style={styles.inputLabel}>Percentage of total</Text>
                  <View style={styles.percentageInputContainer}>
                    <TextInput
                      style={styles.percentageInput}
                      value={downpaymentPercentage}
                      onChangeText={setDownpaymentPercentage}
                      keyboardType="numeric"
                      placeholder="30"
                    />
                    <Text style={styles.percentageSymbol}>%</Text>
                  </View>
                </View>
                
                <View style={styles.amountContainer}>
                  <Text style={styles.inputLabel}>Downpayment amount</Text>
                  <Text style={styles.downpaymentAmountDisplay}>
                    ${downpaymentAmount}
                  </Text>
                </View>
                
                <Text style={styles.downpaymentNote}>
                  The client will be invoiced for this amount upon quote approval.
                </Text>
              </View>
            )}
          </View>
        </SafeAreaView>
      </Modal>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  editButtonText: {
    color: '#F6A623',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  clientSection: {
    marginBottom: 20,
  },
  clientName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  clientEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 2,
  },
  clientPhone: {
    fontSize: 16,
    color: '#666',
  },
  priceSection: {
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  totalAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#F6A623',
    marginBottom: 4,
  },
  totalLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  timelineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  timelineTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  timeline: {
    paddingLeft: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  timelineIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  timelineContent: {
    flex: 1,
  },
  timelineLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  timelineDate: {
    fontSize: 14,
    color: '#666',
  },
  timelineConnector: {
    width: 2,
    height: 20,
    marginLeft: 15,
    marginBottom: 8,
  },
  collapsibleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FAFBFC',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 12,
  },
  cardContent: {
    padding: 20,
  },
  jobTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  jobDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  descriptionInput: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#333',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  addItemButton: {
    marginLeft: 'auto',
    marginRight: 12,
    padding: 8,
    backgroundColor: '#FFF5E6',
    borderRadius: 6,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#E9ECEF',
    marginBottom: 8,
  },
  tableHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
    alignItems: 'center',
  },
  itemInput: {
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 14,
    marginBottom: 8,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  typeOption: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  typeOptionSelected: {
    backgroundColor: '#F6A623',
    borderColor: '#F6A623',
  },
  typeOptionText: {
    fontSize: 11,
    color: '#666',
    textTransform: 'capitalize',
  },
  typeOptionTextSelected: {
    color: '#FFFFFF',
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
  quantityInput: {
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 14,
    textAlign: 'center',
    width: 60,
  },
  itemQuantity: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  priceInput: {
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 14,
    textAlign: 'right',
    width: 80,
  },
  itemPrice: {
    fontSize: 16,
    color: '#333',
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  deleteButton: {
    padding: 4,
  },
  totalsContainer: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
    marginTop: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 16,
    color: '#666',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  finalTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  finalTotalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  finalTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F6A623',
  },
  businessInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  businessLogo: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#F6A623',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  businessLogoText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  businessDetails: {
    flex: 1,
  },
  businessName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  businessDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  actionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  actionsGrid: {
    gap: 16,
    marginBottom: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    minHeight: 56,
  },
  invoiceButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#DA8F1D',
  },
  resendButton: {
    backgroundColor: '#17A2B8',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    color: '#FFFFFF',
  },
  paymentToggle: {
    marginTop: 8,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  paymentDetails: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 16,
    marginTop: 12,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  paymentDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  floatingButtonContainer: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
  },
  floatingSendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F6A623',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingSendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  footer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F6A623',
    paddingVertical: 16,
    borderRadius: 8,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
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
  modalContent: {
    padding: 20,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  downpaymentDetails: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 16,
  },
  percentageContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  percentageInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    paddingHorizontal: 12,
  },
  percentageInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  percentageSymbol: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
  },
  amountContainer: {
    marginBottom: 12,
  },
  downpaymentAmountDisplay: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F6A623',
  },
  downpaymentNote: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
});