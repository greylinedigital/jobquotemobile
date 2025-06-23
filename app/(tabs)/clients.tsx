import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  SafeAreaView,
  TextInput,
  Alert,
  Modal,
  Animated,
  PanResponder,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Plus, Search, CreditCard as Edit, Zap, Trash2, ChevronRight, MoveVertical as MoreVertical } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { Client } from '@/types/database';

const { width: screenWidth } = Dimensions.get('window');
const SWIPE_THRESHOLD = screenWidth * 0.25;

interface SwipeableClientCardProps {
  client: Client;
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
  onNewQuote: (client: Client) => void;
}

const SwipeableClientCard: React.FC<SwipeableClientCardProps> = ({
  client,
  onEdit,
  onDelete,
  onNewQuote,
}) => {
  const translateX = new Animated.Value(0);
  const [isSwipedLeft, setIsSwipedLeft] = useState(false);

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => {
      return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 10;
    },
    onPanResponderMove: (_, gestureState) => {
      if (gestureState.dx < 0) {
        translateX.setValue(Math.max(gestureState.dx, -120));
      }
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dx < -SWIPE_THRESHOLD) {
        // Swipe left - show delete action
        Animated.spring(translateX, {
          toValue: -120,
          useNativeDriver: true,
        }).start();
        setIsSwipedLeft(true);
      } else {
        // Snap back
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
        setIsSwipedLeft(false);
      }
    },
  });

  const resetSwipe = () => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
    }).start();
    setIsSwipedLeft(false);
  };

  const getInitials = (name: string) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getAvatarColor = (name: string) => {
    if (!name) return '#F6A623';
    const colors = [
      '#F6A623', '#E74C3C', '#3498DB', '#2ECC71', '#9B59B6',
      '#F39C12', '#1ABC9C', '#34495E', '#E67E22', '#8E44AD'
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const avatarColor = getAvatarColor(client.name || '');

  return (
    <View style={styles.swipeContainer}>
      {/* Delete Action (behind the card) */}
      <View style={styles.deleteActionContainer}>
        <TouchableOpacity
          style={styles.deleteAction}
          onPress={() => {
            resetSwipe();
            onDelete(client);
          }}
        >
          <Trash2 size={24} color="#FFFFFF" />
          <Text style={styles.deleteActionText}>Delete</Text>
        </TouchableOpacity>
      </View>

      {/* Main Card */}
      <Animated.View
        style={[
          styles.clientCard,
          {
            transform: [{ translateX }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        {/* Tap to edit the entire card */}
        <TouchableOpacity
          style={styles.clientCardContent}
          onPress={() => onEdit(client)}
          activeOpacity={0.7}
        >
          <View style={styles.clientHeader}>
            <View style={[
              styles.clientAvatar, 
              { 
                backgroundColor: avatarColor,
                borderColor: `${avatarColor}20`,
              }
            ]}>
              <Text style={styles.clientInitials}>{getInitials(client.name || '')}</Text>
            </View>
            
            <View style={styles.clientInfo}>
              <Text style={styles.clientName}>{client.name || 'Unnamed Client'}</Text>
              <Text style={styles.clientEmail}>{client.email || 'No email'}</Text>
              {client.phone && <Text style={styles.clientPhone}>{client.phone}</Text>}
            </View>
            
            {/* Orange circle with lightning bolt for fast quote */}
            <TouchableOpacity
              style={styles.fastQuoteButton}
              onPress={(e) => {
                e.stopPropagation(); // Prevent triggering the card tap
                onNewQuote(client);
              }}
              activeOpacity={0.8}
            >
              <Zap size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

export default function ClientsTab() {
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    // Filter clients based on search query
    if (searchQuery.trim() === '') {
      setFilteredClients(clients);
    } else {
      const query = searchQuery.toLowerCase().trim();
      const filtered = clients.filter(client => {
        const name = (client.name || '').toLowerCase();
        const email = (client.email || '').toLowerCase();
        const phone = (client.phone || '').toLowerCase();
        
        return name.includes(query) || 
               email.includes(query) || 
               phone.includes(query);
      });
      setFilteredClients(filtered);
    }
  }, [searchQuery, clients]);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching clients:', error);
        Alert.alert('Error', 'Failed to load clients. Please try again.');
      } else {
        setClients(data || []);
      }
    } catch (error) {
      console.error('Unexpected error fetching clients:', error);
      Alert.alert('Error', 'An unexpected error occurred while loading clients.');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      setClientName(client.name || '');
      setClientEmail(client.email || '');
      setClientPhone(client.phone || '');
    } else {
      setEditingClient(null);
      setClientName('');
      setClientEmail('');
      setClientPhone('');
    }
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingClient(null);
    setClientName('');
    setClientEmail('');
    setClientPhone('');
    setSaving(false);
  };

  const saveClient = async () => {
    // Validation
    if (!clientName.trim()) {
      Alert.alert('Error', 'Client name is required');
      return;
    }

    if (!clientEmail.trim()) {
      Alert.alert('Error', 'Client email is required');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(clientEmail.trim())) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'You must be logged in to save clients');
        return;
      }

      const clientData = {
        name: clientName.trim(),
        email: clientEmail.trim().toLowerCase(),
        phone: clientPhone.trim() || null,
        updated_at: new Date().toISOString(),
      };

      if (editingClient) {
        // Update existing client
        const { error } = await supabase
          .from('clients')
          .update(clientData)
          .eq('id', editingClient.id);

        if (error) {
          console.error('Error updating client:', error);
          Alert.alert('Error', 'Failed to update client. Please try again.');
          return;
        }

        console.log('Client updated successfully');
      } else {
        // Create new client
        const { error } = await supabase
          .from('clients')
          .insert({
            user_id: user.id,
            ...clientData,
          });

        if (error) {
          console.error('Error creating client:', error);
          
          // Check for specific error types
          if (error.code === '23505') {
            Alert.alert('Error', 'A client with this email already exists');
          } else {
            Alert.alert('Error', 'Failed to create client. Please try again.');
          }
          return;
        }

        console.log('Client created successfully');
      }

      // Success - close modal and refresh list
      closeModal();
      await fetchClients();
      
      // Show success message
      Alert.alert(
        'Success', 
        editingClient ? 'Client updated successfully' : 'Client created successfully'
      );

    } catch (error) {
      console.error('Unexpected error saving client:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const deleteClient = async (client: Client) => {
    Alert.alert(
      'Delete Client',
      `Are you sure you want to delete ${client.name}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('clients')
                .delete()
                .eq('id', client.id);

              if (error) {
                console.error('Error deleting client:', error);
                Alert.alert('Error', 'Failed to delete client. Please try again.');
              } else {
                console.log('Client deleted successfully');
                await fetchClients();
                Alert.alert('Success', 'Client deleted successfully');
              }
            } catch (error) {
              console.error('Unexpected error deleting client:', error);
              Alert.alert('Error', 'An unexpected error occurred while deleting the client.');
            }
          },
        },
      ]
    );
  };

  const handleNewQuote = (client: Client) => {
    router.push(`/fast-quote?clientId=${client.id}`);
  };

  const handleEditClient = (client: Client) => {
    openModal(client);
  };

  const renderClient = ({ item }: { item: Client }) => (
    <SwipeableClientCard
      client={item}
      onEdit={handleEditClient}
      onDelete={deleteClient}
      onNewQuote={handleNewQuote}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Clients</Text>
        <Text style={styles.headerSubtitle}>
          Tap a client to edit, or use the ⚡ button for fast quotes.
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={[
          styles.searchInputContainer,
          searchFocused && styles.searchInputContainerFocused
        ]}>
          <Search size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search clients by name, email, or phone..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholderTextColor="#999"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity 
              onPress={() => setSearchQuery('')}
              style={styles.clearButton}
            >
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {searchQuery.length > 0 && (
        <View style={styles.searchResults}>
          <Text style={styles.searchResultsText}>
            {filteredClients.length} client{filteredClients.length !== 1 ? 's' : ''} found
          </Text>
        </View>
      )}

      {filteredClients.length === 0 && !loading ? (
        <View style={styles.emptyState}>
          {searchQuery.length > 0 ? (
            <>
              <Text style={styles.emptyTitle}>No Clients Found</Text>
              <Text style={styles.emptySubtitle}>
                No clients match "{searchQuery}". Try a different search term.
              </Text>
              <TouchableOpacity
                style={styles.clearSearchButton}
                onPress={() => setSearchQuery('')}
              >
                <Text style={styles.clearSearchButtonText}>Clear Search</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.emptyTitle}>No clients yet — get started by adding your first one!</Text>
              <Text style={styles.emptySubtitle}>
                Build your client base and start creating professional quotes
              </Text>
            </>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredClients}
          renderItem={renderClient}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContainer, { paddingBottom: 120 }]}
          refreshing={loading}
          onRefresh={fetchClients}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => openModal()}
      >
        <Plus size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Add/Edit Client Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeModal} disabled={saving}>
              <Text style={[styles.cancelButton, saving && styles.disabledButton]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingClient ? 'Edit Client' : 'New Client'}
            </Text>
            <TouchableOpacity 
              onPress={saveClient} 
              disabled={saving}
              style={[styles.saveHeaderButton, saving && styles.disabledButton]}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#F6A623" />
              ) : (
                <Text style={styles.saveHeaderButtonText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.modalForm}>
            <Text style={styles.inputLabel}>Name *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Client name"
              value={clientName}
              onChangeText={setClientName}
              placeholderTextColor="#999"
              autoFocus
              editable={!saving}
            />

            <Text style={styles.inputLabel}>Email *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="client@email.com"
              value={clientEmail}
              onChangeText={setClientEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#999"
              editable={!saving}
            />

            <Text style={styles.inputLabel}>Phone (Optional)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="+61 400 000 000"
              value={clientPhone}
              onChangeText={setClientPhone}
              keyboardType="phone-pad"
              placeholderTextColor="#999"
              editable={!saving}
            />

            {/* Save Button */}
            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={saveClient}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>
                  {editingClient ? 'Update Client' : 'Save Client'}
                </Text>
              )}
            </TouchableOpacity>
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
  header: {
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
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInputContainerFocused: {
    borderColor: '#F6A623',
    shadowOpacity: 0.1,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    padding: 8,
    marginLeft: 8,
  },
  clearButtonText: {
    color: '#999',
    fontSize: 16,
    fontWeight: 'bold',
  },
  searchResults: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  searchResultsText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  listContainer: {
    padding: 20,
  },
  swipeContainer: {
    marginBottom: 12,
    position: 'relative',
  },
  deleteActionContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 120,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  deleteAction: {
    backgroundColor: '#DC3545',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  deleteActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  clientCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    zIndex: 2,
  },
  clientCardContent: {
    padding: 20,
  },
  clientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clientAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 2,
  },
  clientInitials: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  clientEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  clientPhone: {
    fontSize: 14,
    color: '#666',
  },
  fastQuoteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F6A623',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#F6A623',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F6A623',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  clearSearchButton: {
    backgroundColor: '#F6A623',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  clearSearchButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
  saveHeaderButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 60,
    alignItems: 'center',
  },
  saveHeaderButtonText: {
    fontSize: 16,
    color: '#F6A623',
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
  modalForm: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 16,
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
  },
  saveButton: {
    backgroundColor: '#F6A623',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 32,
    shadowColor: '#F6A623',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  saveButtonDisabled: {
    opacity: 0.6,
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});