// Edit Profile Screen
// Allows workers to update their profile information

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Image,
  TouchableOpacity,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
} from "@/constants/theme";
import { ENDPOINTS, apiRequest, getAbsoluteMediaUrl } from "@/lib/api/config";
import { useMySkills } from "@/lib/hooks/useSkills";
import * as ImagePicker from "expo-image-picker";

// ===== TYPES =====

interface WorkerProfile {
  id: number;
  user: {
    firstName: string;
    lastName: string;
    phoneNumber: string | null;
  };
  bio: string | null;
  hourlyRate: number | null;
  skills: string[];
  softSkills: string | null;
}

interface UpdateProfileData {
  firstName: string;
  lastName: string;
  bio: string;
  hourlyRate: string;
  phoneNumber: string;
  softSkills: string;
}

// ===== MAIN COMPONENT =====

export default function EditProfileScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Form state - basic info
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");

  // Form state - worker specific
  const [bio, setBio] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [softSkills, setSoftSkills] = useState("");
  const [hasChanges, setHasChanges] = useState(false);

  // Avatar state
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarChanged, setAvatarChanged] = useState(false);

  // Soft skills suggestions
  const softSkillsSuggestions = [
    "Punctual",
    "Team Player",
    "Fast Learner",
    "Bilingual",
    "Detail-Oriented",
    "Problem Solver",
    "Good Communicator",
    "Reliable",
    "Organized",
    "Flexible",
  ];

  // Fetch worker's current backend skills
  const { data: mySkills = [] } = useMySkills();

  // Fetch current profile
  const { data: profile, isLoading } = useQuery<WorkerProfile>({
    queryKey: ["worker-profile"],
    queryFn: async () => {
      const response = await apiRequest(ENDPOINTS.WORKER_PROFILE);
      if (!response.ok) {
        throw new Error("Failed to fetch profile");
      }
      return response.json();
    },
  });

  // Initialize form with current values from auth context and profile
  useEffect(() => {
    // Load basic info from auth context
    if (user?.profile_data) {
      setFirstName(user.profile_data.firstName || "");
      setLastName(user.profile_data.lastName || "");
      setEmail(user.email || "");
      setPhoneNumber(user.profile_data.contactNum || "");
      setAvatarUri(getAbsoluteMediaUrl(user.profile_data.profileImg) || null);
    }

    // Load worker-specific data from profile query
    if (profile) {
      setBio(profile.bio || "");
      setHourlyRate(profile.hourlyRate ? profile.hourlyRate.toString() : "");
      setSoftSkills(profile.softSkills || "");
      // Override phone if profile has it
      if (profile.user?.phoneNumber) {
        setPhoneNumber(profile.user.phoneNumber);
      }
    }
  }, [user, profile]);

  // Avatar upload handler
  const handleAvatarPress = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Please grant camera roll access to change your photo."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      uploadAvatar(result.assets[0].uri);
    }
  };

  const uploadAvatar = async (uri: string) => {
    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      const filename = uri.split("/").pop() || "avatar.jpg";
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : "image/jpeg";

      formData.append("profile_image", {
        uri,
        name: filename,
        type,
      } as any);

      const response = await apiRequest(ENDPOINTS.UPLOAD_AVATAR, {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.ok) {
        setAvatarUri(uri);
        setAvatarChanged(true);
        Alert.alert("Success", "Profile photo updated!");
        // Invalidate queries to refresh user data
        queryClient.invalidateQueries({ queryKey: ["worker-profile"] });
      } else {
        throw new Error("Failed to upload avatar");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to update profile photo. Please try again.");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Update profile mutation
  const updateMutation = useMutation({
    mutationFn: async (data: UpdateProfileData) => {
      // First update basic profile info
      const profileResponse = await apiRequest(
        ENDPOINTS.UPDATE_PROFILE(user?.profile_data?.id || 0),
        {
          method: "PUT",
          body: JSON.stringify({
            first_name: data.firstName,
            last_name: data.lastName,
            contact_num: data.phoneNumber,
          }),
        }
      );

      if (!profileResponse.ok) {
        throw new Error("Failed to update basic profile");
      }

      // Then update worker-specific fields
      const response = await apiRequest(ENDPOINTS.UPDATE_WORKER_PROFILE, {
        method: "PUT",
        body: JSON.stringify({
          bio: data.bio,
          hourly_rate: parseFloat(data.hourlyRate) || null,
          phone_number: data.phoneNumber,
          soft_skills: data.softSkills,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update profile");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate profile query to refetch
      queryClient.invalidateQueries({ queryKey: ["worker-profile"] });
      Alert.alert("Success", "Profile updated successfully", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    },
    onError: (error: Error) => {
      Alert.alert("Error", error.message);
    },
  });

  // Track if form has changes
  useEffect(() => {
    const originalFirstName = user?.profile_data?.firstName || "";
    const originalLastName = user?.profile_data?.lastName || "";
    const originalPhone =
      user?.profile_data?.contactNum || profile?.user?.phoneNumber || "";
    const originalBio = profile?.bio || "";
    const originalRate = profile?.hourlyRate
      ? profile.hourlyRate.toString()
      : "";
    const originalSoftSkills = profile?.softSkills || "";

    const changed =
      avatarChanged ||
      firstName !== originalFirstName ||
      lastName !== originalLastName ||
      bio !== originalBio ||
      hourlyRate !== originalRate ||
      phoneNumber !== originalPhone ||
      softSkills !== originalSoftSkills;

    setHasChanges(changed);
  }, [
    firstName,
    lastName,
    bio,
    hourlyRate,
    phoneNumber,
    softSkills,
    profile,
    user,
    avatarChanged,
  ]);

  // Validation
  const validateForm = (): string | null => {
    // Required fields
    if (!firstName.trim()) {
      return "First name is required";
    }
    if (!lastName.trim()) {
      return "Last name is required";
    }

    // Bio validation
    if (bio.trim().length > 0 && bio.trim().length < 50) {
      return "Bio must be at least 50 characters";
    }
    if (bio.length > 500) {
      return "Bio cannot exceed 500 characters";
    }

    // Hourly rate validation
    if (hourlyRate) {
      const rate = parseFloat(hourlyRate);
      if (isNaN(rate)) {
        return "Hourly rate must be a valid number";
      }
      if (rate < 0) {
        return "Hourly rate cannot be negative";
      }
      if (rate > 10000) {
        return "Hourly rate seems too high";
      }
    }

    // Phone number validation (basic)
    if (phoneNumber && phoneNumber.trim().length > 0) {
      const cleaned = phoneNumber.replace(/\D/g, "");
      if (cleaned.length < 10 || cleaned.length > 15) {
        return "Phone number must be 10-15 digits";
      }
    }

    // Skills validation
    if (skills.trim().length > 0) {
      const skillList = skills
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      if (skillList.some((s) => s.length < 2)) {
        return "Each skill must be at least 2 characters";
      }
      if (skillList.some((s) => s.length > 50)) {
        return "Each skill cannot exceed 50 characters";
      }
    }

    return null;
  };

  // Handle save
  const handleSave = () => {
    const error = validateForm();
    if (error) {
      Alert.alert("Validation Error", error);
      return;
    }

    if (!hasChanges) {
      Alert.alert("No Changes", "You haven't made any changes");
      return;
    }

    updateMutation.mutate({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      bio: bio.trim(),
      hourlyRate: hourlyRate.trim(),
      phoneNumber: phoneNumber.trim(),
      softSkills: softSkills.trim(),
    });
  };

  // Handle cancel
  const handleCancel = () => {
    if (hasChanges) {
      Alert.alert(
        "Discard Changes?",
        "You have unsaved changes. Are you sure you want to go back?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Discard",
            style: "destructive",
            onPress: () => router.back(),
          },
        ]
      );
    } else {
      router.back();
    }
  };

  // ===== LOADING STATE =====
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ===== MAIN CONTENT =====
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <TouchableOpacity
            style={[
              styles.saveHeaderButton,
              (!hasChanges || updateMutation.isPending) &&
                styles.saveHeaderButtonDisabled,
            ]}
            onPress={handleSave}
            disabled={!hasChanges || updateMutation.isPending}
          >
            {updateMutation.isPending ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <Text
                style={[
                  styles.saveHeaderButtonText,
                  !hasChanges && styles.saveHeaderButtonTextDisabled,
                ]}
              >
                Save
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <TouchableOpacity
              style={styles.avatarContainer}
              onPress={handleAvatarPress}
              disabled={isUploadingAvatar}
            >
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarInitials}>
                    {firstName.charAt(0)}
                    {lastName.charAt(0)}
                  </Text>
                </View>
              )}
              {isUploadingAvatar ? (
                <View style={styles.avatarOverlay}>
                  <ActivityIndicator size="small" color={Colors.white} />
                </View>
              ) : (
                <View style={styles.avatarEditBadge}>
                  <Ionicons name="camera" size={16} color={Colors.white} />
                </View>
              )}
            </TouchableOpacity>
            <Text style={styles.avatarHint}>Tap to change photo</Text>
          </View>

          {/* Basic Info Section */}
          <View style={styles.formSection}>
            <Text style={styles.sectionHeader}>Basic Information</Text>

            {/* First Name */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>First Name *</Text>
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Enter your first name"
                placeholderTextColor={Colors.textSecondary}
              />
            </View>

            {/* Last Name */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Last Name *</Text>
              <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Enter your last name"
                placeholderTextColor={Colors.textSecondary}
              />
            </View>

            {/* Email (Read-only) */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={[styles.input, styles.inputReadonly]}
                value={email}
                editable={false}
                placeholderTextColor={Colors.textSecondary}
              />
              <Text style={styles.hint}>Email cannot be changed</Text>
            </View>

            {/* Phone Number */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Contact Number</Text>
              <TextInput
                style={styles.input}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="09123456789"
                placeholderTextColor={Colors.textSecondary}
                keyboardType="phone-pad"
                maxLength={11}
              />
            </View>
          </View>

          {/* Worker Profile Section */}
          <View style={styles.formSection}>
            <Text style={styles.sectionHeader}>Worker Profile</Text>

            {/* Bio Field */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>
                Bio <Text style={styles.optional}>(optional)</Text>
              </Text>
              <TextInput
                style={[
                  styles.textArea,
                  bio.length > 0 && styles.textAreaActive,
                ]}
                value={bio}
                onChangeText={setBio}
                placeholder="Tell clients about your experience, skills, and what makes you stand out..."
                placeholderTextColor={Colors.textSecondary}
                multiline
                numberOfLines={6}
                maxLength={500}
                textAlignVertical="top"
              />
              <View style={styles.fieldFooter}>
                <Text
                  style={[
                    styles.hint,
                    bio.length > 0 && bio.length < 50 && styles.hintWarning,
                  ]}
                >
                  {bio.length > 0 && bio.length < 50
                    ? `${50 - bio.length} more characters needed`
                    : "Minimum 50 characters recommended"}
                </Text>
                <Text style={styles.charCount}>{bio.length}/500</Text>
              </View>
            </View>

            {/* Hourly Rate Field */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>
                Hourly Rate <Text style={styles.optional}>(optional)</Text>
              </Text>
              <View style={styles.inputWithIcon}>
                <Text style={styles.currencySymbol}>₱</Text>
                <TextInput
                  style={[
                    styles.input,
                    styles.inputWithPadding,
                    hourlyRate.length > 0 && styles.inputActive,
                  ]}
                  value={hourlyRate}
                  onChangeText={setHourlyRate}
                  placeholder="0.00"
                  placeholderTextColor={Colors.textSecondary}
                  keyboardType="decimal-pad"
                />
                <Text style={styles.inputSuffix}>/hour</Text>
              </View>
              <Text style={styles.hint}>Set your preferred hourly rate</Text>
            </View>
          </View>

          {/* Skills Management Section */}
          <View style={styles.managementSection}>
            <View style={styles.managementHeader}>
              <View>
                <Text style={styles.sectionTitle}>Skills (Specializations)</Text>
                <Text style={styles.managementHint}>
                  {mySkills.length > 0
                    ? `${mySkills.length} skill${mySkills.length === 1 ? "" : "s"} added`
                    : "Add skills to showcase your expertise"}
                </Text>
              </View>
              <Ionicons name="construct" size={32} color={Colors.primary} />
            </View>

            {/* Display current skills as read-only bubbles */}
            {mySkills.length > 0 && (
              <View style={styles.skillBubblesContainer}>
                {mySkills.map((skill) => (
                  <View key={skill.id} style={styles.skillBubble}>
                    <Text style={styles.skillBubbleText}>{skill.name}</Text>
                    <Text style={styles.skillBubbleYears}>
                      {skill.experienceYears}y
                    </Text>
                  </View>
                ))}
              </View>
            )}

            <Pressable
              style={styles.manageButton}
              onPress={() => router.push("/profile/skills" as any)}
            >
              <Ionicons
                name="settings-outline"
                size={20}
                color={Colors.primary}
              />
              <Text style={styles.manageButtonText}>Manage Skills</Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={Colors.primary}
              />
            </Pressable>
          </View>

          {/* Soft Skills Section */}
          <View style={styles.formSection}>
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>
                Soft Skills <Text style={styles.optional}>(optional)</Text>
              </Text>
              <Text style={[styles.hint, { marginBottom: Spacing.sm }]}>
                Personal attributes that don't affect job filtering
              </Text>

              {/* Suggestions chips */}
              <View style={styles.suggestionsContainer}>
                {softSkillsSuggestions.map((suggestion) => {
                  const currentSkills = softSkills
                    .split(",")
                    .map((s) => s.trim().toLowerCase());
                  const isSelected = currentSkills.includes(
                    suggestion.toLowerCase()
                  );

                  return (
                    <Pressable
                      key={suggestion}
                      style={[
                        styles.suggestionChip,
                        isSelected && styles.suggestionChipSelected,
                      ]}
                      onPress={() => {
                        if (isSelected) {
                          // Remove the skill
                          const newSkills = softSkills
                            .split(",")
                            .map((s) => s.trim())
                            .filter(
                              (s) => s.toLowerCase() !== suggestion.toLowerCase()
                            )
                            .join(", ");
                          setSoftSkills(newSkills);
                        } else {
                          // Add the skill
                          const current = softSkills.trim();
                          if (current) {
                            setSoftSkills(`${current}, ${suggestion}`);
                          } else {
                            setSoftSkills(suggestion);
                          }
                        }
                      }}
                    >
                      <Text
                        style={[
                          styles.suggestionChipText,
                          isSelected && styles.suggestionChipTextSelected,
                        ]}
                      >
                        {suggestion}
                      </Text>
                      {isSelected && (
                        <Ionicons
                          name="checkmark"
                          size={14}
                          color={Colors.background}
                          style={{ marginLeft: 4 }}
                        />
                      )}
                    </Pressable>
                  );
                })}
              </View>

              {/* Display selected soft skills */}
              {softSkills.trim() && (
                <View style={styles.selectedSoftSkillsContainer}>
                  {softSkills
                    .split(",")
                    .map((s) => s.trim())
                    .filter((s) => s.length > 0)
                    .map((skill, index) => (
                      <View key={index} style={styles.softSkillBubble}>
                        <Text style={styles.softSkillBubbleText}>{skill}</Text>
                        <Pressable
                          onPress={() => {
                            const newSkills = softSkills
                              .split(",")
                              .map((s) => s.trim())
                              .filter(
                                (s) => s.toLowerCase() !== skill.toLowerCase()
                              )
                              .join(", ");
                            setSoftSkills(newSkills);
                          }}
                        >
                          <Ionicons
                            name="close-circle"
                            size={16}
                            color={Colors.textSecondary}
                          />
                        </Pressable>
                      </View>
                    ))}
                </View>
              )}

              {/* Custom soft skill input */}
              <View style={styles.customSoftSkillInput}>
                <TextInput
                  style={styles.input}
                  placeholder="Add custom soft skill..."
                  placeholderTextColor={Colors.textSecondary}
                  onSubmitEditing={(e) => {
                    const value = e.nativeEvent.text.trim();
                    if (value) {
                      const current = softSkills.trim();
                      if (current) {
                        setSoftSkills(`${current}, ${value}`);
                      } else {
                        setSoftSkills(value);
                      }
                      e.currentTarget.clear();
                    }
                  }}
                  returnKeyType="done"
                />
              </View>
            </View>
          </View>

          {/* Certifications Section */}
          <View style={styles.managementSection}>
            <View style={styles.managementHeader}>
              <View>
                <Text style={styles.sectionTitle}>Certifications</Text>
                <Text style={styles.managementHint}>
                  Add professional certifications
                </Text>
              </View>
              <Ionicons name="ribbon" size={32} color={Colors.primary} />
            </View>
            <Pressable
              style={styles.manageButton}
              onPress={() => router.push("/profile/certifications" as any)}
            >
              <Ionicons
                name="settings-outline"
                size={20}
                color={Colors.primary}
              />
              <Text style={styles.manageButtonText}>Manage Certifications</Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={Colors.primary}
              />
            </Pressable>
          </View>

          {/* Materials Management */}
          <View style={styles.managementSection}>
            <View style={styles.managementHeader}>
              <View>
                <Text style={styles.sectionTitle}>Materials & Products</Text>
                <Text style={styles.managementHint}>
                  List materials or products you offer
                </Text>
              </View>
              <Ionicons name="cube" size={32} color={Colors.primary} />
            </View>
            <Pressable
              style={styles.manageButton}
              onPress={() => router.push("/profile/materials" as any)}
            >
              <Ionicons
                name="settings-outline"
                size={20}
                color={Colors.primary}
              />
              <Text style={styles.manageButtonText}>Manage Materials</Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={Colors.primary}
              />
            </Pressable>
          </View>

          {/* Preview Changes */}
          {hasChanges && (
            <View style={styles.previewContainer}>
              <Text style={styles.previewTitle}>Preview Changes</Text>

              {bio.trim() !== (profile?.bio || "") && (
                <View style={styles.previewItem}>
                  <Text style={styles.previewLabel}>Bio:</Text>
                  <Text style={styles.previewValue} numberOfLines={2}>
                    {bio.trim() || "None"}
                  </Text>
                </View>
              )}

              {hourlyRate.trim() !==
                (profile?.hourlyRate?.toString() || "") && (
                <View style={styles.previewItem}>
                  <Text style={styles.previewLabel}>Hourly Rate:</Text>
                  <Text style={styles.previewValue}>
                    {hourlyRate
                      ? `₱${parseFloat(hourlyRate).toFixed(2)}/hour`
                      : "Not set"}
                  </Text>
                </View>
              )}

              {phoneNumber.trim() !== (profile?.user?.phoneNumber || "") && (
                <View style={styles.previewItem}>
                  <Text style={styles.previewLabel}>Phone:</Text>
                  <Text style={styles.previewValue}>
                    {phoneNumber.trim() || "Not set"}
                  </Text>
                </View>
              )}

              {skills.trim() !== (profile?.skills?.join(", ") || "") && (
                <View style={styles.previewItem}>
                  <Text style={styles.previewLabel}>Skills:</Text>
                  <Text style={styles.previewValue} numberOfLines={2}>
                    {skills.trim() || "None"}
                  </Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ===== STYLES =====

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
  },
  loadingText: {
    ...Typography.body.medium,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.white,
  },
  saveHeaderButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: BorderRadius.medium,
    minWidth: 60,
    alignItems: "center",
  },
  saveHeaderButtonDisabled: {
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  saveHeaderButtonText: {
    ...Typography.body.medium,
    color: Colors.white,
    fontWeight: "600",
  },
  saveHeaderButtonTextDisabled: {
    color: "rgba(255,255,255,0.5)",
  },

  // Avatar Section
  avatarSection: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
    backgroundColor: Colors.white,
    marginBottom: Spacing.md,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    fontSize: 36,
    fontWeight: "700",
    color: Colors.white,
  },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarEditBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.white,
  },
  avatarHint: {
    ...Typography.body.small,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },

  // Form Sections
  formSection: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    padding: Spacing.lg,
    ...Shadows.small,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },

  // Form Fields
  fieldContainer: {
    marginBottom: Spacing.lg,
  },
  label: {
    ...Typography.body.medium,
    color: Colors.textPrimary,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  optional: {
    color: Colors.textSecondary,
    fontWeight: "400",
    fontSize: 12,
  },
  input: {
    ...Typography.body.medium,
    color: Colors.textPrimary,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  inputReadonly: {
    backgroundColor: "#F5F5F5",
    color: Colors.textSecondary,
    borderColor: "#E0E0E0",
  },
  inputActive: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  inputWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
  },
  inputWithPadding: {
    borderWidth: 0,
    flex: 1,
    marginLeft: Spacing.xs,
    paddingVertical: Spacing.md,
  },
  currencySymbol: {
    ...Typography.body.large,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  inputSuffix: {
    ...Typography.body.medium,
    color: Colors.textSecondary,
    marginLeft: Spacing.xs,
  },
  textArea: {
    ...Typography.body.medium,
    color: Colors.textPrimary,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.medium,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    minHeight: 120,
  },
  textAreaActive: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  fieldFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.xs,
  },
  hint: {
    ...Typography.body.small,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  hintWarning: {
    color: Colors.warning,
  },
  charCount: {
    ...Typography.body.small,
    color: Colors.textSecondary,
  },

  // Preview
  previewContainer: {
    marginTop: Spacing.xl,
    marginHorizontal: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.large,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  previewTitle: {
    ...Typography.heading.h4,
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },
  previewItem: {
    marginTop: Spacing.sm,
  },
  previewLabel: {
    ...Typography.body.small,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  previewValue: {
    ...Typography.body.medium,
    color: Colors.textPrimary,
  },
  sectionTitle: {
    ...Typography.heading.h4,
    color: Colors.textPrimary,
    fontWeight: "bold",
  },

  // Management Section (Certifications)
  managementSection: {
    marginBottom: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.large,
    ...Shadows.small,
  },
  managementHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  managementHint: {
    ...Typography.body.small,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  manageButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.medium,
  },
  manageButtonText: {
    ...Typography.body.medium,
    color: Colors.primary,
    fontWeight: "600",
    flex: 1,
    marginLeft: Spacing.sm,
  },

  // Skill Bubbles
  skillBubblesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  skillBubble: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: 20,
    gap: Spacing.xs,
  },
  skillBubbleText: {
    ...Typography.body.small,
    color: Colors.white,
    fontWeight: "600",
  },
  skillBubbleYears: {
    ...Typography.body.small,
    color: Colors.white,
    opacity: 0.8,
    fontSize: 10,
  },

  // Soft Skills
  suggestionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  suggestionChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  suggestionChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  suggestionChipText: {
    ...Typography.body.small,
    color: Colors.textSecondary,
  },
  suggestionChipTextSelected: {
    color: Colors.white,
  },
  selectedSoftSkillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  softSkillBubble: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primaryLight,
    paddingVertical: Spacing.xs,
    paddingLeft: Spacing.md,
    paddingRight: Spacing.xs,
    borderRadius: 16,
    gap: Spacing.xs,
  },
  softSkillBubbleText: {
    ...Typography.body.small,
    color: Colors.primary,
    fontWeight: "500",
  },
  customSoftSkillInput: {
    marginTop: Spacing.xs,
  },

  // Caption Edit Modal
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modalContent: {
    width: "85%",
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.large,
    padding: Spacing.lg,
    ...Shadows.medium,
  },
  modalTitle: {
    ...Typography.heading.h3,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    textAlign: "center",
  },
  captionInput: {
    ...Typography.body.medium,
    color: Colors.textPrimary,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.medium,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    minHeight: 100,
    textAlignVertical: "top",
  },
  captionCharCount: {
    ...Typography.body.small,
    color: Colors.textSecondary,
    textAlign: "right",
    marginTop: Spacing.xs,
  },
  modalButtons: {
    flexDirection: "row",
    marginTop: Spacing.lg,
    gap: Spacing.md,
  },
  modalButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.medium,
    alignItems: "center",
  },
  modalButtonCancel: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalButtonSave: {
    backgroundColor: Colors.primary,
  },
  modalButtonTextCancel: {
    ...Typography.body.medium,
    color: Colors.textPrimary,
    fontWeight: "600",
  },
  modalButtonTextSave: {
    ...Typography.body.medium,
    color: Colors.textLight,
    fontWeight: "600",
  },
});
