import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useData } from '../context/DataContext';
import { deleteTransaction } from '../firebase/firestore';
import { DateFilter, DateRange } from '../types';
import { colors } from '../theme/colors';
import { getDateRange, isWithinRange, todayString, toDateString } from '../utils/dateRanges';
import FilterPills, { PillOption } from '../components/FilterPills';
import TransactionTable, { SortKey } from '../components/TransactionTable';
import TotalsBar from '../components/TotalsBar';
import AddPaymentModal from '../components/AddPaymentModal';
import ExportModal from '../components/ExportModal';
import { exportTransactionsExcel, exportTransactionsWord } from '../utils/exportReport';

const FILTER_OPTIONS: PillOption<DateFilter>[] = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: 'custom', label: 'Custom' },
];

function defaultCustomRange(): DateRange {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  return { start: toDateString(start), end: todayString() };
}

export default function TransactionsScreen() {
  const { transactions } = useData();
  const [filter, setFilter] = useState<DateFilter>('month');
  const [customRange, setCustomRange] = useState<DateRange>(defaultCustomRange);
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [showPayment, setShowPayment] = useState(false);
  const [showExport, setShowExport] = useState(false);

  const range: DateRange = filter === 'custom' ? customRange : getDateRange(filter);

  const periodLabel =
    filter === 'today' ? 'Today' :
    filter === 'week'  ? 'This Week' :
    filter === 'month' ? 'This Month' :
    `${customRange.start} to ${customRange.end}`;

  const filtered = useMemo(() => {
    return transactions.filter((t) => isWithinRange(t.date, range));
  }, [transactions, range]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    list.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'date') cmp = a.date.localeCompare(b.date) || a.createdAt - b.createdAt;
      else if (sortKey === 'flatNumber') cmp = a.flatNumber.localeCompare(b.flatNumber, undefined, { numeric: true });
      else if (sortKey === 'credit') {
        const av = a.direction === 'credit' ? a.amount : -1;
        const bv = b.direction === 'credit' ? b.amount : -1;
        cmp = av - bv;
      } else if (sortKey === 'debit') {
        const av = a.direction === 'debit' ? a.amount : -1;
        const bv = b.direction === 'debit' ? b.amount : -1;
        cmp = av - bv;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [filtered, sortKey, sortDir]);

  const creditTotal = filtered.filter((t) => t.direction === 'credit').reduce((s, t) => s + t.amount, 0);
  const debitTotal = filtered.filter((t) => t.direction === 'debit').reduce((s, t) => s + t.amount, 0);

  function handleSortChange(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <View style={{ width: 36 }} />
        <Text style={styles.title}>Transactions</Text>
        <TouchableOpacity style={styles.exportBtn} onPress={() => setShowExport(true)}>
          <Ionicons name="share-outline" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <FilterPills options={FILTER_OPTIONS} value={filter} onChange={setFilter} />

      {filter === 'custom' && (
        <View style={styles.customRangeRow}>
          <View style={styles.customDateField}>
            <Text style={styles.customDateLabel}>From</Text>
            <TextInput
              style={styles.customDateInput}
              value={customRange.start}
              onChangeText={(v) => setCustomRange((r) => ({ ...r, start: v }))}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              maxLength={10}
            />
          </View>
          <Ionicons name="arrow-forward" size={16} color={colors.textMuted} style={{ marginTop: 20 }} />
          <View style={styles.customDateField}>
            <Text style={styles.customDateLabel}>To</Text>
            <TextInput
              style={styles.customDateInput}
              value={customRange.end}
              onChangeText={(v) => setCustomRange((r) => ({ ...r, end: v }))}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              maxLength={10}
            />
          </View>
        </View>
      )}

      <View style={styles.actionRow}>
        <TouchableOpacity style={[styles.actionButton, styles.creditButton]} onPress={() => setShowPayment(true)}>
          <Ionicons name="add-circle" size={18} color={colors.credit} />
          <Text style={[styles.actionText, { color: colors.credit }]}>Record Payment</Text>
        </TouchableOpacity>
      </View>

      <TransactionTable
        transactions={sorted}
        sortKey={sortKey}
        sortDir={sortDir}
        onSortChange={handleSortChange}
        onDelete={(t) => deleteTransaction(t.id)}
      />

      <TotalsBar creditTotal={creditTotal} debitTotal={debitTotal} closingBalance={creditTotal - debitTotal} />

      <AddPaymentModal visible={showPayment} onClose={() => setShowPayment(false)} />

      <ExportModal
        visible={showExport}
        onClose={() => setShowExport(false)}
        onExport={(format) =>
          format === 'excel'
            ? exportTransactionsExcel(filtered, periodLabel)
            : exportTransactionsWord(filtered, periodLabel)
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingTop: 20 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.topBar,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.topBarBorder,
    marginBottom: 8,
  },
  title: { fontSize: 22, fontWeight: '700', textAlign: 'center', color: colors.text },
  exportBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  customRangeRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  customDateField: { flex: 1 },
  customDateLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  customDateInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: colors.surface,
    color: colors.text,
    fontWeight: '500',
  },
  actionRow: {
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 6,
    elevation: 2,
  },
  creditButton: {
    backgroundColor: colors.creditBg,
    borderWidth: 1,
    borderColor: '#C3EDDA',
  },
  actionText: { fontWeight: '700', fontSize: 14 },
});
