import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'RegisterUser'>;
};

export default function RegisterUserScreen({ navigation }: Props) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'WORKER' | 'MANAGER'>('WORKER');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    if (!fullName || !email || !password) return Alert.alert('Required', 'Name, email, and password are required.');

    setIsLoading(true);
    try {
      await axios.post('https://magna-payment-api.onrender.com/api/users/register', {
        fullName, email, password, role
      });
      Alert.alert('Success', `${fullName} has been added to the system.`);
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Registration Failed', error.response?.data?.error || 'Server error.');
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

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <Text style={styles.title}>Add Team Member</Text>
        <Text style={styles.subtitle}>Register a new worker or manager to the workspace.</Text>

        <Text style={styles.label}>ROLE</Text>
        <View style={styles.roleContainer}>
          <TouchableOpacity 
            style={[styles.roleBtn, role === 'WORKER' && styles.roleBtnActive]} 
            onPress={() => setRole('WORKER')}
          >
            <Text style={[styles.roleBtnText, role === 'WORKER' && styles.roleBtnTextActive]}>Worker</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.roleBtn, role === 'MANAGER' && styles.roleBtnActive]} 
            onPress={() => setRole('MANAGER')}
          >
            <Text style={[styles.roleBtnText, role === 'MANAGER' && styles.roleBtnTextActive]}>Manager</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>FULL NAME</Text>
        <TextInput style={styles.input} placeholder="e.g. Abel Tesfaye" placeholderTextColor="#555" value={fullName} onChangeText={setFullName} />

        <Text style={styles.label}>EMAIL ADDRESS</Text>
        <TextInput style={styles.input} placeholder="worker@magnapay.com" placeholderTextColor="#555" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />

        <Text style={styles.label}>TEMPORARY PASSWORD</Text>
        <TextInput style={styles.input} placeholder="Enter password" placeholderTextColor="#555" value={password} onChangeText={setPassword} secureTextEntry />

        <TouchableOpacity style={styles.submitBtn} onPress={handleRegister} disabled={isLoading}>
          {isLoading ? <ActivityIndicator color="#000" /> : <Text style={styles.submitBtnText}>Register User</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D', paddingHorizontal: 25 },
  header: { flexDirection: 'row', alignItems: 'center', marginTop: 50, marginBottom: 20 },
  backBtn: { flexDirection: 'row', alignItems: 'center' },
  backText: { color: '#888', fontSize: 12, marginLeft: 4, fontWeight: 'bold' },
  title: { color: '#FFF', fontSize: 32, fontWeight: 'bold', marginBottom: 5 },
  subtitle: { color: '#888', fontSize: 14, marginBottom: 30 },
  label: { color: '#888', fontSize: 10, letterSpacing: 1.5, marginBottom: 10, fontWeight: 'bold', marginTop: 10 },
  input: { backgroundColor: '#1A1A1A', color: '#FFF', padding: 20, borderRadius: 16, fontSize: 16, marginBottom: 15, borderWidth: 1, borderColor: '#222' },
  roleContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  roleBtn: { flex: 1, backgroundColor: '#1A1A1A', padding: 15, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#222', marginHorizontal: 5 },
  roleBtnActive: { backgroundColor: '#CCFF00', borderColor: '#CCFF00' },
  roleBtnText: { color: '#888', fontWeight: 'bold' },
  roleBtnTextActive: { color: '#000' },
  submitBtn: { backgroundColor: '#CCFF00', padding: 20, borderRadius: 16, alignItems: 'center', marginTop: 20 },
  submitBtnText: { color: '#000', fontSize: 18, fontWeight: 'bold' }
});