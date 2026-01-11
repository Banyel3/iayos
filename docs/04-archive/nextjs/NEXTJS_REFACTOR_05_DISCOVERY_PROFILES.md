# Module 5: Discovery & Profiles Implementation

**Priority**: Medium-High (User Discovery)  
**Duration**: 2-3 weeks  
**Dependencies**: Module 1 (Job Workflows), Module 4 (Trust & Safety)  
**Files**: ~15 new/modified

---

## Overview

Implement worker/agency discovery, profile management, and dual profile switching matching React Native mobile app. Enables clients to find and hire workers/agencies.

**RN Source Files**:

- `app/(tabs)/explore.tsx` - Worker/Agency browsing
- `app/workers/[id].tsx` - Worker profile detail
- `app/agencies/[id].tsx` - Agency profile detail
- `app/profile/index.tsx` - User profile (own)
- `app/profile/edit.tsx` - Profile editing
- `app/profile/avatar.tsx` - Avatar upload
- `app/profile/portfolio.tsx` - Portfolio management
- `app/profile/certifications.tsx` - Certifications

---

## 5.1 Worker Discovery (CLIENT SIDE)

### Files to Create

```
app/dashboard/workers/page.tsx (NEW - 580 lines)
app/dashboard/workers/[id]/page.tsx (NEW - 720 lines)
components/workers/WorkerCard.tsx (NEW - 250 lines)
components/workers/WorkerFilters.tsx (NEW - 380 lines)
components/workers/WorkerDetailTabs.tsx (NEW - 320 lines)
lib/hooks/useWorkers.ts (NEW - 200 lines)
```

### Features

#### Workers List Page

**Layout**:

```typescript
<WorkersPage>
  <Header>
    <Title>Find Workers</Title>
    <ViewToggle>
      <IconButton active={view === 'grid'} onClick={() => setView('grid')}>
        <Icon>⊞</Icon>
      </IconButton>
      <IconButton active={view === 'list'} onClick={() => setView('list')}>
        <Icon>☰</Icon>
      </IconButton>
    </ViewToggle>
  </Header>

  <SearchBar
    placeholder="Search workers by name, skills, or category..."
    value={searchQuery}
    onChange={setSearchQuery}
    onSearch={handleSearch}
  />

  <WorkerFilters
    categories={categories}
    filters={filters}
    onChange={setFilters}
  />

  <ResultsHeader>
    <Count>{totalWorkers} workers found</Count>
    <SortDropdown
      value={sortBy}
      options={[
        { value: 'rating', label: 'Highest Rated' },
        { value: 'experience', label: 'Most Experienced' },
        { value: 'distance', label: 'Nearest' },
        { value: 'rate_low', label: 'Lowest Rate' },
        { value: 'rate_high', label: 'Highest Rate' },
      ]}
      onChange={setSortBy}
    />
  </ResultsHeader>

  <WorkersList view={view}>
    {loading ? (
      <WorkerCardSkeleton count={8} />
    ) : workers.length === 0 ? (
      <EmptyState>
        <Icon>🔍</Icon>
        <Text>No workers found</Text>
        <SubText>Try adjusting your filters</SubText>
      </EmptyState>
    ) : (
      workers.map(worker => (
        <WorkerCard
          key={worker.id}
          worker={worker}
          view={view}
          onClick={() => router.push(`/dashboard/workers/${worker.id}`)}
        />
      ))
    )}
  </WorkersList>

  <Pagination
    currentPage={page}
    totalPages={totalPages}
    onPageChange={setPage}
  />
</WorkersPage>
```

#### Worker Card Component

```typescript
<WorkerCard worker={worker} view="grid">
  <CardHeader>
    <Avatar src={worker.avatar} size="lg" />
    {worker.isOnline && <OnlineBadge>● Online</OnlineBadge>}
  </CardHeader>

  <CardBody>
    <Name>
      {worker.name}
      {worker.kycVerified && <Icon>✓</Icon>}
    </Name>

    <Category>{worker.primaryCategory}</Category>

    <Rating>
      <RatingStars value={worker.rating} size="small" readonly />
      <RatingValue>{worker.rating.toFixed(1)}</RatingValue>
      <ReviewCount>({worker.totalReviews})</ReviewCount>
    </Rating>

    <Skills>
      {worker.skills.slice(0, 3).map(skill => (
        <SkillBadge key={skill}>{skill}</SkillBadge>
      ))}
      {worker.skills.length > 3 && (
        <MoreBadge>+{worker.skills.length - 3}</MoreBadge>
      )}
    </Skills>

    <Stats>
      <Stat>
        <Icon>✓</Icon>
        <Value>{worker.completedJobs}</Value>
        <Label>Jobs</Label>
      </Stat>
      <Stat>
        <Icon>💰</Icon>
        <Value>₱{formatNumber(worker.hourlyRate)}/hr</Value>
      </Stat>
      {worker.distance && (
        <Stat>
          <Icon>📍</Icon>
          <Value>{worker.distance.toFixed(1)} km</Value>
        </Stat>
      )}
    </Stats>

    <TrustBadges>
      {worker.rating >= 4.5 && worker.totalReviews >= 10 && (
        <Badge variant="gold">⭐ Top Rated</Badge>
      )}
      {worker.responseRate >= 90 && (
        <Badge variant="blue">⚡ Fast</Badge>
      )}
    </TrustBadges>
  </CardBody>

  <CardFooter>
    <ViewProfileButton>View Profile</ViewProfileButton>
    <HireNowButton onClick={(e) => {
      e.stopPropagation();
      handleHire(worker.id);
    }}>
      Hire Now
    </HireNowButton>
  </CardFooter>
</WorkerCard>
```

#### Worker Filters Component

```typescript
<WorkerFilters>
  <FilterSection>
    <Label>Categories</Label>
    <CategoryChips>
      {categories.map(cat => (
        <Chip
          key={cat.id}
          active={filters.categories.includes(cat.id)}
          onClick={() => toggleFilter('categories', cat.id)}
        >
          {cat.name}
        </Chip>
      ))}
    </CategoryChips>
  </FilterSection>

  <FilterSection>
    <Label>Hourly Rate</Label>
    <RangeSlider
      min={0}
      max={5000}
      step={50}
      value={[filters.minRate, filters.maxRate]}
      onChange={(values) => {
        setFilters(prev => ({
          ...prev,
          minRate: values[0],
          maxRate: values[1],
        }));
      }}
    />
    <RangeValues>
      <Value>₱{formatNumber(filters.minRate)}</Value>
      <Value>₱{formatNumber(filters.maxRate)}</Value>
    </RangeValues>
  </FilterSection>

  <FilterSection>
    <Label>Distance (km)</Label>
    <Slider
      min={1}
      max={50}
      step={1}
      value={filters.maxDistance}
      onChange={(value) => setFilters(prev => ({ ...prev, maxDistance: value }))}
    />
    <Value>Within {filters.maxDistance} km</Value>
  </FilterSection>

  <FilterSection>
    <Label>Minimum Rating</Label>
    <RatingFilter
      value={filters.minRating}
      onChange={(rating) => setFilters(prev => ({ ...prev, minRating: rating }))}
    />
  </FilterSection>

  <FilterSection>
    <Label>Availability</Label>
    <CheckboxGroup>
      <Checkbox
        checked={filters.availableNow}
        onChange={(checked) => setFilters(prev => ({ ...prev, availableNow: checked }))}
      >
        Available Now
      </Checkbox>
      <Checkbox
        checked={filters.verifiedOnly}
        onChange={(checked) => setFilters(prev => ({ ...prev, verifiedOnly: checked }))}
      >
        Verified Only
      </Checkbox>
    </CheckboxGroup>
  </FilterSection>

  <FilterActions>
    <ClearButton onClick={handleClearFilters}>
      Clear All
    </ClearButton>
    <ApplyButton onClick={handleApplyFilters}>
      Apply Filters
    </ApplyButton>
  </FilterActions>
</WorkerFilters>
```

#### API Endpoints

**Get Workers List**:

```typescript
GET /api/mobile/workers/list?
  search=plumber&
  categories=1,2&
  min_rate=200&
  max_rate=1000&
  max_distance=10&
  min_rating=4&
  available_now=true&
  verified_only=true&
  sort=rating&
  page=1&
  limit=20

Response:
{
  workers: Array<{
    id: number;
    name: string;
    avatar: string;
    primary_category: string;
    rating: number;
    total_reviews: number;
    completed_jobs: number;
    hourly_rate: number;
    skills: string[];
    kyc_verified: boolean;
    is_online: boolean;
    distance?: number;
    response_rate: number;
  }>;
  total: number;
  page: number;
  total_pages: number;
}
```

---

## 5.2 Worker Detail Page (CLIENT SIDE)

### Features

#### Worker Profile Detail

```typescript
<WorkerDetailPage workerId={workerId}>
  <ProfileHeader>
    <BackButton onClick={() => router.back()} />

    <ProfileHero>
      <Avatar src={worker.avatar} size="xl" />
      {worker.isOnline && <OnlineBadge>● Online</OnlineBadge>}

      <ProfileInfo>
        <Name>
          {worker.name}
          {worker.kycVerified && <VerifiedBadge>✓ Verified</VerifiedBadge>}
        </Name>

        <Category>{worker.primaryCategory}</Category>

        <Location>
          <Icon>📍</Icon>
          {worker.location}
          {worker.distance && ` (${worker.distance.toFixed(1)} km away)`}
        </Location>

        <Rating>
          <RatingStars value={worker.rating} size="large" readonly />
          <RatingValue>{worker.rating.toFixed(1)}</RatingValue>
          <ReviewCount>({worker.totalReviews} reviews)</ReviewCount>
        </Rating>

        <TrustBadges>
          {worker.badges.map(badge => (
            <Badge key={badge.type} variant={badge.variant}>
              {badge.icon} {badge.label}
            </Badge>
          ))}
        </TrustBadges>
      </ProfileInfo>

      <ProfileActions>
        <HireButton onClick={handleHireWorker}>
          Hire {worker.name}
        </HireButton>
        <MessageButton onClick={handleMessage}>
          Send Message
        </MessageButton>
        <MoreButton onClick={() => setShowActions(true)}>
          <Icon>⋮</Icon>
        </MoreButton>
      </ProfileActions>
    </ProfileHero>
  </ProfileHeader>

  <StatsBar>
    <Stat>
      <Icon>✓</Icon>
      <Value>{worker.completedJobs}</Value>
      <Label>Jobs Completed</Label>
    </Stat>
    <Stat>
      <Icon>💰</Icon>
      <Value>₱{formatNumber(worker.hourlyRate)}/hr</Value>
      <Label>Hourly Rate</Label>
    </Stat>
    <Stat>
      <Icon>⏱</Icon>
      <Value>{worker.responseTime}</Value>
      <Label>Response Time</Label>
    </Stat>
    <Stat>
      <Icon>📈</Icon>
      <Value>{worker.onTimeCompletion}%</Value>
      <Label>On-Time</Label>
    </Stat>
  </StatsBar>

  <TabNavigation>
    <Tab active={activeTab === 'about'} onClick={() => setActiveTab('about')}>
      About
    </Tab>
    <Tab active={activeTab === 'portfolio'} onClick={() => setActiveTab('portfolio')}>
      Portfolio ({worker.portfolioCount})
    </Tab>
    <Tab active={activeTab === 'reviews'} onClick={() => setActiveTab('reviews')}>
      Reviews ({worker.totalReviews})
    </Tab>
    <Tab active={activeTab === 'certifications'} onClick={() => setActiveTab('certifications')}>
      Certifications ({worker.certificationsCount})
    </Tab>
  </TabNavigation>

  <TabContent>
    {activeTab === 'about' && (
      <AboutTab>
        <Section>
          <SectionTitle>Bio</SectionTitle>
          <Bio>{worker.bio || 'No bio provided'}</Bio>
        </Section>

        <Section>
          <SectionTitle>Skills</SectionTitle>
          <SkillsList>
            {worker.skills.map(skill => (
              <SkillBadge key={skill}>{skill}</SkillBadge>
            ))}
          </SkillsList>
        </Section>

        <Section>
          <SectionTitle>Categories</SectionTitle>
          <CategoriesList>
            {worker.categories.map(cat => (
              <CategoryBadge key={cat.id}>{cat.name}</CategoryBadge>
            ))}
          </CategoriesList>
        </Section>

        <Section>
          <SectionTitle>Availability</SectionTitle>
          <AvailabilityCalendar workerId={worker.id} />
        </Section>
      </AboutTab>
    )}

    {activeTab === 'portfolio' && (
      <PortfolioTab>
        <PortfolioGrid>
          {worker.portfolio.map(item => (
            <PortfolioItem key={item.id}>
              <Image
                src={item.imageURL}
                alt={item.caption}
                onClick={() => openLightbox(item.imageURL)}
              />
              {item.caption && <Caption>{item.caption}</Caption>}
            </PortfolioItem>
          ))}
        </PortfolioGrid>
        {worker.portfolio.length === 0 && (
          <EmptyState>
            <Icon>🖼️</Icon>
            <Text>No portfolio items yet</Text>
          </EmptyState>
        )}
      </PortfolioTab>
    )}

    {activeTab === 'reviews' && (
      <ReviewsTab>
        <ReviewsList>
          {worker.reviews.map(review => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </ReviewsList>
        <LoadMoreButton onClick={loadMoreReviews}>
          Load More
        </LoadMoreButton>
      </ReviewsTab>
    )}

    {activeTab === 'certifications' && (
      <CertificationsTab>
        <CertificationsList>
          {worker.certifications.map(cert => (
            <CertificationCard key={cert.id}>
              <CertIcon>📜</CertIcon>
              <CertInfo>
                <CertName>{cert.certificationName}</CertName>
                <IssuedBy>{cert.issuedBy}</IssuedBy>
                {cert.expiryDate && (
                  <ExpiryDate>
                    Expires: {formatDate(cert.expiryDate)}
                    {isExpiringSoon(cert.expiryDate) && (
                      <Warning>⚠️ Expiring Soon</Warning>
                    )}
                  </ExpiryDate>
                )}
                {cert.verifiedByAdmin && (
                  <VerifiedBadge>✓ Verified</VerifiedBadge>
                )}
              </CertInfo>
              <ViewButton onClick={() => window.open(cert.documentURL)}>
                View
              </ViewButton>
            </CertificationCard>
          ))}
        </CertificationsList>
      </CertificationsTab>
    )}
  </TabContent>
</WorkerDetailPage>
```

#### Hire Worker Modal

**When "Hire Now" clicked**:

```typescript
<HireWorkerModal worker={worker}>
  <Header>
    <Title>Hire {worker.name}</Title>
    <CloseButton onClick={onClose} />
  </Header>

  <WorkerSummary>
    <Avatar src={worker.avatar} />
    <Name>{worker.name}</Name>
    <Category>{worker.primaryCategory}</Category>
    <Rate>₱{formatNumber(worker.hourlyRate)}/hr</Rate>
  </WorkerSummary>

  <Form>
    <JobSelection>
      <Label>Create New Job or Select Existing?</Label>
      <RadioGroup value={jobOption} onChange={setJobOption}>
        <Radio value="new">Create New Job</Radio>
        <Radio value="existing">Select from My Jobs</Radio>
      </RadioGroup>
    </JobSelection>

    {jobOption === 'new' && (
      <Redirect>
        <Text>You'll be redirected to create an INVITE job</Text>
        <RedirectButton href={`/dashboard/jobs/create/invite?workerId=${worker.id}`}>
          Continue to Job Creation
        </RedirectButton>
      </Redirect>
    )}

    {jobOption === 'existing' && (
      <JobDropdown>
        <Label>Select Job</Label>
        <Select
          value={selectedJobId}
          onChange={setSelectedJobId}
          options={myActiveJobs.map(job => ({
            value: job.id,
            label: `${job.title} (₱${formatNumber(job.budget)})`,
          }))}
        />
        <InviteButton
          onClick={handleInviteToJob}
          disabled={!selectedJobId}
        >
          Send Invite
        </InviteButton>
      </JobDropdown>
    )}
  </Form>
</HireWorkerModal>
```

#### API Endpoints

**Get Worker Detail**:

```typescript
GET /api/mobile/workers/{worker_id}

Response:
{
  id: number;
  name: string;
  avatar: string;
  bio: string;
  primary_category: string;
  categories: Array<{ id: number; name: string }>;
  rating: number;
  total_reviews: number;
  completed_jobs: number;
  hourly_rate: number;
  skills: string[];
  location: string;
  distance?: number;
  kyc_verified: boolean;
  is_online: boolean;
  response_time: string;
  response_rate: number;
  on_time_completion: number;
  badges: Array<{ type: string; label: string; variant: string; icon: string }>;
  portfolio: Array<{
    id: number;
    image_url: string;
    caption: string;
    order: number;
  }>;
  certifications: Array<{
    id: number;
    certification_name: string;
    issued_by: string;
    expiry_date?: string;
    document_url: string;
    verified_by_admin: boolean;
  }>;
  reviews: Array<ReviewObject>;
}
```

---

## 5.3 Agency Discovery (CLIENT SIDE)

### Files to Create

```
app/dashboard/agencies/page.tsx (NEW - 520 lines)
app/dashboard/agencies/[id]/page.tsx (NEW - 680 lines)
components/agencies/AgencyCard.tsx (NEW - 230 lines)
components/agencies/AgencyFilters.tsx (NEW - 300 lines)
```

### Features

**Similar structure to Workers, but with**:

- Agency-specific fields (businessName, employees count)
- Employee roster display
- Agency certifications (business permits, DTI)
- Agency reviews and ratings
- Hire agency flow (no employee selection yet, handled in Agency Module 1)

**API Endpoints**:

```typescript
GET / api / mobile / agencies / list;
GET / api / mobile / agencies / { agency_id };
```

---

## 5.4 User Profile Management (CLIENT + WORKER SIDE)

### Files to Create

```
app/dashboard/profile/page.tsx (NEW - 620 lines)
app/dashboard/profile/edit/page.tsx (NEW - 580 lines)
app/dashboard/profile/avatar/page.tsx (NEW - 380 lines)
app/dashboard/profile/portfolio/page.tsx (NEW - 520 lines)
app/dashboard/profile/certifications/page.tsx (NEW - 480 lines)
components/profile/ProfileCard.tsx (NEW - 280 lines)
components/profile/ProfileEditForm.tsx (NEW - 420 lines)
components/profile/AvatarUpload.tsx (NEW - 250 lines)
components/profile/PortfolioManager.tsx (NEW - 380 lines)
lib/hooks/useProfile.ts (NEW - 200 lines)
```

### Features

#### Profile View Page (Own Profile)

```typescript
<ProfilePage>
  <ProfileHeader>
    <CoverImage src={profile.coverImage} />

    <AvatarSection>
      <Avatar src={profile.avatar} size="xl" />
      <EditAvatarButton href="/dashboard/profile/avatar">
        <Icon>📷</Icon>
      </EditAvatarButton>
    </AvatarSection>

    <ProfileInfo>
      <Name>
        {profile.name}
        {profile.kycVerified && <VerifiedBadge>✓</VerifiedBadge>}
      </Name>

      <Role>{profile.profileType}</Role>

      {profile.profileType === 'WORKER' && (
        <>
          <Category>{profile.primaryCategory}</Category>
          <Rating>
            <RatingStars value={profile.rating} readonly />
            <RatingValue>{profile.rating.toFixed(1)}</RatingValue>
            <ReviewCount>({profile.totalReviews})</ReviewCount>
          </Rating>
        </>
      )}

      <Location>
        <Icon>📍</Icon>
        {profile.location}
      </Location>
    </ProfileInfo>

    <ProfileActions>
      <EditProfileButton href="/dashboard/profile/edit">
        Edit Profile
      </EditProfileButton>
      <SettingsButton href="/dashboard/settings">
        <Icon>⚙️</Icon>
      </SettingsButton>
    </ProfileActions>
  </ProfileHeader>

  {profile.profileType === 'WORKER' && (
    <WorkerStats>
      <Stat>
        <Value>{profile.completedJobs}</Value>
        <Label>Jobs Completed</Label>
      </Stat>
      <Stat>
        <Value>₱{formatNumber(profile.totalEarnings)}</Value>
        <Label>Total Earnings</Label>
      </Stat>
      <Stat>
        <Value>{profile.onTimeCompletion}%</Value>
        <Label>On-Time Rate</Label>
      </Stat>
      <Stat>
        <Value>{profile.responseRate}%</Value>
        <Label>Response Rate</Label>
      </Stat>
    </WorkerStats>
  )}

  <ProfileSections>
    <Section>
      <SectionHeader>
        <Title>About</Title>
        <EditButton href="/dashboard/profile/edit">Edit</EditButton>
      </SectionHeader>
      <Bio>{profile.bio || 'No bio yet. Tell others about yourself!'}</Bio>
    </Section>

    {profile.profileType === 'WORKER' && (
      <>
        <Section>
          <SectionHeader>
            <Title>Skills</Title>
            <EditButton href="/dashboard/profile/edit">Edit</EditButton>
          </SectionHeader>
          <SkillsList>
            {profile.skills.map(skill => (
              <SkillBadge key={skill}>{skill}</SkillBadge>
            ))}
            {profile.skills.length === 0 && (
              <EmptyText>Add your skills to attract more clients</EmptyText>
            )}
          </SkillsList>
        </Section>

        <Section>
          <SectionHeader>
            <Title>Portfolio</Title>
            <ManageButton href="/dashboard/profile/portfolio">
              Manage
            </ManageButton>
          </SectionHeader>
          <PortfolioGrid>
            {profile.portfolio.slice(0, 6).map(item => (
              <PortfolioThumb key={item.id}>
                <Image src={item.imageURL} />
              </PortfolioThumb>
            ))}
          </PortfolioGrid>
          {profile.portfolio.length === 0 && (
            <EmptyState>
              <Icon>🖼️</Icon>
              <Text>No portfolio items</Text>
              <AddButton href="/dashboard/profile/portfolio">
                Add Photos
              </AddButton>
            </EmptyState>
          )}
        </Section>

        <Section>
          <SectionHeader>
            <Title>Certifications</Title>
            <ManageButton href="/dashboard/profile/certifications">
              Manage
            </ManageButton>
          </SectionHeader>
          <CertificationsList>
            {profile.certifications.map(cert => (
              <CertificationBadge key={cert.id}>
                {cert.certificationName}
                {cert.verifiedByAdmin && <Icon>✓</Icon>}
              </CertificationBadge>
            ))}
          </CertificationsList>
          {profile.certifications.length === 0 && (
            <EmptyState>
              <Text>No certifications</Text>
              <AddButton href="/dashboard/profile/certifications">
                Add Certifications
              </AddButton>
            </EmptyState>
          )}
        </Section>
      </>
    )}

    <Section>
      <SectionHeader>
        <Title>Reviews</Title>
        <ViewAllButton onClick={() => router.push(`/dashboard/reviews/${profile.id}`)}>
          View All
        </ViewAllButton>
      </SectionHeader>
      <ReviewsList>
        {profile.recentReviews.slice(0, 3).map(review => (
          <ReviewCard key={review.id} review={review} compact />
        ))}
      </ReviewsList>
      {profile.recentReviews.length === 0 && (
        <EmptyText>No reviews yet</EmptyText>
      )}
    </Section>
  </ProfileSections>
</ProfilePage>
```

#### Edit Profile Page

```typescript
<EditProfilePage>
  <Header>
    <BackButton onClick={() => router.back()} />
    <Title>Edit Profile</Title>
    <SaveButton onClick={handleSave} disabled={!hasChanges || isSaving}>
      {isSaving ? 'Saving...' : 'Save'}
    </SaveButton>
  </Header>

  <Form>
    <Section>
      <Label>Name *</Label>
      <Input
        value={formData.name}
        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
        placeholder="Your full name"
        maxLength={100}
      />
    </Section>

    <Section>
      <Label>Bio</Label>
      <Textarea
        value={formData.bio}
        onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
        placeholder="Tell others about yourself..."
        minLength={50}
        maxLength={500}
        rows={6}
      />
      <CharCount>{formData.bio.length} / 500</CharCount>
    </Section>

    <Section>
      <Label>Phone Number *</Label>
      <Input
        type="tel"
        value={formData.phone}
        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
        placeholder="+63 XXX XXX XXXX"
      />
    </Section>

    <Section>
      <Label>Location *</Label>
      <LocationAutocomplete
        value={formData.location}
        onChange={(location) => setFormData(prev => ({ ...prev, location }))}
      />
    </Section>

    {profileType === 'WORKER' && (
      <>
        <Section>
          <Label>Primary Category *</Label>
          <Select
            value={formData.primaryCategoryId}
            onChange={(id) => setFormData(prev => ({ ...prev, primaryCategoryId: id }))}
            options={categories.map(cat => ({ value: cat.id, label: cat.name }))}
          />
        </Section>

        <Section>
          <Label>Hourly Rate (₱) *</Label>
          <Input
            type="number"
            value={formData.hourlyRate}
            onChange={(e) => setFormData(prev => ({ ...prev, hourlyRate: Number(e.target.value) }))}
            min={0}
            max={10000}
            step={50}
          />
        </Section>

        <Section>
          <Label>Skills (comma-separated)</Label>
          <Input
            value={formData.skills}
            onChange={(e) => setFormData(prev => ({ ...prev, skills: e.target.value }))}
            placeholder="e.g., Plumbing, Welding, Carpentry"
          />
          <HelpText>Separate skills with commas</HelpText>
        </Section>
      </>
    )}
  </Form>

  <ChangesSummary visible={hasChanges}>
    <Title>Unsaved Changes</Title>
    <ChangesList>
      {Object.keys(changes).map(key => (
        <Change key={key}>
          <Field>{formatFieldName(key)}</Field>
          <OldValue>{formatValue(originalData[key])}</OldValue>
          <Arrow>→</Arrow>
          <NewValue>{formatValue(formData[key])}</NewValue>
        </Change>
      ))}
    </ChangesList>
  </ChangesSummary>
</EditProfilePage>
```

#### Avatar Upload Page

```typescript
<AvatarUploadPage>
  <Header>
    <BackButton onClick={() => router.back()} />
    <Title>Change Avatar</Title>
  </Header>

  <CurrentAvatar>
    <Label>Current Avatar</Label>
    <Avatar src={currentAvatar} size="xl" />
  </CurrentAvatar>

  <UploadSection>
    <Label>Upload New Avatar</Label>
    {!selectedImage ? (
      <UploadZone onClick={handleSelectImage}>
        <Icon>📷</Icon>
        <Text>Click to select image</Text>
        <Requirements>
          • Square image recommended<br />
          • Max 5MB, JPG/PNG only<br />
          • Min 400x400 pixels
        </Requirements>
      </UploadZone>
    ) : (
      <ImagePreview>
        <CropArea>
          <Cropper
            image={selectedImage.url}
            crop={crop}
            zoom={zoom}
            aspect={1}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </CropArea>
        <ZoomSlider
          value={zoom}
          min={1}
          max={3}
          step={0.1}
          onChange={setZoom}
        />
        <Actions>
          <CancelButton onClick={() => setSelectedImage(null)}>
            Cancel
          </CancelButton>
          <UploadButton onClick={handleUploadAvatar} disabled={isUploading}>
            {isUploading ? 'Uploading...' : 'Upload'}
          </UploadButton>
        </Actions>
      </ImagePreview>
    )}
  </UploadSection>

  {uploadProgress > 0 && uploadProgress < 100 && (
    <UploadProgress>
      <ProgressBar value={uploadProgress} />
      <ProgressText>{uploadProgress}%</ProgressText>
    </UploadProgress>
  )}
</AvatarUploadPage>
```

#### API Endpoints

**Update Profile**:

```typescript
PUT /api/mobile/profile/update
{
  name?: string;
  bio?: string;
  phone?: string;
  location?: string;
  primary_category_id?: number;
  hourly_rate?: number;
  skills?: string; // comma-separated
}

Response:
{
  success: true;
  message: "Profile updated successfully";
}
```

**Upload Avatar**:

```typescript
POST /api/mobile/profile/avatar
FormData {
  avatar: File;
}

Response:
{
  success: true;
  avatar_url: string;
}
```

---

## 5.5 Dual Profile Switching (CLIENT + WORKER ACCOUNTS)

### Files to Modify

```
app/layout.tsx (modify navbar)
components/layout/ProfileSwitcher.tsx (NEW - 180 lines)
```

### Features

#### Profile Switcher Component

**In navbar/sidebar**:

```typescript
<ProfileSwitcher>
  <CurrentProfile onClick={toggleDropdown}>
    <Avatar src={currentProfile.avatar} size="sm" />
    <Name>{currentProfile.name}</Name>
    <Role>{currentProfile.profileType}</Role>
    <Icon>▼</Icon>
  </CurrentProfile>

  {showDropdown && (
    <DropdownMenu>
      {profiles.map(profile => (
        <ProfileOption
          key={profile.id}
          active={profile.id === currentProfile.id}
          onClick={() => handleSwitchProfile(profile.id)}
        >
          <Avatar src={profile.avatar} size="sm" />
          <Info>
            <Name>{profile.name}</Name>
            <Role>{profile.profileType}</Role>
          </Info>
          {profile.id === currentProfile.id && <Icon>✓</Icon>}
        </ProfileOption>
      ))}

      <Divider />

      <CreateProfileButton href="/dashboard/profile/create">
        <Icon>+</Icon>
        Create New Profile
      </CreateProfileButton>
    </DropdownMenu>
  )}
</ProfileSwitcher>
```

#### Switch Profile Flow

**Process**:

1. User clicks on different profile in dropdown
2. API call to switch profile (updates JWT token with new profile_type)
3. Frontend stores new token
4. Fetches new profile data
5. Updates UI instantly (no logout required)
6. Toast: "Switched to [Profile Type]"

**API Endpoint**:

```typescript
POST /api/mobile/profile/switch-profile
{
  profile_type: "WORKER" | "CLIENT";
}

Response:
{
  success: true;
  token: string; // New JWT with updated profile_type
  profile: ProfileObject;
}
```

---

## Implementation Checklist

### Phase 1: Worker Discovery

- [ ] Create workers list page
- [ ] Build WorkerCard component
- [ ] Build WorkerFilters component
- [ ] Add search functionality
- [ ] Add sorting options
- [ ] Add pagination
- [ ] Create worker detail page
- [ ] Build worker detail tabs
- [ ] Add hire worker modal
- [ ] Wire up all worker APIs
- [ ] Test filtering and search

### Phase 2: Agency Discovery

- [ ] Create agencies list page
- [ ] Build AgencyCard component
- [ ] Build AgencyFilters component
- [ ] Create agency detail page
- [ ] Add employee roster display
- [ ] Add hire agency modal
- [ ] Wire up agency APIs
- [ ] Test agency browsing

### Phase 3: Profile Management

- [ ] Create profile view page
- [ ] Create edit profile page
- [ ] Build ProfileEditForm component
- [ ] Add validation
- [ ] Create avatar upload page
- [ ] Implement image cropping
- [ ] Create portfolio management page
- [ ] Create certifications page
- [ ] Wire up profile APIs
- [ ] Test all CRUD operations

### Phase 4: Dual Profile

- [ ] Create ProfileSwitcher component
- [ ] Add to navbar/sidebar
- [ ] Implement switch profile logic
- [ ] Update JWT token handling
- [ ] Add profile creation flow
- [ ] Test instant switching
- [ ] Test token refresh

### Phase 5: Testing

- [ ] Test worker search with filters
- [ ] Test hire worker flow
- [ ] Test profile editing
- [ ] Test avatar upload
- [ ] Test profile switching
- [ ] Test role-based UI rendering

---

## Testing Strategy

### Unit Tests

- [ ] Filter logic
- [ ] Search query building
- [ ] Profile validation
- [ ] Image cropping logic

### Integration Tests

- [ ] Worker list fetching
- [ ] Worker detail fetching
- [ ] Profile update
- [ ] Avatar upload
- [ ] Profile switching

### E2E Tests (Playwright)

```typescript
test("Client searches for worker and views profile", async ({ page }) => {
  await loginAsClient(page);
  await page.goto("/dashboard/workers");

  // Search for plumber
  await page.fill('input[placeholder*="Search"]', "plumber");
  await page.click('button:has-text("Search")');

  // Apply filters
  await page.click("text=Categories");
  await page.click("text=Plumbing");
  await page.click('button:has-text("Apply Filters")');

  // View first worker
  await page.click(".worker-card:first-child");
  await expect(page).toHaveURL(/\/dashboard\/workers\/\d+/);

  // Check profile sections
  await expect(page.locator("text=About")).toBeVisible();
  await page.click("text=Portfolio");
  await expect(page.locator(".portfolio-grid")).toBeVisible();
});

test("Worker switches profile to client", async ({ page }) => {
  await loginAsDualProfile(page);

  // Current profile is WORKER
  await expect(page.locator("text=WORKER")).toBeVisible();

  // Open profile switcher
  await page.click(".profile-switcher");

  // Switch to CLIENT
  await page.click("text=CLIENT");

  // Verify switch
  await expect(page.locator("text=CLIENT")).toBeVisible();
  await expect(page.locator("text=Switched to CLIENT")).toBeVisible();

  // Verify CLIENT dashboard visible
  await expect(page.locator("text=Find Workers")).toBeVisible();
});
```

---

## Completion Criteria

Module 5 is complete when:

- [x] Worker discovery with filters working
- [x] Worker detail page functional
- [x] Agency discovery working
- [x] Profile view page displays correctly
- [x] Profile editing functional
- [x] Avatar upload with cropping works
- [x] Portfolio management working
- [x] Certifications display working
- [x] Dual profile switching instant
- [x] All validation working
- [x] 0 TypeScript errors
- [x] All E2E tests pass
- [x] Role-based UI rendering correct

---

**Next Module**: Module 6 - Engagement Features
