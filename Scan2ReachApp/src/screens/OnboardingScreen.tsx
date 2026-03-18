import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, SPACING, BORDER_RADIUS } from "../utils/constants";

const { width } = Dimensions.get("window");

const ONBOARDING_DATA = [
  { icon: "🚗", title: "Welcome to Scan2Reach", description: "Receive calls when someone scans your vehicle QR code", subtext: "No phone number revealed. Secure VoIP calls." },
  { icon: "📞", title: "How It Works", steps: [{ icon: "📱", text: "Person scans QR code on your car" }, { icon: "🔔", text: "They click Call Owner or Emergency" }, { icon: "✨", text: "Your phone rings instantly" }] },
];

const OnboardingScreen = ({ navigation }: any) => {
  const [currentPage, setCurrentPage] = useState(0);

  const handleNext = () => {
    if (currentPage < ONBOARDING_DATA.length - 1) setCurrentPage(currentPage + 1);
    else navigation.replace("DeviceMode");
  };

  const handleSkip = () => navigation.replace("DeviceMode");

  const renderPage = () => {
    const data = ONBOARDING_DATA[currentPage];
    if (currentPage === 0) {
      return (
        <View style={styles.pageContent}>
          <Text style={styles.pageIcon}>{data.icon}</Text>
          <Text style={styles.pageTitle}>{data.title}</Text>
          <Text style={styles.pageDescription}>{data.description}</Text>
          <Text style={styles.pageSubtext}>{data.subtext}</Text>
        </View>
      );
    }
    return (
      <View style={styles.pageContent}>
        <Text style={styles.pageTitle}>{data.title}</Text>
        <View style={styles.stepsContainer}>
          {data.steps?.map((step, index) => (
            <View key={index} style={styles.stepItem}>
              <View style={styles.stepIconContainer}><Text style={styles.stepIcon}>{step.icon}</Text></View>
              <View style={styles.stepTextContainer}><Text style={styles.stepNumber}>Step {index + 1}</Text><Text style={styles.stepText}>{step.text}</Text></View>
              {index < (data.steps?.length || 0) - 1 && <View style={styles.stepConnector} />}
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}><Text style={styles.skipText}>Skip</Text></TouchableOpacity>
      <View style={styles.content}>{renderPage()}</View>
      <View style={styles.dotsContainer}>
        {ONBOARDING_DATA.map((_, index) => <View key={index} style={[styles.dot, currentPage === index && styles.dotActive]} />)}
      </View>
      <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
        <Text style={styles.nextButtonText}>{currentPage === ONBOARDING_DATA.length - 1 ? "Get Started" : "Next"}</Text>
        <Text style={styles.nextButtonIcon}>→</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingHorizontal: SPACING.xl },
  skipButton: { alignSelf: "flex-end", paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg },
  skipText: { color: COLORS.textSecondary, fontSize: 16, fontWeight: "500" },
  content: { flex: 1, justifyContent: "center", alignItems: "center" },
  pageContent: { alignItems: "center", paddingHorizontal: SPACING.lg },
  pageIcon: { fontSize: 100, marginBottom: SPACING.xxl },
  pageTitle: { fontSize: 28, fontWeight: "800", color: COLORS.text, textAlign: "center", marginBottom: SPACING.lg },
  pageDescription: { fontSize: 17, color: COLORS.textSecondary, textAlign: "center", lineHeight: 26, marginBottom: SPACING.md },
  pageSubtext: { fontSize: 14, color: COLORS.textTertiary, textAlign: "center" },
  stepsContainer: { width: "100%", marginTop: SPACING.xl },
  stepItem: { flexDirection: "row", alignItems: "flex-start", marginBottom: SPACING.xxl, position: "relative" },
  stepIconContainer: { width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.card, justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: COLORS.primary, marginRight: SPACING.lg },
  stepIcon: { fontSize: 24 },
  stepTextContainer: { flex: 1, paddingTop: SPACING.sm },
  stepNumber: { fontSize: 12, color: COLORS.primary, fontWeight: "700", marginBottom: SPACING.xs, textTransform: "uppercase", letterSpacing: 1 },
  stepText: { fontSize: 16, color: COLORS.text, fontWeight: "500" },
  stepConnector: { position: "absolute", left: 27, top: 56, width: 2, height: 24, backgroundColor: COLORS.border },
  dotsContainer: { flexDirection: "row", justifyContent: "center", marginBottom: SPACING.xxl },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.border, marginHorizontal: SPACING.xs },
  dotActive: { width: 24, backgroundColor: COLORS.primary },
  nextButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.md, height: 56, marginBottom: SPACING.xxl },
  nextButtonText: { color: COLORS.text, fontSize: 17, fontWeight: "700", marginRight: SPACING.sm },
  nextButtonIcon: { color: COLORS.text, fontSize: 20, fontWeight: "700" },
});

export default OnboardingScreen;
