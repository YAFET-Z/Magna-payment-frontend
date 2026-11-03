import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import CustomAlert from '../components/CustomAlert';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'AddExpense'>;
  route: { params: { userId: string; eventId: string; type: 'MEAL' | 'RIDE' } };
};

export default function AddExpenseScreen({ navigation, route }: Props) {
  const { userId, type } = route.params;
  const [amount, setAmount] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [alertConfig, setAlertConfig] = useState({
    visible: false, title: '', message: '', type: 'success' as 'success'|'error'|'confirm',
    onConfirm: () => hideAlert(), onCancel: () => hideAlert()
  });
  const hideAlert = () => setAlertConfig(prev => ({ ...prev, visible: false }));

  const handleImagePick = () => {
    setAlertConfig({
      visible: true,
      title: 'Upload Receipt',
      message: 'How would you like to add your receipt?',
      type: 'confirm',
      onCancel: hideAlert,
      onConfirm: () => {
        hideAlert();
        openGallery();
      }
    });
  };

  const openGallery = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      return setAlertConfig({ visible: true, title: 'Permission Required', message: 'You need to allow gallery access.', type: 'error', onConfirm: hideAlert });
    }
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.5,
      base64: true,
    });
    
    if (!result.canceled && result.assets[0].base64) {
      setImageUri(result.assets[0].uri);
      setImageBase64(result.assets[0].base64);
    }
  };

  const handleSubmit = async () => {
    if (!amount || isNaN(Number(amount))) {
      return setAlertConfig({ visible: true, title: 'Invalid', message: 'Please enter a valid amount.', type: 'error', onConfirm: hideAlert });
    }
    if (!imageBase64) {
      return setAlertConfig({ visible: true, title: 'Missing Receipt', message: 'Please upload a photo or screenshot of your receipt.', type: 'error', onConfirm: hideAlert });
    }

    setIsLoading(true);
    try {
      await axios.post('https://magna-payment-api.onrender.com/api/expenses', {
        eventId: route.params.eventId, 
        workerId: userId,
        amount: parseFloat(amount),
        expenseType: type,
        receiptImageBase64: imageBase64 
      });
      navigation.navigate('WorkerDashboard', { userId });
    } catch (error: any) {
      const serverError = error.response?.data?.error || error.message;
      setAlertConfig({ visible: true, title: 'Upload Failed', message: `Details: ${serverError}`, type: 'error', onConfirm: hideAlert });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add {type === 'MEAL' ? 'Meal' : 'Ride'}</Text>
      <Text style={styles.subtitle}>Log your {type.toLowerCase()} cost for reimbursement.</Text>

      <Text style={styles.label}>AMOUNT (BIRR)</Text>
      <TextInput 
        style={styles.input} 
        placeholder="0.00" 
        placeholderTextColor="#555" 
        keyboardType="numeric" 
        value={amount} 
        onChangeText={setAmount} 
      />

      <Text style={styles.label}>ATTACH RECEIPT</Text>
      <TouchableOpacity style={styles.imageUploadBox} onPress={handleImagePick}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.previewImage} />
        ) : (
          <View style={styles.placeholderBox}>
            <MaterialIcons name="add-a-photo" size={32} color="#555" />
            <Text style={styles.placeholderText}>Tap to add receipt photo</Text>
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={isLoading}>
        {isLoading ? <ActivityIndicator color="#000" /> : <Text style={styles.submitBtnText}>Submit Expense</Text>}
      </TouchableOpacity>

      <CustomAlert 
        visible={alertConfig.visible} 
        title={alertConfig.title} 
        message={alertConfig.message} 
        type={alertConfig.type} 
        onConfirm={alertConfig.onConfirm} 
        onCancel={alertConfig.onCancel}
        confirmText={alertConfig.type === 'confirm' ? "Open Gallery" : "OK"}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D', padding: 25 },
  title: { color: '#FFF', fontSize: 32, fontWeight: 'bold', marginBottom: 10, marginTop: 40 },
  subtitle: { color: '#888', fontSize: 16, marginBottom: 30 },
  label: { color: '#888', fontSize: 10, letterSpacing: 1.5, marginBottom: 10, fontWeight: 'bold' },
  input: { backgroundColor: '#1A1A1A', color: '#FFF', padding: 20, borderRadius: 16, fontSize: 32, fontWeight: 'bold', marginBottom: 25, borderWidth: 1, borderColor: '#222' },
  imageUploadBox: { backgroundColor: '#1A1A1A', borderRadius: 16, borderWidth: 1, borderColor: '#222', borderStyle: 'dashed', height: 180, marginBottom: 25, overflow: 'hidden' },
  placeholderBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  placeholderText: { color: '#555', marginTop: 10, fontSize: 14, fontWeight: 'bold' },
  previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  submitBtn: { backgroundColor: '#CCFF00', padding: 20, borderRadius: 16, alignItems: 'center', marginTop: 10 },
  submitBtnText: { color: '#000', fontSize: 18, fontWeight: 'bold' }
});