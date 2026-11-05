# SMD Quiz 4 — Firebase Phone OTP

A small Expo app that requests Firebase Authentication phone verification, accepts a six-digit OTP or configured Firebase test code, and reports whether verification succeeded. The header is branded with **Saad · i233076**; change `STUDENT_NAME` and `ROLL_NUMBER` near the top of `App.tsx` if you want different text.

### About the Firebase guide you pasted

That guide is for [Firebase Phone Number Verification (PNV)](https://firebase.google.com/docs/phone-number-verification/android/get-started). PNV asks for consent, checks whether a supported SIM/carrier can verify the number, and returns a token. It does **not** send an SMS OTP for the user to type. This app uses Firebase Authentication's Phone provider because the quiz specifically asks for an SMS code and a code-entry screen.

## Firebase project setup

1. Create a project in the [Firebase Console](https://console.firebase.google.com/).
2. In **Project settings → General → Your apps**, add an **Android** app. Set its Android package name to exactly `com.i233076.smdquiz4otp`.
3. Download that app's `google-services.json` and place it in this repository's root folder, beside `app.json`. Do not rename it. The file is project configuration, not a service-account private key.
4. Open **Authentication → Sign-in method** and enable **Phone**.
5. In **Authentication → Settings → SMS region policy**, allow the countries you intend to test (for example, Pakistan). New Firebase projects may have no SMS regions allowed by default.
6. Under the Phone provider's **Phone numbers for testing** section, add a fictional phone number in international format and a six-digit code that you choose. Enter that same number and code in the app. Firebase sends no SMS and does not consume SMS verification quota for these test numbers, so this is the intended no-charge demo path. See [Firebase's test-number instructions](https://firebase.google.com/docs/auth/android/phone-auth#test-with-fictional-phone-numbers).
7. Real SMS delivery is optional. It needs a linked Cloud Billing account and is billed per SMS; check the current [Firebase pricing](https://firebase.google.com/pricing) before using a real number.

### Android app verification

Firebase checks that phone sign-in requests come from your Android app. For a local debug build, generate the native Android project and read its signing fingerprints:

```powershell
npx expo prebuild --platform android
cd android
.\gradlew signingReport
```

In Firebase **Project settings → General → Your apps → Android app**, add the debug variant's SHA-1 and SHA-256 fingerprints. Then return to the repository root and build/install the app:

```powershell
cd ..
npx expo run:android
```

You need Android Studio and the Android SDK for a local build. The alternative is an EAS development APK: run `npx eas-cli login`, then `npx eas-cli build --profile development --platform android`. Register the signing certificate fingerprints for the EAS build in Firebase as well. Whenever you change the package name or native Firebase configuration, rebuild the development app.

## Run the app

React Native Firebase uses native Android code, so this app **does not run in Expo Go**. First place `google-services.json` in the root, then install dependencies and build a development app:

```powershell
npm install
npx expo run:android
```

Or use the EAS development APK steps above. Once the app is installed, start the JavaScript bundler with:

```powershell
npx expo start --dev-client
```

Enter the exact test phone number you configured, including `+` and the country code. Tap **Request verification code**, then enter the six-digit code saved beside that number in Firebase Console. Firebase does not send an SMS for a test number.

Replace the remote URL with your repository's URL. Include `google-services.json` if you want the repository to build immediately; Firebase client configuration is not a private service-account credential. Never add a service-account key or other private credential. If you choose not to publish the Firebase config, share it separately with your instructor and explain where it should be placed.

## References

- [Expo: Using Firebase](https://docs.expo.dev/guides/using-firebase/)
- [React Native Firebase: Phone Authentication](https://rnfirebase.io/auth/phone-auth)
- [Firebase: Phone number authentication on Android](https://firebase.google.com/docs/auth/android/phone-auth)
- [Firebase Authentication pricing](https://firebase.google.com/pricing)
