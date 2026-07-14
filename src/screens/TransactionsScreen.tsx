import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useData } from '../context/DataContext';
import { deleteTransaction } from '../firebase/firestore';
import { DateFilter } from '../types';
import { colors } from '../theme/colors';
import { getDateRange, isWithinRange } from '../utils/dateRanges';
import FilterPills, { PillOption } from '../components/FilterPills';
import TransactionTable, { SortKey } from '../components/TransactionTable';
import TotalsBar from '../components/TotalsBar';
import AddPaymentModal from '../components/AddPaymentModal';

const FILTER_OPTIONS: PillOption<DateFilter>[] = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
];

export default function TransactionsScreen() {
  const { transactions } = useData();
  const [filter, setFilter] = useState<DateFilter>('month');
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [showPayment, setShowPayment] = useState(false);

  const range = getDateRange(filter);

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
        <View style={{ width: 36 }} />
      </View>

      <FilterPills options={FILTER_OPTIONS} value={filter} onChange={setFilter} />

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
