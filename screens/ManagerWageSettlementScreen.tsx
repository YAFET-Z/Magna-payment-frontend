import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Image, ScrollView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'ManagerWageSettlement'>;
  route: { params: { eventId: string; eventName: string; workerName: string; totalAmount: number; bankAccount: string | null; telebirr: string | null; days: number; wageRate: number } };
};

export default function ManagerWageSettlementScreen({ navigation, route }: Props) {
  const { eventId, eventName, workerName, totalAmount, bankAccount, telebirr, days, wageRate } = route.params;
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
    if (!imageBase64) return Alert.alert('Missing File', 'Please attach the proof of payment receipt.');

    setIsLoading(true);
    try {
      await axios.put(`https://magna-payments-api.onrender.com/api/finance/settle-wage/${eventId}`, {
        wageSettlementBase64: imageBase64 
      });
      Alert.alert('Success', `Payroll for ${eventName} has been settled.`);
      navigation.reset({ index: 0, routes: [{ name: 'Login' }, { name: 'ManagerPortal', params: { adminId: 'manager' } }] });
    } catch (error: any) {
      Alert.alert('Upload Failed', error.response?.data?.error || 'Server error.');
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
        <Text style={styles.headerName} numberOfLines={1}>Payroll: {workerName}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.calcBox}>
          <Text style={styles.calcTitle} numberOfLines={1}>{eventName}</Text>
          <Text style={styles.calcSub}>{days} Days @ {wageRate} Birr/Day</Text>
        </View>

        <Text style={styles.label}>TOTAL WAGE DUE</Text>
        <Text style={styles.amountText}>{totalAmount.toLocaleString()} <Text style={styles.currencyText}>Birr</Text></Text>

        <Text style={styles.label}>PAYOUT DESTINATIONS</Text>
        <View style={styles.bankCard}>
          <View style={styles.bankRow}>
            <MaterialIcons name="account-balance" size={20} color="#888" />
            <Text style={styles.bankText}>Bank Account:</Text>
            <Text style={styles.bankValue} numberOfLines={1}>{bankAccount || 'Not Provided'}</Text>
          </View>
          <View style={styles.bankRow}>
            <MaterialIcons name="phone-android" size={20} color="#888" />
            <Text style={styles.bankText}>Telebirr:</Text>
            <Text style={styles.bankValue} numberOfLines={1}>{telebirr || 'Not Provided'}</Text>
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
          {isLoading ? <ActivityIndicator color="#000" /> : <Text style={styles.submitBtnText}>Confirm Payroll Transfer</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 40, borderBottomWidth: 1, borderBottomColor: '#1A1A1A' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1A1A1A', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  headerName: { color: '#FFF', fontSize: 18, fontWeight: 'bold', flex: 1 },
  scrollContent: { padding: 25, paddingBottom: 50 },
  calcBox: { backgroundColor: '#1A1A1A', padding: 20, borderRadius: 12, marginBottom: 25, borderLeftWidth: 4, borderLeftColor: '#CCFF00' },
  calcTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  calcSub: { color: '#888', fontSize: 12, marginTop: 4 },
  label: { color: '#888', fontSize: 10, letterSpacing: 1.5, marginBottom: 10, fontWeight: 'bold' },
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