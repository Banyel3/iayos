import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { safeGoBack } from "@/lib/hooks/useSafeBack";
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

interface Evidence {
  uri: string;
  type: 'image';
  name: string;
}

export default function CreateDisputeScreen() {
  const [disputeType, setDisputeType] = useState<string>('');
  const [jobId, setJobId] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const disputeTypes = [
    { id: 'payment_issue', label: 'Payment Issue', icon: 'cash-outline' },
    { id: 'job_quality', label: 'Job Quality', icon: 'construct-outline' },
    { id: 'no_show', label: 'No Show', icon: 'person-remove-outline' },
    { id: 'harassment', label: 'Harassment', icon: 'shield-outline' },
    { id: 'fraud', label: 'Fraud/Scam', icon: 'warning-outline' },
    { id: 'other', label: 'Other', icon: 'help-circle-outline' },
  ];

  const pickImage = async () => {
    if (evidence.length >= 5) {
      Alert.alert('Maximum Limit', 'You can upload up to 5 evidence images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const compressed = await manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 1200 } }],
        { compress: 0.8, format: SaveFormat.JPEG }
      );

      const newEvidence: Evidence = {
        uri: compressed.uri,
        type: 'image',
        name: `evidence_${Date.now()}.jpg`,
      };

      setEvidence([...evidence, newEvidence]);
    }
  };

  const takePhoto = async () => {
    if (evidence.length >= 5) {
      Alert.alert('Maximum Limit', 'You can upload up to 5 evidence images.');
      return;
    }

    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert(
        'Permission Required',
        'Camera permission is required to take photos.'
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const compressed = await manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 1200 } }],
        { compress: 0.8, format: SaveFormat.JPEG }
      );

      const newEvidence: Evidence = {
        uri: compressed.uri,
        type: 'image',
        name: `evidence_${Date.now()}.jpg`,
      };

      setEvidence([...evidence, newEvidence]);
    }
  };

  const removeEvidence = (index: number) => {
    setEvidence(evidence.filter((_, i) => i !== index));
  };

  const validateForm = (): boolean => {
    if (!disputeType) {
      Alert.alert('Validation Error', 'Please select a dispute type.');
      return false;
    }

    if (!subject.trim() || subject.length < 10) {
      Alert.alert(
        'Validation Error',
        'Subject must be at least 10 characters long.'
      );
      return false;
    }

    if (!description.trim() || description.length < 50) {
      Alert.alert(
        'Validation Error',
        'Description must be at least 50 characters long. Please provide detailed information.'
      );
      return false;
    }

    return true;
  };

  const submitDispute = async () => {
    if (!validateForm()) return;

    Alert.alert(
      'Submit Dispute',
      'Are you sure you want to submit this dispute? Our team will review it within 1-3 business days.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: async () => {
            setIsSubmitting(true);

            try {
              // TODO: Implement API call
              // const formData = new FormData();
              // formData.append('dispute_type', disputeType);
              // formData.append('job_id', jobId);
              // formData.append('subject', subject);
              // formData.append('description', description);
              // evidence.forEach((item, index) => {
              //   formData.append(`evidence_${index}`, {
              //     uri: item.uri,
              //     type: 'image/jpeg',
              //     name: item.name,
              //   });
              // });

              // Simulate API call
              await new Promise((resolve) => setTimeout(resolve, 2000));

              Alert.alert(
                'Dispute Submitted',
                'Your dispute has been submitted successfully. Our support team will review it and contact you within 1-3 business days.',
                [
                  {
                    text: 'OK',
                    onPress: () => safeGoBack(router, "/(tabs)/jobs"),
                  },
                ]
              );
            } catch (error) {
              Alert.alert(
                'Error',
                'Failed to submit dispute. Please try again later.'
              );
            } finally {
              setIsSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const addEvidence = () => {
    Alert.alert(
      'Add Evidence',
      'Choose how to add evidence',
      [
        {
          text: 'Take Photo',
          onPress: takePhoto,
        },
        {
          text: 'Choose from Library',
          onPress: pickImage,
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="alert-circle" size={48} color="#EF4444" />
        <Text style={styles.headerTitle}>Report a Dispute</Text>
        <Text style={styles.headerSubtitle}>
          Please provide as much detail as possible to help us resolve your issue
          quickly.
        </Text>
      </View>

      {/* Dispute Type */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Dispute Type <Text style={styles.required}>*</Text>
        </Text>
        <View style={styles.disputeTypeGrid}>
          {disputeTypes.map((type) => (
            <TouchableOpacity
              key={type.id}
              style={[
                styles.disputeTypeButton,
                disputeType === type.id && styles.disputeTypeButtonActive,
              ]}
              onPress={() => setDisputeType(type.id)}
            >
              <Ionicons
                name={type.icon as any}
                size={24}
                color={disputeType === type.id ? '#3B82F6' : '#6B7280'}
              />
              <Text
                style={[
                  styles.disputeTypeText,
                  disputeType === type.id && styles.disputeTypeTextActive,
                ]}
              >
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Job ID (Optional) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Job ID (Optional)</Text>
        <Text style={styles.sectionHint}>
          If this dispute is related to a specific job, enter the Job ID
        </Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., 12345"
          value={jobId}
          onChangeText={setJobId}
          keyboardType="numeric"
        />
      </View>

      {/* Subject */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Subject <Text style={styles.required}>*</Text>
        </Text>
        <Text style={styles.sectionHint}>Brief summary of the issue (10-100 characters)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Payment not received after job completion"
          value={subject}
          onChangeText={setSubject}
          maxLength={100}
        />
        <Text style={styles.charCounter}>{subject.length} / 100</Text>
      </View>

      {/* Description */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Description <Text style={styles.required}>*</Text>
        </Text>
        <Text style={styles.sectionHint}>
          Detailed explanation of what happened (50-1000 characters)
        </Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe the issue in detail. Include dates, times, and any relevant information that will help us understand and resolve the dispute..."
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={8}
          maxLength={1000}
          textAlignVertical="top"
        />
        <Text style={styles.charCounter}>{description.length} / 1000</Text>
      </View>

      {/* Evidence */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Evidence (Optional)</Text>
        <Text style={styles.sectionHint}>
          Upload screenshots, photos, or documents (up to 5 files, max 5MB each)
        </Text>

        {evidence.length > 0 && (
          <View style={styles.evidenceGrid}>
            {evidence.map((item, index) => (
              <View key={index} style={styles.evidenceItem}>
                <Image source={{ uri: item.uri }} style={styles.evidenceImage} />
                <TouchableOpacity
                  style={styles.evidenceRemove}
                  onPress={() => removeEvidence(index)}
                >
                  <Ionicons name="close-circle" size={24} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {evidence.length < 5 && (
          <TouchableOpacity style={styles.addEvidenceButton} onPress={addEvidence}>
            <Ionicons name="camera-outline" size={24} color="#3B82F6" />
            <Text style={styles.addEvidenceText}>Add Evidence</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Important Information */}
      <View style={styles.infoBox}>
        <Ionicons name="information-circle" size={20} color="#3B82F6" />
        <Text style={styles.infoText}>
          <Text style={styles.infoBold}>Important:</Text> False or malicious
          disputes may result in account suspension. Please ensure all information
          is accurate and truthful.
        </Text>
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
        onPress={submitDispute}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <ActivityIndicator color="#FFFFFF" size="small" />
            <Text style={styles.submitButtonText}>Submitting...</Text>
          </>
        ) : (
          <>
            <Ionicons name="send" size={20} color="#FFFFFF" />
            <Text style={styles.submitButtonText}>Submit Dispute</Text>
          </>
        )}
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Our support team typically responds within 1-3 business days. You will
          receive notifications about your dispute status.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginTop: 12,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  required: {
    color: '#EF4444',
  },
  sectionHint: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 18,
  },
  disputeTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  disputeTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    flex: 1,
    minWidth: '45%',
  },
  disputeTypeButtonActive: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  disputeTypeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginLeft: 8,
  },
  disputeTypeTextActive: {
    color: '#3B82F6',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  charCounter: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 4,
  },
  evidenceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  evidenceItem: {
    width: 100,
    height: 100,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  evidenceImage: {
    width: '100%',
    height: '100%',
  },
  evidenceRemove: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  addEvidenceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#3B82F6',
    borderRadius: 8,
    borderStyle: 'dashed',
    backgroundColor: '#EFF6FF',
  },
  addEvidenceText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3B82F6',
    marginLeft: 8,
  },
  infoBox: {
    flexDirection: 'row',
    padding: 16,
    margin: 16,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1E40AF',
    lineHeight: 18,
    marginLeft: 8,
  },
  infoBold: {
    fontWeight: '700',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 8,
    marginHorizontal: 16,
    marginTop: 8,
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  footer: {
    padding: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
  },
});
