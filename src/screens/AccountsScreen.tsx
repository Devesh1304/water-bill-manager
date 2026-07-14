import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useData } from '../context/DataContext';
import { colors } from '../theme/colors';
import { formatINR } from '../utils/format';
import AccountRow from '../components/AccountRow';
import ExportModal from '../components/ExportModal';
import { exportAccountsExcel, exportAccountsWord } from '../utils/exportReport';

export default function AccountsScreen({ navigation }: any) {
  const { flats, transactions } = useData();
  const [search, setSearch] = useState('');
  const [showExport, setShowExport] = useState(false);

  const allRows = useMemo(() => {
    return flats.map((flat) => {
      const flatTxns = transactions.filter((t) => t.flatId === flat.id);
      const credit = flatTxns.filter((t) => t.direction === 'credit').reduce((s, t) => s + t.amount, 0);
      const debit = flatTxns.filter((t) => t.direction === 'debit').reduce((s, t) => s + t.amount, 0);
      return { flat, balance: credit - debit, credit, debit };
    });
  }, [flats, transactions]);

  const rows = useMemo(() => {
    if (!search.trim()) return allRows;
    const q = search.trim().toLowerCase();
    return allRows.filter(
      (r) => r.flat.flatNumber.toLowerCase().includes(q) || r.flat.residentName.toLowerCase().includes(q)
    );
  }, [allRows, search]);

  const totalDue = rows.filter((r) => r.balance < 0).reduce((s, r) => s + Math.abs(r.balance), 0);
  const totalReceived = rows.reduce((s, r) => s + r.credit, 0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <View style={{ width: 36 }} />
        <Text style={styles.title}>Accounts</Text>
        <TouchableOpacity style={styles.exportBtn} onPress={() => setShowExport(true)}>
          <Ionicons name="share-outline" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Received</Text>
            <Text style={[styles.summaryValue, { color: colors.credit }]}>{formatINR(totalReceived)}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Due</Text>
            <Text style={[styles.summaryValue, { color: colors.debit }]}>{formatINR(totalDue)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={18} color={colors.textMuted} style={{ marginLeft: 14 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search flats..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} style={{ marginRight: 10 }}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <ExportModal
        visible={showExport}
        onClose={() => setShowExport(false)}
        onExport={(format) =>
          format === 'excel'
            ? exportAccountsExcel(allRows)
            : exportAccountsWord(allRows)
        }
      />

      <FlatList
        data={rows}
        keyExtractor={(item) => item.flat.id}
        contentContainerStyle={{ paddingTop: 4, paddingBottom: 12 }}
        renderItem={({ item }) => (
          <AccountRow
            flatNumber={item.flat.flatNumber}
            residentName={item.flat.residentName}
            balance={item.balance}
            credit={item.credit}
            debit={item.debit}
            onPress={() => navigation.navigate('AccountDetail', {
              flatId: item.flat.id,
              flatNumber: item.flat.flatNumber,
              residentName: item.flat.residentName,
            })}
          />
        )}
        ListEmptyComponent={<Text style={styles.empty}>No flats yet.</Text>}
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
  title: { fontSize: 22, fontWeight: '700', textAlign: 'center', color: colors.text, flex: 1 },
  exportBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  summaryCard: {
    marginHorizontal: 12,
    marginBottom: 10,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    elevation: 2,
  },
  summaryRow: { flexDirection: 'row', alignItems: 'center' },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryDivider: { width: 1, height: 36, backgroundColor: colors.border },
  summaryLabel: { fontSize: 12, color: colors.textMuted, marginBottom: 4 },
  summaryValue: { fontSize: 18, fontWeight: '700' },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginHorizontal: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
  },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: 40 },
});
