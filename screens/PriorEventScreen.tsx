import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, Platform, Image } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import CustomAlert from '../components/CustomAlert'; // NEW: Imported your custom alert

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'PriorEvent'>;
  route: { params: { userId: string } };
};

export default function PriorEventScreen({ navigation, route }: Props) {
  const { userId } = route.params;
  
  const [eventName, setEventName] = useState('');
  const [workerRole, setWorkerRole] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStart, setShowStart] = useState(false);
  const [showEnd, setShowEnd] = useState(false);
  
  const [mealAmount, setMealAmount] = useState('');
  const [mealImages, setMealImages] = useState<{uri: string, base64: string}[]>([]);
  const [rideAmount, setRideAmount] = useState('');
  const [rideImages, setRideImages] = useState<{uri: string, base64: string}[]>([]);

  const [isLoading, setIsLoading] = useState(false);

  // NEW: Custom Alert State
  const [alertConfig, setAlertConfig] = useState({
    visible: false, title: '', message: '', type: 'success' as 'success'|'error',
    onConfirm: () => hideAlert()
  });
  const hideAlert = () => setAlertConfig(prev => ({ ...prev, visible: false }));

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
      allowsMultipleSelection: true, 
    });
    
    if (!result.canceled && result.assets) {
      const newImages = result.assets.filter(a => a.base64).map(a => ({ uri: a.uri, base64: a.base64 as string }));
      if (type === 'MEAL') setMealImages(prev => [...prev, ...newImages]);
      else setRideImages(prev => [...prev, ...newImages]);
    }
  };

  const removeImage = (type: 'MEAL' | 'RIDE', indexToRemove: number) => {
    if (type === 'MEAL') setMealImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
    else setRideImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async () => {
    if (!eventName || !workerRole) {
      return setAlertConfig({ visible: true, title: 'Required', message: 'Event Name and Role are required.', type: 'error', onConfirm: hideAlert });
    }
    if (startDate > endDate) {
      return setAlertConfig({ visible: true, title: 'Invalid Dates', message: 'Start date cannot be after end date.', type: 'error', onConfirm: hideAlert });
    }

    setIsLoading(true);
    try {
      const mealBase64List = mealImages.map(img => img.base64);
      const rideBase64List = rideImages.map(img => img.base64);

      await axios.post('https://magna-payment-api.onrender.com/api/events/prior', {
        workerId: userId, eventName, workerRole, 
        startDate: startDate.toISOString(), endDate: endDate.toISOString(),
        mealAmount: mealAmount || null, mealReceiptsBase64: mealBase64List.length > 0 ? mealBase64List : null,
        rideAmount: rideAmount || null, rideReceiptsBase64: rideBase64List.length > 0 ? rideBase64List : null
      });
      
      setAlertConfig({ 
        visible: true, title: 'Success', message: 'Prior event and receipts logged successfully.', type: 'success', 
        onConfirm: () => { hideAlert(); navigation.goBack(); } 
      });
    } catch (error: any) {
      setAlertConfig({ visible: true, title: 'Error', message: error.response?.data?.error || 'Failed to submit event.', type: 'error', onConfirm: hideAlert });
    } finally {
      setIsLoading(false);
    }
  };

  const renderImageScroller = (images: {uri: string}[], type: 'MEAL' | 'RIDE') => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScrollContainer}>
      <TouchableOpacity style={styles.addMoreBtn} onPress={() => handleImagePick(type)}>
        <MaterialIcons name="add-photo-alternate" size={24} color="#888" />
        <Text style={styles.addMoreText}>Add</Text>
      </TouchableOpacity>
      {images.map((img, index) => (
        <View key={index} style={styles.imageWrapper}>
          <Image source={{ uri: img.uri }} style={styles.thumb} />
          <TouchableOpacity style={styles.removeBtn} onPress={() => removeImage(type, index)}>
            <MaterialIcons name="close" size={16} color="#FFF" />
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );

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

        {showStart && (
          <View style={styles.calendarContainer}>
            <DateTimePicker value={startDate} mode="date" display={Platform.OS === 'ios' ? 'inline' : 'default'} themeVariant="dark" accentColor="#CCFF00" textColor="#FFFFFF" onChange={onChangeStart} />
          </View>
        )}
        {showEnd && (
          <View style={styles.calendarContainer}>
            <DateTimePicker value={endDate} mode="date" display={Platform.OS === 'ios' ? 'inline' : 'default'} themeVariant="dark" accentColor="#CCFF00" textColor="#FFFFFF" onChange={onChangeEnd} />
          </View>
        )}

        <View style={styles.divider} />

        <Text style={styles.label}>MEAL EXPENSE TOTAL (OPTIONAL)</Text>
        <TextInput style={styles.input} placeholder="Amount (Birr)" placeholderTextColor="#555" value={mealAmount} onChangeText={setMealAmount} keyboardType="numeric" />
        {mealImages.length === 0 ? (
          <TouchableOpacity style={styles.uploadBtn} onPress={() => handleImagePick('MEAL')}>
            <Text style={styles.uploadText}>+ Upload Meal Receipt(s)</Text>
          </TouchableOpacity>
        ) : renderImageScroller(mealImages, 'MEAL')}

        <View style={styles.divider} />

        <Text style={styles.label}>TRANSPORT EXPENSE TOTAL (OPTIONAL)</Text>
        <TextInput style={styles.input} placeholder="Amount (Birr)" placeholderTextColor="#555" value={rideAmount} onChangeText={setRideAmount} keyboardType="numeric" />
        {rideImages.length === 0 ? (
          <TouchableOpacity style={styles.uploadBtn} onPress={() => handleImagePick('RIDE')}>
            <Text style={styles.uploadText}>+ Upload Taxi Screenshot(s)</Text>
          </TouchableOpacity>
        ) : renderImageScroller(rideImages, 'RIDE')}

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={isLoading}>
          {isLoading ? <ActivityIndicator color="#000" /> : <Text style={styles.submitBtnText}>Submit Event & Receipts</Text>}
        </TouchableOpacity>
      </ScrollView>

      {/* NEW: Custom Alert Component Mounted Here */}
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
  divider: { height: 1, backgroundColor: '#222', marginVertical: 20 },
  uploadBtn: { backgroundColor: '#1A1A1A', height: 80, borderRadius: 16, borderWidth: 1, borderColor: '#333', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  uploadText: { color: '#888', fontSize: 14, fontWeight: 'bold' },
  imageScrollContainer: { flexDirection: 'row', marginBottom: 10 },
  addMoreBtn: { width: 80, height: 80, backgroundColor: '#1A1A1A', borderRadius: 12, borderWidth: 1, borderColor: '#333', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  addMoreText: { color: '#888', fontSize: 10, marginTop: 4, fontWeight: 'bold' },
  imageWrapper: { width: 80, height: 80, borderRadius: 12, overflow: 'hidden', marginRight: 15, borderWidth: 1, borderColor: '#333' },
  thumb: { width: '100%', height: '100%', resizeMode: 'cover' },
  removeBtn: { position: 'absolute', top: 5, right: 5, backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 10, padding: 2 },
  submitBtn: { backgroundColor: '#CCFF00', padding: 20, borderRadius: 16, alignItems: 'center', marginTop: 30 },
  submitBtnText: { color: '#000', fontSize: 18, fontWeight: 'bold' }
});