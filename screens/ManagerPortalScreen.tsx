import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'ManagerPortal'>; };

export default function ManagerPortalScreen({ navigation }: Props) {
  const [activeTab, setActiveTab] = useState<'EXPENSES' | 'WAGES' | 'WORKERS'>('EXPENSES');
  const [expenseWorkers, setExpenseWorkers] = useState([]);
  const [wageWorkers, setWageWorkers] = useState([]);
  const [allWorkers, setAllWorkers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setIsLoading(true);
      Promise.all([
        axios.get('https://magna-payment-api.onrender.com/api/finance/company-pending-expenses'), 
        axios.get('https://magna-payment-api.onrender.com/api/finance/company-pending-wages'),
        axios.get('https://magna-payment-api.onrender.com/api/finance/all-workers')
      ])
      .then(([expRes, wageRes, allRes]) => {
        setExpenseWorkers(expRes.data.actionNeeded || []);
        setWageWorkers(wageRes.data || []);
        setAllWorkers(allRes.data || []);
      })
      .catch(err => console.log('Fetch Error:', err.message))
      .finally(() => setIsLoading(false));
    });
    return unsubscribe;
  }, [navigation]);

  const getInitials = (name: string) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : 'W';

  const handleLogout = () => navigation.reset({ index: 0, routes: [{ name: 'Login' }] });

  const renderExpenseCard = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.workerRow} onPress={() => navigation.navigate('ManagerWorkerReview', { workerId: item.id, workerName: item.fullName, totalAmount: item.totalPendingBalance })}>
      <View style={styles.workerLeft}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{getInitials(item.fullName)}</Text></View>
        <View>
          <Text style={styles.workerName}>{item.fullName}</Text>
          <Text style={styles.workerSubtext}>{item.expenses?.length || 0} unverified receipts</Text>
        </View>
      </View>
      <View style={styles.workerRight}>
        <View style={styles.amountContainer}>
          <Text style={styles.workerAmount}>{item.totalPendingBalance.toLocaleString()}</Text>
          <Text style={styles.currencyTextSmall}>Birr</Text>
        </View>
        <MaterialIcons name="chevron-right" size={24} color="#555" />
      </View>
    </TouchableOpacity>
  );

  const renderWageWorkerCard = ({ item }: { item: any }) => {
    const totalDays = item.events.reduce((sum: number, ev: any) => sum + ev.totalDaysWorked, 0);
    const totalAmount = totalDays * item.dailyWage;
    return (
      <TouchableOpacity style={styles.workerRow} onPress={() => navigation.navigate('ManagerWorkerPayroll', { workerId: item.id, workerName: item.fullName, events: item.events, dailyWage: item.dailyWage, bankAccount: item.bankAccount, telebirr: item.telebirr })}>
        <View style={styles.workerLeft}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{getInitials(item.fullName)}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.workerName} numberOfLines={1}>{item.fullName}</Text>
            <Text style={styles.workerSubtext}>{totalDays} unpaid days total</Text>
          </View>
        </View>
        <View style={styles.workerRight}>
          <View style={styles.amountContainer}>
            <Text style={styles.workerAmount}>{totalAmount.toLocaleString()}</Text>
            <Text style={styles.currencyTextSmall}>Birr</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color="#555" />
        </View>
      </TouchableOpacity>
    );
  };

  const renderAllWorkerCard = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.workerRow} onPress={() => navigation.navigate('ManagerWorkerReview', { workerId: item.id, workerName: item.fullName, totalAmount: item.totalPendingBalance })}>
      <View style={styles.workerLeft}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{getInitials(item.fullName)}</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.workerName} numberOfLines={1}>{item.fullName}</Text>
          <Text style={styles.workerSubtext}>Daily Wage: {item.dailyWage} Birr</Text>
        </View>
      </View>
      <View style={styles.workerRight}>
        <MaterialIcons name="chevron-right" size={24} color="#555" />
      </View>
    </TouchableOpacity>
  );

  const getListData = () => {
    if (activeTab === 'EXPENSES') return expenseWorkers;
    if (activeTab === 'WAGES') return wageWorkers;
    return allWorkers;
  };

  if (isLoading) return <View style={[styles.container, styles.center]}><ActivityIndicator color="#CCFF00" /></View>;

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Image source={require('../assets/logo.png')} style={styles.logoImage} />
        <TouchableOpacity onPress={handleLogout} style={{ padding: 5 }}>
          <MaterialIcons name="logout" size={26} color="#555" />
        </TouchableOpacity>
      </View>

      {/* BRAND ROW */}
      <View style={styles.brandRow}>
        <Text style={styles.brandName}>MAGNA PAYMENTS</Text>
        <TouchableOpacity onPress={() => navigation.navigate('RegisterUser' as any)} style={styles.addBtn}>
          <Text style={styles.headerRight}>+ Add Member</Text>
        </TouchableOpacity>
      </View>

      {/* UPDATED: GROUPED ACTION SUMMARY */}
      <Text style={styles.sectionLabel}>ACTION REQUIRED</Text>
      <View style={styles.summaryRow}>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>Pending Expenses</Text>
          <Text style={styles.summaryAmount}>
            {expenseWorkers.length} <Text style={styles.currencyTextSmall}>{expenseWorkers.length === 1 ? 'Worker' : 'Workers'}</Text>
          </Text>
        </View>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>Unpaid Payroll</Text>
          <Text style={styles.summaryAmount}>
            {wageWorkers.length} <Text style={styles.currencyTextSmall}>{wageWorkers.length === 1 ? 'Worker' : 'Workers'}</Text>
          </Text>
        </View>
      </View>

      {/* TABS */}
      <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tabBtn, activeTab === 'EXPENSES' && styles.tabActive]} onPress={() => setActiveTab('EXPENSES')}>
          <Text style={[styles.tabText, activeTab === 'EXPENSES' && styles.tabTextActive]}>Expenses</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabBtn, activeTab === 'WAGES' && styles.tabActive]} onPress={() => setActiveTab('WAGES')}>
          <Text style={[styles.tabText, activeTab === 'WAGES' && styles.tabTextActive]}>Payroll</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabBtn, activeTab === 'WORKERS' && styles.tabActive]} onPress={() => setActiveTab('WORKERS')}>
          <Text style={[styles.tabText, activeTab === 'WORKERS' && styles.tabTextActive]}>Workers</Text>
        </TouchableOpacity>
      </View>

      {/* LIST CONTENT */}
      <View style={styles.listHeader}>
        <Text style={styles.actionNeeded}>
          {activeTab === 'EXPENSES' && 'Pending Receipts'}
          {activeTab === 'WAGES' && 'Unpaid Field Days'}
          {activeTab === 'WORKERS' && 'Crew Directory'}
        </Text>
        <Text style={styles.countBadge}>{getListData().length}</Text>
      </View>
      
      <FlatList 
        data={getListData()} 
        renderItem={activeTab === 'EXPENSES' ? renderExpenseCard : (activeTab === 'WAGES' ? renderWageWorkerCard : renderAllWorkerCard)} 
        keyExtractor={(item: any) => item.id} 
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D', padding: 20 },
  center: { justifyContent: 'center', alignItems: 'center' },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 15 },
  logoImage: { width: 55, height: 55, resizeMode: 'contain' },
  
  brandRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  brandName: { color: '#CCFF00', fontSize: 12, fontWeight: 'bold', letterSpacing: 2 },
  addBtn: { backgroundColor: '#1A1A1A', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#222' },
  headerRight: { color: '#CCFF00', fontSize: 12, fontWeight: 'bold' },

  sectionLabel: { color: '#888', fontSize: 10, letterSpacing: 1.5, marginBottom: 5, fontWeight: 'bold' },
  
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25, gap: 10 },
  summaryBox: { flex: 1, backgroundColor: '#1A1A1A', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#222' },
  summaryLabel: { color: '#888', fontSize: 11, fontWeight: 'bold', marginBottom: 5 },
  summaryAmount: { color: '#FFF', fontSize: 22, fontWeight: 'bold' },
  
  tabContainer: { flexDirection: 'row', backgroundColor: '#1A1A1A', borderRadius: 12, padding: 4, marginBottom: 20 },
  tabBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  tabActive: { backgroundColor: '#333' },
  tabText: { color: '#888', fontWeight: 'bold', fontSize: 12 },
  tabTextActive: { color: '#FFF' },

  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingBottom: 10 },
  actionNeeded: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  countBadge: { color: '#CCFF00', fontSize: 12, fontWeight: 'bold' },
  workerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#1A1A1A' },
  workerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#CCFF00', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  avatarText: { color: '#000', fontSize: 14, fontWeight: 'bold' },
  workerName: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  workerSubtext: { color: '#888', fontSize: 10, marginTop: 4 },
  workerRight: { flexDirection: 'row', alignItems: 'center', minWidth: 80, justifyContent: 'flex-end' },
  amountContainer: { alignItems: 'flex-end', marginRight: 10 },
  workerAmount: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  currencyTextSmall: { color: '#555', fontSize: 10, marginTop: 2 }
});