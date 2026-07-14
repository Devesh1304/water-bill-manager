import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { createBillingRecord, updateFlat, createTransaction } from '../firebase/firestore';
import { todayString } from '../utils/dateRanges';
import { colors } from '../theme/colors';
import { formatINR, currentBillingMonth, shiftBillingMonth } from '../utils/format';
import { Flat } from '../types';

type Step = 'select' | 'input' | 'review';

export default function BillingScreen() {
  const { user } = useAuth();
  const { flats, billingHistory, defaultSettings } = useData();

  const [step, setStep] = useState<Step>('select');
  const [selectedFlat, setSelectedFlat] = useState<Flat | null>(null);
  const [newReading, setNewReading] = useState('');
  const [adjustment, setAdjustment] = useState(0);
  const [billingMonth, setBillingMonth] = useState(currentBillingMonth());
  const [saving, setSaving] = useState(false);

  const billedFlatIds = useMemo(() => {
    return new Set(billingHistory.filter((b) => b.billingMonth === billingMonth).map((b) => b.flatId));
  }, [billingHistory, billingMonth]);

  const minUnits = defaultSettings.minimumUnits ?? 0;
  const consumed = selectedFlat ? Math.max(0, Number(newReading || 0) - selectedFlat.currentReading) : 0;
  const rawUnits = Math.max(0, consumed + adjustment);
  const totalUnits = minUnits > 0 ? Math.max(minUnits, rawUnits) : rawUnits;
  const minimumApplied = minUnits > 0 && rawUnits < minUnits;
  const totalBill = selectedFlat ? (totalUnits * selectedFlat.multiplier) + selectedFlat.offset : 0;

  function handleSelectFlat(flat: Flat) {
    setSelectedFlat(flat);
    setNewReading('');
    setAdjustment(0);
    setStep('input');
  }

  function handleProceedToReview() {
    const reading = Number(newReading);
    if (!newReading || isNaN(reading)) {
      Alert.alert('Invalid reading', 'Please enter a valid meter reading.');
      return;
    }
    if (reading < (selectedFlat?.currentReading ?? 0)) {
      Alert.alert('Invalid reading', 'New reading cannot be less than the current reading.');
      return;
    }
    setStep('review');
  }

  async function handleGenerateAndSend() {
    if (!selectedFlat || !user) return;
    setSaving(true);
    try {
      const reading = Number(newReading);
      await createBillingRecord({
        userId: user.uid,
        flatId: selectedFlat.id,
        flatNumber: selectedFlat.flatNumber,
        residentName: selectedFlat.residentName,
        billingMonth,
        previousReading: selectedFlat.currentReading,
        newReading: reading,
        unitsConsumed: consumed,
        adjustmentUnits: adjustment,
        totalUnits,
        multiplier: selectedFlat.multiplier,
        offset: selectedFlat.offset,
        totalBillAmount: totalBill,
      });

      if (reading > selectedFlat.currentReading) {
        await updateFlat(selectedFlat.id, { currentReading: reading });
      }

      await createTransaction({
        userId: user.uid,
        direction: 'debit',
        date: todayString(),
        amount: totalBill,
        flatId: selectedFlat.id,
        flatNumber: selectedFlat.flatNumber,
        residentName: selectedFlat.residentName,
        remarks: `Water bill - ${billingMonth} (${totalUnits} units)`,
      });

      const message = [
        `💧 *Water Bill - ${billingMonth}*`,
        ``,
        `🏠 Flat: *${selectedFlat.flatNumber}*`,
        `👤 Name: ${selectedFlat.residentName}`,
        ``,
        `📊 *Meter Reading*`,
        `   Previous: ${selectedFlat.currentReading}`,
        `   Current:  ${reading}`,
        `   Consumed: ${consumed} units`,
        adjustment !== 0 ? `   Adjustment: ${adjustment > 0 ? '+' : ''}${adjustment} units` : null,
        minimumApplied ? `   Minimum Units: ${minUnits} (applied)` : null,
        `   Total Units: ${totalUnits}`,
        ``,
        `💰 *Bill Calculation*`,
        `   ${totalUnits} units × ₹${selectedFlat.multiplier} = ${formatINR(totalUnits * selectedFlat.multiplier)}`,
        `   Fixed charge: ${formatINR(selectedFlat.offset)}`,
        `   ━━━━━━━━━━━━━━`,
        `   *Total: ${formatINR(totalBill)}*`,
        ``,
        `🙏 Please pay at your earliest convenience.`,
      ].filter(Boolean).join('\n');

      const phone = selectedFlat.whatsappNumber.replace(/[^0-9]/g, '');
      const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

      if (Platform.OS === 'web') {
        window.open(waUrl, '_blank');
      } else {
        const nativeUrl = `whatsapp://send?phone=${phone}&text=${encodeURIComponent(message)}`;
        try {
          const canOpen = await Linking.canOpenURL(nativeUrl);
          await Linking.openURL(canOpen ? nativeUrl : waUrl);
        } catch {
          await Linking.openURL(waUrl);
        }
      }

      Alert.alert('Bill Generated', `Bill for Flat ${selectedFlat.flatNumber} has been saved.`);
      setStep('select');
      setSelectedFlat(null);
      setNewReading('');
      setAdjustment(0);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to generate bill.');
    } finally {
      setSaving(false);
    }
  }

  function handleSaveOnly() {
    if (!selectedFlat || !user) return;
    setSaving(true);
    const reading = Number(newReading);
    createBillingRecord({
      userId: user.uid,
      flatId: selectedFlat.id,
      flatNumber: selectedFlat.flatNumber,
      residentName: selectedFlat.residentName,
      billingMonth,
      previousReading: selectedFlat.currentReading,
      newReading: reading,
      unitsConsumed: consumed,
      adjustmentUnits: adjustment,
      totalUnits,
      multiplier: selectedFlat.multiplier,
      offset: selectedFlat.offset,
      totalBillAmount: totalBill,
    })
      .then(() => reading > selectedFlat.currentReading ? updateFlat(selectedFlat.id, { currentReading: reading }) : Promise.resolve())
      .then(() => createTransaction({
        userId: user.uid,
        direction: 'debit',
        date: todayString(),
        amount: totalBill,
        flatId: selectedFlat.id,
        flatNumber: selectedFlat.flatNumber,
        residentName: selectedFlat.residentName,
        remarks: `Water bill - ${billingMonth} (${totalUnits} units)`,
      }))
      .then(() => {
        Alert.alert('Saved', `Bill for Flat ${selectedFlat.flatNumber} saved without sending WhatsApp.`);
        setStep('select');
        setSelectedFlat(null);
        setNewReading('');
        setAdjustment(0);
      })
      .catch((e: any) => Alert.alert('Error', e.message ?? 'Failed to save bill.'))
      .finally(() => setSaving(false));
  }

  if (step === 'review' && selectedFlat) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setStep('input')}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Review Bill</Text>
          <View style={{ width: 24 }} />
        </View>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
          <View style={styles.reviewCard}>
            <Text style={styles.reviewMonth}>{billingMonth}</Text>
            <Text style={styles.reviewFlat}>Flat {selectedFlat.flatNumber}</Text>
            <Text style={styles.reviewName}>{selectedFlat.residentName}</Text>

            <View style={styles.divider} />

            <View style={styles.reviewRow}>
              <Text style={styles.reviewLabel}>Previous Reading</Text>
              <Text style={styles.reviewValue}>{selectedFlat.currentReading}</Text>
            </View>
            <View style={styles.reviewRow}>
              <Text style={styles.reviewLabel}>New Reading</Text>
              <Text style={styles.reviewValue}>{newReading}</Text>
            </View>
            <View style={styles.reviewRow}>
              <Text style={styles.reviewLabel}>Units Consumed</Text>
              <Text style={styles.reviewValue}>{consumed}</Text>
            </View>
            {adjustment !== 0 && (
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Adjustment</Text>
                <Text style={[styles.reviewValue, { color: adjustment > 0 ? colors.debit : colors.credit }]}>
                  {adjustment > 0 ? '+' : ''}{adjustment}
                </Text>
              </View>
            )}
            <View style={styles.reviewRow}>
              <Text style={styles.reviewLabel}>Total Units</Text>
              <Text style={[styles.reviewValue, { fontWeight: '800' }]}>{totalUnits}</Text>
            </View>
            {minimumApplied && (
              <View style={styles.minimumNote}>
                <Ionicons name="information-circle-outline" size={14} color={colors.warning} />
                <Text style={styles.minimumNoteText}>Minimum {minUnits} units applied</Text>
              </View>
            )}

            <View style={styles.divider} />

            <View style={styles.reviewRow}>
              <Text style={styles.reviewLabel}>{totalUnits} × ₹{selectedFlat.multiplier}</Text>
              <Text style={styles.reviewValue}>{formatINR(totalUnits * selectedFlat.multiplier)}</Text>
            </View>
            <View style={styles.reviewRow}>
              <Text style={styles.reviewLabel}>Fixed Charge</Text>
              <Text style={styles.reviewValue}>{formatINR(selectedFlat.offset)}</Text>
            </View>

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Bill</Text>
              <Text style={styles.totalValue}>{formatINR(totalBill)}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.whatsappButton}
            onPress={handleGenerateAndSend}
            disabled={saving}
          >
            <Ionicons name="logo-whatsapp" size={20} color="#fff" />
            <Text style={styles.whatsappButtonText}>
              {saving ? 'Sending...' : 'Save & Send via WhatsApp'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.saveOnlyButton}
            onPress={handleSaveOnly}
            disabled={saving}
          >
            <Ionicons name="save-outline" size={20} color={colors.primary} />
            <Text style={styles.saveOnlyButtonText}>Save Without Sending</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (step === 'input' && selectedFlat) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setStep('select')}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Enter Reading</Text>
          <View style={{ width: 24 }} />
        </View>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
          <View style={styles.selectedFlatCard}>
            <View style={styles.flatBadge}>
              <Text style={styles.flatBadgeText}>{selectedFlat.flatNumber}</Text>
            </View>
            <Text style={styles.selectedFlatName}>{selectedFlat.residentName}</Text>
            <Text style={styles.currentReadingLabel}>
              Current Reading: <Text style={{ fontWeight: '700' }}>{selectedFlat.currentReading}</Text>
            </Text>
          </View>

          <Text style={styles.inputLabel}>New Meter Reading</Text>
          <TextInput
            style={styles.input}
            value={newReading}
            onChangeText={setNewReading}
            keyboardType="numeric"
            placeholder={`Must be ≥ ${selectedFlat.currentReading}`}
            placeholderTextColor={colors.textMuted}
          />

          {newReading !== '' && (
            <View style={styles.consumedBadge}>
              <Ionicons name="water-outline" size={16} color={colors.primary} />
              <Text style={styles.consumedText}>Consumed: {consumed} units</Text>
            </View>
          )}

          <Text style={styles.inputLabel}>Adjustment (+ / -)</Text>
          <View style={styles.adjustmentRow}>
            <TouchableOpacity
              style={styles.stepperBtn}
              onPress={() => setAdjustment((a) => a - 1)}
            >
              <Ionicons name="remove" size={22} color={colors.debit} />
            </TouchableOpacity>
            <TextInput
              style={styles.adjustmentInput}
              value={String(adjustment)}
              onChangeText={(t) => {
                const n = parseInt(t, 10);
                setAdjustment(isNaN(n) ? 0 : n);
              }}
              keyboardType="numeric"
            />
            <TouchableOpacity
              style={styles.stepperBtn}
              onPress={() => setAdjustment((a) => a + 1)}
            >
              <Ionicons name="add" size={22} color={colors.credit} />
            </TouchableOpacity>
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Consumed</Text>
              <Text style={styles.summaryValue}>{consumed}</Text>
            </View>
            {adjustment !== 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Adjustment</Text>
                <Text style={[styles.summaryValue, { color: adjustment > 0 ? colors.debit : colors.credit }]}>
                  {adjustment > 0 ? '+' : ''}{adjustment}
                </Text>
              </View>
            )}
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { fontWeight: '700' }]}>Total Units</Text>
              <Text style={[styles.summaryValue, { fontWeight: '800', fontSize: 18 }]}>{totalUnits}</Text>
            </View>
            {minimumApplied && (
              <View style={styles.minimumNote}>
                <Ionicons name="information-circle-outline" size={14} color={colors.warning} />
                <Text style={styles.minimumNoteText}>Minimum {minUnits} units applied</Text>
              </View>
            )}
            <View style={[styles.summaryRow, { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10, marginTop: 4 }]}>
              <Text style={[styles.summaryLabel, { fontWeight: '700' }]}>Estimated Bill</Text>
              <Text style={[styles.summaryValue, { fontWeight: '800', fontSize: 18, color: colors.primary }]}>
                {formatINR(totalBill)}
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.proceedButton} onPress={handleProceedToReview}>
            <Text style={styles.proceedButtonText}>Review Bill</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Generate Bill</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.monthNav}>
        <TouchableOpacity
          style={styles.monthNavBtn}
          onPress={() => setBillingMonth((m) => shiftBillingMonth(m, -1))}
        >
          <Ionicons name="chevron-back" size={20} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.monthNavText}>{billingMonth}</Text>
        <TouchableOpacity
          style={styles.monthNavBtn}
          onPress={() => setBillingMonth((m) => shiftBillingMonth(m, 1))}
        >
          <Ionicons name="chevron-forward" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
        {flats.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="home-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>No flats added</Text>
            <Text style={styles.emptyHint}>Add flats first from the Flats tab</Text>
          </View>
        ) : (
          flats.map((flat) => {
            const isBilled = billedFlatIds.has(flat.id);
            return (
              <TouchableOpacity
                key={flat.id}
                style={styles.selectCard}
                onPress={() => handleSelectFlat(flat)}
              >
                <View style={styles.selectCardLeft}>
                  <View style={[styles.flatBadge, isBilled && { backgroundColor: colors.creditBg }]}>
                    <Text style={[styles.flatBadgeText, isBilled && { color: colors.credit }]}>
                      {flat.flatNumber}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.selectName}>{flat.residentName}</Text>
                    <Text style={styles.selectReading}>Reading: {flat.currentReading}</Text>
                  </View>
                </View>
                <View style={styles.selectCardRight}>
                  {isBilled && (
                    <View style={styles.billedBadge}>
                      <Ionicons name="checkmark-circle" size={14} color={colors.credit} />
                      <Text style={styles.billedText}>Billed</Text>
                    </View>
                  )}
                  <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
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
  title: { fontSize: 22, fontWeight: '700', color: colors.text, flex: 1, textAlign: 'center' },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  monthNavBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthNavText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  selectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    elevation: 2,
  },
  selectCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  selectCardRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  flatBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  flatBadgeText: { color: colors.primary, fontWeight: '800', fontSize: 14 },
  selectName: { fontSize: 15, fontWeight: '600', color: colors.text },
  selectReading: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  billedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  billedText: { fontSize: 12, color: colors.credit, fontWeight: '600' },
  selectedFlatCard: {
    backgroundColor: colors.primaryLight,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  selectedFlatName: { fontSize: 16, fontWeight: '600', color: colors.text, marginTop: 8 },
  currentReadingLabel: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 6, marginTop: 14 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: colors.surface,
    color: colors.text,
  },
  minimumNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#FFF8E1',
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  minimumNoteText: { fontSize: 12, color: colors.warning, fontWeight: '600' },
  consumedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  consumedText: { fontSize: 14, color: colors.primary, fontWeight: '600' },
  adjustmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepperBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adjustmentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    backgroundColor: colors.surface,
    color: colors.text,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    marginTop: 20,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  summaryLabel: { fontSize: 14, color: colors.textSecondary },
  summaryValue: { fontSize: 15, fontWeight: '600', color: colors.text },
  proceedButton: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
    elevation: 3,
  },
  proceedButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  reviewCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    elevation: 3,
  },
  reviewMonth: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },
  reviewFlat: { fontSize: 22, fontWeight: '800', color: colors.text, textAlign: 'center', marginTop: 4 },
  reviewName: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginTop: 2 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 14 },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  reviewLabel: { fontSize: 14, color: colors.textSecondary },
  reviewValue: { fontSize: 14, fontWeight: '600', color: colors.text },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.primaryLight,
    borderRadius: 12,
    padding: 14,
    marginTop: 14,
  },
  totalLabel: { fontSize: 16, fontWeight: '700', color: colors.primary },
  totalValue: { fontSize: 20, fontWeight: '800', color: colors.primary },
  whatsappButton: {
    flexDirection: 'row',
    backgroundColor: colors.whatsapp,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
    elevation: 3,
  },
  whatsappButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  saveOnlyButton: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
  },
  saveOnlyButtonText: { color: colors.primary, fontWeight: '700', fontSize: 16 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 8 },
  emptyText: { fontSize: 16, fontWeight: '600', color: colors.textSecondary },
  emptyHint: { fontSize: 13, color: colors.textMuted },
});
