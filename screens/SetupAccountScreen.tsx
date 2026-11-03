import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import axios from 'axios';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'SetupAccount'>;
  route: { params: { userId: string; role: string } };
};

export default function SetupAccountScreen({ navigation, route }: Props) {
  const { userId, role } = route.params;
  const isWorker = role === 'WORKER';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [telebirr, setTelebirr] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSetup = async () => {
    if (!password || password !== confirmPassword) {
      return Alert.alert('Error', 'Passwords must match and cannot be empty.');
    }
    if (isWorker && !bankAccount && !telebirr) {
       return Alert.alert('Required', 'Please provide at least one payout method (Bank Account or Telebirr).');
    }

    setIsLoading(true);
    try {
      await axios.put(`https://magna-payment-api.onrender.com/api/users/setup/${userId}`, {
        password, bankAccount: isWorker ? bankAccount : null, telebirr: isWorker ? telebirr : null
      });
      
      Alert.alert('Success', 'Your account is ready.');
      if (role === 'MANAGER') {
        navigation.replace('ManagerPortal', { adminId: userId });
      } else {
        navigation.replace('WorkerDashboard', { userId });
      }
    } catch (error: any) {
      Alert.alert('Setup Failed', error.response?.data?.error || 'Server error.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 60, paddingBottom: 40 }}>
        <Text style={styles.title}>Welcome to Magna.</Text>
        <Text style={styles.subtitle}>Please update your password to secure your account.</Text>

        <Text style={styles.label}>NEW PASSWORD</Text>
        <TextInput style={styles.input} placeholder="Enter a secure password" placeholderTextColor="#555" value={password} onChangeText={setPassword} secureTextEntry />

        <Text style={styles.label}>CONFIRM PASSWORD</Text>
        <TextInput style={styles.input} placeholder="Type password again" placeholderTextColor="#555" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />

        {isWorker && (
          <>
            <Text style={styles.label}>BANK ACCOUNT (CBE / AWASH)</Text>
            <TextInput style={styles.input} placeholder="Account Number" placeholderTextColor="#555" value={bankAccount} onChangeText={setBankAccount} keyboardType="numeric" />

            <Text style={styles.label}>TELEBIRR NUMBER</Text>
            <TextInput style={styles.input} placeholder="09XX XXX XXX" placeholderTextColor="#555" value={telebirr} onChangeText={setTelebirr} keyboardType="phone-pad" />
          </>
        )}

        <TouchableOpacity style={styles.submitBtn} onPress={handleSetup} disabled={isLoading}>
          {isLoading ? <ActivityIndicator color="#000" /> : <Text style={styles.submitBtnText}>Complete Setup  →</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D', paddingHorizontal: 25 },
  title: { color: '#FFF', fontSize: 36, fontWeight: 'bold', marginBottom: 10, lineHeight: 42 },
  subtitle: { color: '#888', fontSize: 16, marginBottom: 30 },
  label: { color: '#888', fontSize: 10, letterSpacing: 1.5, marginBottom: 10, fontWeight: 'bold', marginTop: 10 },
  input: { backgroundColor: '#1A1A1A', color: '#FFF', padding: 20, borderRadius: 16, fontSize: 16, marginBottom: 15, borderWidth: 1, borderColor: '#222' },
  submitBtn: { backgroundColor: '#CCFF00', padding: 20, borderRadius: 16, alignItems: 'center', marginTop: 20 },
  submitBtnText: { color: '#000', fontSize: 18, fontWeight: 'bold' }
});