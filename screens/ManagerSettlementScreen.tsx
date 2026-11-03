import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Image, ScrollView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import CustomAlert from '../components/CustomAlert';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'ManagerSettlement'>;
  route: { params: { workerId: string; workerName: string; totalAmount: number; bankAccount: string | null; telebirr: string | null } };
};

export default function ManagerSettlementScreen({ navigation, route }: Props) {
  const { workerId, workerName, totalAmount, bankAccount, telebirr } = route.params;
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [alertConfig, setAlertConfig] = useState({
    visible: false, title: '', message: '', type: 'success' as 'success'|'error',
    onConfirm: () => hideAlert()
  });
  const hideAlert = () => setAlertConfig(prev => ({ ...prev, visible: false }));

  const handleImagePick = async () => {
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

  const submitSettlement = async () => {
    if (!imageBase64) {
      return setAlertConfig({ visible: true, title: 'Missing File', message: 'Please attach the proof of payment receipt.', type: 'error', onConfirm: hideAlert });
    }

    setIsLoading(true);
    try {
      await axios.put(`https://magna-payment-api.onrender.com/api/expenses/settle/${workerId}`, {
        settlementReceiptBase64: imageBase64 
      });
      setAlertConfig({
        visible: true, title: 'Success', message: `${workerName}'s balance has been settled.`, type: 'success',
        onConfirm: () => {
          hideAlert();
          navigation.reset({ index: 0, routes: [{ name: 'Login' }, { name: 'ManagerPortal', params: { adminId: 'manager' } }] });
        }
      });
    } catch (error: any) {
      setAlertConfig({ visible: true, title: 'Upload Failed', message: error.response?.data?.error || 'Server error.', type: 'error', onConfirm: hideAlert });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back-ios" size={16} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerName}>Settle {workerName}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.label}>AMOUNT DUE</Text>
        <Text style={styles.amountText}>{totalAmount.toLocaleString()} <Text style={styles.currencyText}>Birr</Text></Text>

        <Text style={styles.label}>PAYOUT DESTINATIONS</Text>
        <View style={styles.bankCard}>
          <View style={styles.bankRow}>
            <MaterialIcons name="account-balance" size={20} color="#888" />
            <Text style={styles.bankText}>Bank Account:</Text>
            <Text style={styles.bankValue}>{bankAccount || 'Not Provided'}</Text>
          </View>
          <View style={styles.bankRow}>
            <MaterialIcons name="phone-android" size={20} color="#888" />
            <Text style={styles.bankText}>Telebirr:</Text>
            <Text style={styles.bankValue}>{telebirr || 'Not Provided'}</Text>
          </View>
        </View>

        <Text style={styles.label}>ATTACH PROOF OF PAYMENT</Text>
        <TouchableOpacity style={styles.imageUploadBox} onPress={handleImagePick}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.previewImage} />
          ) : (
            <View style={styles.placeholderBox}>
              <MaterialIcons name="upload-file" size={32} color="#555" />
              <Text style={styles.placeholderText}>Upload Bank/Telebirr Screenshot</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.submitBtn} onPress={submitSettlement} disabled={isLoading}>
          {isLoading ? <ActivityIndicator color="#000" /> : <Text style={styles.submitBtnText}>Confirm Settlement</Text>}
        </TouchableOpacity>
      </ScrollView>

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
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 40, borderBottomWidth: 1, borderBottomColor: '#1A1A1A' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1A1A1A', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  headerName: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  scrollContent: { padding: 25, paddingBottom: 50 },
  label: { color: '#888', fontSize: 10, letterSpacing: 1.5, marginBottom: 10, fontWeight: 'bold', marginTop: 10 },
  amountText: { color: '#FFF', fontSize: 44, fontWeight: 'bold', marginBottom: 20 },
  currencyText: { color: '#CCFF00', fontSize: 20 },
  bankCard: { backgroundColor: '#1A1A1A', padding: 20, borderRadius: 16, marginBottom: 30, borderWidth: 1, borderColor: '#222' },
  bankRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 8 },
  bankText: { color: '#888', fontSize: 14, marginLeft: 10, width: 100 },
  bankValue: { color: '#FFF', fontSize: 16, fontWeight: 'bold', flex: 1, textAlign: 'right' },
  imageUploadBox: { backgroundColor: '#1A1A1A', borderRadius: 16, borderWidth: 1, borderColor: '#222', borderStyle: 'dashed', height: 250, marginBottom: 25, overflow: 'hidden' },
  placeholderBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  placeholderText: { color: '#555', marginTop: 10, fontSize: 14, fontWeight: 'bold' },
  previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  submitBtn: { backgroundColor: '#CCFF00', padding: 20, borderRadius: 16, alignItems: 'center', marginTop: 10 },
  submitBtnText: { color: '#000', fontSize: 18, fontWeight: 'bold' }
});