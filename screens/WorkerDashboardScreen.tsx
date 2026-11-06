import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, RefreshControl } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import CustomAlert from '../components/CustomAlert';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: false }),
});

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'WorkerDashboard'>;
  route: { params: { userId: string } };
};

export default function WorkerDashboardScreen({ navigation, route }: Props) {
  const { userId } = route.params;
  const [data, setData] = useState<any>(null);
  
  // NEW: Refresh State
  const [refreshing, setRefreshing] = useState(false);

  const [alertConfig, setAlertConfig] = useState({
    visible: false, title: '', message: '', type: 'success' as 'success'|'error'|'confirm',
    onConfirm: () => hideAlert(), onCancel: () => hideAlert()
  });
  const hideAlert = () => setAlertConfig(prev => ({ ...prev, visible: false }));

  const fetchDashboard = async () => {
    try {
      const res = await axios.get(`https://magna-payment-api.onrender.com/api/worker/dashboard/${userId}`);
      setData(res.data);
    } catch (err: any) {
      console.log('Dashboard GET Error:', err.message);
    }
  };

  // NEW: Pull-to-Refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDashboard();
    setRefreshing(false);
  }, [userId]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', fetchDashboard);
    return unsubscribe;
  }, [navigation, userId]);

  // FIXED: Push Notification Registration for EAS Builds
  useEffect(() => {
    async function registerForPushNotificationsAsync() {
      if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== 'granted') return;
        
        try {
          // EXPO REQUIRES THE PROJECT ID FOR STANDALONE APK BUILDS
          const token = (await Notifications.getExpoPushTokenAsync({
            projectId: "7b12b73b-72be-4ac5-b72c-6d356d3173ec"
          })).data;
          
          await axios.put(`https://magna-payment-api.onrender.com/api/users/push-token/${userId}`, { token });
        } catch (e) { 
          console.log('Failed to fetch push token:', e); 
        }
      }
    }
    registerForPushNotificationsAsync();
  }, [userId]);

  const handleLogout = () => navigation.reset({ index: 0, routes: [{ name: 'Login' }] });

  const promptStopEvent = () => {
    setAlertConfig({
      visible: true,
      title: 'Stop Event?',
      message: 'This will clock you out of the current shift and calculate your days.',
      type: 'confirm',
      onCancel: hideAlert,
      onConfirm: async () => {
        hideAlert();
        try {
          await axios.put(`https://magna-payment-api.onrender.com/api/events/stop/${data.activeEvent.id}`);
          fetchDashboard();
        } catch (err) {
          setTimeout(() => setAlertConfig({ visible: true, title: 'Error', message: 'Could not stop event', type: 'error', onConfirm: hideAlert }), 500);
        }
      }
    });
  };

  if (!data) return <View style={styles.container} />

  const pendingWageEvents = data.completedEvents.filter((e: any) => e.wageStatus === 'PENDING');
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

      {/* NEW: RefreshControl attached to ScrollView */}
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ paddingBottom: 80 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#CCFF00" />}
      >
        
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
            <TouchableOpacity style={styles.stopBtn} onPress={promptStopEvent}>
              <Text style={styles.stopBtnText}>Stop Event & Calculate Days</Text>
            </TouchableOpacity>

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

        <TouchableOpacity style={styles.viewHistoryBtn} onPress={() => navigation.navigate('WorkerHistory', { userId })}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <MaterialIcons name="account-balance-wallet" size={20} color="#CCFF00" style={{ marginRight: 10 }} />
            <Text style={styles.viewHistoryBtnText}>View Settled History & Receipts</Text>
          </View>
          <MaterialIcons name="arrow-forward-ios" size={16} color="#555" />
        </TouchableOpacity>
      </ScrollView>

      <CustomAlert 
        visible={alertConfig.visible} 
        title={alertConfig.title} 
        message={alertConfig.message} 
        type={alertConfig.type} 
        onConfirm={alertConfig.onConfirm} 
        onCancel={alertConfig.onCancel}
        confirmText={alertConfig.type === 'confirm' ? "Confirm Stop" : "OK"}
      />
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

  logItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#222' },
  logLeft: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#0D0D0D', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  logTitle: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  logSubtitle: { color: '#888', fontSize: 10, marginTop: 2 },
  logRight: { alignItems: 'flex-end' },
  logAmount: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  
  viewHistoryBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1A1A1A', padding: 20, borderRadius: 12, marginTop: 15, borderWidth: 1, borderColor: '#333' },
  viewHistoryBtnText: { color: '#FFF', fontSize: 14, fontWeight: 'bold' }
});