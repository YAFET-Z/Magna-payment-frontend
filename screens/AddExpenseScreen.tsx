import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Image } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';

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

  const handleImagePick = () => {
    Alert.alert('Upload Receipt', 'How would you like to add your receipt?', [
      { text: 'Take Photo', onPress: openCamera },
      { text: 'Choose from Gallery', onPress: openGallery },
      { text: 'Cancel', style: 'cancel' }
    ]);
  };

  const openCamera = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) return Alert.alert('Permission Required', 'You need to allow camera access.');
    
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.5,
      base64: true, // Ask Expo to extract the raw image data
    });
    
    if (!result.canceled && result.assets[0].base64) {
      setImageUri(result.assets[0].uri);
      setImageBase64(result.assets[0].base64);
    }
  };

  const openGallery = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) return Alert.alert('Permission Required', 'You need to allow gallery access.');
    
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
    if (!amount || isNaN(Number(amount))) return Alert.alert('Invalid', 'Please enter a valid amount.');
    if (!imageBase64) return Alert.alert('Missing Receipt', 'Please upload a photo or screenshot of your receipt.');

    setIsLoading(true);
    // Inside handleSubmit of AddExpenseScreen.tsx
    try {
      await axios.post('https://magna-payment-api.onrender.com/api/expenses', {
        eventId: route.params.eventId, // <-- Now attaches directly to the active event!
        workerId: userId,
        amount: parseFloat(amount),
        expenseType: type,
        receiptImageBase64: imageBase64 
      });
      navigation.navigate('WorkerDashboard', { userId });
    } catch (error: any) {
      const serverError = error.response?.data?.error || error.message;
      Alert.alert('Upload Failed', `Details: ${serverError}`);
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D', padding: 25 },
  title: { color: '#FFF', fontSize: 32, fontWeight: 'bold', marginBottom: 10 },
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