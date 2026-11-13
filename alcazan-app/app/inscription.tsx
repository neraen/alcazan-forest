import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { register, violationsDe } from '@/src/core/auth';
import GameButton from '@/src/ui/GameButton';
import Panel from '@/src/ui/Panel';
import { useToast } from '@/src/ui/toast/ToastProvider';
import { colors, fonts, radius, spacing } from '@/src/ui/tokens';

type Sexe = 'feminin' | 'masculin';

/**
 * Inscription — port de `pages/registerPage`. Pas de choix de classe : le personnage est
 * créé côté serveur par `PostRegisterSubscriber` à partir de `GameContent.php`.
 */
export default function InscriptionScreen() {
  const router = useRouter();
  const toast = useToast();
  const [pseudo, setPseudo] = useState('');
  const [sexe, setSexe] = useState<Sexe>('feminin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [erreurs, setErreurs] = useState<Record<string, string>>({});
  const [enCours, setEnCours] = useState(false);

  const valider = async () => {
    if (password !== passwordConfirm) {
      setErreurs({ passwordConfirm: 'Les deux mots de passe ne sont pas identiques.' });
      return;
    }
    setEnCours(true);
    try {
      await register({ pseudo, sexe, email, password, passwordConfirm });
      setErreurs({});
      toast.success('Personnage créé. Vous pouvez vous connecter.');
      router.replace('/connexion');
    } catch (error) {
      const violations = violationsDe(error);
      setErreurs(violations);
      if (Object.keys(violations).length === 0) {
        toast.error("L'inscription a échoué. Réessayez dans un instant.");
      }
    } finally {
      setEnCours(false);
    }
  };

  const champ = (
    cle: string,
    label: string,
    value: string,
    setValue: (v: string) => void,
    options: { secret?: boolean; email?: boolean } = {},
  ) => (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={setValue}
        secureTextEntry={options.secret}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType={options.email ? 'email-address' : 'default'}
        placeholderTextColor={colors.textDim3}
        style={[styles.input, !!erreurs[cle] && styles.inputError]}
      />
      {!!erreurs[cle] && <Text style={styles.erreur}>{erreurs[cle]}</Text>}
    </View>
  );

  return (
    <LinearGradient colors={[colors.bgTop, colors.bgBottom]} style={styles.page}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Panel style={styles.card}>
            <Text style={styles.title}>Inscription</Text>

            {champ('pseudo', 'Pseudo', pseudo, setPseudo)}

            <View style={styles.field}>
              <Text style={styles.label}>Sexe du personnage</Text>
              <View style={styles.radioRow}>
                {(['feminin', 'masculin'] as Sexe[]).map((valeur) => (
                  <Pressable
                    key={valeur}
                    onPress={() => setSexe(valeur)}
                    style={[styles.radio, sexe === valeur && styles.radioActif]}>
                    <Text style={[styles.radioLabel, sexe === valeur && styles.radioLabelActif]}>
                      {valeur === 'feminin' ? 'Femme' : 'Homme'}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {champ('email', 'Adresse email', email, setEmail, { email: true })}
            {champ('password', 'Mot de passe', password, setPassword, { secret: true })}
            {champ('passwordConfirm', 'Confirmation', passwordConfirm, setPasswordConfirm, {
              secret: true,
            })}

            <GameButton
              variant="solid"
              onPress={valider}
              loading={enCours}
              disabled={!pseudo || !email || !password}>
              Créer mon personnage
            </GameButton>

            <Pressable onPress={() => router.replace('/connexion')} style={styles.lien}>
              <Text style={styles.lienLabel}>J'ai déjà un compte</Text>
            </Pressable>
          </Panel>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl },
  card: { width: '100%', maxWidth: 420, alignSelf: 'center', gap: spacing.lg },
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
  erreur: { fontFamily: fonts.body, fontSize: 12, color: colors.dangerText },
  radioRow: { flexDirection: 'row', gap: spacing.sm },
  radio: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.slot,
    borderWidth: 1,
    borderColor: colors.goldFieldBorder,
    backgroundColor: colors.panelInner,
  },
  radioActif: { borderColor: colors.gold, backgroundColor: colors.goldSofter },
  radioLabel: { fontFamily: fonts.body, fontSize: 14, color: colors.textDim },
  radioLabelActif: { fontFamily: fonts.bodyBold, color: colors.gold },
  lien: { alignSelf: 'center', paddingVertical: spacing.sm },
  lienLabel: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.textDim },
});
