import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { getAuth, signInWithPhoneNumber } from '@react-native-firebase/auth';

const STUDENT_NAME = 'Saad';
const ROLL_NUMBER = 'i233076';

type Confirmation = Awaited<ReturnType<typeof signInWithPhoneNumber>>;
type Notice = { kind: 'success' | 'error' | 'info'; message: string } | null;

function toE164(value: string) {
  return value.replace(/[\s()-]/g, '');
}

function firebaseMessage(error: unknown, verifying: boolean) {
  const code = (error as { code?: string } | null)?.code;

  switch (code) {
    case 'auth/invalid-phone-number':
      return 'That phone number is not valid. Include the country code, for example +92.';
    case 'auth/invalid-verification-code':
      return 'That code did not match. Check the SMS and try again.';
    case 'auth/code-expired':
      return 'This code has expired. Request a new one and try again.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Wait a while before requesting another code.';
    case 'auth/operation-not-allowed':
      return 'Phone sign-in is not enabled yet. Turn it on in Firebase Authentication.';
    case 'auth/app-not-authorized':
    case 'auth/invalid-app-credential':
      return 'Firebase could not verify this app. Check the Android package name and SHA fingerprints.';
    case 'auth/network-request-failed':
      return 'Could not reach Firebase. Check your internet connection and try again.';
    default:
      return verifying
        ? 'We could not verify that code. Check it and try again.'
        : 'We could not send a code. Check your Firebase setup and try again.';
  }
}

export default function App() {
  const [phone, setPhone] = useState('');
  const [activePhone, setActivePhone] = useState('');
  const [code, setCode] = useState('');
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [verified, setVerified] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  async function requestCode() {
    const formattedPhone = toE164(phone.trim());
    if (!/^\+[1-9]\d{7,14}$/.test(formattedPhone)) {
      setNotice({
        kind: 'error',
        message: 'Enter a valid number with its country code, such as +92 300 1234567.',
      });
      return;
    }

    setBusy(true);
    setNotice(null);
    try {
      const result = await signInWithPhoneNumber(getAuth(), formattedPhone);
      setConfirmation(result);
      setActivePhone(formattedPhone);
      setCode('');
      setNotice({
        kind: 'info',
        message: 'Request ready. For a Firebase test number, enter the Console code; no SMS is sent.',
      });
    } catch (error) {
      setNotice({ kind: 'error', message: firebaseMessage(error, false) });
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode() {
    if (!confirmation) return;
    if (!/^\d{6}$/.test(code.trim())) {
      setNotice({ kind: 'error', message: 'Enter the 6-digit SMS code or the code configured for this Firebase test number.' });
      return;
    }

    setBusy(true);
    setNotice(null);
    try {
      await confirmation.confirm(code.trim());
      setVerified(true);
      setNotice({ kind: 'success', message: 'Your phone number has been verified.' });
    } catch (error) {
      setNotice({ kind: 'error', message: firebaseMessage(error, true) });
    } finally {
      setBusy(false);
    }
  }

  function startAgain() {
    setPhone('');
    setActivePhone('');
    setCode('');
    setConfirmation(null);
    setVerified(false);
    setNotice(null);
  }

  const isOtpStep = confirmation !== null;

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.topRow}>
          <View style={styles.brandMark}><Text style={styles.brandMarkText}>04</Text></View>
          <Text style={styles.brandText}>SMD QUIZ 4</Text>
          <View style={styles.studentBadge}>
            <Text style={styles.studentName}>{STUDENT_NAME}</Text>
            <Text style={styles.rollNumber}>{ROLL_NUMBER}</Text>
          </View>
        </View>

        <View style={styles.intro}>
          <Text style={styles.kicker}>PHONE AUTHENTICATION</Text>
          <Text style={styles.title}>{verified ? 'You’re verified.' : 'Verify your\nphone number.'}</Text>
          <Text style={styles.subtitle}>
            {verified
              ? 'Your number is now confirmed with Firebase.'
              : 'Request a phone verification code. Firebase test numbers use a Console code without sending SMS.'}
          </Text>
        </View>

        <View style={styles.card}>
          {verified ? (
            <View style={styles.successPanel}>
              <View style={styles.checkCircle}><Text style={styles.checkMark}>✓</Text></View>
              <Text style={styles.successTitle}>Verification complete</Text>
              <Text style={styles.verifiedPhone}>{activePhone}</Text>
              <Text style={styles.helperText}>Firebase Authentication signed you in with this number.</Text>
              <TouchableOpacity style={styles.secondaryButton} onPress={startAgain}>
                <Text style={styles.secondaryButtonText}>Verify another number</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.stepHeader}>
                <View style={styles.stepDot}><Text style={styles.stepDotText}>{isOtpStep ? '2' : '1'}</Text></View>
                <View>
                  <Text style={styles.cardTitle}>{isOtpStep ? 'Enter your code' : 'Your phone number'}</Text>
                  <Text style={styles.cardSubtitle}>{isOtpStep ? 'Enter the SMS code or your configured Firebase test code.' : 'Use international format with + and country code.'}</Text>
                </View>
              </View>

              {isOtpStep ? (
                <>
                  <View style={styles.sentToRow}>
                    <Text style={styles.sentToLabel}>VERIFYING NUMBER</Text>
                    <TouchableOpacity
                      onPress={() => {
                        setConfirmation(null);
                        setCode('');
                        setNotice(null);
                      }}
                    >
                      <Text style={styles.changeNumber}>Change</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.phonePreview}>{activePhone}</Text>
                  <TextInput
                    value={code}
                    onChangeText={(value) => setCode(value.replace(/\D/g, '').slice(0, 6))}
                    style={[styles.input, styles.codeInput]}
                    placeholder="••••••"
                    placeholderTextColor="#A4AFBC"
                    keyboardType="number-pad"
                    textContentType="oneTimeCode"
                    maxLength={6}
                    editable={!busy}
                    accessibilityLabel="6-digit verification code"
                  />
                  <TouchableOpacity
                    style={[styles.primaryButton, busy && styles.buttonDisabled]}
                    onPress={verifyCode}
                    disabled={busy}
                    activeOpacity={0.86}
                  >
                    {busy ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Verify code</Text>}
                  </TouchableOpacity>
                  <TouchableOpacity onPress={requestCode} disabled={busy} style={styles.resendButton}>
                    <Text style={styles.resendText}>Need another code request? <Text style={styles.resendStrong}>Try again</Text></Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TextInput
                    value={phone}
                    onChangeText={setPhone}
                    style={styles.input}
                    placeholder="+92 300 1234567"
                    placeholderTextColor="#A4AFBC"
                    keyboardType="phone-pad"
                    autoComplete="tel"
                    editable={!busy}
                    accessibilityLabel="Phone number including country code"
                  />
                  <Text style={styles.helperText}>Firebase test numbers use the code saved in Console and send no SMS. Real SMS may incur charges.</Text>
                  <TouchableOpacity
                    style={[styles.primaryButton, busy && styles.buttonDisabled]}
                    onPress={requestCode}
                    disabled={busy}
                    activeOpacity={0.86}
                  >
                    {busy ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Request verification code</Text>}
                  </TouchableOpacity>
                </>
              )}

              {notice && <View style={[styles.notice, styles[`notice_${notice.kind}`]]}>
                <Text style={[styles.noticeText, notice.kind === 'success' && styles.noticeSuccessText, notice.kind === 'info' && styles.noticeInfoText]}>{notice.message}</Text>
              </View>}
            </>
          )}
        </View>

        <View style={styles.footer}>
          <View style={styles.lockIcon}><Text style={styles.lockIconText}>✓</Text></View>
          <Text style={styles.footerText}>Secure phone verification powered by Firebase</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F4F7FB' },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 26, paddingBottom: 32 },
  topRow: { flexDirection: 'row', alignItems: 'center', minHeight: 44 },
  brandMark: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#143451', alignItems: 'center', justifyContent: 'center' },
  brandMarkText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
  brandText: { color: '#536579', fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginLeft: 11 },
  studentBadge: { marginLeft: 'auto', alignItems: 'flex-end' },
  studentName: { color: '#173954', fontSize: 12, fontWeight: '800' },
  rollNumber: { color: '#7D8A98', fontSize: 10, fontWeight: '600', marginTop: 2, letterSpacing: 0.6 },
  intro: { marginTop: 46, marginBottom: 27 },
  kicker: { color: '#438B80', fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  title: { color: '#142E45', fontSize: 34, lineHeight: 40, fontWeight: '800', letterSpacing: -0.8, marginTop: 12 },
  subtitle: { color: '#718091', fontSize: 14, lineHeight: 21, marginTop: 12, maxWidth: 310 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 23, padding: 22, borderWidth: 1, borderColor: '#E8EDF3', shadowColor: '#173954', shadowOffset: { width: 0, height: 9 }, shadowOpacity: 0.07, shadowRadius: 20, elevation: 3 },
  stepHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 23 },
  stepDot: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E8F4F1', marginRight: 12 },
  stepDotText: { color: '#367D73', fontSize: 14, fontWeight: '800' },
  cardTitle: { color: '#18364F', fontSize: 16, fontWeight: '800' },
  cardSubtitle: { color: '#8491A0', fontSize: 11, marginTop: 4 },
  input: { height: 56, borderRadius: 13, borderWidth: 1, borderColor: '#E0E7EE', paddingHorizontal: 16, color: '#1A344A', fontSize: 16, backgroundColor: '#FBFCFE' },
  codeInput: { fontSize: 23, fontWeight: '800', letterSpacing: 10, textAlign: 'center', paddingLeft: 24, marginBottom: 16 },
  helperText: { color: '#93A0AE', fontSize: 11, lineHeight: 17, marginTop: 10, marginBottom: 18 },
  primaryButton: { height: 54, borderRadius: 14, backgroundColor: '#173C5A', alignItems: 'center', justifyContent: 'center', shadowColor: '#173C5A', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.16, shadowRadius: 9, elevation: 2 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  buttonDisabled: { opacity: 0.65 },
  notice: { borderRadius: 11, paddingHorizontal: 13, paddingVertical: 11, marginTop: 16, backgroundColor: '#EEF4F8' },
  notice_info: { backgroundColor: '#EDF5F8' },
  notice_error: { backgroundColor: '#FFF0EC' },
  notice_success: { backgroundColor: '#EAF6F0' },
  noticeText: { color: '#9D503A', fontSize: 12, lineHeight: 17 },
  noticeInfoText: { color: '#486C7F' },
  noticeSuccessText: { color: '#26714F' },
  sentToRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 },
  sentToLabel: { color: '#9AA5B1', fontSize: 9, fontWeight: '800', letterSpacing: 1.3 },
  changeNumber: { color: '#438B80', fontSize: 11, fontWeight: '800' },
  phonePreview: { color: '#1A344A', fontSize: 14, fontWeight: '700', marginBottom: 17 },
  resendButton: { alignItems: 'center', paddingTop: 17, paddingBottom: 1 },
  resendText: { color: '#8793A0', fontSize: 12 },
  resendStrong: { color: '#367D73', fontWeight: '800' },
  successPanel: { alignItems: 'center', paddingVertical: 10 },
  checkCircle: { width: 68, height: 68, borderRadius: 24, backgroundColor: '#E6F5ED', alignItems: 'center', justifyContent: 'center', marginBottom: 17 },
  checkMark: { color: '#29835A', fontSize: 31, fontWeight: '700' },
  successTitle: { color: '#18364F', fontSize: 18, fontWeight: '800' },
  verifiedPhone: { color: '#367D73', fontSize: 15, fontWeight: '700', marginTop: 9 },
  secondaryButton: { height: 48, borderRadius: 13, borderWidth: 1, borderColor: '#DDE8E7', paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center', marginTop: 20, backgroundColor: '#FAFCFC' },
  secondaryButtonText: { color: '#367D73', fontSize: 12, fontWeight: '800' },
  lockIcon: { height: 18, width: 18, borderRadius: 6, borderWidth: 1, borderColor: '#91B8AE', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  lockIconText: { color: '#438B80', fontSize: 10, fontWeight: '800' },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 28 },
  footerText: { color: '#9AA6B2', fontSize: 10, fontWeight: '600' },
});
