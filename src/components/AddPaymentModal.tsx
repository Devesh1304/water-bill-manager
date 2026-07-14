import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { createTransaction } from '../firebase/firestore';
import { colors } from '../theme/colors';
import { todayString } from '../utils/dateRanges';
import { Flat } from '../types';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function AddPaymentModal({ visible, onClose }: Props) {
  const { user } = useAuth();
  const { flats } = useData();

  const [selectedFlat, setSelectedFlat] = useState<Flat | null>(null);
  const [amount, setAmount] = useState('');
  const [remarks, setRemarks] = useState('');
  const [saving, setSaving] = useState(false);

  function reset() {
    setSelectedFlat(null);
    setAmount('');
    setRemarks('');
  }

  async function handleSave() {
    if (!selectedFlat) {
      Alert.alert('Select flat', 'Please select a flat first.');
      return;
    }
    const numericAmount = parseFloat(amount);
    if (!numericAmount || numericAmount <= 0) {
      Alert.alert('Invalid amount', 'Please enter an amount greater than 0.');
      return;
    }
    if (!user) return;

    setSaving(true);
    try {
      await createTransaction({
        userId: user.uid,
        direction: 'credit',
        date: todayString(),
        amount: numericAmount,
        flatId: selectedFlat.id,
        flatNumber: selectedFlat.flatNumber,
        residentName: selectedFlat.residentName,
        remarks: remarks.trim() || 'Payment received',
      });
      reset();
      onClose();
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to save payment.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <KeyboardAvoidingView
          style={styles.sheet}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.handle} />
          <View style={styles.headerRow}>
            <Text style={styles.title}>Record Payment</Text>
            <TouchableOpacity onPress={() => { reset(); onClose(); }} style={styles.closeButton}>
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.directionBadge}>
            <Ionicons name="arrow-down" size={14} color={colors.credit} />
            <Text style={[styles.directionText, { color: colors.credit }]}>Credit (Payment Received)</Text>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text style={styles.label}>Select Flat *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.flatPills}>
              {flats.map((flat) => (
                <TouchableOpacity
                  key={flat.id}
                  style={[styles.flatPill, selectedFlat?.id === flat.id && styles.flatPillActive]}
                  onPress={() => setSelectedFlat(flat)}
                >
                  <Text style={[styles.flatPillText, selectedFlat?.id === flat.id && styles.flatPillTextActive]}>
                    {flat.flatNumber}
                  </Text>
                  <Text style={[styles.flatPillSub, selectedFlat?.id === flat.id && styles.flatPillTextActive]}>
                    {flat.residentName}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>Amount *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter amount received"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />

            <Text style={styles.label}>Remarks (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Cash payment, UPI, etc."
              placeholderTextColor={colors.textMuted}
              value={remarks}
              onChangeText={setRemarks}
            />

            <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Record Payment'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { fontSize: 20, fontWeight: '700', color: colors.text },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  directionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginVertical: 10,
    gap: 4,
    backgroundColor: colors.creditBg,
  },
  directionText: { fontWeight: '700', fontSize: 14 },
  label: { marginTop: 14, marginBottom: 6, color: colors.textSecondary, fontWeight: '500', fontSize: 13 },
  flatPills: { flexGrow: 0, marginBottom: 4 },
  flatPill: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 8,
    alignItems: 'center',
  },
  flatPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  flatPillText: { fontWeight: '700', fontSize: 14, color: colors.text },
  flatPillSub: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  flatPillTextActive: { color: '#fff' },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    backgroundColor: colors.surfaceAlt,
    color: colors.text,
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: colors.credit,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 24,
    marginBottom: 12,
    elevation: 3,
  },
  saveButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
