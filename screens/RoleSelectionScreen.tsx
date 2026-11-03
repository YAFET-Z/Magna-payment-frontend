import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'RoleSelection'>;
};

export default function RoleSelectionScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.headerTop}>CHOOSE WORKSPACE</Text>
      <Text style={styles.title}>How are you using the app today?</Text>
      <Text style={styles.subtitle}>Log your own expenses or review the full company queue.</Text>

      <TouchableOpacity 
        style={styles.workerCard}
        // Using a mock userId for now until the backend is fully connected
        onPress={() => navigation.navigate('WorkerDashboard', { userId: 'USER_123' })} 
      >
        <Text style={styles.cardNumberDark}>01</Text>
        <View style={styles.cardContent}>
            <Text style={styles.cardTitleDark}>Worker workspace</Text>
            <Text style={styles.cardSubtitleDark}>Log events, meals, rides, and receipts</Text>
        </View>
        <Text style={styles.arrowDark}>→</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.managerCard}
        onPress={() => navigation.navigate('ManagerPortal', { adminId: 'ADMIN_123' })}
      >
        <Text style={styles.cardNumberLight}>02</Text>
        <View style={styles.cardContent}>
            <Text style={styles.cardTitleLight}>Manager workspace</Text>
            <Text style={styles.cardSubtitleLight}>Review, query, approve, and settle</Text>
        </View>
        <Text style={styles.arrowLight}>→</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D', padding: 20, justifyContent: 'center' },
  headerTop: { color: '#888', fontSize: 10, letterSpacing: 1.5, marginBottom: 15, fontWeight: 'bold' },
  title: { color: '#FFF', fontSize: 44, fontWeight: 'bold', lineHeight: 48, marginBottom: 15 },
  subtitle: { color: '#888', fontSize: 16, marginBottom: 40 },
  workerCard: { backgroundColor: '#CCFF00', padding: 25, borderRadius: 16, marginBottom: 15, flexDirection: 'row', alignItems: 'center' },
  managerCard: { backgroundColor: '#1A1A1A', padding: 25, borderRadius: 16, flexDirection: 'row', alignItems: 'center' },
  cardNumberDark: { color: '#000', fontWeight: 'bold', fontSize: 14, marginRight: 15, alignSelf: 'flex-start' },
  cardNumberLight: { color: '#CCFF00', fontWeight: 'bold', fontSize: 14, marginRight: 15, alignSelf: 'flex-start' },
  cardContent: { flex: 1 },
  cardTitleDark: { color: '#000', fontSize: 20, fontWeight: 'bold', marginBottom: 5 },
  cardSubtitleDark: { color: '#333', fontSize: 12 },
  cardTitleLight: { color: '#FFF', fontSize: 20, fontWeight: 'bold', marginBottom: 5 },
  cardSubtitleLight: { color: '#888', fontSize: 12 },
  arrowDark: { color: '#000', fontSize: 24 },
  arrowLight: { color: '#FFF', fontSize: 24 }
});