import React, { useState, useEffect } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { updateTransaction } from '../firebase/firestore';
import { colors } from '../theme/colors';
import { Transaction } from '../types';

interface Props {
  visible: boolean;
  transaction: Transaction | null;
  onClose: () => void;
}

export default function EditTransactionModal({ visible, transaction, onClose }: Props) {
  const [date, setDate] = useState('');
  const [amount, setAmount] = useState('');
  const [remarks, setRemarks] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (transaction && visible) {
      setDate(transaction.date);
      setAmount(String(transaction.amount));
      setRemarks(transaction.remarks);
    }
  }, [transaction, visible]);

  async function handleSave() {
    const num = parseFloat(amount);
    if (!num || num <= 0) {
      Alert.alert('Invalid amount', 'Please enter a valid amount.');
      return;
    }
    if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      Alert.alert('Invalid date', 'Date must be in YYYY-MM-DD format.');
      return;
    }
    if (!transaction) return;
    setSaving(true);
    try {
      await updateTransaction(transaction.id, { date, amount: num, remarks: remarks.trim() });
      onClose();
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to update transaction.');
    } finally {
      setSaving(false);
    }
  }

  if (!transaction) return null;

  const isCredit = transaction.direction === 'credit';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <KeyboardAvoidingView
          style={styles.sheet}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.handle} />
          <View style={styles.headerRow}>
            <Text style={styles.title}>Edit Transaction</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={[styles.badge, { backgroundColor: isCredit ? colors.creditBg : colors.debitBg }]}>
            <Ionicons
              name={isCredit ? 'arrow-down' : 'arrow-up'}
              size={14}
              color={isCredit ? colors.credit : colors.debit}
            />
            <Text style={[styles.badgeText, { color: isCredit ? colors.credit : colors.debit }]}>
              {transaction.flatNumber} — {transaction.residentName}
            </Text>
          </View>

          <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
          <TextInput
            style={styles.input}
            value={date}
            onChangeText={setDate}
            placeholder="2026-07-01"
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
            maxLength={10}
          />

          <Text style={styles.label}>Amount (₹)</Text>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={colors.textMuted}
          />

          <Text style={styles.label}>Remarks</Text>
          <TextInput
            style={styles.input}
            value={remarks}
            onChangeText={setRemarks}
            placeholder="e.g. Cash payment"
            placeholderTextColor={colors.textMuted}
          />

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
            <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Save Changes'}</Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: 32,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: colors.border, alignSelf: 'center', marginBottom: 14,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  title: { fontSize: 20, fontWeight: '700', color: colors.text },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center',
  },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, marginBottom: 4,
  },
  badgeText: { fontWeight: '600', fontSize: 13 },
  label: { marginTop: 14, marginBottom: 6, color: colors.textSecondary, fontWeight: '500', fontSize: 13 },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 15, backgroundColor: colors.surfaceAlt, color: colors.text,
  },
  saveBtn: {
    backgroundColor: colors.primary, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', marginTop: 24, elevation: 3,
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
