# iAyos Mobile App

React Native mobile application for the iAyos marketplace platform, built with Expo.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Expo CLI: `npm install -g expo-cli`
- For iOS: Xcode and iOS Simulator
- For Android: Android Studio and Android Emulator
- Expo Go app on your physical device (for testing)

### Installation

```bash
cd apps/frontend_mobile/iayos_mobile
npm install
```

### Running the App

**Start the development server:**

```bash
npm start
```

**Run on specific platform:**

```bash
npm run android    # Run on Android emulator
npm run ios        # Run on iOS simulator
npm run web        # Run in web browser
```

**Using Expo Go on your phone:**

1. Install Expo Go app from App Store (iOS) or Play Store (Android)
2. Run `npm start` in terminal
3. Scan the QR code with your camera (iOS) or Expo Go app (Android)

## 📱 Features Implemented

### ✅ Phase 1: Core Authentication & Dashboard

- **Authentication System**
  - Email/password login
  - User registration with email verification
  - JWT-based authentication with HTTP-only cookies
  - Persistent auth state with AsyncStorage
  - Logout with cache clearing

- **Role-Based Dashboard**
  - Role selection screen (Worker vs Client)
  - Worker dashboard with availability status
  - Client dashboard for job posting
  - Quick stats and analytics
  - Quick action buttons

- **Navigation**
  - Bottom tab navigation (Home, Jobs, Messages, Profile)
  - Auth flow with automatic redirects
  - Protected routes

- **Profile Screen**
  - User information display
  - Account status (verified, KYC)
  - Worker-specific info (availability, contact)
  - Edit profile (placeholder)
  - Logout functionality

### 🚧 Coming Soon

- **Jobs Module**
  - Browse available jobs (Worker)
  - Post new jobs (Client)
  - Job details and application
  - My applications tracking

- **Messaging System**
  - Real-time chat with WebSocket
  - Conversation list
  - Message notifications

- **Profile Enhancements**
  - Profile image upload
  - Certifications management
  - Portfolio gallery
  - Rating and reviews

## 🏗️ Architecture

### Project Structure

```
apps/frontend_mobile/iayos_mobile/
├── app/                          # Expo Router pages
│   ├── auth/                     # Authentication screens
│   │   ├── login.tsx            # Login screen
│   │   └── register.tsx         # Registration screen
│   ├── (tabs)/                   # Main app tabs
│   │   ├── _layout.tsx          # Tab navigation layout
│   │   ├── index.tsx            # Home/Dashboard
│   │   ├── jobs.tsx             # Jobs listing
│   │   ├── messages.tsx         # Messages/Chat
│   │   └── profile.tsx          # User profile
│   └── _layout.tsx              # Root layout with providers
├── components/                   # Reusable components
│   ├── auth/                     # Auth-related components
│   ├── jobs/                     # Job-related components
│   └── profile/                  # Profile components
├── context/                      # React Context providers
│   └── AuthContext.tsx          # Authentication state management
├── lib/                          # Utilities and services
│   ├── api/                      # API configuration
│   │   └── config.ts            # API endpoints and request helper
│   └── services/                # Business logic services
├── types/                        # TypeScript type definitions
│   └── index.ts                 # Shared types
└── constants/                    # App constants (colors, config)
```

### Tech Stack

- **Framework**: React Native with Expo SDK 54
- **Navigation**: Expo Router (file-based routing)
- **State Management**: React Context + TanStack React Query
- **Storage**: AsyncStorage for local data
- **HTTP Client**: Fetch API with credentials (cookies)
- **UI Components**: React Native Paper (Material Design)
- **Type Safety**: TypeScript 5.9

### API Integration

The mobile app connects to the Django backend API at:

- **Development**: `http://localhost:8000/api`
- **Production**: `https://api.iayos.com/api` (configurable)

Authentication uses **HTTP-only cookies** for security, matching the web app's approach.

## 🔧 Configuration

### Environment Variables

The app uses `__DEV__` flag to detect development mode. For production:

1. Update `lib/api/config.ts`:

```typescript
const API_URL = __DEV__ ? "http://localhost:8000" : "https://api.iayos.com";
```

2. For Android emulator, use `http://10.0.2.2:8000` instead of `localhost:8000`
3. For physical device, use your computer's IP address (e.g., `http://192.168.1.100:8000`)

## 🧪 Testing

### Manual Testing Flow

**1. Authentication:**

```bash
# Start backend
cd apps/backend
docker-compose -f docker-compose.dev.yml up

# Start mobile app
cd apps/frontend_mobile/iayos_mobile
npm start
```

**2. Test Login:**

- Open app in Expo Go or simulator
- Navigate to Login screen
- Use test credentials: `test@example.com` / `password123`
- Should redirect to home dashboard

**3. Test Role Selection:**

- Register new account
- After login, select "Worker" or "Client" role
- Should see role-specific dashboard

**4. Test Navigation:**

- Tap bottom tabs (Home, Jobs, Messages, Profile)
- Verify each screen loads correctly

**5. Test Logout:**

- Go to Profile tab
- Tap Logout button
- Should clear auth and redirect to Login

## 📦 Dependencies Added

```json
{
  "@react-native-async-storage/async-storage": "^2.1.0",
  "@tanstack/react-query": "^5.90.6",
  "expo-secure-store": "~15.0.2",
  "react-native-paper": "^5.12.3"
}
```

### Installation

```bash
npx expo install @react-native-async-storage/async-storage expo-secure-store
npm install @tanstack/react-query react-native-paper
```

## 🎨 UI Design

The mobile app follows the web version's design language:

- **Primary Color**: #007AFF (iOS blue)
- **Typography**: System fonts (San Francisco on iOS, Roboto on Android)
- **Layout**: Card-based with shadows and rounded corners
- **Spacing**: 16px base unit
- **Icons**: Emoji-based for simplicity (can be replaced with icon library)

## 🔐 Security

- **Authentication**: JWT tokens stored in HTTP-only cookies (handled by backend)
- **Local Storage**: User data cached in AsyncStorage (no sensitive data)
- **API Requests**: Always include `credentials: 'include'` for cookie-based auth
- **Logout**: Clears all local caches and backend session

## 📝 Development Notes

### Known Limitations

1. **No Push Notifications**: Requires Firebase/APNs setup (Phase 9)
2. **No Real-time Chat**: WebSocket not yet implemented (Phase 5)
3. **Limited Offline Support**: No offline-first caching yet
4. **Placeholder Screens**: Jobs, Messages only show empty states

### Future Improvements

- Add job browsing and application flow
- Implement real-time messaging with WebSocket
- Add image upload for profile and portfolio
- Implement map view for worker location
- Add push notifications
- Offline-first architecture with local DB

## 🐛 Troubleshooting

### Common Issues

**1. "Network request failed"**

- Check backend is running (`docker-compose -f docker-compose.dev.yml up`)
- For Android emulator, use `10.0.2.2:8000` instead of `localhost:8000`
- For physical device, use your computer's IP address

**2. "Expo Go not connecting"**

- Ensure phone and computer are on same Wi-Fi network
- Disable firewall temporarily
- Try tunnel connection: `expo start --tunnel`

**3. "Cannot find module '@react-native-async-storage/async-storage'"**

- Run `npm install` in the mobile app directory
- Clear cache: `expo start -c`

**4. "Authentication not persisting"**

- Check backend CORS settings allow credentials
- Verify `credentials: 'include'` in API requests
- Check cookie settings in backend Django settings

## 📚 Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Docs](https://reactnative.dev/)
- [Expo Router Docs](https://expo.github.io/router/docs/)
- [TanStack Query Docs](https://tanstack.com/query/latest)
- [iAyos Backend API Docs](../../backend/README.md)

## 🚦 Next Steps

See `docs/COMPREHENSIVE_PHASES_REPORT.md` for full development roadmap:

- **Mobile Phase 2**: Job completion workflow (60-80 hours)
- **Mobile Phase 3**: Escrow payment system (100-120 hours)
- **Mobile Phase 4**: Final payment system (80-100 hours)
- **Mobile Phase 5**: Real-time chat (100-120 hours)

---

**Built with ❤️ using Expo and React Native**
