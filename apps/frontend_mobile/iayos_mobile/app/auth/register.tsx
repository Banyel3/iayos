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
} from "react-native";
import DateTimePicker, {
  DateTimePickerAndroid,
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

const DEFAULT_COUNTRY = "Philippines";
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
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();
  const adultCutoffDate = useMemo(() => {
    const today = new Date();
    return new Date(
      today.getFullYear() - ADULT_AGE,
      today.getMonth(),
      today.getDate()
    );
  }, []);

  const firstNameRef = useRef<React.ComponentRef<typeof RNTextInput> | null>(
    null
  );
  const middleNameRef = useRef<React.ComponentRef<typeof RNTextInput> | null>(
    null
  );
  const lastNameRef = useRef<React.ComponentRef<typeof RNTextInput> | null>(
    null
  );
  const emailRef = useRef<React.ComponentRef<typeof RNTextInput> | null>(null);
  const contactNumberRef = useRef<
    React.ComponentRef<typeof RNTextInput>
  > | null>(null);
  const birthDateRef = useRef<React.ComponentRef<typeof RNTextInput> | null>(
    null
  );
  const passwordRef = useRef<React.ComponentRef<typeof RNTextInput> | null>(
    null
  );
  const confirmPasswordRef = useRef<React.ComponentRef<
    typeof RNTextInput
  > | null>(null);
  const streetAddressRef = useRef<
    React.ComponentRef<typeof RNTextInput>
  > | null>(null);
  const cityRef = useRef<React.ComponentRef<typeof RNTextInput> | null>(null);
  const provinceRef = useRef<
    React.ComponentRef<typeof RNTextInput>
  > | null>(null);
  const postalCodeRef = useRef<
    React.ComponentRef<typeof RNTextInput>
  > | null>(null);
  const lastFocusedRef = useRef<any>(null);
  const datePickerOpenRef = useRef(false);

  useEffect(() => {
    const subscription = Keyboard.addListener("keyboardDidHide", () => {
      const fieldRef = lastFocusedRef.current?.current ?? null;
      if (fieldRef && (fieldRef as any).isFocused?.()) {
        setTimeout(() => {
          try {
            (fieldRef as any).focus?.();
          } catch (e) {}
        }, 50);
      }
    });

    return () => {
      try {
        subscription.remove();
      } catch (e) {}
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
    selectedDate?: Date
  ) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
      datePickerOpenRef.current = false;
    }

    if (event.type === "dismissed") {
      if (Platform.OS === "ios") {
        setShowDatePicker(false);
      }
      return;
    }

    if (selectedDate) {
      setBirthDate(formatDate(selectedDate));
      if (Platform.OS === "ios") {
        setShowDatePicker(false);
        datePickerOpenRef.current = false;
      } else {
        datePickerOpenRef.current = false;
      }
    }
  };

  const openBirthDatePicker = () => {
    if (datePickerOpenRef.current) {
      return;
    }

    lastFocusedRef.current = birthDateRef;
    datePickerOpenRef.current = true;

    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: birthDate ? new Date(birthDate) : adultCutoffDate,
        mode: "date",
        maximumDate: adultCutoffDate,
        minimumDate: EARLIEST_BIRTH_DATE,
        onChange: handleBirthDateChange,
      });
      return;
    }

    setShowDatePicker(true);
    requestAnimationFrame(() => {
      birthDateRef.current?.blur();
    });
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
        `Password must be at least ${MIN_PASSWORD_LENGTH} characters`
      );
      return;
    }

    if (!/[A-Z]/.test(password)) {
      Alert.alert(
        "Error",
        "Password must include at least one uppercase letter"
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
        "Password must include at least one special character"
      );
      return;
    }

    if (!trimmedStreet || !trimmedCity || !trimmedProvince) {
      Alert.alert(
        "Error",
        "Street address, city, and province are required"
      );
      return;
    }

    if (!postalRegex.test(trimmedPostal)) {
      Alert.alert("Error", "Postal code must be exactly 4 digits");
      return;
    }

    setIsLoading(true);
    try {
      await register({
        firstName: trimmedFirst,
        middleName: trimmedMiddle,
        lastName: trimmedLast,
        contactNum: sanitizedContact,
        birthDate,
        email: trimmedEmail,
        password,
        confirmPassword,
        street_address: trimmedStreet,
        city: trimmedCity,
        province: trimmedProvince,
        postal_code: trimmedPostal,
        country: DEFAULT_COUNTRY,
      });

      Alert.alert(
        "Success",
        "Registration successful! Please check your email to verify your account.",
        [{ text: "OK", onPress: () => router.replace("/auth/login") }]
      );
    } catch (error: any) {
      Alert.alert("Error", error.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        enabled={Platform.OS === "ios"}
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
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>i</Text>
            </View>
            <Text style={styles.headerTitle}>Create Account</Text>
            <Text style={styles.headerSubtitle}>Join iAyos today</Text>
          </View>

          <View style={styles.formContainer}>
            {/* First Name */}
            <Input
              ref={firstNameRef}
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
            <Input
              ref={birthDateRef}
              label="Date of Birth"
              placeholder="YYYY-MM-DD"
              value={birthDate}
              editable={!isLoading}
              required
              showSoftInputOnFocus={false}
              caretHidden
              iconLeft={
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={Colors.primary}
                />
              }
              onPressIn={openBirthDatePicker}
              onFocus={() => {
                openBirthDatePicker();
              }}
            />

            {/* Password */}
            <Input
              ref={passwordRef}
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
                We currently support addresses within the Philippines.
              </Text>
            </View>

            {/* Street Address */}
            <Input
              ref={streetAddressRef}
              label="Street Address"
              placeholder="House no., Street name, Barangay"
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

            {/* City */}
            <Input
              ref={cityRef}
              label="City"
              placeholder="e.g., Zamboanga City"
              value={city}
              onChangeText={setCity}
              editable={!isLoading}
              autoCapitalize="words"
              required
              iconLeft={
                <Ionicons
                  name="business-outline"
                  size={20}
                  color={Colors.primary}
                />
              }
              onFocus={() => {
                lastFocusedRef.current = cityRef;
              }}
            />

            {/* Province */}
            <Input
              ref={provinceRef}
              label="Province"
              placeholder="e.g., Zamboanga del Sur"
              value={province}
              onChangeText={setProvince}
              editable={!isLoading}
              autoCapitalize="words"
              required
              iconLeft={
                <Ionicons
                  name="map-outline"
                  size={20}
                  color={Colors.primary}
                />
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

            {/* Postal Code */}
            <Input
              ref={postalCodeRef}
              label="Postal Code"
              placeholder="7000"
              value={postalCode}
              onChangeText={handlePostalCodeChange}
              keyboardType="number-pad"
              maxLength={4}
              editable={!isLoading}
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

          {Platform.OS === "ios" && showDatePicker && (
            <DateTimePicker
              value={birthDate ? new Date(birthDate) : adultCutoffDate}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              maximumDate={adultCutoffDate}
              minimumDate={EARLIEST_BIRTH_DATE}
              onChange={handleBirthDateChange}
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
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
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.xl,
    marginTop: Spacing["2xl"],
    ...Shadows.md,
  },
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
});
