import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface FAQItem {
  id: number;
  category: string;
  question: string;
  answer: string;
}

const FAQ_DATA: FAQItem[] = [
  // Getting Started
  {
    id: 1,
    category: 'Getting Started',
    question: 'How do I create an account on iAyos?',
    answer:
      'To create an account, tap "Sign Up" on the login screen, enter your email and password, verify your email, and then select whether you\'re a worker or client.',
  },
  {
    id: 2,
    category: 'Getting Started',
    question: 'What is the difference between a worker and a client?',
    answer:
      'Workers provide services to clients. Workers can apply for jobs posted by clients. Clients post jobs and hire workers to complete them.',
  },
  {
    id: 3,
    category: 'Getting Started',
    question: 'How do I complete my profile?',
    answer:
      'Go to the Profile tab, tap "Edit Profile", and fill in your bio, hourly rate, skills, service areas, and upload a profile photo. You can also add certifications and materials.',
  },

  // Jobs & Applications
  {
    id: 4,
    category: 'Jobs & Applications',
    question: 'How do I find jobs?',
    answer:
      'Browse jobs on the Home tab. You can filter by category, budget range, and location. Use the search feature to find specific jobs.',
  },
  {
    id: 5,
    category: 'Jobs & Applications',
    question: 'How do I apply for a job?',
    answer:
      'Open a job listing, review the details, then tap "Apply Now". Enter your proposed budget and a cover letter explaining why you\'re the best fit.',
  },
  {
    id: 6,
    category: 'Jobs & Applications',
    question: 'Can I withdraw my job application?',
    answer:
      'Yes, you can withdraw applications that are still pending. Go to "My Applications", select the application, and tap "Withdraw Application".',
  },
  {
    id: 7,
    category: 'Jobs & Applications',
    question: 'How do I complete a job?',
    answer:
      'Once you finish the work, tap "Mark as Complete" on the active job screen. Upload photos of your work and add completion notes. The client will then review and approve.',
  },

  // Payments
  {
    id: 8,
    category: 'Payments',
    question: 'How does the payment system work?',
    answer:
      'iAyos uses a two-phase escrow payment system. Clients pay 50% upfront (escrow) when accepting your application. The remaining 50% is paid after you complete the job and the client approves it.',
  },
  {
    id: 9,
    category: 'Payments',
    question: 'What payment methods are accepted?',
    answer:
      'We accept GCash, iAyos Wallet balance, and Cash payment (with photo proof verification by admin).',
  },
  {
    id: 10,
    category: 'Payments',
    question: 'How do I add money to my wallet?',
    answer:
      'Go to Wallet > Deposit. Choose an amount (₱100 minimum) and pay via GCash. Your wallet will be credited immediately after successful payment.',
  },
  {
    id: 11,
    category: 'Payments',
    question: 'When do I receive my earnings?',
    answer:
      'After the client approves job completion and pays the final 50%, the funds are automatically released to your wallet (minus 5% platform fee).',
  },
  {
    id: 12,
    category: 'Payments',
    question: 'What is the platform fee?',
    answer:
      'iAyos charges a 5% platform fee on the total job amount. This fee is deducted from your earnings when funds are released.',
  },

  // Profile & Verification
  {
    id: 13,
    category: 'Profile & Verification',
    question: 'Why do I need to verify my identity (KYC)?',
    answer:
      'KYC verification builds trust in the marketplace. Verified workers get a badge, appear higher in search results, and can access higher-value jobs.',
  },
  {
    id: 14,
    category: 'Profile & Verification',
    question: 'What documents do I need for KYC verification?',
    answer:
      'You need a valid government-issued ID (front and back), a selfie holding your ID, and optionally clearances like NBI/Barangay/Police clearance.',
  },
  {
    id: 15,
    category: 'Profile & Verification',
    question: 'How long does KYC verification take?',
    answer:
      'KYC verification typically takes 1-3 business days. You\'ll receive a notification once your documents are reviewed.',
  },
  {
    id: 16,
    category: 'Profile & Verification',
    question: 'How do I add certifications?',
    answer:
      'Go to Profile > Edit Profile > Manage Certifications. Tap "Add Certification", fill in the details (name, organization, dates), and upload your certificate document.',
  },
  {
    id: 17,
    category: 'Profile & Verification',
    question: 'Can I add materials or products I offer?',
    answer:
      'Yes! Go to Profile > Edit Profile > Manage Materials. Add the name, description, price, unit, and an optional photo. Clients can see what materials you provide.',
  },

  // Messaging
  {
    id: 18,
    category: 'Messaging',
    question: 'How do I chat with clients or workers?',
    answer:
      'After your application is accepted, go to the Messages tab. Select the conversation to chat in real-time. You can send text and images.',
  },
  {
    id: 19,
    category: 'Messaging',
    question: 'Can I send images in chat?',
    answer:
      'Yes, tap the camera icon in the message input to take a photo or choose from your gallery. Images are uploaded and shared instantly.',
  },
  {
    id: 20,
    category: 'Messaging',
    question: 'How do I archive a conversation?',
    answer:
      'Swipe left on a conversation (iOS) or long-press (Android), then tap "Archive". Archived conversations can be viewed under the Archived filter.',
  },

  // Reviews & Ratings
  {
    id: 21,
    category: 'Reviews & Ratings',
    question: 'How do I leave a review?',
    answer:
      'After a job is completed, you\'ll receive a prompt to review the other party. Rate 1-5 stars and write a detailed review (10-500 characters).',
  },
  {
    id: 22,
    category: 'Reviews & Ratings',
    question: 'Can I edit or delete my review?',
    answer:
      'You can edit your review within 24 hours of posting. After 24 hours, reviews become permanent and cannot be edited or deleted.',
  },
  {
    id: 23,
    category: 'Reviews & Ratings',
    question: 'What if I receive an unfair or inappropriate review?',
    answer:
      'You can report a review by tapping the flag icon. Our team will review the report and take appropriate action if the review violates our guidelines.',
  },

  // Notifications
  {
    id: 24,
    category: 'Notifications',
    question: 'How do I manage push notifications?',
    answer:
      'Go to Settings > Notifications. You can enable/disable notifications by category (jobs, messages, payments, etc.) and set Do Not Disturb hours.',
  },
  {
    id: 25,
    category: 'Notifications',
    question: 'Why am I not receiving notifications?',
    answer:
      'Check your device settings to ensure notifications are enabled for iAyos. Also verify notification settings within the app under Settings > Notifications.',
  },

  // Troubleshooting
  {
    id: 26,
    category: 'Troubleshooting',
    question: 'The app is slow or crashing. What should I do?',
    answer:
      'Try clearing the app cache (Settings > Clear Cache), restarting the app, or updating to the latest version. If issues persist, contact support.',
  },
  {
    id: 27,
    category: 'Troubleshooting',
    question: 'I forgot my password. How do I reset it?',
    answer:
      'On the login screen, tap "Forgot Password?", enter your email, and you\'ll receive a password reset link. Follow the link to set a new password.',
  },
  {
    id: 28,
    category: 'Troubleshooting',
    question: 'How do I report a bug or technical issue?',
    answer:
      'Go to Settings > Contact Support or Help Center > Report a Problem. Describe the issue in detail and include screenshots if possible.',
  },

  // Safety & Security
  {
    id: 29,
    category: 'Safety & Security',
    question: 'How does iAyos protect my payment information?',
    answer:
      'All payments are processed through secure gateways (Xendit). We never store your credit card or banking details. The escrow system ensures funds are held securely until job completion.',
  },
  {
    id: 30,
    category: 'Safety & Security',
    question: 'What should I do if I suspect fraud or scam?',
    answer:
      'Report the issue immediately through Settings > Report a Problem. Provide all relevant details. Our team will investigate and take action. Never share personal information or make payments outside the app.',
  },
  {
    id: 31,
    category: 'Safety & Security',
    question: 'Can I trust the other users on iAyos?',
    answer:
      'We verify users through KYC, reviews, and ratings. Look for verified badges, check reviews and ratings, and always communicate through the app. Report any suspicious behavior.',
  },
];

export default function FAQScreen() {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', ...new Set(FAQ_DATA.map((item) => item.category))];

  const filteredFAQs = FAQ_DATA.filter((item) => {
    const matchesSearch =
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search frequently asked questions..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9CA3AF"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContent}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryButton,
              selectedCategory === category && styles.categoryButtonActive,
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text
              style={[
                styles.categoryText,
                selectedCategory === category && styles.categoryTextActive,
              ]}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* FAQ List */}
      <ScrollView style={styles.faqList}>
        {filteredFAQs.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyStateTitle}>No results found</Text>
            <Text style={styles.emptyStateText}>
              Try searching with different keywords
            </Text>
          </View>
        ) : (
          filteredFAQs.map((item) => (
            <FAQItemComponent
              key={item.id}
              item={item}
              isExpanded={expandedId === item.id}
              onToggle={() => toggleExpand(item.id)}
            />
          ))
        )}

        {/* Contact Support CTA */}
        <View style={styles.contactSupportContainer}>
          <Ionicons name="chatbubble-outline" size={32} color="#3B82F6" />
          <Text style={styles.contactSupportTitle}>Still need help?</Text>
          <Text style={styles.contactSupportText}>
            Our support team is here to assist you
          </Text>
          <TouchableOpacity style={styles.contactSupportButton}>
            <Text style={styles.contactSupportButtonText}>Contact Support</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

interface FAQItemComponentProps {
  item: FAQItem;
  isExpanded: boolean;
  onToggle: () => void;
}

function FAQItemComponent({ item, isExpanded, onToggle }: FAQItemComponentProps) {
  return (
    <TouchableOpacity
      style={styles.faqItem}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <View style={styles.faqItemHeader}>
        <View style={styles.faqItemHeaderLeft}>
          <Ionicons
            name={isExpanded ? 'chevron-down' : 'chevron-forward'}
            size={20}
            color="#6B7280"
          />
          <Text style={styles.faqQuestion}>{item.question}</Text>
        </View>
      </View>
      {isExpanded && (
        <View style={styles.faqAnswer}>
          <Text style={styles.faqAnswerText}>{item.answer}</Text>
          <Text style={styles.faqCategory}>Category: {item.category}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  categoriesContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  categoriesContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  categoryButtonActive: {
    backgroundColor: '#3B82F6',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  faqList: {
    flex: 1,
  },
  faqItem: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  faqItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  faqItemHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 12,
    flex: 1,
  },
  faqAnswer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingLeft: 48,
  },
  faqAnswerText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#6B7280',
    marginBottom: 8,
  },
  faqCategory: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  contactSupportContainer: {
    alignItems: 'center',
    padding: 32,
    margin: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 24,
    marginBottom: 32,
  },
  contactSupportTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 12,
    marginBottom: 4,
  },
  contactSupportText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    textAlign: 'center',
  },
  contactSupportButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  contactSupportButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
