import React from 'react';
import { Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { colors } from '../theme/colors';

export interface PillOption<T extends string> {
  key: T;
  label: string;
}

interface Props<T extends string> {
  options: PillOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

export default function FilterPills<T extends string>({ options, value, onChange }: Props<T>) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.row}>
      {options.map((opt) => {
        const active = opt.key === value;
        return (
          <TouchableOpacity
            key={opt.key}
            style={[styles.pill, active && styles.pillActive]}
            onPress={() => onChange(opt.key)}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{opt.label}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { flexGrow: 0, paddingHorizontal: 12, marginVertical: 8 },
  pill: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.pillBorder,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 8,
    marginRight: 8,
  },
  pillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  label: { color: colors.textSecondary, fontWeight: '500' },
  labelActive: { color: '#fff' },
});
