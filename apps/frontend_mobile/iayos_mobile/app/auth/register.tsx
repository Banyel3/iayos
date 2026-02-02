import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
  Alert,
  Keyboard,
  TextInput as RNTextInput,
  Modal,
  FlatList,
  ActivityIndicator,
} from "react-native";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
} from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Image } from "react-native";
import { useBarangays, Barangay } from "@/lib/hooks/useLocations";

const DEFAULT_COUNTRY = "Philippines";
const DEFAULT_CITY = "Zamboanga City";
const DEFAULT_PROVINCE = "Zamboanga del Sur";
const MIN_PASSWORD_LENGTH = 8;
const ADULT_AGE = 18;
const EARLIEST_BIRTH_DATE = new Date(1950, 0, 1);

const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function RegisterScreen() {
  const [profileType, setProfileType] = useState<"WORKER" | "CLIENT">("CLIENT");
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [barangay, setBarangay] = useState("");
  const [barangayModalVisible, setBarangayModalVisible] = useState(false);
  const [city, setCity] = useState(DEFAULT_CITY);
  const [province, setProvince] = useState(DEFAULT_PROVINCE);
  const [postalCode, setPostalCode] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();
  
  // Fetch barangays for Zamboanga City (city ID = 1)
  const {
    data: barangays = [],
    isLoading: barangaysLoading,
    isError: barangaysError,
  } = useBarangays(1);

  // Handle barangay selection - auto-fill postal code
  const handleBarangaySelect = (selectedBarangay: Barangay) => {
    setBarangay(selectedBarangay.name);
    // Auto-fill postal code from barangay data
    if (selectedBarangay.zipCode) {
      setPostalCode(selectedBarangay.zipCode);
    }
    // City and province are already set to defaults
    setBarangayModalVisible(false);
  };
  const adultCutoffDate = useMemo(() => {
    const today = new Date();
    return new Date(
      today.getFullYear() - ADULT_AGE,
      today.getMonth(),
      today.getDate(),
    );
  }, []);

  const firstNameRef = useRef<React.ComponentRef<typeof RNTextInput> | null>(
    null,
  );
  const middleNameRef = useRef<React.ComponentRef<typeof RNTextInput> | null>(
    null,
  );
  const lastNameRef = useRef<React.ComponentRef<typeof RNTextInput> | null>(
    null,
  );
  const emailRef = useRef<React.ComponentRef<typeof RNTextInput> | null>(null);
  const contactNumberRef = useRef<React.ComponentRef<
    typeof RNTextInput
  > | null>(null);
  const birthDateRef = useRef<React.ComponentRef<typeof RNTextInput> | null>(
    null,
  );
  const passwordRef = useRef<React.ComponentRef<typeof RNTextInput> | null>(
    null,
  );
  const confirmPasswordRef = useRef<React.ComponentRef<
    typeof RNTextInput
  > | null>(null);
  const streetAddressRef = useRef<React.ComponentRef<
    typeof RNTextInput
  > | null>(null);
  const cityRef = useRef<React.ComponentRef<typeof RNTextInput> | null>(null);
  const provinceRef = useRef<React.ComponentRef<typeof RNTextInput> | null>(
    null,
  );
  const postalCodeRef = useRef<React.ComponentRef<typeof RNTextInput> | null>(
    null,
  );
  const lastFocusedRef = useRef<any>(null);

  useEffect(() => {
    const subscription = Keyboard.addListener("keyboardDidHide", () => {
      const fieldRef = lastFocusedRef.current?.current ?? null;
      if (fieldRef && (fieldRef as any).isFocused?.()) {
        setTimeout(() => {
          try {
            (fieldRef as any).focus?.();
          } catch (e) { }
        }, 50);
      }
    });

    return () => {
      try {
        subscription.remove();
      } catch (e) { }
    };
  }, []);

  const handleContactChange = (value: string) => {
    const digitsOnly = value.replace(/[^0-9]/g, "").slice(0, 11);
    setContactNumber(digitsOnly);
  };

  const handlePostalCodeChange = (value: string) => {
    const digitsOnly = value.replace(/[^0-9]/g, "").slice(0, 4);
    setPostalCode(digitsOnly);
  };

  const handleBirthDateChange = (
    event: DateTimePickerEvent,
    selectedDate?: Date,
  ) => {
    const isIOS = Platform.OS === "ios";
    setShowDatePicker(isIOS);

    if (event.type === "dismissed") {
      return;
    }

    if (selectedDate) {
      setBirthDate(formatDate(selectedDate));
    }
  };

  const openBirthDatePicker = () => {
    lastFocusedRef.current = birthDateRef;
    setShowDatePicker(true);
  };

  const handleRegister = async () => {
    const trimmedFirst = firstName.trim();
    const trimmedMiddle = middleName.trim();
    const trimmedLast = lastName.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedStreet = streetAddress.trim();
    const trimmedCity = city.trim();
    const trimmedProvince = province.trim();
    const trimmedPostal = postalCode.trim();
    const sanitizedContact = contactNumber.trim();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const nameRegex = /^[A-Za-z]+$/;
    const middleNameRegex = /^[A-Za-z]*$/;
    const postalRegex = /^\d{4}$/;
    const contactRegex = /^\d{11}$/;

    if (!nameRegex.test(trimmedFirst)) {
      Alert.alert("Error", "First name must contain letters only");
      return;
    }

    if (trimmedMiddle && !middleNameRegex.test(trimmedMiddle)) {
      Alert.alert("Error", "Middle name must contain letters only");
      return;
    }

    if (!nameRegex.test(trimmedLast)) {
      Alert.alert("Error", "Last name must contain letters only");
      return;
    }

    if (!emailRegex.test(trimmedEmail)) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    if (!contactRegex.test(sanitizedContact)) {
      Alert.alert("Error", "Contact number must be 11 digits");
      return;
    }

    if (!birthDate) {
      Alert.alert("Error", "Please select your birth date");
      return;
    }

    const birthDateObj = new Date(birthDate);
    if (Number.isNaN(birthDateObj.getTime())) {
      Alert.alert("Error", "Invalid birth date");
      return;
    }

    const today = new Date();
    let age = today.getFullYear() - birthDateObj.getFullYear();
    const monthDiff = today.getMonth() - birthDateObj.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDateObj.getDate())
    ) {
      age -= 1;
    }

    if (age < ADULT_AGE) {
      Alert.alert("Error", "You must be at least 18 years old to register");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      Alert.alert(
        "Error",
        `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
      );
      return;
    }

    if (!/[A-Z]/.test(password)) {
      Alert.alert(
        "Error",
        "Password must include at least one uppercase letter",
      );
      return;
    }

    if (!/[0-9]/.test(password)) {
      Alert.alert("Error", "Password must include at least one number");
      return;
    }

    if (!/[^A-Za-z0-9]/.test(password)) {
      Alert.alert(
        "Error",
        "Password must include at least one special character",
      );
      return;
    }

    if (!barangay.trim()) {
      Alert.alert("Error", "Please select a barangay");
      return;
    }

    if (!trimmedStreet || !trimmedCity || !trimmedProvince) {
      Alert.alert("Error", "Street address, city, and province are required");
      return;
    }

    if (!postalRegex.test(trimmedPostal)) {
      Alert.alert("Error", "Postal code must be exactly 4 digits");
      return;
    }

    setIsLoading(true);
    try {
      const response = await register({
        firstName: trimmedFirst,
        middleName: trimmedMiddle,
        lastName: trimmedLast,
        contactNum: sanitizedContact,
        birthDate,
        email: trimmedEmail,
        password,
        confirmPassword,
        street_address: trimmedStreet,
        barangay: barangay.trim(),
        city: trimmedCity,
        province: trimmedProvince,
        postal_code: trimmedPostal,
        country: DEFAULT_COUNTRY,
        profileType,
      });

      // Navigate to OTP verification screen
      router.replace({
        pathname: "/auth/verify-otp",
        params: {
          email: trimmedEmail,
          expiryMinutes: response.otp_expiry_minutes?.toString() || "5",
        },
      } as any);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} testID="register-screen">
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        enabled={true}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
          keyboardDismissMode="on-drag"
        >
          {/* Header */}
          <View style={styles.headerContainer}>
            {/* Back Button */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              disabled={isLoading}
            >
              <Ionicons name="arrow-back" size={24} color={Colors.primary} />
            </TouchableOpacity>

            {/* Title */}
            <Image
              source={require("../../assets/logo-white.png")}
              style={{ width: 120, height: 120, resizeMode: "contain", marginBottom: Spacing["2xl"] }}
              accessibilityLabel="iAyos Logo"
            />
            <Text style={styles.headerTitle}>Create Account</Text>
            <Text style={styles.headerSubtitle}>Join iAyos today</Text>
          </View>

          <View style={styles.formContainer}>
            {/* Profile Type Selection */}
            <View style={styles.profileTypeSection}>
              <Text style={styles.profileTypeTitle}>I want to...</Text>
              <View style={styles.profileTypeCards}>
                {/* Client Card */}
                <TouchableOpacity
                  style={[
                    styles.profileTypeCard,
                    profileType === "CLIENT" && styles.profileTypeCardSelected,
                  ]}
                  onPress={() => setProfileType("CLIENT")}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.profileTypeIconContainer,
                      profileType === "CLIENT" &&
                      styles.profileTypeIconContainerSelected,
                    ]}
                  >
                    <Ionicons
                      name="briefcase-outline"
                      size={32}
                      color={
                        profileType === "CLIENT" ? Colors.white : Colors.primary
                      }
                    />
                  </View>
                  <Text
                    style={[
                      styles.profileTypeCardTitle,
                      profileType === "CLIENT" &&
                      styles.profileTypeCardTitleSelected,
                    ]}
                  >
                    Hire Workers
                  </Text>
                  <Text style={styles.profileTypeCardDescription}>
                    Post jobs and find skilled workers for your projects
                  </Text>
                  {profileType === "CLIENT" && (
                    <View style={styles.selectedBadge}>
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={Colors.primary}
                      />
                    </View>
                  )}
                </TouchableOpacity>

                {/* Worker Card */}
                <TouchableOpacity
                  style={[
                    styles.profileTypeCard,
                    profileType === "WORKER" && styles.profileTypeCardSelected,
                  ]}
                  onPress={() => setProfileType("WORKER")}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.profileTypeIconContainer,
                      profileType === "WORKER" &&
                      styles.profileTypeIconContainerSelected,
                    ]}
                  >
                    <Ionicons
                      name="construct-outline"
                      size={32}
                      color={
                        profileType === "WORKER" ? Colors.white : Colors.primary
                      }
                    />
                  </View>
                  <Text
                    style={[
                      styles.profileTypeCardTitle,
                      profileType === "WORKER" &&
                      styles.profileTypeCardTitleSelected,
                    ]}
                  >
                    Find Work
                  </Text>
                  <Text style={styles.profileTypeCardDescription}>
                    Browse jobs and offer your services to clients
                  </Text>
                  {profileType === "WORKER" && (
                    <View style={styles.selectedBadge}>
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={Colors.primary}
                      />
                    </View>
                  )}
                </TouchableOpacity>
              </View>
              <Text style={styles.profileTypeNote}>
                💡 You can add the other profile type later in settings
              </Text>
            </View>

            {/* Personal Information Section */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Personal Information</Text>
            </View>

            {/* First Name */}
            <Input
              ref={firstNameRef}
              testID="register-first-name-input"
              label="First Name"
              placeholder="Juan"
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="words"
              editable={!isLoading}
              required
              iconLeft={
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={Colors.primary}
                />
              }
              onFocus={() => {
                lastFocusedRef.current = firstNameRef;
              }}
            />

            {/* Middle Name */}
            <Input
              ref={middleNameRef}
              label="Middle Name (Optional)"
              placeholder="Santos"
              value={middleName}
              onChangeText={setMiddleName}
              autoCapitalize="words"
              editable={!isLoading}
              iconLeft={
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={Colors.primary}
                />
              }
              onFocus={() => {
                lastFocusedRef.current = middleNameRef;
              }}
            />

            {/* Last Name */}
            <Input
              ref={lastNameRef}
              testID="register-last-name-input"
              label="Last Name"
              placeholder="Dela Cruz"
              value={lastName}
              onChangeText={setLastName}
              autoCapitalize="words"
              editable={!isLoading}
              required
              iconLeft={
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={Colors.primary}
                />
              }
              onFocus={() => {
                lastFocusedRef.current = lastNameRef;
              }}
            />

            {/* Email */}
            <Input
              ref={emailRef}
              testID="register-email-input"
              label="Email Address"
              placeholder="juan@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
              required
              iconLeft={
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={Colors.primary}
                />
              }
              onFocus={() => {
                lastFocusedRef.current = emailRef;
              }}
            />

            {/* Contact Number */}
            <Input
              ref={contactNumberRef}
              testID="register-phone-input"
              label="Contact Number"
              placeholder="09XXXXXXXXX"
              value={contactNumber}
              onChangeText={handleContactChange}
              keyboardType="number-pad"
              maxLength={11}
              editable={!isLoading}
              required
              iconLeft={
                <Ionicons
                  name="call-outline"
                  size={20}
                  color={Colors.primary}
                />
              }
              onFocus={() => {
                lastFocusedRef.current = contactNumberRef;
              }}
            />

            {/* Birth Date */}
            <View style={styles.readonlyInputContainer}>
              <View pointerEvents="none">
                <Input
                  ref={birthDateRef}
                  label="Date of Birth"
                  placeholder="YYYY-MM-DD"
                  value={birthDate}
                  editable={false}
                  required
                  iconLeft={
                    <Ionicons
                      name="calendar-outline"
                      size={20}
                      color={Colors.primary}
                    />
                  }
                />
              </View>
              <TouchableOpacity
                style={styles.readonlyInputOverlay}
                activeOpacity={0.85}
                onPress={openBirthDatePicker}
              />
            </View>
            {showDatePicker && (
              <View style={styles.datePickerContainer}>
                <DateTimePicker
                  value={birthDate ? new Date(birthDate) : adultCutoffDate}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  maximumDate={adultCutoffDate}
                  minimumDate={EARLIEST_BIRTH_DATE}
                  onChange={handleBirthDateChange}
                  themeVariant="light"
                  textColor={
                    Platform.OS === "ios" ? Colors.textPrimary : undefined
                  }
                  style={
                    Platform.OS === "ios" ? styles.inlineDatePicker : undefined
                  }
                />
              </View>
            )}

            {/* Password */}
            <Input
              ref={passwordRef}
              testID="register-password-input"
              label="Password"
              placeholder="Minimum 8 characters"
              value={password}
              onChangeText={setPassword}
              isPassword
              autoCapitalize="none"
              editable={!isLoading}
              required
              iconLeft={
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={Colors.primary}
                />
              }
              onFocus={() => {
                lastFocusedRef.current = passwordRef;
              }}
            />

            {/* Confirm Password */}
            <Input
              ref={confirmPasswordRef}
              testID="register-confirm-password-input"
              label="Confirm Password"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              isPassword
              autoCapitalize="none"
              editable={!isLoading}
              required
              iconLeft={
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={Colors.primary}
                />
              }
              onFocus={() => {
                lastFocusedRef.current = confirmPasswordRef;
              }}
            />

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Address Information</Text>
              <Text style={styles.sectionSubtitle}>
                We currently serve Zamboanga City, Philippines.
              </Text>
            </View>

            {/* Barangay Picker */}
            <View style={styles.inputGroup}>
              <Text style={styles.fieldLabel}>
                Barangay <Text style={styles.requiredStar}>*</Text>
              </Text>
              {barangaysLoading ? (
                <View style={styles.barangayLoading}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                  <Text style={styles.barangayLoadingText}>Loading barangays...</Text>
                </View>
              ) : barangaysError ? (
                <View style={styles.barangayError}>
                  <Ionicons name="alert-circle-outline" size={20} color={Colors.error} />
                  <Text style={styles.barangayErrorText}>Failed to load barangays</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.barangayButton}
                  onPress={() => setBarangayModalVisible(true)}
                  disabled={isLoading}
                  activeOpacity={0.7}
                >
                  <Ionicons name="location-outline" size={20} color={Colors.primary} />
                  <Text
                    style={barangay ? styles.barangayButtonText : styles.barangayButtonPlaceholder}
                  >
                    {barangay || "Select your barangay"}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>

            {/* Street Address */}
            <Input
              ref={streetAddressRef}
              label="Street Address"
              placeholder="House no., Street name"
              value={streetAddress}
              onChangeText={setStreetAddress}
              editable={!isLoading}
              autoCapitalize="words"
              required
              iconLeft={
                <Ionicons
                  name="home-outline"
                  size={20}
                  color={Colors.primary}
                />
              }
              onFocus={() => {
                lastFocusedRef.current = streetAddressRef;
              }}
            />

            {/* City - Pre-filled and Read-only */}
            <Input
              ref={cityRef}
              label="City"
              value={city}
              editable={false}
              required
              iconLeft={
                <Ionicons
                  name="business-outline"
                  size={20}
                  color={Colors.primary}
                />
              }
            />

            {/* Province - Pre-filled and Read-only */}
            <Input
              ref={provinceRef}
              label="Province"
              value={province}
              editable={false}
              required
              iconLeft={
                <Ionicons name="map-outline" size={20} color={Colors.primary} />
              }
              onFocus={() => {
                lastFocusedRef.current = provinceRef;
              }}
            />

            {/* Country */}
            <Input
              label="Country"
              value={DEFAULT_COUNTRY}
              editable={false}
              required
              iconLeft={
                <Ionicons
                  name="flag-outline"
                  size={20}
                  color={Colors.primary}
                />
              }
            />

            {/* Postal Code - Auto-filled from barangay */}
            <Input
              ref={postalCodeRef}
              label="Postal Code"
              placeholder={barangay ? "" : "Select barangay first"}
              value={postalCode}
              onChangeText={handlePostalCodeChange}
              keyboardType="number-pad"
              maxLength={4}
              editable={!isLoading && !barangay}
              required
              iconLeft={
                <Ionicons
                  name="mail-open-outline"
                  size={20}
                  color={Colors.primary}
                />
              }
              onFocus={() => {
                lastFocusedRef.current = postalCodeRef;
              }}
            />

            {/* Register Button */}
            <Button
              testID="register-submit-button"
              onPress={handleRegister}
              disabled={isLoading}
              loading={isLoading}
              variant="primary"
              size="lg"
              fullWidth
              iconRight={
                <Ionicons name="arrow-forward" size={20} color={Colors.white} />
              }
            >
              Create Account
            </Button>

            {/* Login Link */}
            <TouchableOpacity
              testID="register-login-link"
              style={styles.loginLink}
              onPress={() => router.push("/auth/login")}
              disabled={isLoading}
            >
              <Text style={styles.loginText}>
                Already have an account?{" "}
                <Text style={styles.loginTextBold}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Barangay Selection Modal */}
      <Modal
        visible={barangayModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setBarangayModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Barangay</Text>
              <TouchableOpacity
                onPress={() => setBarangayModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={barangays}
              keyExtractor={(item) => item.barangayID.toString()}
              showsVerticalScrollIndicator={true}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.barangayItem,
                    barangay === item.name && styles.barangayItemSelected,
                  ]}
                  onPress={() => handleBarangaySelect(item)}
                >
                  <View style={styles.barangayItemContent}>
                    <Text
                      style={[
                        styles.barangayItemText,
                        barangay === item.name && styles.barangayItemTextSelected,
                      ]}
                    >
                      {item.name}
                    </Text>
                    {item.zipCode && (
                      <Text style={styles.barangayZipCode}>
                        ZIP: {item.zipCode}
                      </Text>
                    )}
                  </View>
                  {barangay === item.name && (
                    <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              )}
              style={styles.barangayList}
              ListEmptyComponent={
                <View style={styles.barangayEmptyState}>
                  <Ionicons name="location-outline" size={40} color={Colors.textHint} />
                  <Text style={styles.barangayEmptyText}>No barangays available</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: Platform.OS === "android" ? 300 : 100,
  },
  headerContainer: {
    paddingHorizontal: Spacing["2xl"],
    paddingTop: Spacing["2xl"],
    paddingBottom: Spacing["4xl"],
    backgroundColor: Colors.white,
    alignItems: "center",
    position: "relative",
  },
  backButton: {
    position: "absolute",
    left: Spacing["2xl"],
    top: Spacing["2xl"],
    zIndex: 1,
  },
  // logoCircle removed
  logoText: {
    fontSize: 48,
    fontWeight: "700",
    color: Colors.white,
  },
  headerTitle: {
    fontSize: Typography.fontSize["3xl"],
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
  },
  formContainer: {
    paddingHorizontal: Spacing["2xl"],
    paddingBottom: Spacing["4xl"],
  },
  sectionHeader: {
    marginTop: Spacing["2xl"],
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  loginLink: {
    alignItems: "center",
    marginTop: Spacing["2xl"],
  },
  loginText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
  },
  loginTextBold: {
    fontWeight: "700",
    color: Colors.primary,
  },
  readonlyInputContainer: {
    position: "relative",
  },
  readonlyInputOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  datePickerContainer: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
    alignSelf: "stretch",
  },
  inlineDatePicker: {
    width: "100%",
    minHeight: 180,
  },
  // Profile Type Selection Styles
  profileTypeSection: {
    marginBottom: Spacing.xl,
  },
  profileTypeTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
    textAlign: "center",
  },
  profileTypeCards: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  profileTypeCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.border,
    padding: Spacing.lg,
    alignItems: "center",
    position: "relative",
    ...Shadows.sm,
  },
  profileTypeCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight || "#E8F5E9",
  },
  profileTypeIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primaryLight || "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  profileTypeIconContainerSelected: {
    backgroundColor: Colors.primary,
  },
  profileTypeCardTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    textAlign: "center",
  },
  profileTypeCardTitleSelected: {
    color: Colors.primary,
  },
  profileTypeCardDescription: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 16,
  },
  selectedBadge: {
    position: "absolute",
    top: Spacing.sm,
    right: Spacing.sm,
  },
  profileTypeNote: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: Spacing.lg,
    fontStyle: "italic",
  },
  // Barangay Picker Styles
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  fieldLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  requiredStar: {
    color: Colors.error,
  },
  barangayButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  barangayButtonText: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
  },
  barangayButtonPlaceholder: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: Colors.textHint,
  },
  barangayLoading: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  barangayLoadingText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  barangayError: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  barangayErrorText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.error,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: "70%",
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  modalCloseButton: {
    padding: Spacing.xs,
  },
  barangayList: {
    paddingHorizontal: Spacing.lg,
  },
  barangayItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  barangayItemSelected: {
    backgroundColor: Colors.primaryLight || "#E8F5E9",
    borderRadius: BorderRadius.md,
    marginVertical: Spacing.xs,
    borderBottomWidth: 0,
  },
  barangayItemContent: {
    flex: 1,
  },
  barangayItemText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
  },
  barangayItemTextSelected: {
    fontWeight: "600",
    color: Colors.primary,
  },
  barangayZipCode: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  barangayEmptyState: {
    alignItems: "center",
    paddingVertical: Spacing["2xl"],
  },
  barangayEmptyText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textHint,
    marginTop: Spacing.sm,
  },
});
