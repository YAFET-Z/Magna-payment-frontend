import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Image, Modal, ScrollView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import CustomAlert from '../components/CustomAlert';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'ManageExpense'>;
  route: { params: { expense: any; userId: string } };
};

export default function ManageExpenseScreen({ navigation, route }: Props) {
  const { expense } = route.params;
  const [amount, setAmount] = useState(expense.amount.toString());
  const [isLoading, setIsLoading] = useState(false);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);

  // Custom Alert State
  const [alertConfig, setAlertConfig] = useState({
    visible: false, title: '', message: '', type: 'success' as 'success'|'error'|'confirm',
    onConfirm: () => hideAlert(), onCancel: () => hideAlert()
  });
  const hideAlert = () => setAlertConfig(prev => ({ ...prev, visible: false }));

  const isSettled = expense.status === 'SETTLED';
  const eventNameDisplay = expense.event?.eventName || "General Expenses";

  const handleUpdate = async () => {
    if (!amount) return;
    setIsLoading(true);
    try {
      await axios.put(`https://magna-payment-api.onrender.com/api/expenses/${expense.id}`, { amount });
      setAlertConfig({
        visible: true, title: 'Updated', message: 'Expense updated successfully.', type: 'success',
        onConfirm: () => { hideAlert(); navigation.goBack(); }
      });
    } catch (error: any) { 
      setAlertConfig({ visible: true, title: 'Error', message: 'Could not update.', type: 'error', onConfirm: hideAlert });
    } finally { 
      setIsLoading(false); 
    }
  };

  const promptDelete = () => {
    setAlertConfig({
      visible: true,
      title: 'Confirm Delete',
      message: 'Are you sure you want to delete this expense log?',
      type: 'confirm',
      onCancel: hideAlert,
      onConfirm: async () => {
        hideAlert();
        setIsLoading(true);
        try {
          await axios.delete(`https://magna-payment-api.onrender.com/api/expenses/${expense.id}`);
          navigation.goBack();
        } catch (err) { 
          setTimeout(() => setAlertConfig({ visible: true, title: 'Error', message: 'Could not delete.', type: 'error', onConfirm: hideAlert }), 500);
          setIsLoading(false); 
        }
      }
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back-ios" size={14} color="#888" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView contentContainerStyle={{ paddingHorizontal: 25, paddingBottom: 50 }}>
        
        <View style={styles.titleBlock}>
          <Text style={styles.title}>{expense.expenseType === 'MEAL' ? 'Meal' : 'Transport'} Log</Text>
          <Text style={styles.subtitle}>Logged on {new Date(expense.createdAt).toLocaleDateString()}</Text>
          <View style={styles.eventBadge}>
            <MaterialIcons name="event" size={14} color="#CCFF00" />
            <Text style={styles.eventNameText}>{eventNameDisplay}</Text>
          </View>
        </View>

        <Text style={styles.label}>RECEIPT ATTACHED</Text>
        <TouchableOpacity 
          style={styles.receiptBox} 
          onPress={() => expense.receiptImageUrl && expense.receiptImageUrl.startsWith('http') && setFullScreenImage(expense.receiptImageUrl)}
        >
          {expense.receiptImageUrl && expense.receiptImageUrl.startsWith('http') ? (
             <Image source={{ uri: expense.receiptImageUrl }} style={styles.receiptThumb} />
          ) : (
            <View style={styles.noReceiptBox}><Text style={{color: '#555', fontWeight: 'bold'}}>No Receipt Uploaded</Text></View>
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
          <View style={styles.settledBadge}>
            <MaterialIcons name="verified" size={24} color="#CCFF00" style={{ marginBottom: 10 }} />
            <Text style={styles.settledText}>This expense has been verified and settled.</Text>
            <Text style={styles.settledSubtext}>Modifications are locked for accounting purposes.</Text>
            
            {expense.settlementReceiptUrl && expense.settlementReceiptUrl.startsWith('http') && (
              <TouchableOpacity style={styles.viewProofBtn} onPress={() => setFullScreenImage(expense.settlementReceiptUrl)}>
                <MaterialIcons name="receipt" size={16} color="#000" />
                <Text style={styles.viewProofBtnText}>View Payment Proof</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <>
            <TouchableOpacity style={styles.updateBtn} onPress={handleUpdate} disabled={isLoading}>
              {isLoading ? <ActivityIndicator color="#000" /> : <Text style={styles.updateBtnText}>Save Changes</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteBtn} onPress={promptDelete} disabled={isLoading}>
              <Text style={styles.deleteBtnText}>Delete Log</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* Full Screen Image Modal */}
      <Modal visible={!!fullScreenImage} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.closeModalBtn} onPress={() => setFullScreenImage(null)}>
            <MaterialIcons name="close" size={32} color="#FFF" />
          </TouchableOpacity>
          {fullScreenImage && (
             <Image source={{ uri: fullScreenImage }} style={styles.fullScreenImage} />
          )}
        </View>
      </Modal>

      {/* Custom Alert Mounted Here */}
      <CustomAlert 
        visible={alertConfig.visible} 
        title={alertConfig.title} 
        message={alertConfig.message} 
        type={alertConfig.type} 
        onConfirm={alertConfig.onConfirm} 
        onCancel={alertConfig.onCancel}
        confirmText={alertConfig.type === 'confirm' ? "Delete" : "OK"}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 25, paddingTop: 50 },
  backBtn: { flexDirection: 'row', alignItems: 'center' },
  backText: { color: '#888', fontSize: 12, marginLeft: 4, fontWeight: 'bold' },
  titleBlock: { marginBottom: 30 },
  title: { color: '#FFF', fontSize: 32, fontWeight: 'bold' },
  subtitle: { color: '#888', fontSize: 14, marginBottom: 15 },
  eventBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1A1A', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#222' },
  eventNameText: { color: '#CCFF00', fontSize: 12, fontWeight: 'bold', marginLeft: 6 },
  
  label: { color: '#888', fontSize: 10, letterSpacing: 1.5, marginBottom: 10, fontWeight: 'bold' },
  input: { backgroundColor: '#1A1A1A', color: '#FFF', padding: 20, borderRadius: 16, fontSize: 16, marginBottom: 25, borderWidth: 1, borderColor: '#222' },
  receiptBox: { height: 200, backgroundColor: '#1A1A1A', borderRadius: 16, marginBottom: 25, overflow: 'hidden', borderWidth: 1, borderColor: '#222' },
  receiptThumb: { width: '100%', height: '100%', resizeMode: 'cover' },
  noReceiptBox: { flex: 1, justifyContent: 'center', alignItems: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: '#333', borderRadius: 16 },
  
  updateBtn: { backgroundColor: '#CCFF00', padding: 20, borderRadius: 16, alignItems: 'center', marginBottom: 15 },
  updateBtnText: { color: '#000', fontSize: 16, fontWeight: 'bold' },
  deleteBtn: { backgroundColor: '#1A1A1A', padding: 20, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#FF3B30' },
  deleteBtnText: { color: '#FF3B30', fontSize: 16, fontWeight: 'bold' },
  
  settledBadge: { backgroundColor: '#1f2600', padding: 25, borderRadius: 16, borderWidth: 1, borderColor: '#CCFF00', alignItems: 'center' },
  settledText: { color: '#CCFF00', textAlign: 'center', fontWeight: 'bold', fontSize: 14, marginBottom: 5 },
  settledSubtext: { color: '#888', textAlign: 'center', fontSize: 12 },
  
  viewProofBtn: { backgroundColor: '#CCFF00', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 8, marginTop: 15 },
  viewProofBtnText: { color: '#000', fontSize: 14, fontWeight: 'bold', marginLeft: 8 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  closeModalBtn: { position: 'absolute', top: 50, right: 20, zIndex: 10, padding: 15 },
  fullScreenImage: { width: '90%', height: '80%', resizeMode: 'contain' }
});