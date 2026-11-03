import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'ManagerWorkerPayroll'>;
  route: { params: { workerId: string; workerName: string; events: any[]; dailyWage: number; bankAccount: string | null; telebirr: string | null } };
};

export default function ManagerWorkerPayrollScreen({ navigation, route }: Props) {
  const { workerName, events, dailyWage, bankAccount, telebirr } = route.params;
  
  // NEW: State for bulk selection
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const totalDays = events.reduce((sum, ev) => sum + ev.totalDaysWorked, 0);
  const totalAmount = totalDays * dailyWage;

  const toggleEventSelection = (eventId: string) => {
    setSelectedEventIds(prev => 
      prev.includes(eventId) ? prev.filter(id => id !== eventId) : [...prev, eventId]
    );
  };

  const handleBulkSettle = async () => {
    if (selectedEventIds.length === 0) return Alert.alert('Error', 'Please select at least one event to settle.');

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setIsUploading(true);
      try {
        await axios.put('https://magna-payments-api.onrender.com/api/finance/settle-wages-bulk', {
          eventIds: selectedEventIds,
          wageSettlementBase64: result.assets[0].base64
        });
        Alert.alert('Success', `Selected wages for ${workerName} have been settled.`);
        navigation.reset({ index: 0, routes: [{ name: 'Login' }, { name: 'ManagerPortal', params: { adminId: 'manager' } }] });
      } catch (error: any) {
        Alert.alert('Settlement Failed', error.response?.data?.error || 'Server error.');
      } finally {
        setIsUploading(false);
      }
    }
  };

  const renderEventCard = (event: any) => {
    const eventAmount = event.totalDaysWorked * dailyWage;
    const isSelected = selectedEventIds.includes(event.id);

    return (
      <TouchableOpacity 
        key={event.id}
        style={[styles.eventCard, isSelected && styles.eventCardSelected]} 
        onPress={() => {
          if (isBulkMode) toggleEventSelection(event.id);
          else {
            navigation.navigate('ManagerWageSettlement', { 
              eventId: event.id, eventName: event.eventName, workerName, 
              totalAmount: eventAmount, bankAccount, telebirr, 
              days: event.totalDaysWorked, wageRate: dailyWage 
            });
          }
        }}
      >
        {isBulkMode && (
          <View style={styles.checkbox}>
            {isSelected && <MaterialIcons name="check" size={16} color="#000" />}
          </View>
        )}
        
        <View style={styles.cardLeft}>
          <Text style={styles.eventName} numberOfLines={1}>{event.eventName}</Text>
          <Text style={styles.eventSub}>{event.totalDaysWorked} Days Logged</Text>
        </View>
        
        <View style={styles.cardRight}>
          <Text style={styles.eventAmount}>{eventAmount.toLocaleString()} Birr</Text>
          {!isBulkMode && (
            <View style={styles.payBtn}>
              <Text style={styles.payBtnText}>Settle</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back-ios" size={16} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerName}>Unpaid Payroll</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.workerName}>{workerName}</Text>
        <Text style={styles.summaryText}>{totalDays} Total Days @ {dailyWage} Birr/Day</Text>
        
        <View style={styles.balanceContainer}>
          <Text style={styles.balanceText}>{totalAmount.toLocaleString()}</Text>
          <Text style={styles.currencyText}>Birr Owed</Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.label}>PENDING WAGE SETTLEMENTS</Text>
          {/* NEW: Bulk Toggle Button */}
          <TouchableOpacity style={styles.toggleBulkBtn} onPress={() => { setIsBulkMode(!isBulkMode); setSelectedEventIds([]); }}>
            <Text style={styles.toggleBulkText}>{isBulkMode ? "Cancel Selection" : "Select Multiple"}</Text>
          </TouchableOpacity>
        </View>
        
        {events.map((ev) => renderEventCard(ev))}

        {/* NEW: Bulk Settle Execution Button */}
        {isBulkMode && selectedEventIds.length > 0 && (
          <TouchableOpacity style={styles.bulkSubmitBtn} onPress={handleBulkSettle} disabled={isUploading}>
            {isUploading ? <ActivityIndicator color="#000" /> : <Text style={styles.bulkSubmitBtnText}>Settle {selectedEventIds.length} Selected</Text>}
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 40, borderBottomWidth: 1, borderBottomColor: '#1A1A1A' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1A1A1A', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  headerName: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  scrollContent: { padding: 20, paddingBottom: 50 },
  workerName: { color: '#FFF', fontSize: 32, fontWeight: 'bold', marginBottom: 5 },
  summaryText: { color: '#888', fontSize: 14, marginBottom: 20 },
  balanceContainer: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 30, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#222' },
  balanceText: { color: '#FFF', fontSize: 44, fontWeight: 'bold' },
  currencyText: { color: '#CCFF00', fontSize: 16, marginLeft: 8, fontWeight: 'bold' },
  
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  label: { color: '#888', fontSize: 10, letterSpacing: 1.5, fontWeight: 'bold' },
  toggleBulkBtn: { backgroundColor: '#333', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  toggleBulkText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  
  eventCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1A1A1A', padding: 20, borderRadius: 16, marginBottom: 15, borderWidth: 1, borderColor: '#222' },
  eventCardSelected: { borderColor: '#CCFF00', backgroundColor: '#1f2600' },
  checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#CCFF00', marginRight: 15, justifyContent: 'center', alignItems: 'center', backgroundColor: '#CCFF00' },
  
  cardLeft: { flex: 1, marginRight: 10 },
  eventName: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  eventSub: { color: '#888', fontSize: 12, marginTop: 4 },
  cardRight: { alignItems: 'flex-end', minWidth: 80 },
  eventAmount: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  payBtn: { backgroundColor: '#CCFF00', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  payBtnText: { color: '#000', fontSize: 12, fontWeight: 'bold' },

  bulkSubmitBtn: { backgroundColor: '#CCFF00', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  bulkSubmitBtnText: { color: '#000', fontSize: 16, fontWeight: 'bold' }
});