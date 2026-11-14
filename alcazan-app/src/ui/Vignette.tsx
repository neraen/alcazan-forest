import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';

import { colors, fonts, radius } from './tokens';

const TAILLES = { sm: 28, md: 40, lg: 52 } as const;

/**
 * Image d'un item, d'un métier ou d'un joueur, avec REPLI SUR L'INITIALE — port de
 * `artisanat/vignette/Vignette.jsx`. Le repli n'est pas décoratif : le contenu du jeu a
 * des images manquantes (les icônes de métier n'existent pas encore sur le disque), et
 * sans lui la carte montrerait un carré vide.
 */
export default function Vignette({
  src,
  initiale,
  taille = 'md',
  couleur,
  style,
  children,
}: {
  src?: string | null;
  /** Texte dont on prend la première lettre quand l'image manque. */
  initiale?: string | null;
  taille?: keyof typeof TAILLES;
  /** Couleur de bordure (rareté). */
  couleur?: string;
  style?: ViewStyle;
  children?: React.ReactNode;
}) {
  const [enEchec, setEnEchec] = useState(false);
  useEffect(() => setEnEchec(false), [src]);
  const cote = TAILLES[taille];

  return (
    <View
      style={[
        styles.vignette,
        { width: cote, height: cote },
        !!couleur && { borderColor: couleur },
        style,
      ]}>
      {src && !enEchec ? (
        <Image
          source={{ uri: src }}
          style={styles.image}
          contentFit="contain"
          onError={() => setEnEchec(true)}
        />
      ) : (
        <Text style={[styles.initiale, { fontSize: cote * 0.42 }]}>
          {(initiale || '?').trim().charAt(0).toUpperCase()}
        </Text>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  vignette: {
    borderRadius: radius.slot,
    borderWidth: 1,
    borderColor: colors.goldBorder,
    backgroundColor: colors.spellThumbBg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: { width: '84%', height: '84%' },
  initiale: { fontFamily: fonts.title, color: colors.gold },
});
