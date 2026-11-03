import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from './screens/LoginScreen';
import WorkerDashboardScreen from './screens/WorkerDashboardScreen';
import NewEventScreen from './screens/NewEventScreen';
import AddExpenseScreen from './screens/AddExpenseScreen';
import ManagerPortalScreen from './screens/ManagerPortalScreen';
import ManagerWorkerReviewScreen from './screens/ManagerWorkerReviewScreen'; 
import RegisterUserScreen from './screens/RegisterUserScreen';
import ManagerSettlementScreen from './screens/ManagerSettlementScreen'; 
import SetupAccountScreen from './screens/SetupAccountScreen';
import PriorEventScreen from './screens/PriorEventScreen'; 
import ManageExpenseScreen from './screens/ManageExpenseScreen'; 
import ManageEventScreen from './screens/ManageEventScreen';
import ManagerWageSettlementScreen from './screens/ManagerWageSettlementScreen'; 
import ManagerWorkerPayrollScreen from './screens/ManagerWorkerPayrollScreen';
import WorkerHistoryScreen from './screens/WorkerHistoryScreen';

export type RootStackParamList = {
  Login: undefined;
  WorkerDashboard: { userId: string };
  NewEvent: { userId: string };
  AddExpense: { userId: string; type: 'MEAL' | 'RIDE'; eventId: string };
  ManagerPortal: { adminId: string };
  ManagerWorkerReview: { workerId: string; workerName: string; totalAmount: number }; 
  RegisterUser: undefined;
  ManagerSettlement: { workerId: string; workerName: string; totalAmount: number; bankAccount: string | null; telebirr: string | null };
  SetupAccount: { userId: string; role: string };
  PriorEvent: { userId: string }; 
  ManageExpense: { expense: any; userId: string }; 
  ManageEvent: { event: any; userId: string };
  ManagerWageSettlement: { eventId: string; eventName: string; workerName: string; totalAmount: number; bankAccount: string | null; telebirr: string | null; days: number; wageRate: number };
  ManagerWorkerPayroll: { workerId: string; workerName: string; events: any[]; dailyWage: number; bankAccount: string | null; telebirr: string | null };
  WorkerHistory: { userId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const FieldPaymentsTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: '#0D0D0D', primary: '#CCFF00', text: '#FFFFFF', card: '#1A1A1A' },
};

export default function App() {
  return (
    <NavigationContainer theme={FieldPaymentsTheme}>
      <Stack.Navigator initialRouteName="Login" screenOptions={{ headerStyle: { backgroundColor: '#0D0D0D' }, headerTintColor: '#FFFFFF', headerTitleStyle: { fontWeight: 'bold' }, headerShadowVisible: false }}>
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="WorkerDashboard" component={WorkerDashboardScreen} options={{ title: 'Workspace', headerBackVisible: false }} />
        <Stack.Screen name="NewEvent" component={NewEventScreen} options={{ title: 'New Event' }} />
        <Stack.Screen name="AddExpense" component={AddExpenseScreen} options={{ title: 'Add Expense' }} />
        <Stack.Screen name="ManagerPortal" component={ManagerPortalScreen} options={{ title: 'Finance Portal', headerBackVisible: false, headerShown: false }} />
        <Stack.Screen name="ManagerWorkerReview" component={ManagerWorkerReviewScreen} options={{ headerShown: false }} />
        <Stack.Screen name="RegisterUser" component={RegisterUserScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ManagerSettlement" component={ManagerSettlementScreen} options={{ headerShown: false }} />
        <Stack.Screen name="SetupAccount" component={SetupAccountScreen} options={{ headerShown: false }} /> 
        <Stack.Screen name="PriorEvent" component={PriorEventScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ManageExpense" component={ManageExpenseScreen} options={{ title: 'Expense Details' }} />
        <Stack.Screen name="ManageEvent" component={ManageEventScreen} options={{ title: 'Event Details' }} />
        <Stack.Screen name="ManagerWageSettlement" component={ManagerWageSettlementScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ManagerWorkerPayroll" component={ManagerWorkerPayrollScreen} options={{ headerShown: false }} />
        <Stack.Screen name="WorkerHistory" component={WorkerHistoryScreen} options={{ headerShown: false }} /> 
      </Stack.Navigator>
    </NavigationContainer>
  );
}