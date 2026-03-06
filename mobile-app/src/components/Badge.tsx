import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type Props = {
  label: string;
  color: string;
  backgroundColor: string;
  size?: 'sm' | 'md';
  fontWeight?: '600' | '700';
};

export default function Badge({ label, color, backgroundColor, size = 'sm', fontWeight = '600' }: Props) {
  return (
    <View style={[styles.badge, { backgroundColor }]}>
      <Text style={[styles.text, { color, fontSize: size === 'sm' ? 11 : 12, fontWeight }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  text: {},
});
