import React, { useState } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function RegisterScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      await register(email, password, confirmPassword);
      Alert.alert(
        'Success',
        'Registration successful! Please check your email to verify your account.',
        [{ text: 'OK', onPress: () => router.replace('/auth/login') }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
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
              label="First Name"
              placeholder="Juan"
              value={firstName}
              onChangeText={setFirstName}
              editable={!isLoading}
              iconLeft={<Ionicons name="person-outline" size={20} color={Colors.primary} />}
            />

            {/* Last Name */}
            <Input
              label="Last Name"
              placeholder="Dela Cruz"
              value={lastName}
              onChangeText={setLastName}
              editable={!isLoading}
              iconLeft={<Ionicons name="person-outline" size={20} color={Colors.primary} />}
            />

            {/* Email */}
            <Input
              label="Email Address"
              placeholder="juan@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
              required
              iconLeft={<Ionicons name="mail-outline" size={20} color={Colors.primary} />}
            />

            {/* Password */}
            <Input
              label="Password"
              placeholder="Minimum 6 characters"
              value={password}
              onChangeText={setPassword}
              isPassword
              autoCapitalize="none"
              editable={!isLoading}
              required
              iconLeft={<Ionicons name="lock-closed-outline" size={20} color={Colors.primary} />}
            />

            {/* Confirm Password */}
            <Input
              label="Confirm Password"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              isPassword
              autoCapitalize="none"
              editable={!isLoading}
              required
              iconLeft={<Ionicons name="lock-closed-outline" size={20} color={Colors.primary} />}
            />

            {/* Register Button */}
            <Button
              onPress={handleRegister}
              disabled={isLoading}
              loading={isLoading}
              variant="primary"
              size="lg"
              fullWidth
              iconRight={<Ionicons name="arrow-forward" size={20} color={Colors.white} />}
            >
              Create Account
            </Button>

            {/* Login Link */}
            <TouchableOpacity
              style={styles.loginLink}
              onPress={() => router.push('/auth/login')}
              disabled={isLoading}
            >
              <Text style={styles.loginText}>
                Already have an account? <Text style={styles.loginTextBold}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </View>
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
    paddingHorizontal: Spacing['2xl'],
    paddingTop: Spacing['2xl'],
    paddingBottom: Spacing['4xl'],
    backgroundColor: Colors.white,
    alignItems: 'center',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: Spacing['2xl'],
    top: Spacing['2xl'],
    zIndex: 1,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    marginTop: Spacing['2xl'],
    ...Shadows.md,
  },
  logoText: {
    fontSize: 48,
    fontWeight: '700',
    color: Colors.white,
  },
  headerTitle: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
  },
  formContainer: {
    paddingHorizontal: Spacing['2xl'],
    paddingBottom: Spacing['4xl'],
  },
  loginLink: {
    alignItems: 'center',
    marginTop: Spacing['2xl'],
  },
  loginText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
  },
  loginTextBold: {
    fontWeight: '700',
    color: Colors.primary,
  },
});
