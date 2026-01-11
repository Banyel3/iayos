# Module 6: Engagement Features Implementation

**Priority**: Medium (User Engagement)  
**Duration**: 1-2 weeks  
**Dependencies**: Module 1 (Jobs), Module 3 (Messaging), Module 5 (Profiles)  
**Files**: ~10 new/modified

---

## Overview

Implement engagement features that enhance user experience: notifications, saved jobs, advanced search, and settings matching React Native mobile app.

**RN Source Files**:

- `app/(tabs)/notifications.tsx` - Notification center
- `app/jobs/saved.tsx` - Saved jobs
- `app/jobs/search.tsx` - Advanced search
- `app/settings/notifications.tsx` - Notification preferences
- `app/settings/privacy.tsx` - Privacy settings
- `context/NotificationsContext.tsx` - Notifications state

---

## 6.1 Notification Center (CLIENT + WORKER SIDE)

### Files to Create

```
app/dashboard/notifications/page.tsx (NEW - 580 lines)
components/notifications/NotificationCard.tsx (NEW - 280 lines)
components/notifications/NotificationFilters.tsx (NEW - 180 lines)
lib/hooks/useNotifications.ts (NEW - 250 lines)
lib/context/NotificationsContext.tsx (NEW - 200 lines)
```

### Features

#### Notifications Page

```typescript
<NotificationsPage>
  <Header>
    <Title>Notifications</Title>
    <Actions>
      <MarkAllReadButton onClick={handleMarkAllRead} disabled={unreadCount === 0}>
        Mark All Read
      </MarkAllReadButton>
      <SettingsButton href="/dashboard/settings/notifications">
        <Icon>⚙️</Icon>
      </SettingsButton>
    </Actions>
  </Header>

  <FilterBar>
    <TabGroup value={activeTab} onChange={setActiveTab}>
      <Tab value="all">
        All ({totalCount})
      </Tab>
      <Tab value="unread">
        Unread ({unreadCount})
      </Tab>
      <Tab value="job">
        Jobs ({jobNotifications})
      </Tab>
      <Tab value="message">
        Messages ({messageNotifications})
      </Tab>
      <Tab value="payment">
        Payments ({paymentNotifications})
      </Tab>
      <Tab value="review">
        Reviews ({reviewNotifications})
      </Tab>
    </TabGroup>
  </FilterBar>

  <NotificationsList>
    {loading ? (
      <NotificationCardSkeleton count={5} />
    ) : notifications.length === 0 ? (
      <EmptyState>
        <Icon>🔔</Icon>
        <Title>No notifications</Title>
        <Text>You're all caught up!</Text>
      </EmptyState>
    ) : (
      notifications.map(notification => (
        <NotificationCard
          key={notification.id}
          notification={notification}
          onClick={() => handleNotificationClick(notification)}
        />
      ))
    )}
  </NotificationsList>

  {hasMore && (
    <LoadMoreButton onClick={loadMoreNotifications}>
      Load More
    </LoadMoreButton>
  )}
</NotificationsPage>
```

#### Notification Card Component

```typescript
<NotificationCard notification={notification} unread={!notification.isRead}>
  <NotificationContent onClick={() => handleClick(notification)}>
    <IconContainer type={notification.type}>
      {getNotificationIcon(notification.type)}
    </IconContainer>

    <Details>
      <Title unread={!notification.isRead}>
        {notification.title}
      </Title>

      <Message>{notification.message}</Message>

      <Meta>
        <Timestamp>{formatRelativeTime(notification.createdAt)}</Timestamp>
        {notification.type === 'JOB_APPLICATION' && (
          <Badge variant="blue">New Application</Badge>
        )}
        {notification.type === 'PAYMENT_RECEIVED' && (
          <Badge variant="green">Payment</Badge>
        )}
      </Meta>
    </Details>

    {!notification.isRead && <UnreadDot />}
  </NotificationContent>

  <Actions>
    <ActionButton onClick={(e) => {
      e.stopPropagation();
      handleMarkRead(notification.id);
    }}>
      <Icon>✓</Icon>
    </ActionButton>
    <ActionButton onClick={(e) => {
      e.stopPropagation();
      handleDelete(notification.id);
    }}>
      <Icon>🗑️</Icon>
    </ActionButton>
  </Actions>
</NotificationCard>
```

#### Notification Types & Icons

```typescript
const NOTIFICATION_TYPES = {
  JOB_APPLICATION: { icon: "📝", color: "blue" },
  JOB_ACCEPTED: { icon: "✓", color: "green" },
  JOB_REJECTED: { icon: "✗", color: "red" },
  JOB_STARTED: { icon: "▶", color: "blue" },
  JOB_COMPLETED: { icon: "✓", color: "green" },
  NEW_MESSAGE: { icon: "💬", color: "purple" },
  PAYMENT_RECEIVED: { icon: "💰", color: "green" },
  PAYMENT_SENT: { icon: "💸", color: "blue" },
  NEW_REVIEW: { icon: "⭐", color: "yellow" },
  KYC_APPROVED: { icon: "✓", color: "green" },
  KYC_REJECTED: { icon: "✗", color: "red" },
  WORKER_ASSIGNED: { icon: "👷", color: "blue" },
};

function getNotificationIcon(type: string) {
  return NOTIFICATION_TYPES[type]?.icon || "🔔";
}
```

#### Notification Click Handling

```typescript
function handleNotificationClick(notification: Notification) {
  // Mark as read
  markNotificationAsRead(notification.id);

  // Navigate based on type
  switch (notification.type) {
    case "JOB_APPLICATION":
      router.push(`/dashboard/jobs/${notification.relatedId}/applications`);
      break;
    case "JOB_ACCEPTED":
    case "JOB_REJECTED":
      router.push(`/dashboard/applications/${notification.relatedId}`);
      break;
    case "JOB_STARTED":
    case "JOB_COMPLETED":
      router.push(`/dashboard/jobs/${notification.relatedId}`);
      break;
    case "NEW_MESSAGE":
      router.push(`/dashboard/messages/${notification.relatedId}`);
      break;
    case "PAYMENT_RECEIVED":
    case "PAYMENT_SENT":
      router.push(`/dashboard/payments/${notification.relatedId}`);
      break;
    case "NEW_REVIEW":
      router.push(`/dashboard/reviews/${notification.relatedId}`);
      break;
    case "KYC_APPROVED":
    case "KYC_REJECTED":
      router.push("/dashboard/kyc/status");
      break;
    default:
    // No navigation
  }
}
```

#### Real-Time Notifications (WebSocket)

**Add to existing Socket.IO context**:

```typescript
// In lib/context/SocketContext.tsx
socket.on("new_notification", (notification: Notification) => {
  // Add to notifications list
  queryClient.setQueryData(["notifications"], (old: any) => ({
    ...old,
    notifications: [notification, ...(old?.notifications || [])],
    unread_count: (old?.unread_count || 0) + 1,
  }));

  // Show toast
  toast({
    title: notification.title,
    description: notification.message,
    duration: 5000,
    action: {
      label: "View",
      onClick: () => router.push(`/dashboard/notifications`),
    },
  });

  // Play sound (optional)
  playNotificationSound();
});
```

#### API Endpoints

**Get Notifications**:

```typescript
GET /api/mobile/notifications?
  type=JOB_APPLICATION&
  is_read=false&
  page=1&
  limit=20

Response:
{
  notifications: Array<{
    id: number;
    type: string;
    title: string;
    message: string;
    related_id?: number;
    is_read: boolean;
    created_at: string;
  }>;
  unread_count: number;
  total: number;
  page: number;
}
```

**Mark Notification as Read**:

```typescript
PUT / api / mobile / notifications / { id } / read;

Response: {
  success: true;
}
```

**Mark All as Read**:

```typescript
PUT / api / mobile / notifications / read - all;

Response: {
  success: true;
  count: number;
}
```

**Delete Notification**:

```typescript
DELETE / api / mobile / notifications / { id };

Response: {
  success: true;
}
```

---

## 6.2 Saved Jobs (WORKER SIDE)

### Files to Create

```
app/dashboard/jobs/saved/page.tsx (NEW - 420 lines)
components/jobs/SaveButton.tsx (NEW - 120 lines)
lib/hooks/useSaveJob.ts (NEW - 150 lines)
```

### Features

#### Saved Jobs Page

```typescript
<SavedJobsPage>
  <Header>
    <Title>Saved Jobs</Title>
    <Count>{savedJobs.length} jobs saved</Count>
  </Header>

  <FilterBar>
    <SearchInput
      placeholder="Search saved jobs..."
      value={searchQuery}
      onChange={setSearchQuery}
    />

    <SortDropdown
      value={sortBy}
      options={[
        { value: 'saved_at', label: 'Recently Saved' },
        { value: 'budget_high', label: 'Budget: High to Low' },
        { value: 'budget_low', label: 'Budget: Low to High' },
        { value: 'urgency', label: 'Most Urgent' },
      ]}
      onChange={setSortBy}
    />
  </FilterBar>

  <JobsList>
    {loading ? (
      <JobCardSkeleton count={4} />
    ) : filteredJobs.length === 0 ? (
      <EmptyState>
        <Icon>⭐</Icon>
        <Title>No saved jobs</Title>
        <Text>Jobs you save will appear here</Text>
        <BrowseButton href="/dashboard/jobs/browse">
          Browse Jobs
        </BrowseButton>
      </EmptyState>
    ) : (
      filteredJobs.map(job => (
        <JobCard
          key={job.id}
          job={job}
          actions={
            <CardActions>
              <UnsaveButton onClick={() => handleUnsave(job.id)}>
                <Icon>❤️</Icon> Saved
              </UnsaveButton>
              <ApplyButton href={`/dashboard/jobs/${job.id}`}>
                View & Apply
              </ApplyButton>
            </CardActions>
          }
        />
      ))
    )}
  </JobsList>
</SavedJobsPage>
```

#### Save Button Component (Reusable)

```typescript
<SaveButton jobId={jobId} isSaved={isSaved}>
  <IconButton
    onClick={handleToggleSave}
    disabled={isSaving}
    className={isSaved ? 'saved' : 'unsaved'}
  >
    <Icon>{isSaved ? '❤️' : '🤍'}</Icon>
  </IconButton>
</SaveButton>

// Usage in JobCard, JobDetail, etc.
```

#### useSaveJob Hook

```typescript
function useSaveJob(jobId: number) {
  const queryClient = useQueryClient();

  const { data: savedStatus } = useQuery({
    queryKey: ["job-saved-status", jobId],
    queryFn: () => apiRequest(ENDPOINTS.CHECK_JOB_SAVED(jobId)),
  });

  const saveMutation = useMutation({
    mutationFn: () => apiRequest(ENDPOINTS.SAVE_JOB(jobId), { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries(["job-saved-status", jobId]);
      queryClient.invalidateQueries(["saved-jobs"]);
      toast.success("Job saved!");
    },
  });

  const unsaveMutation = useMutation({
    mutationFn: () =>
      apiRequest(ENDPOINTS.UNSAVE_JOB(jobId), { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries(["job-saved-status", jobId]);
      queryClient.invalidateQueries(["saved-jobs"]);
      toast.success("Job removed from saved");
    },
  });

  return {
    isSaved: savedStatus?.is_saved || false,
    save: saveMutation.mutate,
    unsave: unsaveMutation.mutate,
    isSaving: saveMutation.isPending || unsaveMutation.isPending,
  };
}
```

#### API Endpoints

**Save Job**:

```typescript
POST / api / mobile / jobs / { job_id } / save;

Response: {
  success: true;
  message: "Job saved successfully";
}
```

**Unsave Job**:

```typescript
DELETE / api / mobile / jobs / { job_id } / save;

Response: {
  success: true;
  message: "Job removed from saved";
}
```

**Get Saved Jobs**:

```typescript
GET /api/mobile/jobs/saved?page=1&limit=20

Response:
{
  jobs: Array<JobObject>;
  total: number;
  page: number;
}
```

---

## 6.3 Advanced Search (CLIENT + WORKER SIDE)

### Files to Create

```
app/dashboard/search/page.tsx (NEW - 680 lines)
components/search/SearchFilters.tsx (NEW - 450 lines)
components/search/RecentSearches.tsx (NEW - 180 lines)
lib/hooks/useSearch.ts (NEW - 200 lines)
```

### Features

#### Advanced Search Page

```typescript
<SearchPage>
  <Header>
    <BackButton onClick={() => router.back()} />
    <Title>Search</Title>
  </Header>

  <SearchBar>
    <SearchInput
      placeholder={searchType === 'jobs' ? 'Search jobs...' : 'Search workers...'}
      value={searchQuery}
      onChange={setSearchQuery}
      onFocus={() => setShowRecentSearches(true)}
      autoFocus
    />
    <ClearButton onClick={() => setSearchQuery('')} visible={searchQuery.length > 0}>
      <Icon>✕</Icon>
    </ClearButton>
  </SearchBar>

  <SearchTypeTabs>
    <Tab active={searchType === 'jobs'} onClick={() => setSearchType('jobs')}>
      Jobs
    </Tab>
    <Tab active={searchType === 'workers'} onClick={() => setSearchType('workers')}>
      Workers
    </Tab>
    <Tab active={searchType === 'agencies'} onClick={() => setSearchType('agencies')}>
      Agencies
    </Tab>
  </SearchTypeTabs>

  {showRecentSearches && recentSearches.length > 0 && (
    <RecentSearches>
      <Header>
        <Title>Recent Searches</Title>
        <ClearAllButton onClick={handleClearRecentSearches}>
          Clear All
        </ClearAllButton>
      </Header>
      <List>
        {recentSearches.map((search, idx) => (
          <RecentSearchItem
            key={idx}
            onClick={() => {
              setSearchQuery(search);
              setShowRecentSearches(false);
              handleSearch(search);
            }}
          >
            <Icon>🕒</Icon>
            <Text>{search}</Text>
            <RemoveButton onClick={(e) => {
              e.stopPropagation();
              handleRemoveRecentSearch(search);
            }}>
              <Icon>✕</Icon>
            </RemoveButton>
          </RecentSearchItem>
        ))}
      </List>
    </RecentSearches>
  )}

  <FiltersButton onClick={() => setShowFilters(!showFilters)}>
    <Icon>⚙️</Icon>
    Filters
    {activeFiltersCount > 0 && (
      <FilterCount>{activeFiltersCount}</FilterCount>
    )}
  </FiltersButton>

  {showFilters && (
    <SearchFilters
      searchType={searchType}
      filters={filters}
      onChange={setFilters}
      onApply={() => {
        setShowFilters(false);
        handleSearch(searchQuery);
      }}
      onClear={handleClearFilters}
    />
  )}

  <ResultsSection>
    <ResultsHeader>
      <Count>
        {isSearching ? 'Searching...' : `${totalResults} results found`}
      </Count>
      <SortDropdown
        value={sortBy}
        options={getSortOptions(searchType)}
        onChange={setSortBy}
      />
    </ResultsHeader>

    <ResultsList>
      {isSearching ? (
        <ResultCardSkeleton count={5} />
      ) : results.length === 0 ? (
        <EmptyState>
          <Icon>🔍</Icon>
          <Title>No results found</Title>
          <Text>Try different keywords or filters</Text>
        </EmptyState>
      ) : (
        results.map(result => (
          <ResultCard
            key={result.id}
            result={result}
            type={searchType}
            onClick={() => handleResultClick(result)}
          />
        ))
      )}
    </ResultsList>

    {hasMore && (
      <LoadMoreButton onClick={loadMoreResults}>
        Load More
      </LoadMoreButton>
    )}
  </ResultsSection>
</SearchPage>
```

#### Search Filters Component

```typescript
<SearchFilters searchType={searchType}>
  {searchType === 'jobs' && (
    <>
      <FilterSection>
        <Label>Budget Range</Label>
        <RangeInputs>
          <Input
            type="number"
            placeholder="Min"
            value={filters.minBudget}
            onChange={(e) => updateFilter('minBudget', e.target.value)}
          />
          <Separator>to</Separator>
          <Input
            type="number"
            placeholder="Max"
            value={filters.maxBudget}
            onChange={(e) => updateFilter('maxBudget', e.target.value)}
          />
        </RangeInputs>
      </FilterSection>

      <FilterSection>
        <Label>Location</Label>
        <Input
          placeholder="Enter location..."
          value={filters.location}
          onChange={(e) => updateFilter('location', e.target.value)}
        />
      </FilterSection>

      <FilterSection>
        <Label>Categories</Label>
        <CategoryChips>
          {categories.map(cat => (
            <Chip
              key={cat.id}
              active={filters.categories.includes(cat.id)}
              onClick={() => toggleArrayFilter('categories', cat.id)}
            >
              {cat.name}
            </Chip>
          ))}
        </CategoryChips>
      </FilterSection>

      <FilterSection>
        <Label>Urgency</Label>
        <UrgencyChips>
          {['LOW', 'MEDIUM', 'HIGH'].map(level => (
            <Chip
              key={level}
              active={filters.urgency === level}
              onClick={() => updateFilter('urgency', level)}
            >
              {level}
            </Chip>
          ))}
        </UrgencyChips>
      </FilterSection>

      <FilterSection>
        <Label>Job Type</Label>
        <RadioGroup value={filters.jobType} onChange={(val) => updateFilter('jobType', val)}>
          <Radio value="all">All Jobs</Radio>
          <Radio value="LISTING">Public Listings</Radio>
          <Radio value="INVITE">Direct Invites</Radio>
        </RadioGroup>
      </FilterSection>
    </>
  )}

  {searchType === 'workers' && (
    <>
      <FilterSection>
        <Label>Hourly Rate Range</Label>
        <RangeSlider
          min={0}
          max={5000}
          step={50}
          value={[filters.minRate, filters.maxRate]}
          onChange={(values) => {
            updateFilter('minRate', values[0]);
            updateFilter('maxRate', values[1]);
          }}
        />
        <RangeValues>
          <Value>₱{filters.minRate}</Value>
          <Value>₱{filters.maxRate}</Value>
        </RangeValues>
      </FilterSection>

      <FilterSection>
        <Label>Minimum Rating</Label>
        <RatingFilter
          value={filters.minRating}
          onChange={(rating) => updateFilter('minRating', rating)}
        />
      </FilterSection>

      <FilterSection>
        <Label>Distance (km)</Label>
        <Slider
          min={1}
          max={50}
          value={filters.maxDistance}
          onChange={(val) => updateFilter('maxDistance', val)}
        />
        <Value>Within {filters.maxDistance} km</Value>
      </FilterSection>

      <FilterSection>
        <Label>Availability</Label>
        <CheckboxGroup>
          <Checkbox
            checked={filters.availableNow}
            onChange={(checked) => updateFilter('availableNow', checked)}
          >
            Available Now
          </Checkbox>
          <Checkbox
            checked={filters.verifiedOnly}
            onChange={(checked) => updateFilter('verifiedOnly', checked)}
          >
            Verified Only
          </Checkbox>
        </CheckboxGroup>
      </FilterSection>
    </>
  )}

  <FilterActions>
    <ClearButton onClick={onClear}>
      Clear All
    </ClearButton>
    <ApplyButton onClick={onApply}>
      Apply Filters ({activeFiltersCount})
    </ApplyButton>
  </FilterActions>
</SearchFilters>
```

#### Recent Searches Storage

```typescript
// Store in localStorage
const RECENT_SEARCHES_KEY = "iayos_recent_searches";
const MAX_RECENT_SEARCHES = 10;

function saveRecentSearch(query: string) {
  if (!query.trim()) return;

  const recent = getRecentSearches();
  const updated = [query, ...recent.filter((s) => s !== query)].slice(
    0,
    MAX_RECENT_SEARCHES
  );

  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
}

function getRecentSearches(): string[] {
  const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
  return stored ? JSON.parse(stored) : [];
}

function clearRecentSearches() {
  localStorage.removeItem(RECENT_SEARCHES_KEY);
}
```

#### API Endpoints

**Universal Search**:

```typescript
GET /api/mobile/search?
  query=plumber&
  type=jobs&
  categories=1,2&
  min_budget=500&
  max_budget=5000&
  location=Manila&
  urgency=HIGH&
  sort=relevance&
  page=1&
  limit=20

Response:
{
  results: Array<JobObject | WorkerObject | AgencyObject>;
  total: number;
  page: number;
  type: "jobs" | "workers" | "agencies";
}
```

---

## 6.4 Notification Preferences (CLIENT + WORKER SIDE)

### Files to Create

```
app/dashboard/settings/notifications/page.tsx (NEW - 480 lines)
components/settings/NotificationToggle.tsx (NEW - 120 lines)
```

### Features

#### Notification Settings Page

```typescript
<NotificationSettingsPage>
  <Header>
    <BackButton onClick={() => router.back()} />
    <Title>Notification Preferences</Title>
  </Header>

  <SettingsSection>
    <SectionTitle>Job Notifications</SectionTitle>

    <SettingRow>
      <Label>
        <Title>New Job Applications</Title>
        <Description>When someone applies to your job</Description>
      </Label>
      <Toggle
        checked={settings.jobApplications}
        onChange={(checked) => updateSetting('jobApplications', checked)}
      />
    </SettingRow>

    <SettingRow>
      <Label>
        <Title>Job Status Updates</Title>
        <Description>When job status changes</Description>
      </Label>
      <Toggle
        checked={settings.jobStatusUpdates}
        onChange={(checked) => updateSetting('jobStatusUpdates', checked)}
      />
    </SettingRow>

    <SettingRow>
      <Label>
        <Title>Application Status</Title>
        <Description>When your application is accepted/rejected</Description>
      </Label>
      <Toggle
        checked={settings.applicationStatus}
        onChange={(checked) => updateSetting('applicationStatus', checked)}
      />
    </SettingRow>
  </SettingsSection>

  <SettingsSection>
    <SectionTitle>Message Notifications</SectionTitle>

    <SettingRow>
      <Label>
        <Title>New Messages</Title>
        <Description>When you receive a new message</Description>
      </Label>
      <Toggle
        checked={settings.newMessages}
        onChange={(checked) => updateSetting('newMessages', checked)}
      />
    </SettingRow>
  </SettingsSection>

  <SettingsSection>
    <SectionTitle>Payment Notifications</SectionTitle>

    <SettingRow>
      <Label>
        <Title>Payment Received</Title>
        <Description>When you receive a payment</Description>
      </Label>
      <Toggle
        checked={settings.paymentReceived}
        onChange={(checked) => updateSetting('paymentReceived', checked)}
      />
    </SettingRow>

    <SettingRow>
      <Label>
        <Title>Payment Sent</Title>
        <Description>When your payment is processed</Description>
      </Label>
      <Toggle
        checked={settings.paymentSent}
        onChange={(checked) => updateSetting('paymentSent', checked)}
      />
    </SettingRow>
  </SettingsSection>

  <SettingsSection>
    <SectionTitle>Review Notifications</SectionTitle>

    <SettingRow>
      <Label>
        <Title>New Reviews</Title>
        <Description>When someone reviews you</Description>
      </Label>
      <Toggle
        checked={settings.newReviews}
        onChange={(checked) => updateSetting('newReviews', checked)}
      />
    </SettingRow>
  </SettingsSection>

  <SettingsSection>
    <SectionTitle>Email Notifications</SectionTitle>

    <SettingRow>
      <Label>
        <Title>Email Digest</Title>
        <Description>Receive daily summary of activity</Description>
      </Label>
      <Toggle
        checked={settings.emailDigest}
        onChange={(checked) => updateSetting('emailDigest', checked)}
      />
    </SettingRow>

    <SettingRow>
      <Label>
        <Title>Marketing Emails</Title>
        <Description>Promotions and updates</Description>
      </Label>
      <Toggle
        checked={settings.marketingEmails}
        onChange={(checked) => updateSetting('marketingEmails', checked)}
      />
    </SettingRow>
  </SettingsSection>

  <SaveButton onClick={handleSaveSettings} disabled={isSaving || !hasChanges}>
    {isSaving ? 'Saving...' : 'Save Preferences'}
  </SaveButton>
</NotificationSettingsPage>
```

#### API Endpoints

**Get Notification Preferences**:

```typescript
GET / api / mobile / settings / notifications;

Response: {
  job_applications: boolean;
  job_status_updates: boolean;
  application_status: boolean;
  new_messages: boolean;
  payment_received: boolean;
  payment_sent: boolean;
  new_reviews: boolean;
  email_digest: boolean;
  marketing_emails: boolean;
}
```

**Update Notification Preferences**:

```typescript
PUT /api/mobile/settings/notifications
{
  job_applications: true,
  new_messages: true,
  // ... other preferences
}

Response:
{
  success: true;
  message: "Preferences updated";
}
```

---

## Implementation Checklist

### Phase 1: Notification Center

- [ ] Create notifications page
- [ ] Build NotificationCard component
- [ ] Build NotificationFilters component
- [ ] Add notification types & icons
- [ ] Implement mark as read
- [ ] Implement mark all as read
- [ ] Implement delete notification
- [ ] Add click navigation handling
- [ ] Wire up WebSocket real-time notifications
- [ ] Add notification sound (optional)
- [ ] Wire up all notification APIs
- [ ] Test real-time updates

### Phase 2: Saved Jobs

- [ ] Create saved jobs page
- [ ] Build SaveButton component
- [ ] Create useSaveJob hook
- [ ] Add save/unsave functionality
- [ ] Add to job cards
- [ ] Add to job detail page
- [ ] Wire up saved jobs APIs
- [ ] Test save/unsave flow

### Phase 3: Advanced Search

- [ ] Create search page
- [ ] Build SearchFilters component
- [ ] Build RecentSearches component
- [ ] Add search input with debounce
- [ ] Add search type tabs
- [ ] Add recent searches storage
- [ ] Add filter logic
- [ ] Wire up search API
- [ ] Test all search scenarios

### Phase 4: Notification Settings

- [ ] Create notification settings page
- [ ] Build NotificationToggle component
- [ ] Add all preference options
- [ ] Wire up settings API
- [ ] Test preference updates

### Phase 5: Testing

- [ ] Test notification real-time updates
- [ ] Test notification navigation
- [ ] Test saved jobs functionality
- [ ] Test advanced search with filters
- [ ] Test notification preferences

---

## Testing Strategy

### Unit Tests

- [ ] Notification type mapping
- [ ] Search query building
- [ ] Filter logic
- [ ] Recent searches storage

### Integration Tests

- [ ] Fetch notifications
- [ ] Mark notifications as read
- [ ] Save/unsave jobs
- [ ] Search with filters
- [ ] Update notification preferences

### E2E Tests (Playwright)

```typescript
test("User receives and clicks on notification", async ({ page }) => {
  await loginAsClient(page);

  // Trigger notification (e.g., new job application)
  await triggerJobApplication();

  // Check notification badge
  await expect(page.locator(".notification-badge")).toHaveText("1");

  // Open notifications
  await page.click('a[href="/dashboard/notifications"]');

  // See new notification
  await expect(page.locator(".notification-card").first()).toBeVisible();

  // Click notification
  await page.click(".notification-card").first();

  // Navigate to related page
  await expect(page).toHaveURL(/\/dashboard\/jobs\/\d+\/applications/);
});

test("Worker saves and unsaves a job", async ({ page }) => {
  await loginAsWorker(page);
  await page.goto("/dashboard/jobs/browse");

  // Save job
  const firstJobCard = page.locator(".job-card").first();
  await firstJobCard.locator(".save-button").click();
  await expect(firstJobCard.locator(".save-button")).toHaveClass(/saved/);

  // Go to saved jobs
  await page.goto("/dashboard/jobs/saved");
  await expect(page.locator(".job-card")).toHaveCount(1);

  // Unsave job
  await page.locator(".unsave-button").first().click();
  await expect(page.locator(".job-card")).toHaveCount(0);
});

test("Client searches for workers with filters", async ({ page }) => {
  await loginAsClient(page);
  await page.goto("/dashboard/search");

  // Switch to workers tab
  await page.click("text=Workers");

  // Type search query
  await page.fill('input[placeholder*="Search"]', "electrician");
  await page.waitForTimeout(500); // debounce

  // Open filters
  await page.click("text=Filters");

  // Set min rating
  await page.click('.rating-filter [data-value="4"]');

  // Set max distance
  await page.fill('input[type="range"]', "10");

  // Apply filters
  await page.click("text=Apply Filters");

  // Check results
  await expect(page.locator(".worker-card")).toHaveCount.greaterThan(0);
  await expect(page.locator(".results-count")).toContainText("results found");
});
```

---

## Completion Criteria

Module 6 is complete when:

- [x] Notification center displays all notifications
- [x] Real-time notifications working via WebSocket
- [x] Notification click navigation functional
- [x] Mark as read/unread working
- [x] Saved jobs page functional
- [x] Save/unsave toggle working on all job displays
- [x] Advanced search with filters working
- [x] Recent searches stored and displayed
- [x] Search results accurate
- [x] Notification preferences saveable
- [x] 0 TypeScript errors
- [x] All E2E tests pass

---

**Next Module**: Module 7 - API Reference (Complete endpoint documentation)
