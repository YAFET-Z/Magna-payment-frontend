import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'ManageEvent'>;
  route: { params: { event: any; userId: string } };
};

export default function ManageEventScreen({ navigation, route }: Props) {
  const { event, userId } = route.params;
  const [eventName, setEventName] = useState(event.eventName);
  const [workerRole, setWorkerRole] = useState(event.workerRole);
  const [isLoading, setIsLoading] = useState(false);

  const isSettled = event.wageStatus === 'SETTLED';

  const handleUpdate = async () => {
    setIsLoading(true);
    try {
      await axios.put(`https://magna-payment-api.onrender.com/api/events/${event.id}`, { eventName, workerRole });
      Alert.alert('Updated', 'Event details saved.');
      navigation.goBack();
    } catch (error: any) { Alert.alert('Error', 'Could not update.'); } 
    finally { setIsLoading(false); }
  };

  const handleDelete = () => {
    Alert.alert("Delete Event", "This will permanently delete the event AND all expenses inside it.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete Everything", style: "destructive", onPress: async () => {
          setIsLoading(true);
          try {
            await axios.delete(`https://magna-payment-api.onrender.com/api/events/${event.id}`);
            navigation.goBack();
          } catch (err) { Alert.alert('Error', 'Could not delete.'); setIsLoading(false); }
        }
      }
    ]);
  };

  const renderExpenseRow = (exp: any) => (
    <TouchableOpacity key={exp.id} style={styles.logItem} onPress={() => navigation.navigate('ManageExpense', { expense: exp, userId })}>
      <View style={styles.logLeft}>
        <View style={styles.iconBox}><MaterialIcons name={exp.expenseType === 'MEAL' ? 'restaurant' : 'directions-car'} size={18} color="#CCFF00" /></View>
        <View>
          <Text style={styles.logTitle}>{exp.expenseType}</Text>
          <Text style={styles.logSubtitle}>{new Date(exp.createdAt).toLocaleDateString()}</Text>
        </View>
      </View>
      <View style={styles.logRight}>
        <Text style={styles.logAmount}>{exp.amount} Birr</Text>
        <Text style={[styles.statusText, exp.status === 'SETTLED' && { color: '#CCFF00' }]}>{exp.status}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 25, paddingBottom: 60 }}>
        <Text style={styles.title}>Event Details</Text>
        <Text style={styles.subtitle}>{event.totalDaysWorked} Days Logged</Text>

        <Text style={styles.label}>EVENT NAME</Text>
        <TextInput style={[styles.input, isSettled && { opacity: 0.5 }]} value={eventName} onChangeText={setEventName} editable={!isSettled} />

        <Text style={styles.label}>YOUR ROLE</Text>
        <TextInput style={[styles.input, isSettled && { opacity: 0.5 }]} value={workerRole} onChangeText={setWorkerRole} editable={!isSettled} />

        {!isSettled ? (
          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.updateBtn} onPress={handleUpdate} disabled={isLoading}><Text style={styles.updateBtnText}>Save</Text></TouchableOpacity>
            <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} disabled={isLoading}><MaterialIcons name="delete" size={24} color="#FF3B30" /></TouchableOpacity>
          </View>
        ) : (
          <View style={styles.settledBadge}><Text style={styles.settledText}>Wages for this event are PAID. Event is locked.</Text></View>
        )}

        <Text style={[styles.label, { marginTop: 20 }]}>ATTACHED EXPENSES ({event.expenses.length})</Text>
        <View style={styles.expenseList}>
          {event.expenses.map((exp: any) => renderExpenseRow(exp))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },
  title: { color: '#FFF', fontSize: 32, fontWeight: 'bold' },
  subtitle: { color: '#888', fontSize: 14, marginBottom: 30 },
  label: { color: '#888', fontSize: 10, letterSpacing: 1.5, marginBottom: 10, fontWeight: 'bold' },
  input: { backgroundColor: '#1A1A1A', color: '#FFF', padding: 20, borderRadius: 16, fontSize: 16, marginBottom: 25, borderWidth: 1, borderColor: '#222' },
  btnRow: { flexDirection: 'row', justifyContent: 'space-between' },
  updateBtn: { flex: 1, backgroundColor: '#CCFF00', padding: 18, borderRadius: 16, alignItems: 'center', marginRight: 10 },
  updateBtnText: { color: '#000', fontSize: 16, fontWeight: 'bold' },
  deleteBtn: { backgroundColor: '#1A1A1A', padding: 18, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#FF3B30' },
  settledBadge: { backgroundColor: '#1A1A1A', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#CCFF00', marginBottom: 20 },
  settledText: { color: '#CCFF00', textAlign: 'center', fontWeight: 'bold' },
  expenseList: { marginTop: 10 },
  logItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#222' },
  logLeft: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 35, height: 35, borderRadius: 17.5, backgroundColor: '#1A1A1A', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  logTitle: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  logSubtitle: { color: '#888', fontSize: 10, marginTop: 4 },
  logRight: { alignItems: 'flex-end' },
  logAmount: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  statusText: { color: '#E5A93C', fontSize: 10, fontWeight: 'bold', marginTop: 4 }
});