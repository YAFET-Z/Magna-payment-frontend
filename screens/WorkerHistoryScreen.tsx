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
  const [groupedExpenses, setGroupedExpenses] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    axios.get(`https://magna-payment-api.onrender.com/api/worker/dashboard/${userId}`)
      .then(res => {
        const history = (res.data.settledExpenses || []).reduce((acc: any, curr: any) => {
          const date = new Date(curr.createdAt);
          const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
          if (!acc[monthYear]) acc[monthYear] = { total: 0, items: [] };
          acc[monthYear].items.push(curr);
          acc[monthYear].total += (curr.amount || 0);
          return acc;
        }, {});
        setGroupedExpenses(history);
      })
      .catch(err => console.log('Fetch Error:', err.message))
      .finally(() => setIsLoading(false));
  }, [userId]);

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
        <Text style={styles.logAmount}>{item.amount || 0} Birr</Text>
        <View style={styles.paidBadge}><Text style={styles.paidBadgeText}>PAID</Text></View>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) return <View style={[styles.container, styles.center]}><ActivityIndicator color="#CCFF00" /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back-ios" size={16} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerName}>Expense History</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 25, paddingBottom: 60 }}>
        {Object.keys(groupedExpenses).length === 0 ? <Text style={styles.emptyText}>No settled expenses yet.</Text> :
          Object.entries(groupedExpenses).map(([month, monthData]: any) => (
            <View key={month} style={styles.monthBlock}>
              <View style={styles.monthHeaderRow}>
                <Text style={styles.monthName}>{month}</Text>
                <Text style={styles.monthTotal}>{(monthData.total || 0).toLocaleString()} Birr</Text>
              </View>
              <View style={styles.cardBlock}>
                {monthData.items.map((exp: any) => renderExpenseItem(exp))}
              </View>
            </View>
          ))
        }
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 40, borderBottomWidth: 1, borderBottomColor: '#1A1A1A' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1A1A1A', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  headerName: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  emptyText: { color: '#555', fontSize: 14, fontStyle: 'italic', marginTop: 20 },
  
  monthBlock: { marginBottom: 25 },
  monthHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 10, paddingHorizontal: 5 },
  monthName: { color: '#888', fontSize: 12, fontWeight: 'bold', letterSpacing: 1.5, textTransform: 'uppercase' },
  monthTotal: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  cardBlock: { backgroundColor: '#1A1A1A', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#222' },
  logItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#222' },
  logLeft: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 35, height: 35, borderRadius: 17.5, backgroundColor: '#0D0D0D', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  logTitle: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  logSubtitle: { color: '#888', fontSize: 10, marginTop: 4 },
  logRight: { alignItems: 'flex-end' },
  logAmount: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  paidBadge: { backgroundColor: '#0D0D0D', borderWidth: 1, borderColor: '#CCFF00', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginTop: 6 },
  paidBadgeText: { color: '#CCFF00', fontSize: 9, fontWeight: 'bold' }
});