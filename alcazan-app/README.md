# Alcazan Forest — application mobile

## Preview Android et mises à jour

Les builds installés utilisent le même serveur que le site :
`https://alcazan-forest.com/api/` pour l'API, `https://alcazan-forest.com` pour les
images et `https://alcazan-forest.com/.well-known/mercure` pour le temps réel.
En développement avec Metro, les services locaux restent utilisés. Les variables
`EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_MEDIA_URL` et `EXPO_PUBLIC_MERCURE_URL` permettent
de surcharger ces adresses au moment de générer le bundle.

Depuis ce dossier :

```bash
npx eas-cli@latest build --platform android --profile preview
```

Installer cet APK une première fois : les APK antérieurs à l'ajout d'`expo-updates`
ne peuvent pas recevoir les mises à jour à distance.

Pour publier ensuite un correctif JavaScript ou des assets compatibles :

```bash
npx eas-cli@latest update --channel preview --environment preview --platform android --message "Description du correctif"
```

La mise à jour est téléchargée au lancement et appliquée au prochain redémarrage
de l'app. Le canal `production` est séparé du canal `preview`. La politique de
runtime `fingerprint` empêche une mise à jour incompatible de parvenir à un ancien
APK : un changement de dépendance native, de SDK ou de configuration native exige
un nouveau build. Utiliser le même environnement EAS pour le build et l'update.

## Documentation Expo

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
