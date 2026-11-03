import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Image } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import axios from 'axios';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Login'>;
};

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      return Alert.alert('Required', 'Please enter both email and password.');
    }

    setIsLoading(true);
    try {
      const response = await axios.post('https://magna-payment-api.onrender.com/api/auth/login', {
        email: email.trim().toLowerCase(),
        password: password
      });

      const user = response.data;

      // Force setup if flag is true
      if (user.requiresSetup) {
        navigation.replace('SetupAccount', { userId: user.id, role: user.role });
      } else {
        if (user.role === 'MANAGER') {
          navigation.replace('ManagerPortal', { adminId: user.id });
        } else {
          navigation.replace('WorkerDashboard', { userId: user.id });
        }
      }
    } catch (error: any) {
      Alert.alert('Access Denied', error.response?.data?.error || 'Unable to connect to server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.brandContainer}>
        <Image source={require('../assets/logo.png')} style={styles.logoImage} />
        <Text style={styles.brandName}>MAGNA PAYMENTS</Text>
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.title}>Welcome back.</Text>
        <Text style={styles.subtitle}>Sign in to manage your workspace.</Text>

        <Text style={styles.label}>EMAIL ADDRESS</Text>
        <TextInput 
          style={styles.input}
          placeholder="Enter your email"
          placeholderTextColor="#555"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.label}>PASSWORD</Text>
        <TextInput 
          style={styles.input}
          placeholder="Enter your password"
          placeholderTextColor="#555"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity 
          style={styles.loginBtn} 
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.loginBtnText}>Secure Login  →</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D', padding: 25 }, 
  brandContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 40, marginBottom: 40 }, 
  logoImage: { width: 45, height: 45, resizeMode: 'contain', marginRight: 12 },
  brandName: { color: '#FFF', fontSize: 14, fontWeight: 'bold', letterSpacing: 2 },
  formContainer: { marginTop: 10 },
  title: { color: '#FFF', fontSize: 44, fontWeight: 'bold', lineHeight: 48, marginBottom: 10 },
  subtitle: { color: '#888', fontSize: 16, marginBottom: 40 },
  label: { color: '#888', fontSize: 10, letterSpacing: 1.5, marginBottom: 10, fontWeight: 'bold' },
  input: { backgroundColor: '#1A1A1A', color: '#FFF', padding: 20, borderRadius: 16, fontSize: 16, marginBottom: 25, borderWidth: 1, borderColor: '#222' },
  loginBtn: { backgroundColor: '#CCFF00', padding: 20, borderRadius: 16, alignItems: 'center', marginTop: 15, flexDirection: 'row', justifyContent: 'center' },
  loginBtnText: { color: '#000', fontSize: 18, fontWeight: 'bold' }
});