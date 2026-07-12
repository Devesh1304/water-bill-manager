import React, { useState, useEffect } from 'react';
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
import { createFlat, updateFlat } from '../firebase/firestore';
import { colors } from '../theme/colors';
import { Flat } from '../types';

interface Props {
  visible: boolean;
  onClose: () => void;
  existingFlat?: Flat;
}

export default function AddFlatModal({ visible, onClose, existingFlat }: Props) {
  const { user } = useAuth();
  const isEditing = !!existingFlat;

  const [flatNumber, setFlatNumber] = useState('');
  const [residentName, setResidentName] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [currentReading, setCurrentReading] = useState('0');
  const [multiplier, setMultiplier] = useState('');
  const [offset, setOffset] = useState('0');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existingFlat) {
      setFlatNumber(existingFlat.flatNumber);
      setResidentName(existingFlat.residentName);
      setWhatsappNumber(existingFlat.whatsappNumber);
      setCurrentReading(String(existingFlat.currentReading));
      setMultiplier(String(existingFlat.multiplier));
      setOffset(String(existingFlat.offset));
    } else {
      setFlatNumber('');
      setResidentName('');
      setWhatsappNumber('');
      setCurrentReading('0');
      setMultiplier('');
      setOffset('0');
    }
  }, [existingFlat, visible]);

  async function handleSave() {
    if (!flatNumber.trim()) {
      Alert.alert('Missing info', 'Please enter a flat number.');
      return;
    }
    if (!residentName.trim()) {
      Alert.alert('Missing info', 'Please enter the resident name.');
      return;
    }
    if (!whatsappNumber.trim()) {
      Alert.alert('Missing info', 'Please enter a WhatsApp number with country code.');
      return;
    }
    const mult = parseFloat(multiplier);
    if (!mult || mult <= 0) {
      Alert.alert('Invalid rate', 'Please enter a valid rate per unit (multiplier).');
      return;
    }
    if (!user) return;

    setSaving(true);
    try {
      const data = {
        flatNumber: flatNumber.trim(),
        residentName: residentName.trim(),
        whatsappNumber: whatsappNumber.trim(),
        currentReading: parseFloat(currentReading) || 0,
        multiplier: mult,
        offset: parseFloat(offset) || 0,
      };

      if (existingFlat) {
        await updateFlat(existingFlat.id, data);
      } else {
        await createFlat({ userId: user.uid, ...data });
      }
      onClose();
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to save flat.');
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
            <Text style={styles.title}>{isEditing ? 'Edit Flat' : 'Add Flat'}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text style={styles.label}>Flat Number *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. A-101"
              placeholderTextColor={colors.textMuted}
              value={flatNumber}
              onChangeText={setFlatNumber}
            />

            <Text style={styles.label}>Resident Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Full name"
              placeholderTextColor={colors.textMuted}
              value={residentName}
              onChangeText={setResidentName}
            />

            <Text style={styles.label}>WhatsApp Number * (with country code)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 919876543210"
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
              value={whatsappNumber}
              onChangeText={setWhatsappNumber}
            />

            <Text style={styles.label}>Current Meter Reading</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={currentReading}
              onChangeText={setCurrentReading}
            />

            <Text style={styles.label}>Rate per Unit (Multiplier) *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 15"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={multiplier}
              onChangeText={setMultiplier}
            />

            <Text style={styles.label}>Fixed Charge (Offset)</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={offset}
              onChangeText={setOffset}
            />

            <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
              <Text style={styles.saveButtonText}>{saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Flat'}</Text>
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
    marginBottom: 8,
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
  label: { marginTop: 14, marginBottom: 6, color: colors.textSecondary, fontWeight: '500', fontSize: 13 },
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
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 12,
    elevation: 3,
  },
  saveButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
