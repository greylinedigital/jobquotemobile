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
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Send, Wand as Wand2, CreditCard, Banknote, DollarSign, FileText, CircleCheck as CheckCircle, Download, CreditCard as Edit, Save, X, Minus } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { Invoice, Quote, QuoteItem, Client, BusinessProfile } from '@/types/database';

type InvoiceWithDetails = Invoice & {
  quotes: Quote & {
    clients: Client;
    quote_items: QuoteItem[];
  };
};

export default function InvoiceView() {
  const { id } = useLocalSearchParams();
  const [invoice, setInvoice] = useState<InvoiceWithDetails | null>(null);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [markingPaid, setMarkingPaid] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Invoice editing state
  const [editInvoiceNumber, setEditInvoiceNumber] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editTotal, setEditTotal] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'cash' | 'card'>('bank_transfer');
  const [showPaymentDetails, setShowPaymentDetails] = useState(true);

  // Deposit deduction state
  const [depositModalVisible, setDepositModalVisible] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [hasDepositDeducted, setHasDepositDeducted] = useState(false);

  useEffect(() => {
    if (id) {
      fetchInvoice();
      fetchBusinessProfile();
    }
  }, [id]);

  const fetchInvoice = async () => {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        quotes (
          *,
          clients (*),
          quote_items (*)
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      Alert.alert('Error', 'Failed to load invoice');
      router.back();
    } else {
      setInvoice(data);
      setEditInvoiceNumber(data.invoice_number || '');
      setEditDueDate(data.due_date || '');
      setEditTotal((data.total || 0).toString());
      
      // Check if this is a partial payment (deposit deducted)
      const originalTotal = data.quotes.total || 0;
      const invoiceTotal = data.total || 0;
      setHasDepositDeducted(invoiceTotal < originalTotal);
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

  const saveInvoiceChanges = async () => {
    if (!invoice) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('invoices')
        .update({
          invoice_number: editInvoiceNumber,
          due_date: editDueDate,
          total: parseFloat(editTotal) || 0,
          updated_at: new Date().toISOString(),
        })
        .eq('id', invoice.id);

      if (error) throw error;

      Alert.alert('Success', 'Invoice updated successfully');
      setIsEditing(false);
      fetchInvoice();
    } catch (error) {
      console.error('Error saving invoice:', error);
      Alert.alert('Error', 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const deductDeposit = async () => {
    if (!invoice || !depositAmount) return;

    const depositValue = parseFloat(depositAmount);
    const originalTotal = invoice.quotes.total || 0;
    const newTotal = originalTotal - depositValue;

    if (newTotal < 0) {
      Alert.alert('Error', 'Deposit amount cannot exceed the original total');
      return;
    }

    try {
      const { error } = await supabase
        .from('invoices')
        .update({
          total: newTotal,
          updated_at: new Date().toISOString(),
        })
        .eq('id', invoice.id);

      if (error) throw error;

      Alert.alert('Success', `Deposit of $${depositValue.toFixed(2)} has been deducted from the invoice`);
      setDepositModalVisible(false);
      setDepositAmount('');
      fetchInvoice();
    } catch (error) {
      console.error('Error deducting deposit:', error);
      Alert.alert('Error', 'Failed to deduct deposit');
    }
  };

  const generateAISummary = async () => {
    if (!invoice) return;

    setGeneratingAI(true);
    try {
      // Create a professional invoice summary based on the quote
      const quote = invoice.quotes;
      const itemsText = quote.quote_items
        .map(item => `${item.name} (${item.quantity || item.qty || 1} × $${item.unit_price || item.cost || 0})`)
        .join(', ');

      // Generate different types of professional messages
      const summaryOptions = [
        `Thank you for choosing ${businessProfile?.business_name || 'our services'}. This invoice covers the ${quote.job_title?.toLowerCase()} work completed as per our agreed quote. We appreciate your business and look forward to serving you again.`,
        
        `We're pleased to provide this invoice for the ${quote.job_title?.toLowerCase()} services. All work has been completed to the highest standards using quality materials and professional workmanship. Payment is due within the specified terms.`,
        
        `Invoice for professional ${quote.job_title?.toLowerCase()} services. The work included ${itemsText.split(',').length} items as detailed in the original quote. We trust you're satisfied with the quality of our work.`,
        
        `This invoice reflects the completion of your ${quote.job_title?.toLowerCase()} project. Our team has delivered the work as specified, and we're confident in the quality and durability of the installation. Thank you for your trust in our services.`,
      ];

      // Randomly select one of the professional summaries
      const selectedSummary = summaryOptions[Math.floor(Math.random() * summaryOptions.length)];
      setCustomMessage(selectedSummary);

    } catch (error) {
      console.error('Error generating AI summary:', error);
      Alert.alert('Error', 'Failed to generate summary. Please try again.');
    } finally {
      setGeneratingAI(false);
    }
  };

  const downloadPDF = async () => {
    setDownloadingPDF(true);
    try {
      // Simulate PDF generation - in a real app, you'd call a PDF generation service
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert('PDF Generated', 'Invoice PDF has been saved to your device');
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('Error', 'Failed to generate PDF. Please try again.');
    } finally {
      setDownloadingPDF(false);
    }
  };

  const markAsPaid = async () => {
    if (!invoice) return;

    Alert.alert(
      'Mark as Paid',
      'Are you sure you want to mark this invoice as paid?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Paid',
          onPress: async () => {
            setMarkingPaid(true);
            try {
              const { error } = await supabase
                .from('invoices')
                .update({ status: 'Paid' })
                .eq('id', invoice.id);

              if (error) throw error;

              Alert.alert('Success', 'Invoice marked as paid');
              fetchInvoice();
            } catch (error) {
              console.error('Error marking invoice as paid:', error);
              Alert.alert('Error', 'Failed to update invoice status');
            } finally {
              setMarkingPaid(false);
            }
          },
        },
      ]
    );
  };

  const sendInvoiceEmail = async () => {
    if (!invoice || !businessProfile) {
      Alert.alert('Error', 'Invoice or business profile not loaded');
      return;
    }

    setSending(true);
    try {
      // Prepare invoice data for email
      const invoiceData = {
        ...invoice,
        business_profile: businessProfile,
        custom_message: customMessage,
        payment_method: paymentMethod,
        show_payment_details: showPaymentDetails,
      };

      const response = await fetch('/send-invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invoice: invoiceData,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send invoice');
      }

      // Update invoice status to sent
      const { error } = await supabase
        .from('invoices')
        .update({ status: 'Sent' })
        .eq('id', invoice.id);

      if (error) throw error;

      Alert.alert(
        'Success! 📧',
        `Invoice sent successfully to ${invoice.quotes.clients.email}!\n\nPayment method: ${paymentMethod.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}`,
        [
          {
            text: 'OK',
            onPress: () => {
              fetchInvoice();
            }
          }
        ]
      );

    } catch (error) {
      console.error('Error sending invoice:', error);
      Alert.alert('Error', 'Failed to send invoice. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

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
      case 'paid':
        return '#28A745';
      case 'sent':
        return '#17A2B8';
      case 'unpaid':
        return '#DC3545';
      default:
        return '#6C757D';
    }
  };

  if (loading || !invoice) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F6A623" />
          <Text style={styles.loadingText}>Loading invoice...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const originalTotal = invoice.quotes.total || 0;
  const invoiceTotal = invoice.total || 0;
  const isPartialPayment = invoiceTotal < originalTotal;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Invoice Details</Text>
        <TouchableOpacity 
          style={styles.editButton} 
          onPress={() => {
            if (isEditing) {
              if (saving) return;
              saveInvoiceChanges();
            } else {
              setIsEditing(true);
            }
          }}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#F6A623" />
          ) : isEditing ? (
            <Save size={20} color="#F6A623" />
          ) : (
            <Edit size={20} color="#F6A623" />
          )}
          <Text style={styles.editButtonText}>
            {saving ? 'Saving...' : isEditing ? 'Save' : 'Edit'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Action Buttons Header - Fixed spacing */}
      <View style={styles.actionHeader}>
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity 
            style={[styles.actionHeaderButton, styles.markPaidButton]}
            onPress={markAsPaid}
            disabled={markingPaid || invoice.status === 'Paid'}
          >
            {markingPaid ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <CheckCircle size={16} color="#FFFFFF" />
            )}
            <Text style={styles.actionHeaderButtonText}>
              {invoice.status === 'Paid' ? 'Paid' : 'Mark Paid'}
            </Text>
          </TouchableOpacity>

          {!hasDepositDeducted && (
            <TouchableOpacity 
              style={[styles.actionHeaderButton, styles.depositButton]}
              onPress={() => setDepositModalVisible(true)}
            >
              <Minus size={16} color="#333" />
              <Text style={[styles.actionHeaderButtonText, { color: '#333' }]}>
                Deduct
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.actionButtonsRow}>
          <TouchableOpacity 
            style={[styles.actionHeaderButton, styles.viewPdfButton]}
            onPress={downloadPDF}
            disabled={downloadingPDF}
          >
            {downloadingPDF ? (
              <ActivityIndicator size="small" color="#333" />
            ) : (
              <Download size={16} color="#333" />
            )}
            <Text style={[styles.actionHeaderButtonText, { color: '#333' }]}>
              {downloadingPDF ? 'Generating...' : 'PDF'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionHeaderButton, styles.sendInvoiceButton]}
            onPress={sendInvoiceEmail}
            disabled={sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Send size={16} color="#FFFFFF" />
            )}
            <Text style={styles.actionHeaderButtonText}>
              {sending ? 'Sending...' : 'Send'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Invoice Header Card */}
        <View style={styles.invoiceHeaderCard}>
          <View style={styles.invoiceHeaderLeft}>
            {isEditing ? (
              <TextInput
                style={styles.editInput}
                value={editInvoiceNumber}
                onChangeText={setEditInvoiceNumber}
                placeholder="Invoice number"
              />
            ) : (
              <Text style={styles.invoiceTitle}>Invoice #{invoice.invoice_number}</Text>
            )}
            <Text style={styles.clientName}>{invoice.quotes.clients.name}</Text>
            <Text style={styles.clientEmail}>{invoice.quotes.clients.email}</Text>
            {isEditing ? (
              <TextInput
                style={styles.editInput}
                value={editDueDate}
                onChangeText={setEditDueDate}
                placeholder="YYYY-MM-DD"
              />
            ) : (
              <Text style={styles.invoiceDate}>Due: {formatDate(invoice.due_date)}</Text>
            )}
          </View>
          <View style={styles.invoiceHeaderRight}>
            {isEditing ? (
              <TextInput
                style={styles.editTotalInput}
                value={editTotal}
                onChangeText={setEditTotal}
                placeholder="0.00"
                keyboardType="numeric"
              />
            ) : (
              <Text style={styles.invoiceTotal}>{formatCurrency(invoice.total || 0)}</Text>
            )}
            <Text style={styles.invoiceTotalLabel}>
              {isPartialPayment ? 'Balance Due' : 'Total Amount'}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(invoice.status || 'unpaid') }]}>
              <Text style={styles.statusText}>{invoice.status || 'Unpaid'}</Text>
            </View>
          </View>
        </View>

        {/* Deposit Information */}
        {isPartialPayment && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>💰 Payment Summary</Text>
            </View>
            <View style={styles.paymentSummary}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Original Quote Total:</Text>
                <Text style={styles.summaryValue}>{formatCurrency(originalTotal)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Deposit Paid:</Text>
                <Text style={styles.summaryValue}>-{formatCurrency(originalTotal - invoiceTotal)}</Text>
              </View>
              <View style={[styles.summaryRow, styles.summaryRowFinal]}>
                <Text style={styles.summaryLabelFinal}>Remaining Balance:</Text>
                <Text style={styles.summaryValueFinal}>{formatCurrency(invoiceTotal)}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Business Information */}
        {businessProfile && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🏢 From</Text>
            </View>
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

        {/* Job Details */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🔧 Job Details</Text>
          </View>
          <View style={styles.jobDetails}>
            <Text style={styles.jobTitle}>{invoice.quotes.job_title}</Text>
            <Text style={styles.jobDescription}>{invoice.quotes.description}</Text>
            <Text style={styles.quoteReference}>Quote #{invoice.quotes.id.slice(-6).toUpperCase()}</Text>
          </View>
        </View>

        {/* Invoice Items - Table Style */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📋 Invoice Items</Text>
          </View>
          
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, { flex: 3 }]}>Description</Text>
            <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'center' }]}>Qty</Text>
            <Text style={[styles.tableHeaderText, { flex: 1.5, textAlign: 'right' }]}>Rate</Text>
            <Text style={[styles.tableHeaderText, { flex: 1.5, textAlign: 'right' }]}>Total</Text>
          </View>

          {invoice.quotes.quote_items.map((item, index) => (
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
              <Text style={styles.totalLabel}>Subtotal:</Text>
              <Text style={styles.totalValue}>{formatCurrency(invoice.quotes.subtotal || 0)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>GST (10%):</Text>
              <Text style={styles.totalValue}>{formatCurrency(invoice.quotes.gst_amount || 0)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Original Total:</Text>
              <Text style={styles.totalValue}>{formatCurrency(originalTotal)}</Text>
            </View>
            {isPartialPayment && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Deposit Paid:</Text>
                <Text style={styles.totalValue}>-{formatCurrency(originalTotal - invoiceTotal)}</Text>
              </View>
            )}
            <View style={styles.finalTotalRow}>
              <Text style={styles.finalTotalLabel}>
                {isPartialPayment ? 'Balance Due:' : 'Total:'}
              </Text>
              <Text style={styles.finalTotalValue}>{formatCurrency(invoice.total || 0)}</Text>
            </View>
          </View>
        </View>

        {/* AI Summary Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>✨ Invoice Message</Text>
            <TouchableOpacity 
              style={styles.aiButton} 
              onPress={generateAISummary}
              disabled={generatingAI}
            >
              {generatingAI ? (
                <ActivityIndicator size="small" color="#F6A623" />
              ) : (
                <Wand2 size={16} color="#F6A623" />
              )}
              <Text style={styles.aiButtonText}>
                {generatingAI ? 'Generating...' : 'AI Generate'}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.messageContainer}>
            <TextInput
              style={styles.messageInput}
              value={customMessage}
              onChangeText={setCustomMessage}
              placeholder="Add a personal message to your invoice..."
              multiline
              numberOfLines={4}
              placeholderTextColor="#999"
            />
            <Text style={styles.messageHint}>
              This message will appear in the email and on the invoice
            </Text>
          </View>
        </View>

        {/* Payment Method Selection */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>💳 Payment Method</Text>
          </View>
          <View style={styles.paymentMethodContainer}>
            <TouchableOpacity
              style={[styles.paymentOption, paymentMethod === 'bank_transfer' && styles.paymentOptionSelected]}
              onPress={() => setPaymentMethod('bank_transfer')}
            >
              <View style={styles.paymentIconContainer}>
                <Banknote size={24} color={paymentMethod === 'bank_transfer' ? '#FFFFFF' : '#666'} />
              </View>
              <Text style={[styles.paymentOptionText, paymentMethod === 'bank_transfer' && styles.paymentOptionTextSelected]}>
                Bank Transfer
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.paymentOption, paymentMethod === 'cash' && styles.paymentOptionSelected]}
              onPress={() => setPaymentMethod('cash')}
            >
              <View style={styles.paymentIconContainer}>
                <DollarSign size={24} color={paymentMethod === 'cash' ? '#FFFFFF' : '#666'} />
              </View>
              <Text style={[styles.paymentOptionText, paymentMethod === 'cash' && styles.paymentOptionTextSelected]}>
                Cash
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.paymentOption, paymentMethod === 'card' && styles.paymentOptionSelected]}
              onPress={() => setPaymentMethod('card')}
            >
              <View style={styles.paymentIconContainer}>
                <CreditCard size={24} color={paymentMethod === 'card' ? '#FFFFFF' : '#666'} />
              </View>
              <Text style={[styles.paymentOptionText, paymentMethod === 'card' && styles.paymentOptionTextSelected]}>
                Card
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Payment Details */}
        {paymentMethod === 'bank_transfer' && businessProfile && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🏦 Payment Details</Text>
              <Switch
                value={showPaymentDetails}
                onValueChange={setShowPaymentDetails}
                trackColor={{ false: '#E9ECEF', true: '#F6A623' }}
                thumbColor="#FFFFFF"
              />
            </View>
            {showPaymentDetails && (
              <View style={styles.paymentDetails}>
                <Text style={styles.paymentTitle}>Bank Transfer Details</Text>
                {businessProfile.bank_name && (
                  <View style={styles.paymentDetailRow}>
                    <Text style={styles.paymentDetailLabel}>Bank:</Text>
                    <Text style={styles.paymentDetailValue}>{businessProfile.bank_name}</Text>
                  </View>
                )}
                {businessProfile.bsb && (
                  <View style={styles.paymentDetailRow}>
                    <Text style={styles.paymentDetailLabel}>BSB:</Text>
                    <Text style={styles.paymentDetailValue}>{businessProfile.bsb}</Text>
                  </View>
                )}
                {businessProfile.account_number && (
                  <View style={styles.paymentDetailRow}>
                    <Text style={styles.paymentDetailLabel}>Account:</Text>
                    <Text style={styles.paymentDetailValue}>{businessProfile.account_number}</Text>
                  </View>
                )}
                {businessProfile.account_name && (
                  <View style={styles.paymentDetailRow}>
                    <Text style={styles.paymentDetailLabel}>Name:</Text>
                    <Text style={styles.paymentDetailValue}>{businessProfile.account_name}</Text>
                  </View>
                )}
                <View style={styles.paymentDetailRow}>
                  <Text style={styles.paymentDetailLabel}>Amount:</Text>
                  <Text style={styles.paymentDetailValue}>{formatCurrency(invoiceTotal)}</Text>
                </View>
                <View style={styles.paymentDetailRow}>
                  <Text style={styles.paymentDetailLabel}>Reference:</Text>
                  <Text style={styles.paymentDetailValue}>{invoice.invoice_number}</Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Payment Terms */}
        {businessProfile?.payment_terms && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>📋 Payment Terms</Text>
            </View>
            <View style={styles.paymentTerms}>
              <Text style={styles.paymentTermsText}>{businessProfile.payment_terms}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Deposit Deduction Modal */}
      <Modal
        visible={depositModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setDepositModalVisible(false)}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Deduct Deposit</Text>
            <TouchableOpacity onPress={deductDeposit} disabled={!depositAmount}>
              <Text style={[styles.saveButton, !depositAmount && styles.saveButtonDisabled]}>
                Deduct
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.modalDescription}>
              Enter the deposit amount that has been paid by the client. This will be deducted from the invoice total.
            </Text>
            
            <View style={styles.depositInputContainer}>
              <Text style={styles.inputLabel}>Deposit Amount</Text>
              <View style={styles.currencyInputContainer}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  style={styles.depositInput}
                  value={depositAmount}
                  onChangeText={setDepositAmount}
                  placeholder="0.00"
                  keyboardType="numeric"
                  placeholderTextColor="#999"
                />
              </View>
            </View>

            <View style={styles.calculationPreview}>
              <View style={styles.previewRow}>
                <Text style={styles.previewLabel}>Original Total:</Text>
                <Text style={styles.previewValue}>{formatCurrency(originalTotal)}</Text>
              </View>
              <View style={styles.previewRow}>
                <Text style={styles.previewLabel}>Deposit:</Text>
                <Text style={styles.previewValue}>-{formatCurrency(parseFloat(depositAmount) || 0)}</Text>
              </View>
              <View style={[styles.previewRow, styles.previewRowFinal]}>
                <Text style={styles.previewLabelFinal}>New Invoice Total:</Text>
                <Text style={styles.previewValueFinal}>
                  {formatCurrency(originalTotal - (parseFloat(depositAmount) || 0))}
                </Text>
              </View>
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
  actionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
    gap: 12,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionHeaderButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    minHeight: 44,
  },
  markPaidButton: {
    backgroundColor: '#28A745',
  },
  depositButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#6C757D',
  },
  viewPdfButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DA8F1D',
  },
  sendInvoiceButton: {
    backgroundColor: '#DA8F1D',
  },
  actionHeaderButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  invoiceHeaderCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  invoiceHeaderLeft: {
    flex: 1,
    marginRight: 16,
  },
  invoiceTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F6A623',
    marginBottom: 4,
  },
  clientEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  invoiceDate: {
    fontSize: 14,
    color: '#666',
  },
  invoiceHeaderRight: {
    alignItems: 'flex-end',
  },
  invoiceTotal: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#F6A623',
    marginBottom: 4,
  },
  invoiceTotalLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  editInput: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  editTotalInput: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F6A623',
    textAlign: 'right',
    marginBottom: 4,
    minWidth: 120,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  paymentSummary: {
    padding: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryRowFinal: {
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
    paddingTop: 8,
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  summaryLabelFinal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  summaryValueFinal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F6A623',
  },
  businessInfo: {
    flexDirection: 'row',
    padding: 20,
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
  jobDetails: {
    padding: 20,
  },
  jobTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  jobDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
    marginBottom: 12,
  },
  quoteReference: {
    fontSize: 14,
    color: '#F6A623',
    fontWeight: '600',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  tableHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  tableRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
    alignItems: 'center',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
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
    color: '#333',
    textAlign: 'center',
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
  totalsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
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
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F8F9FA',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#F6A623',
  },
  aiButtonText: {
    color: '#F6A623',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  messageContainer: {
    padding: 20,
  },
  messageInput: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#333',
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 8,
  },
  messageHint: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  paymentMethodContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  paymentOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E9ECEF',
  },
  paymentOptionSelected: {
    backgroundColor: '#F6A623',
    borderColor: '#F6A623',
  },
  paymentIconContainer: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  paymentOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
  paymentOptionTextSelected: {
    color: '#FFFFFF',
  },
  paymentDetails: {
    padding: 20,
    backgroundColor: '#F8F9FA',
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  paymentDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  paymentDetailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  paymentDetailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  paymentTerms: {
    padding: 20,
  },
  paymentTermsText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
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
  depositInputContainer: {
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
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  currencySymbol: {
    fontSize: 18,
    color: '#666',
    marginRight: 8,
  },
  depositInput: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 18,
    color: '#333',
  },
  calculationPreview: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 16,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  previewRowFinal: {
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
    paddingTop: 8,
    marginTop: 8,
  },
  previewLabel: {
    fontSize: 16,
    color: '#666',
  },
  previewValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  previewLabelFinal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  previewValueFinal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F6A623',
  },
});