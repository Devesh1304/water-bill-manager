import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useData } from '../context/DataContext';
import { deleteFlat } from '../firebase/firestore';
import { colors } from '../theme/colors';
import AddFlatModal from '../components/AddFlatModal';
import ConfirmDialog from '../components/ConfirmDialog';
import { Flat } from '../types';

export default function FlatsScreen() {
  const { flats } = useData();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingFlat, setEditingFlat] = useState<Flat | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<Flat | undefined>();

  function handleEdit(flat: Flat) {
    setEditingFlat(flat);
    setModalVisible(true);
  }

  function handleAdd() {
    setEditingFlat(undefined);
    setModalVisible(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteFlat(deleteTarget.id);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Could not delete flat.');
    }
    setDeleteTarget(undefined);
  }

  function renderFlat({ item }: { item: Flat }) {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.flatBadge}>
            <Text style={styles.flatBadgeText}>{item.flatNumber}</Text>
          </View>
          <View style={styles.cardActions}>
            <TouchableOpacity onPress={() => handleEdit(item)} style={styles.iconBtn}>
              <Ionicons name="create-outline" size={18} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setDeleteTarget(item)} style={styles.iconBtn}>
              <Ionicons name="trash-outline" size={18} color={colors.debit} />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.residentName}>{item.residentName}</Text>
        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Reading</Text>
            <Text style={styles.detailValue}>{item.currentReading}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Rate/Unit</Text>
            <Text style={styles.detailValue}>{item.multiplier}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Fixed Charge</Text>
            <Text style={styles.detailValue}>{item.offset}</Text>
          </View>
        </View>
        <View style={styles.whatsappRow}>
          <Ionicons name="logo-whatsapp" size={14} color={colors.whatsapp} />
          <Text style={styles.whatsappText}>{item.whatsappNumber}</Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Flats</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
          <Ionicons name="add" size={22} color="#fff" />
          <Text style={styles.addButtonText}>Add Flat</Text>
        </TouchableOpacity>
      </View>

      {flats.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="home-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyText}>No flats added yet</Text>
          <Text style={styles.emptyHint}>Tap "Add Flat" to get started</Text>
        </View>
      ) : (
        <FlatList
          data={flats}
          keyExtractor={(item) => item.id}
          renderItem={renderFlat}
          contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      <AddFlatModal
        visible={modalVisible}
        onClose={() => { setModalVisible(false); setEditingFlat(undefined); }}
        existingFlat={editingFlat}
      />

      <ConfirmDialog
        visible={!!deleteTarget}
        title="Delete Flat?"
        message={`This will permanently remove Flat ${deleteTarget?.flatNumber} (${deleteTarget?.residentName}). Billing history will not be deleted.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(undefined)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingTop: 20 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: colors.topBar,
    borderBottomWidth: 1,
    borderBottomColor: colors.topBarBorder,
  },
  title: { fontSize: 22, fontWeight: '700', color: colors.text },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 4,
  },
  addButtonText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  flatBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  flatBadgeText: { color: colors.primary, fontWeight: '800', fontSize: 15 },
  cardActions: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  residentName: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 10 },
  detailsRow: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  detailItem: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
  },
  detailLabel: { fontSize: 11, color: colors.textMuted, marginBottom: 2 },
  detailValue: { fontSize: 16, fontWeight: '700', color: colors.text },
  whatsappRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  whatsappText: { fontSize: 13, color: colors.textSecondary },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyText: { fontSize: 16, fontWeight: '600', color: colors.textSecondary },
  emptyHint: { fontSize: 13, color: colors.textMuted },
});
