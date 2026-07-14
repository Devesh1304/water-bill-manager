import React, { useState } from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

interface Props {
  visible: boolean;
  onClose: () => void;
  onExport: (format: 'excel' | 'word') => Promise<void>;
}

export default function ExportModal({ visible, onClose, onExport }: Props) {
  const [loading, setLoading] = useState(false);

  async function handle(format: 'excel' | 'word') {
    setLoading(true);
    try {
      await onExport(format);
      onClose();
    } catch (e: any) {
      Alert.alert('Export failed', e.message ?? 'Could not generate report.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.headerRow}>
            <Text style={styles.title}>Export Report</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} disabled={loading}>
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.hint}>
            {Platform.OS === 'web'
              ? 'File will be downloaded — then share it on WhatsApp.'
              : 'Choose a format. A share sheet will open — pick WhatsApp to send directly.'}
          </Text>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Preparing report…</Text>
            </View>
          ) : (
            <>
              <TouchableOpacity style={styles.option} onPress={() => handle('excel')}>
                <View style={[styles.optionIcon, { backgroundColor: '#E8F5E9' }]}>
                  <Ionicons name="grid-outline" size={26} color="#2E7D32" />
                </View>
                <View style={styles.optionBody}>
                  <Text style={styles.optionLabel}>Excel Spreadsheet</Text>
                  <Text style={styles.optionSub}>.xlsx — opens in Excel or Google Sheets</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.option} onPress={() => handle('word')}>
                <View style={[styles.optionIcon, { backgroundColor: '#E3F2FD' }]}>
                  <Ionicons name="document-text-outline" size={26} color="#1565C0" />
                </View>
                <View style={styles.optionBody}>
                  <Text style={styles.optionLabel}>Word Document</Text>
                  <Text style={styles.optionSub}>.doc — opens in Word or Google Docs</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 32,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: colors.border, alignSelf: 'center', marginBottom: 14,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  title: { fontSize: 20, fontWeight: '700', color: colors.text },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center',
  },
  hint: { fontSize: 13, color: colors.textMuted, marginBottom: 18, lineHeight: 18 },
  loadingBox: { alignItems: 'center', paddingVertical: 32, gap: 12 },
  loadingText: { fontSize: 14, color: colors.textSecondary },
  option: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: colors.surfaceAlt, borderRadius: 14,
    padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: colors.border,
  },
  optionIcon: {
    width: 48, height: 48, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  optionBody: { flex: 1 },
  optionLabel: { fontSize: 15, fontWeight: '700', color: colors.text },
  optionSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
});
