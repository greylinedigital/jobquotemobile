import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  TextInput,
  SafeAreaView,
} from 'react-native';
import { ChevronDown, Search, X } from 'lucide-react-native';

const COUNTRIES = [
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
  { code: 'BE', name: 'Belgium', flag: '🇧🇪' },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭' },
  { code: 'AT', name: 'Austria', flag: '🇦🇹' },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪' },
  { code: 'NO', name: 'Norway', flag: '🇳🇴' },
  { code: 'DK', name: 'Denmark', flag: '🇩🇰' },
  { code: 'FI', name: 'Finland', flag: '🇫🇮' },
  { code: 'IE', name: 'Ireland', flag: '🇮🇪' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
  { code: 'HK', name: 'Hong Kong', flag: '🇭🇰' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'CN', name: 'China', flag: '🇨🇳' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
  { code: 'CL', name: 'Chile', flag: '🇨🇱' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬' },
  { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪' },
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦' },
  { code: 'IL', name: 'Israel', flag: '🇮🇱' },
  { code: 'TR', name: 'Turkey', flag: '🇹🇷' },
  { code: 'RU', name: 'Russia', flag: '🇷🇺' },
  { code: 'PL', name: 'Poland', flag: '🇵🇱' },
  { code: 'CZ', name: 'Czech Republic', flag: '🇨🇿' },
  { code: 'HU', name: 'Hungary', flag: '🇭🇺' },
  { code: 'GR', name: 'Greece', flag: '🇬🇷' },
  { code: 'RO', name: 'Romania', flag: '🇷🇴' },
  { code: 'BG', name: 'Bulgaria', flag: '🇧🇬' },
  { code: 'HR', name: 'Croatia', flag: '🇭🇷' },
  { code: 'SI', name: 'Slovenia', flag: '🇸🇮' },
  { code: 'SK', name: 'Slovakia', flag: '🇸🇰' },
  { code: 'LT', name: 'Lithuania', flag: '🇱🇹' },
  { code: 'LV', name: 'Latvia', flag: '🇱🇻' },
  { code: 'EE', name: 'Estonia', flag: '🇪🇪' },
  { code: 'IS', name: 'Iceland', flag: '🇮🇸' },
  { code: 'LU', name: 'Luxembourg', flag: '🇱🇺' },
  { code: 'MT', name: 'Malta', flag: '🇲🇹' },
  { code: 'CY', name: 'Cyprus', flag: '🇨🇾' },
];

interface CountryPickerProps {
  selectedCountry: string;
  onCountrySelect: (country: string) => void;
  placeholder?: string;
  style?: any;
}

export default function CountryPicker({
  selectedCountry,
  onCountrySelect,
  placeholder = 'Select Country',
  style,
}: CountryPickerProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedCountryData = COUNTRIES.find(c => c.name === selectedCountry);
  
  const filteredCountries = COUNTRIES.filter(country =>
    country.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCountrySelect = (country: typeof COUNTRIES[0]) => {
    onCountrySelect(country.name);
    setModalVisible(false);
    setSearchQuery('');
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.selector, style]}
        onPress={() => setModalVisible(true)}
      >
        <View style={styles.selectorContent}>
          {selectedCountryData ? (
            <>
              <Text style={styles.flag}>{selectedCountryData.flag}</Text>
              <Text style={styles.countryName}>{selectedCountryData.name}</Text>
            </>
          ) : (
            <Text style={styles.placeholder}>{placeholder}</Text>
          )}
        </View>
        <ChevronDown size={20} color="#666" />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => {
                setModalVisible(false);
                setSearchQuery('');
              }}
              style={styles.closeButton}
            >
              <X size={24} color="#666" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Country</Text>
            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <Search size={20} color="#999" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search countries..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#999"
              />
            </View>
          </View>

          <FlatList
            data={filteredCountries}
            keyExtractor={(item) => item.code}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.countryOption,
                  selectedCountry === item.name && styles.selectedCountryOption,
                ]}
                onPress={() => handleCountrySelect(item)}
              >
                <Text style={styles.countryFlag}>{item.flag}</Text>
                <Text
                  style={[
                    styles.countryOptionText,
                    selectedCountry === item.name && styles.selectedCountryText,
                  ]}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
            )}
            style={styles.countryList}
          />
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  selector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  selectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  flag: {
    fontSize: 20,
    marginRight: 12,
  },
  countryName: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  placeholder: {
    fontSize: 16,
    color: '#999',
    flex: 1,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  closeButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSpacer: {
    width: 32,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  countryList: {
    flex: 1,
  },
  countryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
  },
  selectedCountryOption: {
    backgroundColor: '#F6F8FF',
  },
  countryFlag: {
    fontSize: 20,
    marginRight: 16,
  },
  countryOptionText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  selectedCountryText: {
    color: '#F6A623',
    fontWeight: '600',
  },
});