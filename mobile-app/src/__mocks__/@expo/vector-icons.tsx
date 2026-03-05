import React from 'react';
import { Text } from 'react-native';

export const Ionicons = ({ name, ...props }: any) => (
  <Text {...props}>{name}</Text>
);

export default { Ionicons };
