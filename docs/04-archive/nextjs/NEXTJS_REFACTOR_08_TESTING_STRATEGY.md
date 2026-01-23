# Module 8: Testing Strategy - Comprehensive Testing Plan

**Purpose**: Complete testing approach for Next.js migration  
**Coverage**: Unit, Integration, E2E, Manual Testing  
**Tools**: Jest, React Testing Library, Playwright, Manual QA

---

## Overview

This module defines the comprehensive testing strategy for the Next.js web app migration. Testing ensures feature parity with the React Native mobile app and maintains code quality.

**Testing Levels**:

1. **Unit Tests** - Individual functions and components
2. **Integration Tests** - API integration and data flow
3. **E2E Tests** - Complete user workflows (Playwright)
4. **Manual Testing** - QA checklist for edge cases

**Coverage Goals**:

- Unit: 80%+ coverage
- Integration: All API endpoints tested
- E2E: All critical user flows covered
- Manual: Comprehensive edge case validation

---

## 8.1 Unit Testing Strategy

### Setup

**Testing Framework**: Jest + React Testing Library

**Configuration** (`jest.config.js`):

```javascript
module.exports = {
  preset: "next",
  testEnvironment: "jest-environment-jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    "^@/components/(.*)$": "<rootDir>/components/$1",
    "^@/lib/(.*)$": "<rootDir>/lib/$1",
  },
  collectCoverageFrom: [
    "app/**/*.{js,jsx,ts,tsx}",
    "components/**/*.{js,jsx,ts,tsx}",
    "lib/**/*.{js,jsx,ts,tsx}",
    "!**/*.d.ts",
    "!**/node_modules/**",
    "!**/.next/**",
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

**Jest Setup** (`jest.setup.js`):

```javascript
import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach } from "@jest/globals";

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  })),
  usePathname: jest.fn(() => "/"),
  useSearchParams: jest.fn(() => new URLSearchParams()),
}));

// Mock React Query
jest.mock("@tanstack/react-query", () => ({
  ...jest.requireActual("@tanstack/react-query"),
  useQuery: jest.fn(),
  useMutation: jest.fn(),
}));
```

### Component Testing Examples

#### Test Job Card Component

```typescript
// components/__tests__/JobCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { JobCard } from '@/components/jobs/JobCard';

const mockJob = {
  id: 1,
  title: 'Fix leaking pipe',
  description: 'Need urgent plumbing help',
  budget: 1500,
  category: { id: 1, name: 'Plumbing' },
  urgency: 'HIGH',
  status: 'ACTIVE',
  location: 'Manila',
  materials_included: true,
  created_at: '2025-01-20T10:00:00Z',
  client: {
    id: 2,
    name: 'John Doe',
    avatar: 'avatar.jpg',
    rating: 4.5,
  },
  has_applied: false,
  application_count: 3,
};

describe('JobCard', () => {
  it('renders job information correctly', () => {
    render(<JobCard job={mockJob} />);

    expect(screen.getByText('Fix leaking pipe')).toBeInTheDocument();
    expect(screen.getByText('₱1,500')).toBeInTheDocument();
    expect(screen.getByText('Plumbing')).toBeInTheDocument();
    expect(screen.getByText('Manila')).toBeInTheDocument();
  });

  it('displays urgency badge with correct color', () => {
    render(<JobCard job={mockJob} />);

    const urgencyBadge = screen.getByText('HIGH');
    expect(urgencyBadge).toHaveClass('bg-red-100');
  });

  it('shows materials included indicator', () => {
    render(<JobCard job={mockJob} />);

    expect(screen.getByText(/materials included/i)).toBeInTheDocument();
  });

  it('displays application count', () => {
    render(<JobCard job={mockJob} />);

    expect(screen.getByText('3 applications')).toBeInTheDocument();
  });

  it('calls onClick when card is clicked', () => {
    const handleClick = jest.fn();
    render(<JobCard job={mockJob} onClick={handleClick} />);

    fireEvent.click(screen.getByTestId('job-card'));

    expect(handleClick).toHaveBeenCalledWith(mockJob);
  });

  it('disables Apply button if user has already applied', () => {
    const jobWithApplication = { ...mockJob, has_applied: true };
    render(<JobCard job={jobWithApplication} />);

    const applyButton = screen.getByRole('button', { name: /applied/i });
    expect(applyButton).toBeDisabled();
  });
});
```

#### Test Payment Calculation Hook

```typescript
// lib/hooks/__tests__/usePaymentCalculation.test.ts
import { renderHook } from "@testing-library/react";
import { usePaymentCalculation } from "@/lib/hooks/usePaymentCalculation";

describe("usePaymentCalculation", () => {
  it("calculates escrow amount correctly (50%)", () => {
    const { result } = renderHook(() => usePaymentCalculation(2000));

    expect(result.current.escrowAmount).toBe(1000);
  });

  it("calculates platform fee correctly (5% OF escrow = 2.5% of total)", () => {
    const { result } = renderHook(() => usePaymentCalculation(2000));

    expect(result.current.escrowPlatformFee).toBe(50); // 5% of 1000 escrow
    expect(result.current.finalPlatformFee).toBe(50); // 5% of 1000 final
  });

  it("calculates worker earnings correctly (100% of listing)", () => {
    const { result } = renderHook(() => usePaymentCalculation(2000));

    expect(result.current.escrowWorkerReceives).toBe(1000); // Full 50% of listing
    expect(result.current.finalWorkerReceives).toBe(1000); // Full 50% of listing
    expect(result.current.totalWorkerEarns).toBe(2000); // Full listing price
  });

  it("calculates client total correctly (105% of listing)", () => {
    const { result } = renderHook(() => usePaymentCalculation(2000));

    expect(result.current.escrowClientPays).toBe(1050); // 1000 + 50 fee
    expect(result.current.finalClientPays).toBe(1050); // 1000 + 50 fee
    expect(result.current.totalClientPays).toBe(2100); // 105% of listing
  });

  it("calculates total platform earnings correctly", () => {
    const { result } = renderHook(() => usePaymentCalculation(2000));

    expect(result.current.totalPlatformFee).toBe(100); // 50 + 50 (5% of listing)
  });

  it("handles zero budget", () => {
    const { result } = renderHook(() => usePaymentCalculation(0));

    expect(result.current.escrowAmount).toBe(0);
    expect(result.current.totalWorkerEarns).toBe(0);
    expect(result.current.totalClientPays).toBe(0);
  });

  it("handles large budgets", () => {
    const { result } = renderHook(() => usePaymentCalculation(100000));

    expect(result.current.escrowAmount).toBe(50000); // 50% to worker
    expect(result.current.escrowPlatformFee).toBe(2500); // 5% of 50k = 2.5% of total
    expect(result.current.escrowClientPays).toBe(52500); // 50k + 2.5k fee
    expect(result.current.totalWorkerEarns).toBe(100000); // Full listing price
    expect(result.current.totalClientPays).toBe(105000); // 105% of listing
  });
});
```

#### Test Form Validation

```typescript
// lib/utils/__tests__/validation.test.ts
import {
  validateJobTitle,
  validateJobDescription,
  validateBudget,
  validateProposalMessage,
} from "@/lib/utils/validation";

describe("Job Validation", () => {
  describe("validateJobTitle", () => {
    it("accepts valid titles", () => {
      expect(validateJobTitle("Fix leaking pipe")).toEqual({ valid: true });
      expect(validateJobTitle("Need plumber ASAP")).toEqual({ valid: true });
    });

    it("rejects empty titles", () => {
      const result = validateJobTitle("");
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Title is required");
    });

    it("rejects titles shorter than 10 characters", () => {
      const result = validateJobTitle("Fix it");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("at least 10 characters");
    });

    it("rejects titles longer than 100 characters", () => {
      const longTitle = "A".repeat(101);
      const result = validateJobTitle(longTitle);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("maximum 100 characters");
    });
  });

  describe("validateBudget", () => {
    it("accepts valid budgets", () => {
      expect(validateBudget(500)).toEqual({ valid: true });
      expect(validateBudget(10000)).toEqual({ valid: true });
    });

    it("rejects budgets below minimum", () => {
      const result = validateBudget(50);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("minimum ₱100");
    });

    it("rejects budgets above maximum", () => {
      const result = validateBudget(1000001);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("maximum ₱1,000,000");
    });

    it("rejects negative budgets", () => {
      const result = validateBudget(-100);
      expect(result.valid).toBe(false);
    });
  });
});
```

### Running Unit Tests

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test JobCard.test.tsx

# Watch mode
npm test -- --watch

# Update snapshots
npm test -- -u
```

---

## 8.2 Integration Testing Strategy

### API Integration Tests

**Setup** (`lib/api/__tests__/setup.ts`):

```typescript
import { rest } from "msw";
import { setupServer } from "msw/node";

const API_BASE_URL = "http://localhost:8000";

export const handlers = [
  rest.get(`${API_BASE_URL}/api/mobile/jobs/list`, (req, res, ctx) => {
    return res(
      ctx.json({
        jobs: [
          /* mock jobs */
        ],
        total: 10,
        page: 1,
        total_pages: 1,
      })
    );
  }),

  rest.post(`${API_BASE_URL}/api/mobile/jobs/create`, (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({
        success: true,
        job_id: 123,
        message: "Job created successfully",
      })
    );
  }),

  // Add all other endpoints...
];

export const server = setupServer(...handlers);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

#### Test Job Creation Flow

```typescript
// lib/api/__tests__/jobs.integration.test.ts
import { apiRequest } from "@/lib/api/config";
import { ENDPOINTS } from "@/lib/api/config";
import { server } from "./setup";
import { rest } from "msw";

describe("Job Creation API Integration", () => {
  it("creates job successfully", async () => {
    const jobData = {
      title: "Fix leaking pipe",
      description: "Need urgent plumbing help",
      budget: 1500,
      category_id: 1,
      urgency: "HIGH",
      location: "Manila",
      materials_included: true,
      job_type: "LISTING",
    };

    const response = await apiRequest(ENDPOINTS.CREATE_JOB, {
      method: "POST",
      body: JSON.stringify(jobData),
    });

    expect(response.success).toBe(true);
    expect(response.job_id).toBeDefined();
  });

  it("handles validation errors", async () => {
    server.use(
      rest.post(`${API_BASE_URL}/api/mobile/jobs/create`, (req, res, ctx) => {
        return res(
          ctx.status(400),
          ctx.json({
            error: "Budget must be at least ₱100",
          })
        );
      })
    );

    const invalidJobData = {
      title: "Test",
      budget: 50,
      // ... other fields
    };

    await expect(
      apiRequest(ENDPOINTS.CREATE_JOB, {
        method: "POST",
        body: JSON.stringify(invalidJobData),
      })
    ).rejects.toThrow("Budget must be at least ₱100");
  });

  it("handles authentication errors", async () => {
    server.use(
      rest.post(`${API_BASE_URL}/api/mobile/jobs/create`, (req, res, ctx) => {
        return res(
          ctx.status(401),
          ctx.json({
            error: "Authentication required",
          })
        );
      })
    );

    await expect(
      apiRequest(ENDPOINTS.CREATE_JOB, {
        method: "POST",
        body: JSON.stringify({}),
      })
    ).rejects.toThrow("Authentication required");
  });
});
```

#### Test Payment Flow

```typescript
// lib/api/__tests__/payments.integration.test.ts
describe("Payment Flow Integration", () => {
  it("creates escrow payment with GCash", async () => {
    const paymentData = {
      job_id: 123,
      payment_method: "GCASH",
    };

    const response = await apiRequest(ENDPOINTS.CREATE_ESCROW_PAYMENT, {
      method: "POST",
      body: JSON.stringify(paymentData),
    });

    expect(response.success).toBe(true);
    expect(response.payment_id).toBeDefined();
    expect(response.xendit_invoice_url).toBeDefined();
  });

  it("creates escrow payment with Wallet", async () => {
    const paymentData = {
      job_id: 123,
      payment_method: "WALLET",
    };

    const response = await apiRequest(ENDPOINTS.CREATE_ESCROW_PAYMENT, {
      method: "POST",
      body: JSON.stringify(paymentData),
    });

    expect(response.success).toBe(true);
    expect(response.status).toBe("COMPLETED");
    expect(response.xendit_invoice_url).toBeUndefined(); // Wallet payment instant
  });

  it("uploads cash proof correctly", async () => {
    const formData = new FormData();
    formData.append("payment_id", "456");
    formData.append("proof_image", new File(["proof"], "proof.jpg"));

    const response = await apiRequest(ENDPOINTS.UPLOAD_CASH_PROOF, {
      method: "POST",
      body: formData,
    });

    expect(response.success).toBe(true);
    expect(response.message).toContain("pending verification");
  });
});
```

---

## 8.3 End-to-End Testing Strategy

### Playwright Setup

**Installation**:

```bash
npm install -D @playwright/test
npx playwright install
```

**Configuration** (`playwright.config.ts`):

```typescript
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 5"] },
    },
  ],

  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
```

### E2E Test Examples

#### Test Complete Job Workflow (CLIENT)

```typescript
// e2e/client-job-workflow.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Client Job Workflow", () => {
  test.beforeEach(async ({ page }) => {
    // Login as client
    await page.goto("/login");
    await page.fill('input[name="email"]', "client@test.com");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL("/dashboard");
  });

  test("complete job posting flow", async ({ page }) => {
    // Navigate to create job
    await page.click('a[href="/dashboard/jobs/create"]');
    await expect(page).toHaveURL("/dashboard/jobs/create");

    // Select job type
    await page.click('button:has-text("Post Public Job")');

    // Fill job form
    await page.fill('input[name="title"]', "Fix leaking pipe urgently");
    await page.fill(
      'textarea[name="description"]',
      "I have a leaking pipe in my kitchen that needs immediate attention. " +
        "Water is leaking from the connection under the sink."
    );
    await page.fill('input[name="budget"]', "1500");
    await page.selectOption('select[name="category"]', "1"); // Plumbing
    await page.click('input[value="HIGH"]'); // Urgency
    await page.fill('input[name="location"]', "Makati City, Manila");
    await page.check('input[name="materials_included"]');

    // Submit job
    await page.click('button[type="submit"]');

    // Verify success
    await expect(page.locator("text=Job posted successfully")).toBeVisible();
    await expect(page).toHaveURL(/\/dashboard\/jobs\/\d+/);

    // Verify job details
    await expect(page.locator("h1")).toContainText("Fix leaking pipe urgently");
    await expect(page.locator("text=₱1,500")).toBeVisible();
    await expect(page.locator("text=Plumbing")).toBeVisible();
    await expect(page.locator("text=HIGH")).toBeVisible();
  });

  test("view and accept job application", async ({ page }) => {
    // Navigate to job with applications
    await page.goto("/dashboard/jobs/123");

    // Click view applications
    await page.click('button:has-text("View Applications")');
    await expect(page).toHaveURL("/dashboard/jobs/123/applications");

    // Verify applications list
    await expect(page.locator(".application-card")).toHaveCount.greaterThan(0);

    // Click on first application
    const firstApplication = page.locator(".application-card").first();
    await firstApplication.click();

    // View application detail
    await expect(page.locator("text=Proposal Message")).toBeVisible();
    await expect(page.locator(".worker-profile")).toBeVisible();

    // Accept application
    await page.click('button:has-text("Accept Application")');

    // Confirm acceptance
    await page.click('button:has-text("Confirm")');

    // Verify success
    await expect(page.locator("text=Application accepted")).toBeVisible();
    await expect(page.locator("text=Worker Assigned")).toBeVisible();
  });
});
```

#### Test Complete Job Workflow (WORKER)

```typescript
// e2e/worker-job-workflow.spec.ts
test.describe("Worker Job Workflow", () => {
  test.beforeEach(async ({ page }) => {
    // Login as worker
    await page.goto("/login");
    await page.fill('input[name="email"]', "worker@test.com");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL("/dashboard");
  });

  test("browse jobs and apply", async ({ page }) => {
    // Navigate to jobs
    await page.goto("/dashboard/jobs/browse");

    // Apply filters
    await page.click("text=Filters");
    await page.selectOption('select[name="category"]', "1"); // Plumbing
    await page.fill('input[name="min_budget"]', "1000");
    await page.fill('input[name="max_budget"]', "5000");
    await page.click('button:has-text("Apply Filters")');

    // Wait for filtered results
    await page.waitForSelector(".job-card");
    await expect(page.locator(".job-card")).toHaveCount.greaterThan(0);

    // Click on first job
    await page.locator(".job-card").first().click();
    await expect(page).toHaveURL(/\/dashboard\/jobs\/\d+/);

    // Apply to job
    await page.click('button:has-text("Apply Now")');

    // Fill application form
    await page.fill(
      'textarea[name="proposal_message"]',
      "I have 5 years of experience in plumbing. I can fix this issue quickly " +
        "and efficiently. I have all the necessary tools and can start immediately."
    );
    await page.fill('input[name="proposed_rate"]', "1200");
    await page.fill('input[name="estimated_duration"]', "2-3 hours");

    // Submit application
    await page.click('button:has-text("Submit Application")');

    // Verify success
    await expect(page.locator("text=Application submitted")).toBeVisible();
    await expect(page.locator('button:has-text("Applied")')).toBeDisabled();
  });

  test("complete job and upload photos", async ({ page }) => {
    // Navigate to active job
    await page.goto("/dashboard/jobs/active/456");

    // Mark as complete
    await page.click('button:has-text("Mark as Complete")');

    // Fill completion notes
    await page.fill(
      'textarea[name="completion_notes"]',
      "Job completed successfully. Pipe has been fixed and tested for leaks."
    );

    // Upload photos
    await page.setInputFiles('input[type="file"]', [
      "test-files/before.jpg",
      "test-files/after.jpg",
    ]);

    // Wait for upload
    await expect(page.locator("text=Uploading... 100%")).toBeVisible();

    // Submit completion
    await page.click('button:has-text("Submit Completion")');

    // Verify success
    await expect(page.locator("text=Completion submitted")).toBeVisible();
    await expect(page.locator("text=Awaiting client approval")).toBeVisible();
  });
});
```

#### Test Payment Flow

```typescript
// e2e/payment-flow.spec.ts
test.describe("Payment Flow", () => {
  test("escrow payment with wallet", async ({ page }) => {
    await loginAsClient(page);

    // Navigate to job payment
    await page.goto("/dashboard/jobs/789/payment");

    // Verify payment summary (job listing ₱2,000)
    await expect(page.locator("text=₱1,000")).toBeVisible(); // 50% to worker
    await expect(page.locator("text=Platform Fee: +₱50")).toBeVisible(); // 5% of escrow
    await expect(page.locator("text=Worker Receives: ₱1,000")).toBeVisible(); // Full 50%
    await expect(page.locator("text=You Pay: ₱1,050")).toBeVisible(); // 1000 + 50 fee

    // Select wallet payment
    await page.click('button:has-text("Pay with Wallet")');

    // Check wallet balance
    const balance = await page.locator(".wallet-balance").textContent();
    expect(Number(balance?.replace(/[^\d]/g, ""))).toBeGreaterThan(1000);

    // Confirm payment
    await page.click('button:has-text("Confirm Payment")');

    // Verify success
    await expect(page.locator("text=Payment successful")).toBeVisible();
    await expect(page.locator("text=Escrow paid")).toBeVisible();
  });

  test("cash payment with proof upload", async ({ page }) => {
    await loginAsClient(page);
    await page.goto("/dashboard/jobs/789/payment");

    // Select cash payment
    await page.click('button:has-text("Pay with Cash")');

    // Upload proof
    await page.setInputFiles('input[type="file"]', "test-files/receipt.jpg");

    // Wait for upload
    await expect(page.locator(".upload-progress")).toHaveText("100%");

    // Submit
    await page.click('button:has-text("Submit Proof")');

    // Verify pending verification
    await expect(page.locator("text=Under Verification")).toBeVisible();
    await expect(page.locator("text=1-2 business days")).toBeVisible();
  });
});
```

### Running E2E Tests

```bash
# Run all E2E tests
npx playwright test

# Run specific test file
npx playwright test e2e/client-job-workflow.spec.ts

# Run in headed mode (see browser)
npx playwright test --headed

# Run specific browser
npx playwright test --project=chromium

# Debug mode
npx playwright test --debug

# Generate test report
npx playwright show-report
```

---

## 8.4 Manual Testing Checklist

### Client Workflows

#### Job Management

- [ ] Create public job (LISTING)
- [ ] Create invite job (INVITE) with worker selection
- [ ] Edit job details
- [ ] Delete job
- [ ] View job applications
- [ ] Accept application
- [ ] Reject application with reason
- [ ] Confirm job started
- [ ] Approve job completion
- [ ] View job history

#### Payment Flow

- [ ] Make escrow payment (GCash)
- [ ] Make escrow payment (Wallet)
- [ ] Make escrow payment (Cash with proof)
- [ ] Check payment status
- [ ] Make final payment after completion
- [ ] View payment history
- [ ] Deposit funds to wallet
- [ ] View wallet transactions

#### Communication

- [ ] Send message to worker
- [ ] Receive real-time messages
- [ ] Upload attachment in chat
- [ ] View conversation history
- [ ] Mark messages as read

#### Reviews

- [ ] Submit review for worker after job completion
- [ ] Edit review
- [ ] View worker's reviews
- [ ] View rating distribution

### Worker Workflows

#### Job Discovery

- [ ] Browse available jobs
- [ ] Filter jobs by category
- [ ] Filter jobs by budget range
- [ ] Filter jobs by location
- [ ] Search jobs by keyword
- [ ] View job detail
- [ ] Save job for later
- [ ] View saved jobs

#### Application Management

- [ ] Apply to job with proposal
- [ ] View my applications
- [ ] View application detail
- [ ] Withdraw application
- [ ] Accept job invitation (INVITE jobs)

#### Job Execution

- [ ] Confirm job started
- [ ] Mark job as complete with notes
- [ ] Upload job completion photos
- [ ] View job status
- [ ] View active jobs

#### Earnings

- [ ] View earnings dashboard
- [ ] View earnings chart
- [ ] View job earnings list
- [ ] View payment history
- [ ] Check wallet balance

#### Profile Management

- [ ] Edit profile (bio, hourly rate, skills)
- [ ] Upload avatar
- [ ] Upload portfolio images
- [ ] Add caption to portfolio
- [ ] Reorder portfolio
- [ ] Delete portfolio image
- [ ] Add certification
- [ ] View certifications

### Dual Profile Users

#### Profile Switching

- [ ] Switch from CLIENT to WORKER
- [ ] Switch from WORKER to CLIENT
- [ ] Verify UI changes based on profile type
- [ ] Verify data isolation (CLIENT jobs vs WORKER applications)

### Edge Cases

#### Authentication

- [ ] Login with valid credentials
- [ ] Login with invalid credentials
- [ ] Logout
- [ ] Session timeout handling
- [ ] Token refresh

#### Validation

- [ ] Submit form with empty fields
- [ ] Submit form with invalid budget (< ₱100)
- [ ] Submit job with short title (< 10 chars)
- [ ] Apply with short proposal (< 50 chars)
- [ ] Upload oversized image (> 5MB)
- [ ] Upload invalid file type

#### Network

- [ ] Slow internet connection
- [ ] Offline handling
- [ ] API timeout
- [ ] 500 server error
- [ ] 401 authentication error

#### Browser Compatibility

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Chrome
- [ ] Mobile Safari

---

## 8.5 Performance Testing

### Lighthouse Audit

**Run Lighthouse**:

```bash
npx lighthouse http://localhost:3000 --view
```

**Performance Goals**:

- Performance: > 90
- Accessibility: > 95
- Best Practices: > 90
- SEO: > 90

### Load Testing

**Setup K6**:

```bash
brew install k6  # macOS
choco install k6  # Windows
```

**Load Test Script** (`load-test.js`):

```javascript
import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "30s", target: 20 }, // Ramp-up
    { duration: "1m", target: 50 }, // Stay at 50 users
    { duration: "30s", target: 0 }, // Ramp-down
  ],
  thresholds: {
    http_req_duration: ["p(95)<500"], // 95% of requests < 500ms
    http_req_failed: ["rate<0.01"], // < 1% failure rate
  },
};

export default function () {
  // Test job list endpoint
  const jobsRes = http.get(
    "http://localhost:8000/api/mobile/jobs/list?page=1&limit=20",
    {
      headers: { Authorization: "Bearer <token>" },
    }
  );

  check(jobsRes, {
    "status is 200": (r) => r.status === 200,
    "response time < 500ms": (r) => r.timings.duration < 500,
  });

  sleep(1);
}
```

**Run Load Test**:

```bash
k6 run load-test.js
```

---

## 8.6 Accessibility Testing

### Automated Tools

**axe DevTools**:

```bash
npm install -D @axe-core/playwright
```

**Accessibility Test** (`e2e/accessibility.spec.ts`):

```typescript
import { test, expect } from "@playwright/test";
import { injectAxe, checkA11y } from "axe-playwright";

test.describe("Accessibility Tests", () => {
  test("home page should have no accessibility violations", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await injectAxe(page);
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true },
    });
  });

  test("job detail page should be accessible", async ({ page }) => {
    await page.goto("/dashboard/jobs/123");
    await injectAxe(page);
    await checkA11y(page);
  });
});
```

### Manual Accessibility Checks

- [ ] Keyboard navigation works (Tab, Enter, Esc)
- [ ] Focus indicators visible
- [ ] Screen reader friendly (alt text, ARIA labels)
- [ ] Color contrast meets WCAG AA standards
- [ ] Forms have proper labels
- [ ] Error messages are announced
- [ ] Skip to main content link present

---

## 8.7 Security Testing

### Security Checklist

#### Authentication

- [ ] JWT tokens stored securely (httpOnly cookies or encrypted localStorage)
- [ ] Token expiration working
- [ ] Refresh token mechanism
- [ ] CSRF protection enabled
- [ ] XSS prevention (input sanitization)

#### Authorization

- [ ] Client cannot access worker-only endpoints
- [ ] Worker cannot access client-only endpoints
- [ ] Users cannot modify other users' data
- [ ] Job owners can only delete their own jobs

#### Data Validation

- [ ] All inputs validated on client and server
- [ ] SQL injection prevented (ORM parameterized queries)
- [ ] File upload validation (type, size, content)
- [ ] Rate limiting implemented

#### HTTPS

- [ ] All API calls use HTTPS in production
- [ ] Secure cookies (Secure, SameSite flags)
- [ ] HSTS header present

---

## 8.8 CI/CD Integration

### GitHub Actions Workflow

**Configuration** (`.github/workflows/test.yml`):

```yaml
name: Test Suite

on:
  push:
    branches: [main, dev]
  pull_request:
    branches: [main, dev]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "18"
      - run: npm ci
      - run: npm test -- --coverage
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "18"
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run build
      - run: npx playwright test
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/

  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "18"
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
```

---

## Completion Criteria

Testing Strategy module is complete when:

- [x] Unit test setup configured (Jest + RTL)
- [x] Integration test setup configured (MSW)
- [x] E2E test setup configured (Playwright)
- [x] Test examples provided for all critical flows
- [x] Manual testing checklist comprehensive
- [x] Performance testing strategy defined
- [x] Accessibility testing included
- [x] Security testing checklist provided
- [x] CI/CD workflow configured
- [x] Coverage goals defined (80%+)

---

**Documentation Suite Complete**: All 8 modules documented ✅
