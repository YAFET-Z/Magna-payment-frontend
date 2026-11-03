import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'NewEvent'>;
  route: { params: { userId: string } };
};

export default function NewEventScreen({ navigation, route }: Props) {
  const { userId } = route.params;
  const [eventName, setEventName] = useState('');
  const [workerRole, setWorkerRole] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleStartEvent = async () => {
    if (!eventName || !workerRole) return Alert.alert('Required', 'Please fill in both fields.');

    setIsLoading(true);
    try {
      await axios.post('https://magna-payment-api.onrender.com/api/events/start', {
        workerId: userId,
        eventName,
        workerRole
      });
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Could not start event.');
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

      <Text style={styles.title}>Start a new shift.</Text>
      <Text style={styles.subtitle}>Tell us where you are working.</Text>

      <Text style={styles.label}>EVENT NAME</Text>
      <TextInput style={styles.input} placeholder="e.g. Tourism Week Setup" placeholderTextColor="#555" value={eventName} onChangeText={setEventName} />

      <Text style={styles.label}>YOUR ROLE</Text>
      <TextInput style={styles.input} placeholder="e.g. Rigger, Sound Tech" placeholderTextColor="#555" value={workerRole} onChangeText={setWorkerRole} />

      <TouchableOpacity style={styles.submitBtn} onPress={handleStartEvent} disabled={isLoading}>
        {isLoading ? <ActivityIndicator color="#000" /> : <Text style={styles.submitBtnText}>Start Event Clock</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D', paddingHorizontal: 25 },
  header: { flexDirection: 'row', alignItems: 'center', marginTop: 50, marginBottom: 30 },
  backBtn: { flexDirection: 'row', alignItems: 'center' },
  backText: { color: '#888', fontSize: 12, marginLeft: 4, fontWeight: 'bold' },
  title: { color: '#FFF', fontSize: 36, fontWeight: 'bold', marginBottom: 10, lineHeight: 42 },
  subtitle: { color: '#888', fontSize: 16, marginBottom: 30 },
  label: { color: '#888', fontSize: 10, letterSpacing: 1.5, marginBottom: 10, fontWeight: 'bold' },
  input: { backgroundColor: '#1A1A1A', color: '#FFF', padding: 20, borderRadius: 16, fontSize: 16, marginBottom: 25, borderWidth: 1, borderColor: '#222' },
  submitBtn: { backgroundColor: '#CCFF00', padding: 20, borderRadius: 16, alignItems: 'center', marginTop: 10 },
  submitBtnText: { color: '#000', fontSize: 18, fontWeight: 'bold' }
});