import { StyleSheet, TextInput, TextStyle } from 'react-native';

import { colors, fonts, radius, spacing } from './tokens';

/**
 * Champ de recherche. `onSubmit` sert aux recherches envoyées au SERVEUR (hôtel des
 * ventes) : on ne requête pas à chaque frappe, on attend la touche « Rechercher ».
 */
export default function SearchField({
  value,
  onChangeText,
  placeholder = 'Rechercher',
  onSubmit,
  style,
}: {
  value: string;
  onChangeText: (texte: string) => void;
  placeholder?: string;
  onSubmit?: () => void;
  style?: TextStyle;
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      onSubmitEditing={onSubmit}
      placeholder={placeholder}
      placeholderTextColor={colors.textDim3}
      returnKeyType="search"
      autoCorrect={false}
      autoCapitalize="none"
      clearButtonMode="while-editing"
      style={[styles.champ, style]}
    />
  );
}

export const champStyle = {
  minHeight: 38,
  paddingHorizontal: spacing.md,
  borderRadius: radius.slot,
  borderWidth: 1,
  borderColor: colors.goldFieldBorder,
  backgroundColor: colors.panelInner,
  color: colors.text,
  fontFamily: fonts.body,
  fontSize: 13,
} as const;

const styles = StyleSheet.create({ champ: champStyle });
