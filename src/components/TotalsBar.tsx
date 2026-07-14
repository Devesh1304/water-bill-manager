import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { formatINR } from '../utils/format';

interface Props {
  creditTotal: number;
  debitTotal: number;
  closingBalance: number;
}

export default function TotalsBar({ creditTotal, debitTotal, closingBalance }: Props) {
  return (
    <View>
      <View style={styles.row}>
        <View style={styles.totalItem}>
          <Text style={styles.totalLabel}>Received</Text>
          <Text style={[styles.totalValue, { color: colors.credit }]}>{formatINR(creditTotal)}</Text>
        </View>
        <View style={styles.totalItem}>
          <Text style={styles.totalLabel}>Billed</Text>
          <Text style={[styles.totalValue, { color: colors.debit }]}>{formatINR(debitTotal)}</Text>
        </View>
      </View>
      <View style={[styles.banner, { backgroundColor: closingBalance >= 0 ? colors.credit : colors.debit }]}>
        <Text style={styles.bannerText}>Balance: {formatINR(closingBalance)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalItem: { alignItems: 'center' },
  totalLabel: { fontSize: 12, color: colors.textMuted, marginBottom: 2 },
  totalValue: { fontWeight: '700', fontSize: 15 },
  banner: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  bannerText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
