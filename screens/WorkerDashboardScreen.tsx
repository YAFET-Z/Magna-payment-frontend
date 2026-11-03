import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Modal, Alert, ScrollView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'WorkerDashboard'>;
  route: { params: { userId: string } };
};

export default function WorkerDashboardScreen({ navigation, route }: Props) {
  const { userId } = route.params;
  const [data, setData] = useState<any>(null);
  const [selectedProof, setSelectedProof] = useState<string | null>(null);

  const fetchDashboard = () => {
    axios.get(`https://magna-payment-api.onrender.com/api/worker/dashboard/${userId}`)
      .then(res => setData(res.data))
      .catch(err => console.log('Dashboard GET Error:', err.message));
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', fetchDashboard);
    return unsubscribe;
  }, [navigation, userId]);

  const handleLogout = () => navigation.reset({ index: 0, routes: [{ name: 'Login' }] });

  const stopActiveEvent = () => {
    Alert.alert("Stop Event?", "This will clock you out.", [
      { text: "Cancel", style: "cancel" },
      { text: "Confirm Stop", style: "destructive", onPress: async () => {
          try {
            await axios.put(`https://magna-payment-api.onrender.com/api/events/stop/${data.activeEvent.id}`);
            fetchDashboard();
          } catch (err) { Alert.alert('Error', 'Could not stop event'); }
        }
      }
    ]);
  };

  if (!data) return <View style={styles.container} />

  const pendingWageEvents = data.completedEvents.filter((e: any) => e.wageStatus === 'PENDING');
  const settledWageEvents = data.completedEvents.filter((e: any) => e.wageStatus === 'SETTLED');
  const totalPendingDays = pendingWageEvents.reduce((sum: number, e: any) => sum + e.totalDaysWorked, 0);

  const renderExpenseItem = (item: any) => (
    <TouchableOpacity key={item.id} style={styles.logItem} onPress={() => navigation.navigate('ManageExpense', { expense: item, userId })}>
      <View style={styles.logLeft}>
        <View style={styles.iconBox}><MaterialIcons name={item.expenseType === 'MEAL' ? 'restaurant' : 'directions-car'} size={18} color="#CCFF00" /></View>
        <View>
          <Text style={styles.logTitle}>{item.expenseType === 'MEAL' ? 'Meal' : 'Transport'}</Text>
          <Text style={styles.logSubtitle}>{new Date(item.createdAt).toLocaleDateString()}</Text>
        </View>
      </View>
      <View style={styles.logRight}>
        <Text style={styles.logAmount}>{item.amount} Birr</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Image source={require('../assets/logo.png')} style={styles.logoImage} />
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => navigation.navigate('WorkerHistory', { userId })} style={styles.iconBtn}>
            <MaterialIcons name="history" size={28} color="#555" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} style={styles.iconBtn}>
            <MaterialIcons name="logout" size={26} color="#555" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.balancesContainer}>
        <View style={styles.balanceBlock}>
          <Text style={styles.headerLabel}>OWED EXPENSES</Text>
          <Text style={styles.balanceText}>{data.totalUnowedBalance.toLocaleString()} <Text style={styles.currencyText}>Birr</Text></Text>
        </View>
        <View style={styles.balanceBlock}>
          <Text style={styles.headerLabel}>UNSETTLED FIELD DAYS</Text>
          <Text style={styles.balanceText}>{totalPendingDays} <Text style={styles.currencyText}>Days</Text></Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 80 }}>
        
        {/* COMPACT ACTIVE CONTROL PANEL WITH EMBEDDED LOGS */}
        {!data.activeEvent ? (
          <View style={styles.idleState}>
            <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('NewEvent', { userId })}>
              <Text style={styles.primaryButtonTitle}>Start New Event</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('PriorEvent' as any, { userId })}>
              <Text style={styles.secondaryButtonTitle}>Log Prior Event (Missed dates)</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.activeCard}>
            <View style={styles.activeHeaderRow}>
              <View>
                <Text style={styles.activeBadge}>🔴 LIVE EVENT</Text>
                <Text style={styles.activeEventName}>{data.activeEvent.eventName}</Text>
              </View>
            </View>
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('AddExpense', { userId, type: 'MEAL', eventId: data.activeEvent.id })}>
                <Text style={styles.actionBtnText}>+ Meal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('AddExpense', { userId, type: 'RIDE', eventId: data.activeEvent.id })}>
                <Text style={styles.actionBtnText}>+ Ride</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.stopBtn} onPress={stopActiveEvent}>
              <Text style={styles.stopBtnText}>Stop Event & Calculate Days</Text>
            </TouchableOpacity>

            {/* NESTED ACTIVE LOGS */}
            {data.activeEvent.expenses.length > 0 && (
              <View style={styles.nestedLogsContainer}>
                <Text style={styles.sectionTitleSmall}>CURRENT SHIFT LOGS</Text>
                {data.activeEvent.expenses.map((exp: any) => renderExpenseItem(exp))}
              </View>
            )}
          </View>
        )}

        <Text style={styles.sectionTitle}>Unsettled Events</Text>
        {pendingWageEvents.length === 0 ? <Text style={styles.emptyText}>No pending events.</Text> : 
          pendingWageEvents.map((event: any) => (
            <TouchableOpacity key={event.id} style={styles.historyCard} onPress={() => navigation.navigate('ManageEvent', { event, userId })}>
              <View>
                <Text style={styles.historyEventName}>{event.eventName}</Text>
                <Text style={styles.historySub}>{event.totalDaysWorked} Days Logged</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#555" />
            </TouchableOpacity>
          ))
        }

        <Text style={styles.sectionTitle}>Settled Wage Logs</Text>
        {settledWageEvents.length === 0 ? <Text style={styles.emptyText}>No settled history yet.</Text> : 
          settledWageEvents.map((event: any) => (
            <TouchableOpacity key={event.id} style={styles.historyCard} onPress={() => navigation.navigate('ManageEvent', { event, userId })}>
              <View style={{ flex: 1 }}>
                <Text style={styles.historyEventName}>{event.eventName}</Text>
                <Text style={styles.historySub}>{new Date(event.endDate).toLocaleDateString()}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.historyAmount}>{event.totalDaysWorked} Days</Text>
                {event.wageSettlementReceipt && (
                  <TouchableOpacity onPress={() => setSelectedProof(event.wageSettlementReceipt)} style={styles.proofBtn}>
                    <MaterialIcons name="visibility" size={12} color="#000" />
                    <Text style={styles.proofBtnText}>View Receipt</Text>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          ))
        }
      </ScrollView>

      <Modal visible={!!selectedProof} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.closeModalBtn} onPress={() => setSelectedProof(null)}><MaterialIcons name="close" size={32} color="#FFF" /></TouchableOpacity>
          {selectedProof && <Image source={{ uri: selectedProof }} style={styles.fullScreenImage} />}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D', padding: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  logoImage: { width: 55, height: 55, resizeMode: 'contain' },
  iconBtn: { padding: 8, marginLeft: 5 },
  balancesContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  balanceBlock: { flex: 1 },
  headerLabel: { color: '#888', fontSize: 10, letterSpacing: 1, marginBottom: 5, fontWeight: 'bold' },
  balanceText: { color: '#FFF', fontSize: 28, fontWeight: 'bold' },
  currencyText: { color: '#CCFF00', fontSize: 14 },
  
  idleState: { marginBottom: 25 },
  primaryButton: { backgroundColor: '#CCFF00', padding: 20, borderRadius: 16, alignItems: 'center', marginBottom: 10 },
  primaryButtonTitle: { color: '#000', fontSize: 16, fontWeight: 'bold' },
  secondaryButton: { backgroundColor: '#1A1A1A', padding: 15, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#222' },
  secondaryButtonTitle: { color: '#888', fontSize: 14, fontWeight: 'bold' },

  activeCard: { backgroundColor: '#1A1A1A', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#333', marginBottom: 25 },
  activeHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  activeBadge: { color: '#CCFF00', fontSize: 10, fontWeight: 'bold', letterSpacing: 1.5, marginBottom: 5 },
  activeEventName: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  actionBtn: { flex: 1, backgroundColor: '#222', padding: 15, borderRadius: 12, alignItems: 'center', marginHorizontal: 5 },
  actionBtnText: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  stopBtn: { backgroundColor: '#FF3B30', padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 5 },
  stopBtnText: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  
  nestedLogsContainer: { marginTop: 25, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#333' },

  sectionTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginBottom: 15, marginTop: 10 },
  sectionTitleSmall: { color: '#888', fontSize: 10, fontWeight: 'bold', letterSpacing: 1.5, marginBottom: 10 },
  emptyText: { color: '#555', fontSize: 14, fontStyle: 'italic', marginBottom: 20 },
  historyCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1A1A1A', padding: 15, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#222' },
  historyEventName: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  historySub: { color: '#888', fontSize: 12, marginTop: 4 },
  historyAmount: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },

  logItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#222' },
  logLeft: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#0D0D0D', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  logTitle: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  logSubtitle: { color: '#888', fontSize: 10, marginTop: 2 },
  logRight: { alignItems: 'flex-end' },
  logAmount: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  
  proofBtn: { backgroundColor: '#CCFF00', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginTop: 6 },
  proofBtnText: { color: '#000', fontSize: 10, fontWeight: 'bold', marginLeft: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  closeModalBtn: { position: 'absolute', top: 50, right: 20, zIndex: 10, padding: 15 },
  fullScreenImage: { width: '90%', height: '80%', resizeMode: 'contain' }
});