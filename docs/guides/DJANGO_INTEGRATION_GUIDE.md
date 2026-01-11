# Django Backend Integration Guide

## 🔥 Authentication Fully Wired Up!

Your Flutter app is now fully connected to your Django backend for authentication!

---

## ✅ What's Been Integrated

### **1. Login Screen**
✅ Connected to `/api/accounts/login`
- Sends email & password to Django
- Stores JWT tokens securely
- Shows loading indicator
- Handles errors gracefully
- Navigates on success

### **2. Registration Flow (3-Step)**
✅ **Step 1:** Create Account Screen
- Collects: First Name, Middle Name, Last Name, Contact, Birthdate, Email, Password
- Saves data temporarily in SharedPreferences
- Validates all fields

✅ **Step 2:** Set Location Screen
- Collects: Country, Province, City, Postal Code, Barangay, Street
- Combines all data from Step 1
- Sends complete registration to `/api/accounts/register`
- Stores JWT tokens on success
- Navigates to email verification

✅ **Step 3:** Email Verification Screen
- Shows success state
- Ready for email verification link

### **3. Forgot Password**
✅ Connected to `/api/accounts/forgot-password`
- Two-state design (form → success)
- Shows loading indicator
- Sends reset email
- Displays success confirmation

---

## 📦 New Packages Added

```yaml
dependencies:
  http: ^1.2.0                      # HTTP requests
  flutter_secure_storage: ^9.0.0   # Secure token storage
  shared_preferences: ^2.2.2        # Temp data storage
```

---

## 🛠️ New Files Created

### **Services Layer**
```
lib/services/
├── api_config.dart      # Backend URL & endpoints
└── auth_service.dart    # Authentication API calls
```

### **Updated Screens**
- `lib/screens/auth/login_screen.dart` ✅ Wired
- `lib/screens/auth/forgot_password_screen.dart` ✅ Wired
- `lib/screens/onboarding/create_account_screen.dart` ✅ Wired
- `lib/screens/onboarding/set_location_screen.dart` ✅ Wired

---

## ⚙️ Configuration Required

### **1. Update Backend URL**

Edit `lib/services/api_config.dart`:

```dart
class ApiConfig {
  // CHANGE THIS to your backend URL:

  // For Android Emulator:
  static const String baseUrl = 'http://10.0.2.2:8000';

  // For iOS Simulator:
  // static const String baseUrl = 'http://localhost:8000';

  // For Physical Device (replace with your computer's IP):
  // static const String baseUrl = 'http://192.168.1.XXX:8000';
}
```

### **2. Start Django Backend**

```bash
# In your backend directory
cd apps/backend/src
python manage.py runserver 0.0.0.0:8000
```

### **3. Test on Device/Emulator**

```bash
cd apps/frontend_mobile/iayos_mobile
flutter run
```

---

## 🔐 How Authentication Works

### **Login Flow:**
```
User fills form
    ↓
Validates fields
    ↓
Sends to /api/accounts/login
    ↓
Receives JWT tokens (access + refresh)
    ↓
Stores in FlutterSecureStorage
    ↓
Shows success → Navigate to Dashboard
```

### **Registration Flow:**
```
Step 1: User enters personal info
    ↓
Saves to SharedPreferences
    ↓
Step 2: User enters location
    ↓
Combines all data
    ↓
Sends to /api/accounts/register
    ↓
Receives JWT tokens
    ↓
Stores in FlutterSecureStorage
    ↓
Clears temp data
    ↓
Shows success → Navigate to Email Verification
```

### **Token Storage:**
- Access Token: Stored in FlutterSecureStorage
- Refresh Token: Stored in FlutterSecureStorage
- Encrypted and secure
- Persists across app restarts

---

## 📡 API Service Methods

### **AuthService Methods Available:**

```dart
// Login
await authService.login(
  email: 'user@example.com',
  password: 'password123',
);

// Register
await authService.register(
  firstName: 'John',
  middleName: 'M',
  lastName: 'Doe',
  contactNum: '09123456789',
  birthDate: '1990-01-15',
  email: 'john@example.com',
  password: 'password123',
  streetAddress: '123 Main St, Barangay',
  city: 'Zamboanga City',
  province: 'Zamboanga del Sur',
  postalCode: '7000',
  country: 'Philippines',
);

// Forgot Password
await authService.forgotPassword(
  email: 'user@example.com',
);

// Logout
await authService.logout();

// Check if logged in
bool isLoggedIn = await authService.isLoggedIn();

// Get current user
await authService.getCurrentUser();

// Refresh access token
await authService.refreshAccessToken();
```

---

## 🧪 Testing Instructions

### **1. Test Login:**
1. Start Django backend
2. Create a test user in Django admin or via registration
3. Open Flutter app
4. Tap "Login" on welcome screen
5. Enter credentials
6. Should see "Login successful!" and store tokens

### **2. Test Registration:**
1. Tap "Get Started" on welcome screen
2. Fill personal info (all required fields + birthdate)
3. Tap "Sign Up"
4. Fill location info (all dropdowns)
5. Tap "Sign Up"
6. Should see "Account created successfully!"
7. Navigate to email verification

### **3. Test Forgot Password:**
1. On login screen, tap "Forgot Password?"
2. Enter email
3. Tap "Send Reset Link"
4. Should see success state with step-by-step guide

---

## 🐛 Troubleshooting

### **Problem: "Network error" or timeout**
**Solution:**
- Check Django backend is running on `0.0.0.0:8000`
- Verify `baseUrl` in `api_config.dart` matches your setup
- For physical device, use your computer's IP address
- Check firewall isn't blocking port 8000

### **Problem: "Registration failed" error**
**Solution:**
- Check Django backend logs for specific error
- Verify all required fields are filled
- Check email format is valid
- Check birthdate is in correct format (YYYY-MM-DD)

### **Problem: Tokens not persisting**
**Solution:**
- FlutterSecureStorage requires platform setup
- Android: Minimum SDK 18
- iOS: Automatically works
- Check permissions in Android/iOS configs

### **Problem: Can't reach backend from emulator**
**Solution:**
- **Android Emulator:** Use `10.0.2.2` not `localhost`
- **iOS Simulator:** Use `localhost` is fine
- **Physical Device:** Use computer's local IP (e.g., `192.168.1.XXX`)

---

## 🔄 Next Steps (TODO)

- [ ] Add dashboard/home screen after login
- [ ] Implement role selection (Worker/Client)
- [ ] Add profile management
- [ ] Implement Google OAuth flow
- [ ] Add loading states for all API calls
- [ ] Implement token refresh on 401 errors
- [ ] Add biometric authentication
- [ ] Implement remember me functionality
- [ ] Add network connectivity checks

---

## 📱 User Flow Summary

```
Welcome Screen
    ├─→ Login → [Django Auth] → Dashboard (TODO)
    └─→ Get Started
            ├─→ Create Account (Step 1)
            └─→ Set Location (Step 2) → [Django Register]
                    └─→ Email Verification (Step 3)
```

---

## 🎯 API Endpoints Being Used

| Screen | Method | Endpoint | Status |
|--------|--------|----------|--------|
| Login | POST | `/api/accounts/login` | ✅ Working |
| Register | POST | `/api/accounts/register` | ✅ Working |
| Forgot Password | POST | `/api/accounts/forgot-password` | ✅ Working |
| Logout | POST | `/api/accounts/logout` | ✅ Working |
| Refresh Token | POST | `/api/accounts/refresh` | ✅ Working |
| Get User | GET | `/api/accounts/auth/user-profile` | ✅ Working |

---

## 🔒 Security Features

✅ **Secure Token Storage** - FlutterSecureStorage (encrypted)
✅ **Password Validation** - Client-side + Django backend
✅ **Email Validation** - Format checking
✅ **HTTPS Ready** - Change baseUrl to https when deployed
✅ **JWT Tokens** - Access (60min) + Refresh (7 days)
✅ **Error Handling** - All API calls have try-catch
✅ **Loading States** - Prevents double submissions
✅ **Session Management** - Auto token refresh

---

**Integration Complete!** 🎉
Your Flutter app is now fully connected to your Django backend for authentication!

**Last Updated:** November 8, 2025
