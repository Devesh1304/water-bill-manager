import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { saveDefaultSettings } from '../firebase/firestore';
import { colors } from '../theme/colors';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function DefaultSettingsModal({ visible, onClose }: Props) {
  const { user } = useAuth();
  const { defaultSettings } = useData();
  const [multiplier, setMultiplier] = useState('');
  const [offset, setOffset] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setMultiplier(defaultSettings.multiplier > 0 ? String(defaultSettings.multiplier) : '');
      setOffset(String(defaultSettings.offset));
    }
  }, [visible, defaultSettings]);

  async function handleSave() {
    const mult = parseFloat(multiplier);
    if (!mult || mult <= 0) {
      Alert.alert('Invalid rate', 'Please enter a valid rate per unit.');
      return;
    }
    if (!user) return;
    setSaving(true);
    try {
      await saveDefaultSettings(user.uid, {
        multiplier: mult,
        offset: parseFloat(offset) || 0,
      });
      onClose();
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to save settings.');
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
            <Text style={styles.title}>Default Billing Settings</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.hint}>
            These values are pre-filled when adding a new flat.
          </Text>

          <Text style={styles.label}>Rate per Unit (₹) *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 15"
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
            value={multiplier}
            onChangeText={setMultiplier}
          />

          <Text style={styles.label}>Fixed Charge / Offset (₹)</Text>
          <TextInput
            style={styles.input}
            placeholder="0"
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
            value={offset}
            onChangeText={setOffset}
          />

          <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
            <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save Settings'}</Text>
          </TouchableOpacity>
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
    marginBottom: 4,
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
  hint: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 8,
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
