import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { colors } from '../theme/colors';
import { formatINR, currentBillingMonth } from '../utils/format';
import DefaultSettingsModal from '../components/DefaultSettingsModal';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export default function HomeScreen({ navigation }: any) {
  const { user, signOut } = useAuth();
  const { flats, billingHistory, defaultSettings } = useData();
  const [settingsVisible, setSettingsVisible] = useState(false);

  const stats = useMemo(() => {
    const month = currentBillingMonth();
    const monthBills = billingHistory.filter((b) => b.billingMonth === month);
    const totalRevenue = monthBills.reduce((s, b) => s + b.totalBillAmount, 0);
    const totalUnits = monthBills.reduce((s, b) => s + b.totalUnits, 0);
    const billed = monthBills.length;
    const pending = flats.length - billed;
    return { month, totalRevenue, totalUnits, billed, pending };
  }, [flats, billingHistory]);

  return (
    <SafeAreaView style={styles.container}>
      <DefaultSettingsModal visible={settingsVisible} onClose={() => setSettingsVisible(false)} />
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <View>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.name}>{user?.displayName || user?.email}</Text>
          </View>
          <View style={styles.topBarActions}>
            <TouchableOpacity onPress={() => setSettingsVisible(true)} style={styles.topBarButton}>
              <Ionicons name="settings-outline" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={signOut} style={styles.topBarButton}>
              <Ionicons name="log-out-outline" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>{stats.month}</Text>
          <Text style={styles.heroValue}>{formatINR(stats.totalRevenue)}</Text>
          <Text style={styles.heroHint}>Total billed this month</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="home-outline" size={24} color={colors.primary} />
            <Text style={styles.statValue}>{flats.length}</Text>
            <Text style={styles.statLabel}>Total Flats</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="checkmark-circle-outline" size={24} color={colors.credit} />
            <Text style={styles.statValue}>{stats.billed}</Text>
            <Text style={styles.statLabel}>Billed</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="time-outline" size={24} color={colors.warning} />
            <Text style={styles.statValue}>{stats.pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { flex: 1 }]}>
            <Ionicons name="water-outline" size={24} color={colors.accent} />
            <Text style={styles.statValue}>{stats.totalUnits}</Text>
            <Text style={styles.statLabel}>Units This Month</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.settingsRow} onPress={() => setSettingsVisible(true)}>
          <View style={styles.settingsIcon}>
            <Ionicons name="settings-outline" size={18} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.settingsLabel}>Billing Defaults</Text>
            <Text style={styles.settingsValue}>
              ₹{defaultSettings.multiplier}/unit · Fixed ₹{defaultSettings.offset}
              {defaultSettings.minimumUnits > 0 ? ` · Min ${defaultSettings.minimumUnits} units` : ''}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </TouchableOpacity>

        <View style={styles.quickRow}>
          <TouchableOpacity style={styles.quickButton} onPress={() => navigation.navigate('Flats')}>
            <Ionicons name="add-circle-outline" size={20} color="#fff" />
            <Text style={styles.quickButtonText}>Manage Flats</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickButton, styles.quickButtonOutline]}
            onPress={() => navigation.navigate('Billing')}
          >
            <Ionicons name="receipt-outline" size={20} color={colors.primary} />
            <Text style={[styles.quickButtonText, styles.quickButtonOutlineText]}>Generate Bill</Text>
          </TouchableOpacity>
        </View>

        {billingHistory.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Bills</Text>
            <View style={styles.recentCard}>
              {billingHistory.slice(0, 5).map((b, i) => (
                <View key={b.id} style={[styles.recentRow, i < Math.min(billingHistory.length, 5) - 1 && styles.recentRowBorder]}>
                  <View style={styles.recentIcon}>
                    <Ionicons name="water" size={16} color={colors.primary} />
                  </View>
                  <View style={styles.recentInfo}>
                    <Text style={styles.recentName} numberOfLines={1}>Flat {b.flatNumber} - {b.residentName}</Text>
                    <Text style={styles.recentDate}>{b.billingMonth} | {b.totalUnits} units</Text>
                  </View>
                  <Text style={styles.recentAmount}>{formatINR(b.totalBillAmount)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingTop: 20 },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: colors.topBar,
    borderBottomWidth: 1,
    borderBottomColor: colors.topBarBorder,
  },
  greeting: { color: colors.textMuted, fontSize: 14 },
  name: { color: colors.text, fontSize: 22, fontWeight: '700', marginTop: 2 },
  topBarActions: {
    flexDirection: 'row',
    gap: 8,
  },
  topBarButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    gap: 12,
    elevation: 1,
  },
  settingsIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsLabel: { fontSize: 12, color: colors.textMuted, fontWeight: '500' },
  settingsValue: { fontSize: 14, color: colors.text, fontWeight: '600', marginTop: 2 },
  heroCard: {
    marginHorizontal: 16,
    backgroundColor: colors.primary,
    borderRadius: 20,
    padding: 24,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  heroLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '500' },
  heroValue: { color: '#fff', fontSize: 32, fontWeight: '800', marginTop: 8 },
  heroHint: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 8 },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    paddingHorizontal: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  statValue: { fontSize: 22, fontWeight: '800', color: colors.text, marginTop: 6 },
  statLabel: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  quickRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    paddingHorizontal: 16,
  },
  quickButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    elevation: 3,
  },
  quickButtonOutline: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  quickButtonText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  quickButtonOutlineText: { color: colors.primary },
  section: { marginTop: 20, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 10 },
  recentCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 4,
    elevation: 2,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  recentRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  recentIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  recentInfo: { flex: 1 },
  recentName: { fontSize: 14, fontWeight: '600', color: colors.text },
  recentDate: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  recentAmount: { fontSize: 14, fontWeight: '700', color: colors.primary },
});
