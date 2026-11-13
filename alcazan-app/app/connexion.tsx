import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useAuth } from '@/src/core/AuthContext';
import { mediaUrl } from '@/src/core/media';
import GameButton from '@/src/ui/GameButton';
import Panel from '@/src/ui/Panel';
import { colors, fonts, radius, spacing } from '@/src/ui/tokens';

export default function ConnexionScreen() {
  const { seConnecter } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [erreur, setErreur] = useState('');
  const [enCours, setEnCours] = useState(false);

  const valider = async () => {
    setEnCours(true);
    try {
      await seConnecter(username.trim(), password);
      setErreur('');
      // Pas de navigation ici : la garde de `app/_layout` redirige dès que le token est
      // posé. Deux redirections concurrentes feraient clignoter l'écran.
    } catch {
      setErreur('Combinaison email / mot de passe invalide ou email inexistant.');
    } finally {
      setEnCours(false);
    }
  };

  return (
    <LinearGradient colors={[colors.bgTop, colors.bgBottom]} style={styles.page}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Image
            source={{ uri: mediaUrl('/img/alcazan_forest_logo.png') }}
            style={styles.logo}
            contentFit="contain"
          />
          <Text style={styles.brand}>Alcazan Forest</Text>
          <Text style={styles.tagline}>MMORPG médiéval</Text>

          <Panel style={styles.card}>
            <Text style={styles.title}>Connexion</Text>

            <View style={styles.field}>
              <Text style={styles.label}>Adresse email</Text>
              <TextInput
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="username"
                placeholder="vous@exemple.fr"
                placeholderTextColor={colors.textDim3}
                style={[styles.input, !!erreur && styles.inputError]}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Mot de passe</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                textContentType="password"
                placeholderTextColor={colors.textDim3}
                style={styles.input}
                onSubmitEditing={valider}
                returnKeyType="go"
              />
            </View>

            {!!erreur && <Text style={styles.erreur}>{erreur}</Text>}

            <GameButton
              variant="solid"
              onPress={valider}
              loading={enCours}
              disabled={!username || !password}
              style={styles.submit}>
              Je me connecte
            </GameButton>

            <Link href="/inscription" style={styles.lien}>
              <Text style={styles.lienLabel}>Créer un personnage</Text>
            </Link>
          </Panel>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.xs,
  },
  logo: { width: 86, height: 86, marginBottom: spacing.sm },
  brand: {
    fontFamily: fonts.titleBold,
    fontSize: 26,
    color: colors.gold,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  tagline: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textFaint,
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: spacing.xl,
  },
  card: { width: '100%', maxWidth: 420, gap: spacing.lg },
  title: {
    fontFamily: fonts.title,
    fontSize: 20,
    color: colors.gold,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  field: { gap: spacing.xs + 2 },
  label: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: colors.textMute,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  input: {
    minHeight: 46,
    paddingHorizontal: spacing.md,
    borderRadius: radius.slot,
    borderWidth: 1,
    borderColor: colors.goldFieldBorder,
    backgroundColor: colors.panelInner,
    color: colors.text,
    fontFamily: fonts.body,
    fontSize: 15,
  },
  inputError: { borderColor: colors.dangerBorder },
  erreur: { fontFamily: fonts.body, fontSize: 13, color: colors.dangerText },
  submit: { marginTop: spacing.xs },
  lien: { alignSelf: 'center', paddingVertical: spacing.sm },
  lienLabel: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.textDim },
});
