import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, SPACING, BORDER_RADIUS } from "../utils/constants";
import { useAuthStore } from "../store/useAuthStore";
import authService from "../services/authService";

const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { login, loginWithGoogle, hasCompletedOnboarding, deviceMode } = useAuthStore();

  const validateEmail = (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleEmailLogin = async () => {
    if (!email.trim()) { Alert.alert("Error", "Please enter your email"); return; }
    if (!validateEmail(email)) { Alert.alert("Error", "Please enter a valid email address"); return; }
    if (!password || password.length < 6) { Alert.alert("Error", "Password must be at least 6 characters"); return; }
    setIsLoading(true);
    try {
      await login(email.trim(), password);
      navigateAfterLogin();
    } catch (error: any) {
      Alert.alert("Login Failed", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      await loginWithGoogle();
      navigateAfterLogin();
    } catch (error: any) {
      Alert.alert("Google Sign-In Failed", error.message);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const navigateAfterLogin = () => {
    if (!hasCompletedOnboarding || !deviceMode) navigation.replace("Onboarding");
  };

  const handleForgotPassword = () => {
    if (!email.trim() || !validateEmail(email)) { Alert.alert("Enter Email", "Please enter a valid email first"); return; }
    Alert.alert("Reset Password", `Send password reset email to ${email}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Send", onPress: async () => { try { await authService.resetPassword(email); Alert.alert("Email Sent", "Check your inbox"); } catch (error: any) { Alert.alert("Error", error.message); } } },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.logoContainer}><Text style={styles.logoIcon}>🚗</Text><Text style={styles.logoText}>Scan2Reach</Text></View>
          <View style={styles.titleContainer}><Text style={styles.title}>Welcome Back</Text><Text style={styles.subtitle}>Sign in to receive vehicle calls</Text></View>
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputIcon}>📧</Text>
              <TextInput style={styles.input} placeholder="your@email.com" placeholderTextColor={COLORS.textTertiary} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput style={styles.input} placeholder="Password" placeholderTextColor={COLORS.textTertiary} value={password} onChangeText={setPassword} secureTextEntry={!showPassword} autoCapitalize="none" />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}><Text style={styles.eyeIcon}>{showPassword ? "👁️" : "👁️‍🗨️"}</Text></TouchableOpacity>
            </View>
            <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotButton}><Text style={styles.forgotText}>Forgot Password?</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.loginButton, isLoading && styles.buttonDisabled]} onPress={handleEmailLogin} disabled={isLoading}>
              {isLoading ? <ActivityIndicator color={COLORS.text} /> : <><Text style={styles.loginButtonIcon}>🔓</Text><Text style={styles.loginButtonText}>Sign In</Text></>}
            </TouchableOpacity>
            <View style={styles.divider}><View style={styles.dividerLine} /><Text style={styles.dividerText}>or</Text><View style={styles.dividerLine} /></View>
            <TouchableOpacity style={[styles.googleButton, isGoogleLoading && styles.buttonDisabled]} onPress={handleGoogleLogin} disabled={isGoogleLoading}>
              {isGoogleLoading ? <ActivityIndicator color={COLORS.background} /> : <><Text style={styles.googleIcon}>G</Text><Text style={styles.googleButtonText}>Continue with Google</Text></>}
            </TouchableOpacity>
          </View>
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account?</Text>
            <TouchableOpacity onPress={() => Linking.openURL("https://scan2reach-new.web.app")}><Text style={styles.footerLink}>Visit scan2reach.com</Text></TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.xxl },
  logoContainer: { alignItems: "center", marginTop: SPACING.xxl, marginBottom: SPACING.xl },
  logoIcon: { fontSize: 64, marginBottom: SPACING.md },
  logoText: { fontSize: 28, fontWeight: "800", color: COLORS.primary },
  titleContainer: { alignItems: "center", marginBottom: SPACING.xxl },
  title: { fontSize: 28, fontWeight: "700", color: COLORS.text, marginBottom: SPACING.xs },
  subtitle: { fontSize: 15, color: COLORS.textSecondary },
  form: { width: "100%" },
  inputContainer: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.lg, paddingHorizontal: SPACING.lg, height: 56 },
  inputIcon: { fontSize: 18, marginRight: SPACING.md },
  input: { flex: 1, color: COLORS.text, fontSize: 16 },
  eyeButton: { padding: SPACING.sm },
  eyeIcon: { fontSize: 18 },
  forgotButton: { alignSelf: "flex-end", marginBottom: SPACING.xl },
  forgotText: { color: COLORS.primary, fontSize: 14, fontWeight: "600" },
  loginButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.md, height: 56, marginBottom: SPACING.xl },
  loginButtonIcon: { fontSize: 18, marginRight: SPACING.sm },
  loginButtonText: { color: COLORS.text, fontSize: 17, fontWeight: "700" },
  buttonDisabled: { opacity: 0.6 },
  divider: { flexDirection: "row", alignItems: "center", marginBottom: SPACING.xl },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: { color: COLORS.textTertiary, paddingHorizontal: SPACING.lg, fontSize: 14 },
  googleButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: COLORS.text, borderRadius: BORDER_RADIUS.md, height: 56 },
  googleIcon: { fontSize: 20, fontWeight: "700", color: "#4285F4", marginRight: SPACING.md },
  googleButtonText: { color: COLORS.background, fontSize: 16, fontWeight: "600" },
  footer: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: "auto", paddingTop: SPACING.xxl },
  footerText: { color: COLORS.textSecondary, fontSize: 14 },
  footerLink: { color: COLORS.primary, fontSize: 14, fontWeight: "600", marginLeft: SPACING.xs },
});

export default LoginScreen;
