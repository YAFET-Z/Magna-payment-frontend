import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Image, Modal, ScrollView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'ManageExpense'>;
  route: { params: { expense: any; userId: string } };
};

export default function ManageExpenseScreen({ navigation, route }: Props) {
  const { expense } = route.params;
  const [amount, setAmount] = useState(expense.amount.toString());
  const [isLoading, setIsLoading] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const isSettled = expense.status === 'SETTLED';

  const handleUpdate = async () => {
    if (!amount) return;
    setIsLoading(true);
    try {
      await axios.put(`https://magna-payment-api.onrender.com/api/expenses/${expense.id}`, { amount });
      Alert.alert('Updated', 'Expense updated successfully.');
      navigation.goBack();
    } catch (error: any) { Alert.alert('Error', 'Could not update.'); } 
    finally { setIsLoading(false); }
  };

  const handleDelete = () => {
    Alert.alert("Confirm Delete", "Are you sure you want to delete this expense log?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
          setIsLoading(true);
          try {
            await axios.delete(`https://magna-payment-api.onrender.com/api/expenses/${expense.id}`);
            navigation.goBack();
          } catch (err) { Alert.alert('Error', 'Could not delete.'); setIsLoading(false); }
        }
      }
    ]);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 25 }}>
        <Text style={styles.title}>{expense.expenseType} Log</Text>
        <Text style={styles.subtitle}>Logged on {new Date(expense.createdAt).toLocaleDateString()}</Text>

        <Text style={styles.label}>RECEIPT ATTACHED</Text>
        <TouchableOpacity style={styles.receiptBox} onPress={() => setIsFullScreen(true)}>
          {expense.receiptImageUrl && expense.receiptImageUrl.startsWith('http') ? (
             <Image source={{ uri: expense.receiptImageUrl }} style={styles.receiptThumb} />
          ) : (
            <View style={styles.noReceiptBox}><Text style={{color: '#555'}}>No Receipt Uploaded</Text></View>
          )}
        </TouchableOpacity>

        <Text style={styles.label}>EXPENSE AMOUNT (BIRR)</Text>
        <TextInput 
          style={[styles.input, isSettled && { opacity: 0.5 }]} 
          value={amount} 
          onChangeText={setAmount} 
          keyboardType="numeric" 
          editable={!isSettled} 
        />

        {isSettled ? (
          <View style={styles.settledBadge}><Text style={styles.settledText}>This expense has been PAID and cannot be edited.</Text></View>
        ) : (
          <>
            <TouchableOpacity style={styles.updateBtn} onPress={handleUpdate} disabled={isLoading}>
              {isLoading ? <ActivityIndicator color="#000" /> : <Text style={styles.updateBtnText}>Save Changes</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} disabled={isLoading}>
              <Text style={styles.deleteBtnText}>Delete Expense</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* Full Screen Receipt Modal */}
      <Modal visible={isFullScreen} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.closeModalBtn} onPress={() => setIsFullScreen(false)}>
            <MaterialIcons name="close" size={32} color="#FFF" />
          </TouchableOpacity>
          <Image source={{ uri: expense.receiptImageUrl }} style={styles.fullScreenImage} />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },
  title: { color: '#FFF', fontSize: 32, fontWeight: 'bold' },
  subtitle: { color: '#888', fontSize: 14, marginBottom: 30 },
  label: { color: '#888', fontSize: 10, letterSpacing: 1.5, marginBottom: 10, fontWeight: 'bold' },
  input: { backgroundColor: '#1A1A1A', color: '#FFF', padding: 20, borderRadius: 16, fontSize: 16, marginBottom: 25, borderWidth: 1, borderColor: '#222' },
  receiptBox: { height: 200, backgroundColor: '#1A1A1A', borderRadius: 16, marginBottom: 25, overflow: 'hidden', borderWidth: 1, borderColor: '#222' },
  receiptThumb: { width: '100%', height: '100%', resizeMode: 'cover' },
  noReceiptBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  updateBtn: { backgroundColor: '#CCFF00', padding: 20, borderRadius: 16, alignItems: 'center', marginBottom: 15 },
  updateBtnText: { color: '#000', fontSize: 16, fontWeight: 'bold' },
  deleteBtn: { backgroundColor: '#1A1A1A', padding: 20, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#FF3B30' },
  deleteBtnText: { color: '#FF3B30', fontSize: 16, fontWeight: 'bold' },
  settledBadge: { backgroundColor: '#1A1A1A', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#CCFF00' },
  settledText: { color: '#CCFF00', textAlign: 'center', fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  closeModalBtn: { position: 'absolute', top: 50, right: 20, zIndex: 10, padding: 15 },
  fullScreenImage: { width: '90%', height: '80%', resizeMode: 'contain' }
});