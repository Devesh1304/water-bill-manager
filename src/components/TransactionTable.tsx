import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Transaction } from '../types';
import { colors } from '../theme/colors';
import { formatINR } from '../utils/format';
import { formatDisplayDate } from '../utils/dateRanges';
import ConfirmDialog from './ConfirmDialog';

export type SortKey = 'date' | 'flatNumber' | 'credit' | 'debit';

interface Props {
  transactions: Transaction[];
  sortKey: SortKey;
  sortDir: 'asc' | 'desc';
  onSortChange: (key: SortKey) => void;
  onDelete?: (t: Transaction) => void;
}

const COLUMNS: { key: SortKey; label: string; flex: number }[] = [
  { key: 'date', label: 'Date', flex: 1.1 },
  { key: 'flatNumber', label: 'Flat', flex: 1.3 },
  { key: 'credit', label: 'Credit', flex: 1 },
  { key: 'debit', label: 'Debit', flex: 1 },
];

export default function TransactionTable({ transactions, sortKey, sortDir, onSortChange, onDelete }: Props) {
  const [pendingDelete, setPendingDelete] = useState<Transaction | null>(null);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        {COLUMNS.map((col) => (
          <TouchableOpacity
            key={col.key}
            style={[styles.headerCell, { flex: col.flex }]}
            onPress={() => onSortChange(col.key)}
          >
            <Text style={styles.headerText}>{col.label}</Text>
            <Ionicons
              name={sortKey === col.key ? (sortDir === 'asc' ? 'chevron-up' : 'chevron-down') : 'swap-vertical'}
              size={14}
              color={colors.textMuted}
              style={{ marginLeft: 4 }}
            />
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={[styles.row, index % 2 === 1 && styles.rowAlt]}
            onLongPress={() => setPendingDelete(item)}
            activeOpacity={0.6}
          >
            <Text style={[styles.cell, { flex: 1.1 }]}>{formatDisplayDate(item.date)}</Text>
            <View style={{ flex: 1.3 }}>
              <Text style={styles.cell} numberOfLines={1}>{item.flatNumber} - {item.residentName}</Text>
              {item.remarks ? <Text style={styles.remarks} numberOfLines={1}>{item.remarks}</Text> : null}
            </View>
            <Text style={[styles.cell, styles.amountCell, styles.credit, { flex: 1 }]}>
              {item.direction === 'credit' ? formatINR(item.amount) : '-'}
            </Text>
            <Text style={[styles.cell, styles.amountCell, styles.debit, { flex: 1 }]}>
              {item.direction === 'debit' ? formatINR(item.amount) : '-'}
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No entries yet.</Text>
        }
      />

      <ConfirmDialog
        visible={!!pendingDelete}
        title="Delete entry"
        message={pendingDelete ? `Delete ${pendingDelete.flatNumber} - ${formatINR(pendingDelete.amount)}?` : undefined}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) onDelete?.(pendingDelete);
          setPendingDelete(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  headerCell: { flexDirection: 'row', alignItems: 'center' },
  headerText: { fontWeight: '600', color: colors.textSecondary, fontSize: 13 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: colors.surface,
  },
  rowAlt: { backgroundColor: colors.surfaceAlt },
  cell: { color: colors.text, fontSize: 14 },
  remarks: { color: colors.textMuted, fontSize: 11, marginTop: 1 },
  amountCell: { textAlign: 'right' },
  credit: { color: colors.credit },
  debit: { color: colors.debit },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: 40 },
});
