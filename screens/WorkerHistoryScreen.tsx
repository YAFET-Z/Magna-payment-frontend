import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Modal, ScrollView, ActivityIndicator } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'WorkerHistory'>;
  route: { params: { userId: string } };
};

export default function WorkerHistoryScreen({ navigation, route }: Props) {
  const { userId } = route.params;
  
  const [activeTab, setActiveTab] = useState<'PENDING' | 'SETTLED_EXPENSES' | 'SETTLED_EVENTS'>('PENDING');
  const [pendingExpenses, setPendingExpenses] = useState<any[]>([]);
  const [monthlyExpenseHistory, setMonthlyExpenseHistory] = useState<any>({});
  const [monthlyEventHistory, setMonthlyEventHistory] = useState<any>({});
  const [dailyWage, setDailyWage] = useState(0);
  
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProof, setSelectedProof] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setIsLoading(true);
      Promise.all([
        axios.get(`https://magna-payment-api.onrender.com/api/expenses/worker/${userId}`),
        axios.get(`https://magna-payment-api.onrender.com/api/worker/dashboard/${userId}`)
      ])
      .then(([expRes, dashRes]) => {
        const allExpenses = expRes.data.expenses || [];
        
        // 1. Pending Expenses
        setPendingExpenses(allExpenses.filter((e: any) => e.status === 'PENDING'));

        // 2. Settled Expenses (Grouped)
        const settledExps = allExpenses.filter((e: any) => e.status === 'SETTLED');
        const groupedExps = settledExps.reduce((acc: any, curr: any) => {
          const date = new Date(curr.createdAt);
          const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
          if (!acc[monthYear]) acc[monthYear] = { total: 0, items: [] };
          acc[monthYear].items.push(curr);
          acc[monthYear].total += (curr.amount || 0);
          return acc;
        }, {});
        setMonthlyExpenseHistory(groupedExps);

        // 3. Settled Events/Wages (Grouped)
        const wageRate = dashRes.data.worker?.dailyWage || 0;
        setDailyWage(wageRate);
        const settledEvents = (dashRes.data.completedEvents || []).filter((ev: any) => ev.wageStatus === 'SETTLED');
        const groupedEvents = settledEvents.reduce((acc: any, curr: any) => {
          const date = new Date(curr.endDate);
          const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
          if (!acc[monthYear]) acc[monthYear] = { total: 0, items: [] };
          acc[monthYear].items.push(curr);
          acc[monthYear].total += (curr.totalDaysWorked * wageRate);
          return acc;
        }, {});
        setMonthlyEventHistory(groupedEvents);
      })
      .catch(err => console.log('Fetch Error:', err.message))
      .finally(() => setIsLoading(false));
    });
    return unsubscribe;
  }, [navigation, userId]);

const renderExpenseItem = (item: any, isSettled: boolean) => (
    <TouchableOpacity 
      key={item.id} 
      style={styles.listRow} 
      // Removed the disabled state so settled items can be clicked
      onPress={() => navigation.navigate('ManageExpense', { expense: item, userId })}
    >
      <View style={styles.listLeft}>
        <View style={styles.iconBox}>
          <MaterialIcons name={item.expenseType === 'MEAL' ? 'restaurant' : 'directions-car'} size={18} color="#CCFF00" />
        </View>
        <View style={{ flex: 1 }}>
          {/* Removed numberOfLines={1} so long event names wrap normally */}
          <Text style={styles.listTitle}>{item.expenseType === 'MEAL' ? 'Meal' : 'Transport'} · {item.event?.eventName || 'General'}</Text>
          <Text style={styles.listDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
        </View>
      </View>
      <View style={styles.listRight}>
        <Text style={styles.listAmount}>{item.amount} Birr</Text>
        <View style={{ flexDirection: 'row', marginTop: 4 }}>
          {!isSettled ? (
            <Text style={styles.pendingText}>Under Review</Text>
          ) : (
             <MaterialIcons name="verified" size={14} color="#CCFF00" />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEventItem = (event: any) => {
    const eventPay = event.totalDaysWorked * dailyWage;
    return (
      <View key={event.id} style={styles.listRow}>
        <View style={styles.listLeft}>
          <View style={[styles.iconBox, { backgroundColor: '#CCFF00' }]}>
            <MaterialIcons name="event-available" size={18} color="#000" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.listTitle} numberOfLines={1}>{event.eventName}</Text>
            <Text style={styles.listDate}>{event.totalDaysWorked} Days @ {dailyWage}/day</Text>
          </View>
        </View>
        <View style={styles.listRight}>
          <Text style={styles.listAmount}>{eventPay.toLocaleString()} Birr</Text>
          {event.wageSettlementReceipt && event.wageSettlementReceipt.startsWith('http') && (
            <TouchableOpacity onPress={() => setSelectedProof(event.wageSettlementReceipt)} style={[styles.receiptBtn, styles.paidProofBtn, { marginTop: 4 }]}>
               <MaterialIcons name="verified" size={12} color="#CCFF00" />
               <Text style={[styles.receiptBtnText, { color: '#CCFF00' }]}>Payroll Proof</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (isLoading) return <View style={[styles.container, styles.center]}><ActivityIndicator color="#CCFF00" /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back-ios" size={16} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerName}>My Financial Record</Text>
      </View>

      {/* 3-TAB SYSTEM */}
      <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tabBtn, activeTab === 'PENDING' && styles.tabActive]} onPress={() => setActiveTab('PENDING')}>
          <Text style={[styles.tabText, activeTab === 'PENDING' && styles.tabTextActive]}>Pending ({pendingExpenses.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabBtn, activeTab === 'SETTLED_EXPENSES' && styles.tabActive]} onPress={() => setActiveTab('SETTLED_EXPENSES')}>
          <Text style={[styles.tabText, activeTab === 'SETTLED_EXPENSES' && styles.tabTextActive]}>Settled Expenses</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabBtn, activeTab === 'SETTLED_EVENTS' && styles.tabActive]} onPress={() => setActiveTab('SETTLED_EVENTS')}>
          <Text style={[styles.tabText, activeTab === 'SETTLED_EVENTS' && styles.tabTextActive]}>Settled Events</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        
        {activeTab === 'PENDING' && (
          <>
            <Text style={styles.sectionTitle}>Awaiting Manager Approval</Text>
            {pendingExpenses.length === 0 ? (
               <Text style={styles.emptyText}>You have no pending expenses.</Text>
            ) : (
              <View style={styles.cardBlock}>
                {pendingExpenses.map((exp: any) => renderExpenseItem(exp, false))}
              </View>
            )}
          </>
        )}

        {activeTab === 'SETTLED_EXPENSES' && (
          <>
            {Object.keys(monthlyExpenseHistory).length === 0 ? (
               <Text style={styles.emptyText}>No settled expenses found.</Text>
            ) : (
              Object.entries(monthlyExpenseHistory).map(([month, data]: any) => (
                <View key={`exp-${month}`} style={styles.monthBlock}>
                  <View style={styles.monthHeaderRow}>
                    <Text style={styles.monthName}>{month}</Text>
                    <Text style={styles.monthTotal}>{data.total.toLocaleString()} Birr</Text>
                  </View>
                  <View style={styles.cardBlock}>
                    {data.items.map((exp: any) => renderExpenseItem(exp, true))}
                  </View>
                </View>
              ))
            )}
          </>
        )}

        {activeTab === 'SETTLED_EVENTS' && (
          <>
            {Object.keys(monthlyEventHistory).length === 0 ? (
               <Text style={styles.emptyText}>No settled payroll found.</Text>
            ) : (
              Object.entries(monthlyEventHistory).map(([month, data]: any) => (
                <View key={`ev-${month}`} style={styles.monthBlock}>
                  <View style={styles.monthHeaderRow}>
                    <Text style={styles.monthName}>{month}</Text>
                    <Text style={styles.monthTotal}>{data.total.toLocaleString()} Birr</Text>
                  </View>
                  <View style={styles.cardBlock}>
                    {data.items.map((ev: any) => renderEventItem(ev))}
                  </View>
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>

      {/* FULL SCREEN RECEIPT MODAL */}
      <Modal visible={!!selectedProof} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.closeModalBtn} onPress={() => setSelectedProof(null)}>
            <MaterialIcons name="close" size={32} color="#FFF" />
          </TouchableOpacity>
          {selectedProof && <Image source={{ uri: selectedProof }} style={styles.fullScreenImage} />}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 40, borderBottomWidth: 1, borderBottomColor: '#1A1A1A' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1A1A1A', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  headerName: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  
  tabContainer: { flexDirection: 'row', backgroundColor: '#1A1A1A', borderRadius: 12, padding: 4, margin: 20, marginBottom: 15 },
  tabBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  tabActive: { backgroundColor: '#333' },
  tabText: { color: '#888', fontWeight: 'bold', fontSize: 11, textAlign: 'center' },
  tabTextActive: { color: '#FFF' },

  sectionTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginHorizontal: 20, marginBottom: 15 },
  emptyText: { color: '#555', fontSize: 14, fontStyle: 'italic', marginHorizontal: 20, marginTop: 10 },
  
  monthBlock: { marginBottom: 25 },
  monthHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 20, marginBottom: 10 },
  monthName: { color: '#888', fontSize: 12, fontWeight: 'bold', letterSpacing: 1.5, textTransform: 'uppercase' },
  monthTotal: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  
  cardBlock: { backgroundColor: '#1A1A1A', marginHorizontal: 20, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#222' },
  listRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#222' },
  listLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 10 },
  iconBox: { width: 35, height: 35, borderRadius: 17.5, backgroundColor: '#0D0D0D', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  listTitle: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  listDate: { color: '#888', fontSize: 10, marginTop: 4 },
  listRight: { alignItems: 'flex-end', minWidth: 70 },
  listAmount: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  
  pendingText: { color: '#FF9500', fontSize: 10, fontWeight: 'bold', fontStyle: 'italic' },
  receiptBtn: { backgroundColor: '#CCFF00', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  paidProofBtn: { backgroundColor: '#1A1A1A', borderColor: '#CCFF00', borderWidth: 1, marginLeft: 5 },
  receiptBtnText: { color: '#000', fontSize: 10, fontWeight: 'bold', marginLeft: 4 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  closeModalBtn: { position: 'absolute', top: 50, right: 20, zIndex: 10, padding: 15 },
  fullScreenImage: { width: '90%', height: '80%', resizeMode: 'contain' }
});