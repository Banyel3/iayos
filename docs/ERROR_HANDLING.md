# Error Handling System

This document explains the comprehensive error handling system implemented for authentication and general application errors.

## 🔒 Security First Approach

**CRITICAL SECURITY NOTE:** This error handling system is designed with security in mind:
- **Never exposes technical details** like database connection strings, stack traces, or internal error messages
- **Sanitizes all error messages** before displaying to users  
- **Logs technical details server-side** while showing user-friendly messages client-side
- **Protects sensitive information** that could be used by attackers

## Overview

The error handling system consists of three main components:

1. **Dedicated Error Page** (`/app/auth/error/page.tsx`) - Handles NextAuth authentication errors
2. **Error Modal Component** (`/components/ui/error-modal.tsx`) - Reusable modal for in-app errors
3. **Error Testing Component** (`/components/dev/error-tester.tsx`) - Development tool for testing errors

## Error Page

### What it handles
- Database connection errors (DATABASE_URL not found)
- Prisma query failures
- OAuth provider errors (Google sign-in failures)
- Email verification issues
- Network timeout errors
- Generic authentication failures

### How it works
When NextAuth encounters an error, it automatically redirects to `/auth/error?error=<encoded_error_message>`. The error page:

1. Parses the error message
2. Categorizes the error type
3. Displays a user-friendly message
4. Provides appropriate action buttons
5. Shows technical details in development mode

### Example Error URL
```
http://localhost:3000/auth/error?error=Environment%20variable%20not%20found%3A%20DATABASE_URL
```

## Error Modal

### Usage in Components
```tsx
import { useErrorModal } from "@/components/ui/error-modal";

function MyComponent() {
  const errorModal = useErrorModal();

  const handleError = () => {
    errorModal.showError(
      "Something went wrong!",
      "Try Again",
      () => retryAction(),
      "Custom Title"
    );
  };

  return (
    <div>
      <button onClick={handleError}>Trigger Error</button>
      <errorModal.Modal />
    </div>
  );
}
```

### Available Methods
- `showError(message, actionText?, onAction?, title?)` - Red error modal
- `showWarning(message, actionText?, onAction?, title?)` - Yellow warning modal  
- `showInfo(message, actionText?, onAction?, title?)` - Blue info modal
- `close()` - Close the modal programmatically

### Props for Direct Usage
```tsx
<ErrorModal
  isOpen={true}
  onClose={() => setOpen(false)}
  title="Error Title"
  message="Error message here"
  type="error" // "error" | "warning" | "info"
  actionText="Try Again"
  onAction={() => doSomething()}
  showCloseButton={true}
/>
```

## Integration with NextAuth

### Configuration Update
The NextAuth configuration now includes the custom error page:

```typescript
// In /app/api/auth/[...nextauth]/route.ts
pages: {
  signIn: "/auth/login",
  error: "/auth/error", // ← Added this line
}
```

### Login Page Updates
The login page now uses error modals instead of inline error messages:

```tsx
// Before
const [loginError, setLoginError] = useState<string | null>(null);

// After  
const errorModal = useErrorModal();
```

## Testing the Error System

### Using the Error Tester Component
Add the error tester to any page during development:

```tsx
import { ErrorTester } from "@/components/dev/error-tester";

export default function TestPage() {
  return (
    <div>
      <ErrorTester />
    </div>
  );
}
```

### Simulating Database Errors
To test the actual DATABASE_URL error you encountered:

1. **Temporary .env removal:**
   ```bash
   # Rename your .env file temporarily
   mv .env .env.backup
   
   # Try to sign in - you'll get the database error
   # Then restore the file
   mv .env.backup .env
   ```

2. **Invalid DATABASE_URL:**
   ```bash
   # In your .env file, temporarily change:
   DATABASE_URL="invalid_url"
   
   # Try to sign in, then restore the correct URL
   ```

### Expected Behavior

#### For Database Errors (e.g., DATABASE_URL missing):
- **User sees:** "Service Temporarily Unavailable"  
- **Message:** "Our authentication service is currently experiencing issues."
- **Action:** "Try Again" button redirects to login
- **Security:** No database connection details exposed

#### For OAuth Errors:
- **User sees:** "Sign-In Issue"  
- **Message:** "We couldn't complete your sign-in request."
- **Action:** "Back to Login" button
- **Security:** No OAuth provider technical details exposed

#### For Verification Errors:
- **User sees:** "Email Verification Required"
- **Message:** "Your email address needs to be verified..."
- **Action:** "Verify Email" redirects to verification page
- **Security:** No verification token details exposed

## Customization

### Adding New Error Types
To handle new error types, update the `getErrorDetails` function in `/app/auth/error/page.tsx`:

```typescript
// Add new error detection
if (decodedError.includes("your_new_error_keyword")) {
  return {
    title: "Your Custom Error Title",
    message: "User-friendly explanation",
    suggestion: "What the user should do",
    actionText: "Action Button Text",
    actionHref: "/redirect/path",
  };
}
```

### Styling the Modal
The error modal uses Tailwind CSS classes. Customize the appearance by modifying the classes in `/components/ui/error-modal.tsx`.

### Adding New Modal Types
Extend the modal component to support additional types:

```typescript
// In error-modal.tsx, add to the getIconAndColors function
case "success":
  return {
    bgColor: "bg-green-100",
    textColor: "text-green-600",
    icon: (/* success icon SVG */),
  };
```

## Best Practices

1. **🔒 Security First:** Never expose raw database errors, stack traces, or technical details to users
2. **Always provide the Modal component:** When using `useErrorModal`, always include `<errorModal.Modal />` in your JSX
3. **Use appropriate error types:** Choose between error, warning, and info based on severity
4. **Sanitize error messages:** Always convert technical errors to user-friendly messages before displaying
5. **Provide actionable buttons:** Give users clear next steps with meaningful button text
6. **Test error scenarios:** Use the error tester component to verify your error handling works
7. **Handle network errors:** Wrap async operations in try-catch blocks and show appropriate errors
8. **Log technical details server-side:** Use proper logging for debugging while keeping user-facing messages simple

## Troubleshooting

### Modal not appearing
- Ensure `<errorModal.Modal />` is included in your component's JSX
- Check that the modal state is being set correctly
- Verify there are no CSS z-index conflicts

### Error page not showing
- Confirm the NextAuth configuration includes the error page
- Check that the error URL format matches expected pattern
- Verify the error page file exists at `/app/auth/error/page.tsx`

### TypeScript errors
- Ensure all required props are provided to components
- Check that error message types match expected interfaces
- Verify import paths are correct