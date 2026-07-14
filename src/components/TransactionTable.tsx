import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList,
  Modal, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Transaction } from '../types';
import { colors } from '../theme/colors';
import { formatINR } from '../utils/format';
import { formatDisplayDate } from '../utils/dateRanges';
import ConfirmDialog from './ConfirmDialog';
import EditTransactionModal from './EditTransactionModal';
import { deleteTransaction } from '../firebase/firestore';

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
  const [activeItem, setActiveItem] = useState<Transaction | null>(null);
  const [editTarget, setEditTarget] = useState<Transaction | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);

  return (
    <View style={styles.container}>
      {/* Column headers */}
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

      {/* Rows */}
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={[styles.row, index % 2 === 1 && styles.rowAlt]}
            onPress={() => setActiveItem(item)}
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
        ListEmptyComponent={<Text style={styles.empty}>No entries yet.</Text>}
      />

      {/* Action sheet — shown on row tap */}
      <Modal
        visible={!!activeItem}
        transparent
        animationType="slide"
        onRequestClose={() => setActiveItem(null)}
      >
        <TouchableOpacity style={styles.actionBackdrop} activeOpacity={1} onPress={() => setActiveItem(null)}>
          <View style={styles.actionSheet}>
            <View style={styles.actionHandle} />

            {activeItem && (
              <>
                {/* Transaction summary */}
                <View style={styles.actionInfo}>
                  <View style={[
                    styles.actionBadge,
                    { backgroundColor: activeItem.direction === 'credit' ? colors.creditBg : colors.debitBg },
                  ]}>
                    <Ionicons
                      name={activeItem.direction === 'credit' ? 'arrow-down' : 'arrow-up'}
                      size={14}
                      color={activeItem.direction === 'credit' ? colors.credit : colors.debit}
                    />
                    <Text style={[
                      styles.actionBadgeText,
                      { color: activeItem.direction === 'credit' ? colors.credit : colors.debit },
                    ]}>
                      {activeItem.direction === 'credit' ? 'Payment' : 'Bill'}
                    </Text>
                  </View>
                  <Text style={styles.actionFlat}>{activeItem.flatNumber} — {activeItem.residentName}</Text>
                  <Text style={styles.actionAmount}>{formatINR(activeItem.amount)}</Text>
                  <Text style={styles.actionDate}>{formatDisplayDate(activeItem.date)}</Text>
                  {activeItem.remarks ? <Text style={styles.actionRemarks}>{activeItem.remarks}</Text> : null}
                </View>

                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => { setEditTarget(activeItem); setActiveItem(null); }}
                  >
                    <View style={[styles.actionBtnIcon, { backgroundColor: colors.primaryLight }]}>
                      <Ionicons name="pencil-outline" size={20} color={colors.primary} />
                    </View>
                    <Text style={styles.actionBtnLabel}>Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => { setDeleteTarget(activeItem); setActiveItem(null); }}
                  >
                    <View style={[styles.actionBtnIcon, { backgroundColor: colors.debitBg }]}>
                      <Ionicons name="trash-outline" size={20} color={colors.debit} />
                    </View>
                    <Text style={[styles.actionBtnLabel, { color: colors.debit }]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Edit modal */}
      <EditTransactionModal
        visible={!!editTarget}
        transaction={editTarget}
        onClose={() => setEditTarget(null)}
      />

      {/* Delete confirm */}
      <ConfirmDialog
        visible={!!deleteTarget}
        title="Delete transaction?"
        message={deleteTarget
          ? `Delete ${deleteTarget.flatNumber} — ${formatINR(deleteTarget.amount)}? This cannot be undone.`
          : undefined}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            onDelete ? onDelete(deleteTarget) : deleteTransaction(deleteTarget.id);
          }
          setDeleteTarget(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    paddingHorizontal: 12, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  headerCell: { flexDirection: 'row', alignItems: 'center' },
  headerText: { fontWeight: '600', color: colors.textSecondary, fontSize: 13 },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 12,
    backgroundColor: colors.surface,
  },
  rowAlt: { backgroundColor: colors.surfaceAlt },
  cell: { color: colors.text, fontSize: 14 },
  remarks: { color: colors.textMuted, fontSize: 11, marginTop: 1 },
  amountCell: { textAlign: 'right' },
  credit: { color: colors.credit },
  debit: { color: colors.debit },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: 40 },

  // Action sheet
  actionBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  actionSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  actionHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: colors.border, alignSelf: 'center', marginBottom: 16,
  },
  actionInfo: { alignItems: 'center', marginBottom: 20 },
  actionBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, marginBottom: 10,
  },
  actionBadgeText: { fontWeight: '700', fontSize: 13 },
  actionFlat: { fontSize: 15, fontWeight: '700', color: colors.text },
  actionAmount: { fontSize: 24, fontWeight: '800', color: colors.text, marginTop: 4 },
  actionDate: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  actionRemarks: { fontSize: 13, color: colors.textSecondary, marginTop: 4, fontStyle: 'italic' },
  actionButtons: { flexDirection: 'row', gap: 12 },
  actionBtn: { flex: 1, alignItems: 'center', gap: 8 },
  actionBtnIcon: {
    width: 56, height: 56, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  actionBtnLabel: { fontSize: 13, fontWeight: '600', color: colors.text },
});
