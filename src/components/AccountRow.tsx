import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { formatINR } from '../utils/format';

interface Props {
  flatNumber: string;
  residentName: string;
  balance: number;
  credit: number;
  debit: number;
  onPress: () => void;
  onDelete?: () => void;
}

export default function AccountRow({ flatNumber, residentName, balance, credit, debit, onPress, onDelete }: Props) {
  const positive = balance >= 0;
  const hasNoEntries = credit === 0 && debit === 0;

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{flatNumber}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{residentName}</Text>
        <Text style={styles.subtext}>
          {hasNoEntries ? 'No transactions yet' : `Paid: ${formatINR(credit)}  |  Billed: ${formatINR(debit)}`}
        </Text>
      </View>
      {hasNoEntries && onDelete ? (
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={(e) => { e.stopPropagation?.(); onDelete(); }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="trash-outline" size={18} color={colors.debit} />
        </TouchableOpacity>
      ) : (
        <View style={styles.balanceContainer}>
          <Text style={[styles.balance, positive ? styles.positive : styles.negative]}>
            {formatINR(balance)}
          </Text>
          <Text style={styles.balanceLabel}>{positive ? (balance === 0 ? 'Settled' : 'Overpaid') : 'Due'}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginHorizontal: 12,
    marginBottom: 8,
    elevation: 1,
  },
  avatar: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: { color: colors.primary, fontWeight: '800', fontSize: 13 },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600', color: colors.text },
  subtext: { fontSize: 12, color: colors.textMuted, marginTop: 3 },
  balanceContainer: { alignItems: 'flex-end' },
  balance: { fontWeight: '700', fontSize: 15 },
  balanceLabel: { fontSize: 10, color: colors.textMuted, marginTop: 2 },
  positive: { color: colors.credit },
  negative: { color: colors.debit },
  deleteBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.debitBg,
    alignItems: 'center', justifyContent: 'center',
  },
});
