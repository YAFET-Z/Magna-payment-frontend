import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Modal, ScrollView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import CustomAlert from '../components/CustomAlert'; // NEW

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'ManagerWorkerReview'>;
  route: { params: { workerId: string; workerName: string; totalAmount: number } };
};

export default function ManagerWorkerReviewScreen({ navigation, route }: Props) {
  const { workerId, workerName, totalAmount } = route.params;
  const safeTotalAmount = totalAmount || 0;
  
  const [activeTab, setActiveTab] = useState<'PENDING' | 'HISTORY_EXPENSES' | 'HISTORY_EVENTS'>('PENDING');
  const [pendingExpenses, setPendingExpenses] = useState([]);
  const [monthlyExpenseHistory, setMonthlyExpenseHistory] = useState<any>({});
  const [monthlyEventHistory, setMonthlyEventHistory] = useState<any>({});
  const [dailyWage, setDailyWage] = useState(0);
  const [bankAccount, setBankAccount] = useState<string | null>(null);
  const [telebirr, setTelebirr] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // NEW: Custom Alert State
  const [alertConfig, setAlertConfig] = useState({
    visible: false, title: '', message: '', type: 'success' as 'success'|'error',
    onConfirm: () => hideAlert()
  });
  const hideAlert = () => setAlertConfig(prev => ({ ...prev, visible: false }));

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setIsLoading(true);
      Promise.all([
        axios.get(`https://magna-payment-api.onrender.com/api/expenses/worker/${workerId}`),
        axios.get(`https://magna-payment-api.onrender.com/api/worker/dashboard/${workerId}`) 
      ])
      .then(([expenseRes, dashboardRes]) => {
        const allExpenses = expenseRes.data.expenses || [];
        setPendingExpenses(allExpenses.filter((e: any) => e.status === 'PENDING'));
        
        const settledExps = allExpenses.filter((e: any) => e.status === 'SETTLED');
        const groupedExps = settledExps.reduce((acc: any, curr: any) => {
          const date = new Date(curr.createdAt);
          const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
          if (!acc[monthYear]) acc[monthYear] = { total: 0, items: [] };
          acc[monthYear].items.push(curr);
          acc[monthYear].total += curr.amount;
          return acc;
        }, {});
        setMonthlyExpenseHistory(groupedExps);

        const wageRate = dashboardRes.data.worker?.dailyWage || 0;
        setDailyWage(wageRate);
        
        const settledEvents = (dashboardRes.data.completedEvents || []).filter((ev: any) => ev.wageStatus === 'SETTLED');
        const groupedEvents = settledEvents.reduce((acc: any, curr: any) => {
          const date = new Date(curr.endDate);
          const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
          if (!acc[monthYear]) acc[monthYear] = { total: 0, items: [] };
          acc[monthYear].items.push(curr);
          acc[monthYear].total += (curr.totalDaysWorked * wageRate);
          return acc;
        }, {});
        setMonthlyEventHistory(groupedEvents);

        setBankAccount(expenseRes.data.bankAccount);
        setTelebirr(expenseRes.data.telebirr);
      })
      .catch(err => console.log('Error fetching worker data:', err.message))
      .finally(() => setIsLoading(false));
    });
    return unsubscribe;
  }, [navigation, workerId]);

  const handleGoToSettlement = () => {
    if (safeTotalAmount <= 0) {
      return setAlertConfig({ visible: true, title: 'Notice', message: 'No pending balance to settle.', type: 'error', onConfirm: hideAlert });
    }
    navigation.navigate('ManagerSettlement', { workerId, workerName, totalAmount: safeTotalAmount, bankAccount, telebirr });
  };

  const renderExpenseItem = (item: any, isSettled: boolean = false) => (
    <TouchableOpacity key={item.id} style={styles.listRow} onPress={() => navigation.navigate('ManageExpense', { expense: item, userId: workerId })}>
      <View style={styles.listLeft}>
        <View style={styles.iconBox}>
          <MaterialIcons name={item.expenseType === 'MEAL' ? 'restaurant' : 'directions-car'} size={18} color="#CCFF00" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.listTitle} numberOfLines={1}>{item.expenseType === 'MEAL' ? 'Meal' : 'Transport'} · {item.event?.eventName || 'General'}</Text>
          <Text style={styles.listDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
        </View>
      </View>
      <View style={styles.listRight}>
        <Text style={styles.listAmount}>{item.amount} Birr</Text>
        <MaterialIcons name="chevron-right" size={20} color="#555" style={{ marginTop: 4 }} />
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
            <TouchableOpacity onPress={() => setSelectedImage(event.wageSettlementReceipt)} style={[styles.receiptBtn, styles.paidProofBtn, { marginTop: 4 }]}>
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
        <View style={{ flex: 1 }}>
          <Text style={styles.headerName} numberOfLines={1}>{workerName}'s Record</Text>
          <Text style={styles.headerSubtext}>{safeTotalAmount.toLocaleString()} Birr pending</Text>
        </View>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tabBtn, activeTab === 'PENDING' && styles.tabActive]} onPress={() => setActiveTab('PENDING')}>
          <Text style={[styles.tabText, activeTab === 'PENDING' && styles.tabTextActive]}>Pending ({pendingExpenses.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabBtn, activeTab === 'HISTORY_EXPENSES' && styles.tabActive]} onPress={() => setActiveTab('HISTORY_EXPENSES')}>
          <Text style={[styles.tabText, activeTab === 'HISTORY_EXPENSES' && styles.tabTextActive]}>Settled Expenses</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabBtn, activeTab === 'HISTORY_EVENTS' && styles.tabActive]} onPress={() => setActiveTab('HISTORY_EVENTS')}>
          <Text style={[styles.tabText, activeTab === 'HISTORY_EVENTS' && styles.tabTextActive]}>Settled Events</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        
        {activeTab === 'PENDING' && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Requires Verification</Text>
            </View>
            {pendingExpenses.length === 0 ? (
               <Text style={styles.emptyText}>No pending expenses right now.</Text>
            ) : (
              <View style={styles.cardBlock}>
                {pendingExpenses.map((exp: any) => renderExpenseItem(exp, false))}
              </View>
            )}
          </>
        )}

        {activeTab === 'HISTORY_EXPENSES' && (
          <>
            {Object.keys(monthlyExpenseHistory).length === 0 ? (
               <Text style={[styles.emptyText, { marginTop: 20 }]}>No settled expense history found.</Text>
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

        {activeTab === 'HISTORY_EVENTS' && (
          <>
            {Object.keys(monthlyEventHistory).length === 0 ? (
               <Text style={[styles.emptyText, { marginTop: 20 }]}>No settled payroll history found.</Text>
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

      {activeTab === 'PENDING' && pendingExpenses.length > 0 && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.settleBtn} onPress={handleGoToSettlement}>
            <Text style={styles.settleBtnText}>Settle {pendingExpenses.length} Receipts</Text>
            <Text style={styles.settleBtnAmount}>{safeTotalAmount.toLocaleString()} Birr</Text>
          </TouchableOpacity>
        </View>
      )}

      <Modal visible={!!selectedImage} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.closeModalBtn} onPress={() => setSelectedImage(null)}>
            <MaterialIcons name="close" size={32} color="#FFF" />
          </TouchableOpacity>
          {selectedImage && <Image source={{ uri: selectedImage }} style={styles.fullScreenImage} />}
        </View>
      </Modal>

      <CustomAlert 
        visible={alertConfig.visible} 
        title={alertConfig.title} 
        message={alertConfig.message} 
        type={alertConfig.type} 
        onConfirm={alertConfig.onConfirm} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 40, borderBottomWidth: 1, borderBottomColor: '#1A1A1A' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1A1A1A', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  headerName: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  headerSubtext: { color: '#CCFF00', fontSize: 12, marginTop: 4 },
  
  tabContainer: { flexDirection: 'row', backgroundColor: '#1A1A1A', borderRadius: 12, padding: 4, margin: 20, marginBottom: 5 },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  tabActive: { backgroundColor: '#333' },
  tabText: { color: '#888', fontWeight: 'bold', fontSize: 11, textAlign: 'center' },
  tabTextActive: { color: '#FFF' },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginTop: 25, marginBottom: 15 },
  sectionTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginRight: 10 },
  emptyText: { color: '#555', fontSize: 14, fontStyle: 'italic', paddingHorizontal: 20, marginBottom: 20 },
  
  monthBlock: { marginTop: 25 },
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
  
  receiptBtn: { backgroundColor: '#CCFF00', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  paidProofBtn: { backgroundColor: '#1A1A1A', borderColor: '#CCFF00', borderWidth: 1, marginLeft: 5 },
  receiptBtnText: { color: '#000', fontSize: 10, fontWeight: 'bold', marginLeft: 4 },
  
  footer: { position: 'absolute', bottom: 0, width: '100%', padding: 20, backgroundColor: '#0D0D0D', borderTopWidth: 1, borderTopColor: '#1A1A1A' },
  settleBtn: { backgroundColor: '#CCFF00', padding: 20, borderRadius: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  settleBtnText: { color: '#000', fontSize: 16, fontWeight: 'bold' },
  settleBtnAmount: { color: '#000', fontSize: 14, fontWeight: 'bold' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  closeModalBtn: { position: 'absolute', top: 50, right: 20, zIndex: 10, padding: 15 },
  fullScreenImage: { width: '90%', height: '80%', resizeMode: 'contain' }
});