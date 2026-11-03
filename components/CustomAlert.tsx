import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

type CustomAlertProps = {
  visible: boolean;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'confirm';
  onConfirm: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
};

export default function CustomAlert({ visible, title, message, type = 'success', onConfirm, onCancel, confirmText = 'OK', cancelText = 'Cancel' }: CustomAlertProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.alertBox}>
          <Text style={[styles.title, type === 'error' ? { color: '#FF3B30' } : { color: '#CCFF00' }]}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          
          <View style={styles.buttonRow}>
            {type === 'confirm' && onCancel && (
              <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
                <Text style={styles.cancelBtnText}>{cancelText}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[styles.confirmBtn, type === 'error' && { backgroundColor: '#FF3B30' }]} onPress={onConfirm}>
              <Text style={styles.confirmBtnText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  alertBox: { backgroundColor: '#1A1A1A', width: '100%', borderRadius: 16, padding: 25, borderWidth: 1, borderColor: '#333' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  message: { color: '#FFF', fontSize: 14, marginBottom: 25, lineHeight: 20 },
  buttonRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  cancelBtn: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10, backgroundColor: '#333' },
  cancelBtnText: { color: '#FFF', fontWeight: 'bold' },
  confirmBtn: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10, backgroundColor: '#CCFF00' },
  confirmBtnText: { color: '#000', fontWeight: 'bold' }
});