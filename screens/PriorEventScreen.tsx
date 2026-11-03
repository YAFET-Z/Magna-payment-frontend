import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, Platform, Image } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'PriorEvent'>;
  route: { params: { userId: string } };
};

export default function PriorEventScreen({ navigation, route }: Props) {
  const { userId } = route.params;
  
  // Core Event State
  const [eventName, setEventName] = useState('');
  const [workerRole, setWorkerRole] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStart, setShowStart] = useState(false);
  const [showEnd, setShowEnd] = useState(false);
  
  // Optional Expenses State
  const [mealAmount, setMealAmount] = useState('');
  const [mealUri, setMealUri] = useState<string | null>(null);
  const [mealBase64, setMealBase64] = useState<string | null>(null);

  const [rideAmount, setRideAmount] = useState('');
  const [rideUri, setRideUri] = useState<string | null>(null);
  const [rideBase64, setRideBase64] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);

  const onChangeStart = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowStart(false);
    if (selectedDate) setStartDate(selectedDate);
  };

  const onChangeEnd = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowEnd(false);
    if (selectedDate) setEndDate(selectedDate);
  };

  const handleImagePick = async (type: 'MEAL' | 'RIDE') => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.5,
      base64: true,
    });
    if (!result.canceled && result.assets[0].base64) {
      if (type === 'MEAL') {
        setMealUri(result.assets[0].uri);
        setMealBase64(result.assets[0].base64);
      } else {
        setRideUri(result.assets[0].uri);
        setRideBase64(result.assets[0].base64);
      }
    }
  };

  const handleSubmit = async () => {
    if (!eventName || !workerRole) return Alert.alert('Required', 'Event Name and Role are required.');
    if (startDate > endDate) return Alert.alert('Invalid Dates', 'Start date cannot be after end date.');

    setIsLoading(true);
    try {
      await axios.post('https://magna-payment-api.onrender.com/api/events/prior', {
        workerId: userId, 
        eventName, 
        workerRole, 
        startDate: startDate.toISOString(), 
        endDate: endDate.toISOString(),
        mealAmount: mealAmount || null,
        mealReceiptBase64: mealBase64 || null,
        rideAmount: rideAmount || null,
        rideReceiptBase64: rideBase64 || null
      });
      Alert.alert('Success', 'Prior event and receipts logged successfully.');
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to submit event.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back-ios" size={14} color="#888" />
          <Text style={styles.backText}>Cancel</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
        <Text style={styles.title}>Log Prior Event.</Text>
        <Text style={styles.subtitle}>Log missed dates and attach any receipts from that shift.</Text>

        <Text style={styles.label}>EVENT DETAILS</Text>
        <TextInput style={styles.input} placeholder="e.g. Tourism Gala" placeholderTextColor="#555" value={eventName} onChangeText={setEventName} />
        <TextInput style={styles.input} placeholder="Your Role (e.g. Rigger)" placeholderTextColor="#555" value={workerRole} onChangeText={setWorkerRole} />

        {/* Date Pickers */}
        <View style={styles.dateRow}>
          <View style={styles.dateCol}>
            <Text style={styles.label}>START DATE</Text>
            <TouchableOpacity style={styles.dateBtn} onPress={() => setShowStart(!showStart)}>
              <Text style={styles.dateText}>{startDate.toLocaleDateString()}</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.dateCol}>
            <Text style={styles.label}>END DATE</Text>
            <TouchableOpacity style={styles.dateBtn} onPress={() => setShowEnd(!showEnd)}>
              <Text style={styles.dateText}>{endDate.toLocaleDateString()}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Themed Native Calendars */}
        {showStart && (
          <View style={styles.calendarContainer}>
            <DateTimePicker 
              value={startDate} 
              mode="date" 
              display={Platform.OS === 'ios' ? 'inline' : 'default'} 
              themeVariant="dark" 
              accentColor="#CCFF00" 
              textColor="#FFFFFF"
              onChange={onChangeStart} 
            />
          </View>
        )}
        
        {showEnd && (
          <View style={styles.calendarContainer}>
            <DateTimePicker 
              value={endDate} 
              mode="date" 
              display={Platform.OS === 'ios' ? 'inline' : 'default'} 
              themeVariant="dark" 
              accentColor="#CCFF00" 
              textColor="#FFFFFF"
              onChange={onChangeEnd} 
            />
          </View>
        )}

        <View style={styles.divider} />

        {/* Optional Expenses */}
        <Text style={styles.label}>MEAL EXPENSE (OPTIONAL)</Text>
        <TextInput style={styles.input} placeholder="Amount (Birr)" placeholderTextColor="#555" value={mealAmount} onChangeText={setMealAmount} keyboardType="numeric" />
        <TouchableOpacity style={styles.uploadBtn} onPress={() => handleImagePick('MEAL')}>
          {mealUri ? <Image source={{ uri: mealUri }} style={styles.thumb} /> : <Text style={styles.uploadText}>+ Upload Meal Receipt</Text>}
        </TouchableOpacity>

        <Text style={[styles.label, { marginTop: 20 }]}>TRANSPORT EXPENSE (OPTIONAL)</Text>
        <TextInput style={styles.input} placeholder="Amount (Birr)" placeholderTextColor="#555" value={rideAmount} onChangeText={setRideAmount} keyboardType="numeric" />
        <TouchableOpacity style={styles.uploadBtn} onPress={() => handleImagePick('RIDE')}>
          {rideUri ? <Image source={{ uri: rideUri }} style={styles.thumb} /> : <Text style={styles.uploadText}>+ Upload Taxi Screenshot</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={isLoading}>
          {isLoading ? <ActivityIndicator color="#000" /> : <Text style={styles.submitBtnText}>Submit Event & Receipts</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D', paddingHorizontal: 25 },
  header: { flexDirection: 'row', alignItems: 'center', marginTop: 50, marginBottom: 30 },
  backBtn: { flexDirection: 'row', alignItems: 'center' },
  backText: { color: '#888', fontSize: 12, marginLeft: 4, fontWeight: 'bold' },
  title: { color: '#FFF', fontSize: 32, fontWeight: 'bold', marginBottom: 10 },
  subtitle: { color: '#888', fontSize: 14, marginBottom: 30 },
  label: { color: '#888', fontSize: 10, letterSpacing: 1.5, marginBottom: 10, fontWeight: 'bold' },
  input: { backgroundColor: '#1A1A1A', color: '#FFF', padding: 20, borderRadius: 16, fontSize: 16, marginBottom: 15, borderWidth: 1, borderColor: '#222' },
  dateRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  dateCol: { flex: 0.48 },
  dateBtn: { backgroundColor: '#1A1A1A', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#222', alignItems: 'center' },
  dateText: { color: '#CCFF00', fontSize: 16, fontWeight: 'bold' },
  calendarContainer: { backgroundColor: '#1A1A1A', borderRadius: 16, padding: 10, marginBottom: 15, borderWidth: 1, borderColor: '#222' },
  divider: { height: 1, backgroundColor: '#222', marginVertical: 25 },
  uploadBtn: { backgroundColor: '#1A1A1A', height: 80, borderRadius: 16, borderWidth: 1, borderColor: '#333', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  uploadText: { color: '#888', fontSize: 14, fontWeight: 'bold' },
  thumb: { width: '100%', height: '100%', resizeMode: 'cover' },
  submitBtn: { backgroundColor: '#CCFF00', padding: 20, borderRadius: 16, alignItems: 'center', marginTop: 40 },
  submitBtnText: { color: '#000', fontSize: 18, fontWeight: 'bold' }
});