import React, { useState, useMemo } from 'react';
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
import { deleteBillingRecord } from '../firebase/firestore';
import { colors } from '../theme/colors';
import { formatINR } from '../utils/format';
import FilterPills from '../components/FilterPills';
import ConfirmDialog from '../components/ConfirmDialog';
import { BillingRecord } from '../types';

export default function HistoryScreen() {
  const { billingHistory } = useData();
  const [deleteTarget, setDeleteTarget] = useState<BillingRecord | undefined>();

  const months = useMemo(() => {
    const set = new Set(billingHistory.map((b) => b.billingMonth));
    return ['All', ...Array.from(set)];
  }, [billingHistory]);

  const [selectedMonth, setSelectedMonth] = useState('All');

  const filtered = useMemo(() => {
    if (selectedMonth === 'All') return billingHistory;
    return billingHistory.filter((b) => b.billingMonth === selectedMonth);
  }, [billingHistory, selectedMonth]);

  const totalAmount = useMemo(() => filtered.reduce((s, b) => s + b.totalBillAmount, 0), [filtered]);

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteBillingRecord(deleteTarget.id);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Could not delete bill.');
    }
    setDeleteTarget(undefined);
  }

  function renderRecord({ item }: { item: BillingRecord }) {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.flatBadge}>
            <Text style={styles.flatBadgeText}>{item.flatNumber}</Text>
          </View>
          <View style={styles.cardHeaderRight}>
            <Text style={styles.monthText}>{item.billingMonth}</Text>
            <TouchableOpacity onPress={() => setDeleteTarget(item)} style={styles.deleteBtn}>
              <Ionicons name="trash-outline" size={16} color={colors.debit} />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.residentName}>{item.residentName}</Text>
        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Prev</Text>
            <Text style={styles.detailValue}>{item.previousReading}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>New</Text>
            <Text style={styles.detailValue}>{item.newReading}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Units</Text>
            <Text style={styles.detailValue}>{item.totalUnits}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Amount</Text>
            <Text style={[styles.detailValue, { color: colors.primary }]}>
              {formatINR(item.totalBillAmount)}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Billing History</Text>
      </View>

      {months.length > 1 && (
        <FilterPills
          options={months.map((m) => ({ key: m, label: m }))}
          value={selectedMonth}
          onChange={setSelectedMonth}
        />
      )}

      <View style={styles.totalBar}>
        <Text style={styles.totalLabel}>{filtered.length} bills</Text>
        <Text style={styles.totalValue}>{formatINR(totalAmount)}</Text>
      </View>

      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="receipt-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyText}>No billing history</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderRecord}
          contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      <ConfirmDialog
        visible={!!deleteTarget}
        title="Delete Bill?"
        message={`Delete the ${deleteTarget?.billingMonth} bill for Flat ${deleteTarget?.flatNumber} (${formatINR(deleteTarget?.totalBillAmount ?? 0)})? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(undefined)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingTop: 20 },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: colors.topBar,
    borderBottomWidth: 1,
    borderBottomColor: colors.topBarBorder,
  },
  title: { fontSize: 22, fontWeight: '700', color: colors.text },
  totalBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: colors.primaryLight,
  },
  totalLabel: { fontSize: 13, color: colors.textSecondary },
  totalValue: { fontSize: 16, fontWeight: '800', color: colors.primary },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  flatBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
  },
  flatBadgeText: { color: colors.primary, fontWeight: '800', fontSize: 13 },
  monthText: { fontSize: 12, color: colors.textMuted },
  deleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.debitBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  residentName: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8 },
  detailsRow: { flexDirection: 'row', gap: 8 },
  detailItem: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
  },
  detailLabel: { fontSize: 10, color: colors.textMuted },
  detailValue: { fontSize: 14, fontWeight: '700', color: colors.text, marginTop: 2 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyText: { fontSize: 16, fontWeight: '600', color: colors.textSecondary },
});
