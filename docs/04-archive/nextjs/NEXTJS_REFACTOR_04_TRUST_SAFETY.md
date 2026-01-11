# Module 4: Trust & Safety Implementation

**Priority**: High (User Protection)  
**Duration**: 2-3 weeks  
**Dependencies**: Module 1 (Job Workflows)  
**Files**: ~10 new/modified

---

## Overview

Implement KYC verification, review system, and trust & safety features matching React Native mobile app. Ensures platform integrity and user trust.

**RN Source Files**:

- `app/kyc/upload.tsx` - Document upload
- `app/kyc/status.tsx` - Verification status
- `app/reviews/submit/[jobId].tsx` - Submit review
- `app/reviews/[userId].tsx` - View reviews

---

## 4.1 KYC Document Upload

### Files to Create

```
app/dashboard/kyc/upload/page.tsx (NEW - 550 lines)
app/dashboard/kyc/status/page.tsx (NEW - 380 lines)
components/kyc/DocumentUploadZone.tsx (NEW - 280 lines)
components/kyc/DocumentPreview.tsx (NEW - 150 lines)
components/kyc/KYCStatusCard.tsx (NEW - 200 lines)
lib/hooks/useKYC.ts (NEW - 180 lines)
```

### Features (CLIENT + WORKER SIDE)

#### KYC Upload Page

**Required Documents**:

```typescript
const REQUIRED_DOCUMENTS = {
  WORKER: [
    { id: "valid_id", label: "Valid ID", required: true },
    { id: "selfie", label: "Selfie with ID", required: true },
    { id: "proof_of_address", label: "Proof of Address", required: false },
  ],
  CLIENT: [
    { id: "valid_id", label: "Valid ID", required: true },
    { id: "selfie", label: "Selfie with ID", required: true },
  ],
  AGENCY: [
    { id: "business_permit", label: "Business Permit", required: true },
    { id: "dti_registration", label: "DTI Registration", required: true },
    { id: "valid_id", label: "Owner's Valid ID", required: true },
    { id: "selfie", label: "Owner's Selfie with ID", required: true },
  ],
};
```

**Page Layout**:

```typescript
<KYCUploadPage>
  <Header>
    <Title>KYC Verification</Title>
    <Subtitle>Upload your documents to verify your identity</Subtitle>
  </Header>

  <ProgressIndicator>
    <Step active={currentStep >= 1}>
      <Number>1</Number>
      <Label>Valid ID</Label>
    </Step>
    <Step active={currentStep >= 2}>
      <Number>2</Number>
      <Label>Selfie with ID</Label>
    </Step>
    {userType === 'WORKER' && (
      <Step active={currentStep >= 3}>
        <Number>3</Number>
        <Label>Proof of Address</Label>
      </Step>
    )}
    <Step active={currentStep >= 4}>
      <Number>4</Number>
      <Label>Review & Submit</Label>
    </Step>
  </ProgressIndicator>

  <DocumentUploadSection>
    {currentStep === 1 && (
      <ValidIDUpload
        onUpload={handleValidIDUpload}
        existingFile={documents.valid_id}
      />
    )}

    {currentStep === 2 && (
      <SelfieUpload
        onUpload={handleSelfieUpload}
        existingFile={documents.selfie}
      />
    )}

    {currentStep === 3 && userType === 'WORKER' && (
      <ProofOfAddressUpload
        onUpload={handleProofUpload}
        existingFile={documents.proof_of_address}
      />
    )}

    {currentStep === 4 && (
      <ReviewSubmit
        documents={documents}
        onSubmit={handleSubmitKYC}
      />
    )}
  </DocumentUploadSection>

  <Actions>
    {currentStep > 1 && (
      <BackButton onClick={() => setCurrentStep(prev => prev - 1)}>
        Back
      </BackButton>
    )}

    {currentStep < 4 ? (
      <NextButton
        onClick={() => setCurrentStep(prev => prev + 1)}
        disabled={!currentDocumentUploaded}
      >
        Next
      </NextButton>
    ) : (
      <SubmitButton
        onClick={handleSubmitKYC}
        disabled={!allRequiredDocsUploaded || isSubmitting}
      >
        {isSubmitting ? 'Submitting...' : 'Submit for Verification'}
      </SubmitButton>
    )}
  </Actions>
</KYCUploadPage>
```

#### Document Upload Zone Component

```typescript
<DocumentUploadZone documentType={documentType}>
  <Instructions>
    <Title>Upload {documentLabel}</Title>
    <Requirements>
      <Item>✓ Clear and readable</Item>
      <Item>✓ All corners visible</Item>
      <Item>✓ No glare or blur</Item>
      <Item>✓ Max 5MB, JPG/PNG only</Item>
    </Requirements>
  </Instructions>

  {!uploadedFile ? (
    <UploadArea
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <Icon>📤</Icon>
      <Text>Drag & drop or click to select</Text>
      <Button onClick={handleFileSelect}>
        Choose File
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png"
        onChange={handleFileChange}
        hidden
      />
    </UploadArea>
  ) : (
    <DocumentPreview>
      <Image src={uploadedFile.preview} />
      <FileInfo>
        <FileName>{uploadedFile.name}</FileName>
        <FileSize>{formatFileSize(uploadedFile.size)}</FileSize>
      </FileInfo>
      <Actions>
        <RemoveButton onClick={handleRemove}>
          Remove
        </RemoveButton>
        <ReplaceButton onClick={handleFileSelect}>
          Replace
        </ReplaceButton>
      </Actions>
    </DocumentPreview>
  )}

  {uploadProgress > 0 && uploadProgress < 100 && (
    <UploadProgress>
      <ProgressBar value={uploadProgress} />
      <ProgressText>{uploadProgress}%</ProgressText>
    </UploadProgress>
  )}

  {error && (
    <ErrorMessage>{error}</ErrorMessage>
  )}
</DocumentUploadZone>
```

#### Validation

**Client-side Validation**:

```typescript
const validateDocument = (file: File, documentType: string) => {
  // File size
  if (file.size > 5 * 1024 * 1024) {
    return { error: "File size must be less than 5MB" };
  }

  // File type
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
  if (!allowedTypes.includes(file.type)) {
    return { error: "Only JPG and PNG files are allowed" };
  }

  // Image dimensions (optional, requires loading image)
  const img = new Image();
  img.src = URL.createObjectURL(file);
  await new Promise((resolve) => (img.onload = resolve));

  if (img.width < 800 || img.height < 600) {
    return { error: "Image resolution too low. Minimum 800x600 pixels." };
  }

  return { valid: true };
};
```

#### API Endpoints

**Upload KYC Document**:

```typescript
POST /api/mobile/kyc/upload
FormData {
  document_type: "valid_id" | "selfie" | "proof_of_address" | "business_permit" | "dti_registration";
  file: File;
}

Response:
{
  success: true;
  file_id: number;
  file_url: string;
  message: "Document uploaded successfully";
}
```

**Submit KYC for Verification**:

```typescript
POST / api / mobile / kyc / submit;

Response: {
  success: true;
  kyc_id: number;
  status: "PENDING_VERIFICATION";
  message: "KYC submitted. Verification usually takes 24-48 hours.";
}
```

---

## 4.2 KYC Status Tracking

### Features (CLIENT + WORKER SIDE)

#### Status Page Layout

```typescript
<KYCStatusPage>
  <Header>
    <Title>KYC Verification Status</Title>
    <RefreshButton onClick={refetch}>
      <Icon>🔄</Icon>
    </RefreshButton>
  </Header>

  <KYCStatusCard status={kycStatus}>
    <StatusIcon status={kycStatus}>
      {kycStatus === 'NOT_SUBMITTED' && <Icon>📋</Icon>}
      {kycStatus === 'PENDING_VERIFICATION' && <Icon>⏳</Icon>}
      {kycStatus === 'APPROVED' && <Icon>✅</Icon>}
      {kycStatus === 'REJECTED' && <Icon>❌</Icon>}
    </StatusIcon>

    <StatusMessage>
      {kycStatus === 'NOT_SUBMITTED' && (
        <>
          <Title>Verification Required</Title>
          <Text>Complete KYC to unlock all features</Text>
          <UploadButton href="/dashboard/kyc/upload">
            Upload Documents
          </UploadButton>
        </>
      )}

      {kycStatus === 'PENDING_VERIFICATION' && (
        <>
          <Title>Under Review</Title>
          <Text>Your documents are being verified</Text>
          <SubText>Usually takes 24-48 hours</SubText>
          <SubmittedDate>{formatRelativeTime(kyc.submittedAt)}</SubmittedDate>
        </>
      )}

      {kycStatus === 'APPROVED' && (
        <>
          <Title variant="success">Verified ✓</Title>
          <Text>Your account is fully verified</Text>
          <ApprovedDate>{formatDate(kyc.approvedAt)}</ApprovedDate>
          <Badge variant="success">VERIFIED</Badge>
        </>
      )}

      {kycStatus === 'REJECTED' && (
        <>
          <Title variant="danger">Verification Failed</Title>
          <Text>Your KYC was rejected</Text>
          <ReasonCard>
            <ReasonTitle>Reason:</ReasonTitle>
            <ReasonText>{kyc.rejectionReason}</ReasonText>
          </ReasonCard>
          <ReuploadButton href="/dashboard/kyc/upload">
            Upload New Documents
          </ReuploadButton>
        </>
      )}
    </StatusMessage>
  </KYCStatusCard>

  {kyc.status !== 'NOT_SUBMITTED' && (
    <DocumentsList>
      <Title>Uploaded Documents</Title>
      {kyc.documents.map(doc => (
        <DocumentCard key={doc.id}>
          <Thumbnail src={doc.fileURL} />
          <Info>
            <Label>{doc.documentType}</Label>
            <Status badge>{doc.status}</Status>
          </Info>
          <ViewButton onClick={() => openLightbox(doc.fileURL)}>
            View
          </ViewButton>
        </DocumentCard>
      ))}
    </DocumentsList>
  )}

  <BenefitsList>
    <Title>Benefits of Verification</Title>
    <Benefit>
      <Icon>✓</Icon>
      <Text>Apply to jobs without restrictions</Text>
    </Benefit>
    <Benefit>
      <Icon>✓</Icon>
      <Text>Higher trust from clients</Text>
    </Benefit>
    <Benefit>
      <Icon>✓</Icon>
      <Text>Eligible for premium features</Text>
    </Benefit>
    <Benefit>
      <Icon>✓</Icon>
      <Text>Faster payment withdrawals</Text>
    </Benefit>
  </BenefitsList>
</KYCStatusPage>
```

#### KYC Badge Display

**Show verification badge on profiles**:

```typescript
<ProfileHeader>
  <Avatar src={user.avatar} />
  <Name>
    {user.name}
    {user.kycVerified && (
      <VerifiedBadge>
        <Icon>✓</Icon>
        Verified
      </VerifiedBadge>
    )}
  </Name>
  <Rating value={user.rating} />
</ProfileHeader>
```

#### API Endpoints

**Get KYC Status**:

```typescript
GET /api/mobile/kyc/status

Response:
{
  status: "NOT_SUBMITTED" | "PENDING_VERIFICATION" | "APPROVED" | "REJECTED";
  submitted_at?: string;
  approved_at?: string;
  rejected_at?: string;
  rejection_reason?: string;
  documents: Array<{
    id: number;
    document_type: string;
    file_url: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
    uploaded_at: string;
  }>;
}
```

---

## 4.3 Review System (CLIENT + WORKER SIDE)

### Files to Create

```
app/dashboard/reviews/submit/[jobId]/page.tsx (NEW - 480 lines)
app/dashboard/reviews/[userId]/page.tsx (NEW - 420 lines)
components/reviews/ReviewForm.tsx (NEW - 350 lines)
components/reviews/ReviewCard.tsx (NEW - 200 lines)
components/reviews/RatingStars.tsx (NEW - 120 lines)
lib/hooks/useReviews.ts (NEW - 180 lines)
```

### Features

#### Submit Review Page

**When Triggered**:

- Job status = COMPLETED
- User has NOT yet reviewed the other party
- Both parties can review each other

**Page Layout**:

```typescript
<ReviewSubmitPage jobId={jobId}>
  <Header>
    <Title>Leave a Review</Title>
    <JobInfo>
      <JobTitle>{job.title}</JobTitle>
      <CompletedDate>{formatDate(job.completedAt)}</CompletedDate>
    </JobInfo>
  </Header>

  <ReviewForm>
    <RevieweeInfo>
      <Avatar src={reviewee.avatar} />
      <Name>{reviewee.name}</Name>
      <Role>{reviewee.role}</Role>
    </RevieweeInfo>

    <RatingSection>
      <Label>Overall Rating *</Label>
      <RatingStars
        value={rating}
        onChange={setRating}
        size="large"
      />
      <RequiredText>{rating === 0 && 'Please select a rating'}</RequiredText>
    </RatingSection>

    <RatingCategoriesSection>
      <Title>Rate by Category</Title>

      {userRole === 'CLIENT' && (
        <>
          <CategoryRating>
            <Label>Quality of Work</Label>
            <RatingStars
              value={ratings.quality}
              onChange={v => setRatings(prev => ({ ...prev, quality: v }))}
            />
          </CategoryRating>

          <CategoryRating>
            <Label>Professionalism</Label>
            <RatingStars
              value={ratings.professionalism}
              onChange={v => setRatings(prev => ({ ...prev, professionalism: v }))}
            />
          </CategoryRating>

          <CategoryRating>
            <Label>Communication</Label>
            <RatingStars
              value={ratings.communication}
              onChange={v => setRatings(prev => ({ ...prev, communication: v }))}
            />
          </CategoryRating>

          <CategoryRating>
            <Label>Timeliness</Label>
            <RatingStars
              value={ratings.timeliness}
              onChange={v => setRatings(prev => ({ ...prev, timeliness: v }))}
            />
          </CategoryRating>
        </>
      )}

      {userRole === 'WORKER' && (
        <>
          <CategoryRating>
            <Label>Payment Promptness</Label>
            <RatingStars
              value={ratings.payment}
              onChange={v => setRatings(prev => ({ ...prev, payment: v }))}
            />
          </CategoryRating>

          <CategoryRating>
            <Label>Communication</Label>
            <RatingStars
              value={ratings.communication}
              onChange={v => setRatings(prev => ({ ...prev, communication: v }))}
            />
          </CategoryRating>

          <CategoryRating>
            <Label>Clarity of Requirements</Label>
            <RatingStars
              value={ratings.clarity}
              onChange={v => setRatings(prev => ({ ...prev, clarity: v }))}
            />
          </CategoryRating>
        </>
      )}
    </RatingCategoriesSection>

    <CommentSection>
      <Label>Your Review *</Label>
      <Textarea
        value={comment}
        onChange={e => setComment(e.target.value)}
        placeholder="Share your experience working with this person..."
        minLength={20}
        maxLength={500}
        rows={6}
      />
      <CharCount>
        {comment.length} / 500 characters
        {comment.length < 20 && <Error> (minimum 20)</Error>}
      </CharCount>
    </CommentSection>

    <RecommendSection>
      <Label>Would you recommend this {reviewee.role.toLowerCase()}?</Label>
      <RadioGroup value={recommend} onChange={setRecommend}>
        <Radio value="yes">
          <Icon>👍</Icon> Yes, definitely
        </Radio>
        <Radio value="maybe">
          <Icon>🤔</Icon> Maybe
        </Radio>
        <Radio value="no">
          <Icon>👎</Icon> No
        </Radio>
      </RadioGroup>
    </RecommendSection>

    <SubmitButton
      onClick={handleSubmitReview}
      disabled={!isValid || isSubmitting}
    >
      {isSubmitting ? 'Submitting...' : 'Submit Review'}
    </SubmitButton>
  </ReviewForm>
</ReviewSubmitPage>
```

#### Validation

```typescript
const validateReview = (data: ReviewData) => {
  if (data.rating === 0) {
    return { error: "Please select a rating" };
  }

  if (data.comment.length < 20) {
    return { error: "Review must be at least 20 characters" };
  }

  if (data.comment.length > 500) {
    return { error: "Review must not exceed 500 characters" };
  }

  if (!data.recommend) {
    return { error: "Please indicate if you would recommend" };
  }

  // At least 2 category ratings required
  const categoryRatings = Object.values(data.categoryRatings).filter(
    (r) => r > 0
  );
  if (categoryRatings.length < 2) {
    return { error: "Please rate at least 2 categories" };
  }

  return { valid: true };
};
```

#### API Endpoints

**Submit Review**:

```typescript
POST /api/mobile/reviews/create
{
  job_id: number;
  reviewee_id: number;
  rating: number; // 1-5
  comment: string;
  category_ratings: {
    quality?: number;
    professionalism?: number;
    communication?: number;
    timeliness?: number;
    payment?: number;
    clarity?: number;
  };
  recommend: "yes" | "maybe" | "no";
}

Response:
{
  success: true;
  review_id: number;
  message: "Review submitted successfully";
}
```

---

## 4.4 View Reviews (Profile Reviews)

### Features (CLIENT + WORKER SIDE)

#### Reviews Page for User Profile

```typescript
<UserReviewsPage userId={userId}>
  <Header>
    <BackButton onClick={() => router.back()} />
    <Title>Reviews</Title>
  </Header>

  <ProfileSummary>
    <Avatar src={user.avatar} />
    <Name>{user.name}</Name>
    <Role>{user.role}</Role>
  </ProfileSummary>

  <RatingOverview>
    <OverallRating>
      <RatingValue>{user.rating.toFixed(1)}</RatingValue>
      <RatingStars value={user.rating} size="large" readonly />
      <ReviewCount>{user.totalReviews} reviews</ReviewCount>
    </OverallRating>

    <RatingDistribution>
      {[5, 4, 3, 2, 1].map(stars => (
        <DistributionBar key={stars}>
          <Stars>{stars} ★</Stars>
          <ProgressBar
            value={(reviewDistribution[stars] / user.totalReviews) * 100}
          />
          <Count>{reviewDistribution[stars]}</Count>
        </DistributionBar>
      ))}
    </RatingDistribution>

    <CategoryAverages>
      <Title>Average Ratings by Category</Title>
      {userRole === 'WORKER' && (
        <>
          <CategoryBar>
            <Label>Quality of Work</Label>
            <RatingStars value={categoryAverages.quality} readonly />
            <Value>{categoryAverages.quality.toFixed(1)}</Value>
          </CategoryBar>
          <CategoryBar>
            <Label>Professionalism</Label>
            <RatingStars value={categoryAverages.professionalism} readonly />
            <Value>{categoryAverages.professionalism.toFixed(1)}</Value>
          </CategoryBar>
          <CategoryBar>
            <Label>Communication</Label>
            <RatingStars value={categoryAverages.communication} readonly />
            <Value>{categoryAverages.communication.toFixed(1)}</Value>
          </CategoryBar>
          <CategoryBar>
            <Label>Timeliness</Label>
            <RatingStars value={categoryAverages.timeliness} readonly />
            <Value>{categoryAverages.timeliness.toFixed(1)}</Value>
          </CategoryBar>
        </>
      )}
    </CategoryAverages>
  </RatingOverview>

  <FilterTabs>
    <Tab active={filter === 'all'} onClick={() => setFilter('all')}>
      All ({reviews.length})
    </Tab>
    <Tab active={filter === 'positive'} onClick={() => setFilter('positive')}>
      Positive ({positiveCount})
    </Tab>
    <Tab active={filter === 'negative'} onClick={() => setFilter('negative')}>
      Negative ({negativeCount})
    </Tab>
  </FilterTabs>

  <ReviewsList>
    {filteredReviews.map(review => (
      <ReviewCard key={review.id}>
        <ReviewHeader>
          <ReviewerInfo>
            <Avatar src={review.reviewer.avatar} />
            <Name>{review.reviewer.name}</Name>
            <Role>{review.reviewer.role}</Role>
          </ReviewerInfo>
          <ReviewDate>{formatRelativeTime(review.createdAt)}</ReviewDate>
        </ReviewHeader>

        <RatingSection>
          <RatingStars value={review.rating} readonly />
          <RatingValue>{review.rating}.0</RatingValue>
        </RatingSection>

        <CommentText>{review.comment}</CommentText>

        {review.categoryRatings && (
          <CategoryRatings>
            {Object.entries(review.categoryRatings).map(([category, rating]) => (
              <Category key={category}>
                <Label>{formatCategoryLabel(category)}</Label>
                <RatingStars value={rating} size="small" readonly />
              </Category>
            ))}
          </CategoryRatings>
        )}

        <JobInfo>
          <JobTitle>Job: {review.job.title}</JobTitle>
          <ViewJobButton href={`/dashboard/jobs/${review.jobId}`}>
            View Job
          </ViewJobButton>
        </JobInfo>

        {review.recommend && (
          <RecommendBadge variant={review.recommend}>
            {review.recommend === 'yes' && '👍 Recommended'}
            {review.recommend === 'maybe' && '🤔 Maybe'}
            {review.recommend === 'no' && '👎 Not Recommended'}
          </RecommendBadge>
        )}
      </ReviewCard>
    ))}
  </ReviewsList>

  {hasMore && (
    <LoadMoreButton onClick={loadMore}>
      Load More Reviews
    </LoadMoreButton>
  )}
</UserReviewsPage>
```

#### API Endpoints

**Get User Reviews**:

```typescript
GET /api/mobile/reviews/user/{user_id}?filter=all&page=1&limit=20

Response:
{
  user: {
    id: number;
    name: string;
    avatar: string;
    role: "WORKER" | "CLIENT";
    rating: number;
    total_reviews: number;
  };
  rating_distribution: {
    "5": number;
    "4": number;
    "3": number;
    "2": number;
    "1": number;
  };
  category_averages: {
    quality?: number;
    professionalism?: number;
    communication?: number;
    timeliness?: number;
    payment?: number;
    clarity?: number;
  };
  reviews: Array<{
    id: number;
    reviewer: {
      id: number;
      name: string;
      avatar: string;
      role: "WORKER" | "CLIENT";
    };
    job_id: number;
    job_title: string;
    rating: number;
    comment: string;
    category_ratings: object;
    recommend: "yes" | "maybe" | "no";
    created_at: string;
  }>;
  has_more: boolean;
  page: number;
}
```

---

## 4.5 Trust Badges & Indicators

### Features

#### Profile Trust Indicators

**Display on all user profiles**:

```typescript
<TrustBadges user={user}>
  {user.kycVerified && (
    <Badge variant="success">
      <Icon>✓</Icon>
      Verified
    </Badge>
  )}

  {user.rating >= 4.5 && user.totalReviews >= 10 && (
    <Badge variant="gold">
      <Icon>⭐</Icon>
      Top Rated
    </Badge>
  )}

  {user.completedJobs >= 50 && (
    <Badge variant="purple">
      <Icon>🏆</Icon>
      Experienced
    </Badge>
  )}

  {user.responseRate >= 90 && (
    <Badge variant="blue">
      <Icon>⚡</Icon>
      Fast Responder
    </Badge>
  )}

  {user.onTimeCompletion >= 95 && (
    <Badge variant="green">
      <Icon>⏰</Icon>
      On-Time
    </Badge>
  )}
</TrustBadges>
```

#### Job Card Trust Indicators

**Show on job listings for clients**:

```typescript
<JobCard>
  {/* ...job info... */}

  <ClientTrustInfo>
    <ClientName>
      {job.client.name}
      {job.client.kycVerified && <Icon>✓</Icon>}
    </ClientName>
    <TrustScore>
      <RatingStars value={job.client.rating} size="small" />
      <ReviewCount>({job.client.totalReviews})</ReviewCount>
    </TrustScore>
    {job.client.paymentVerified && (
      <Badge variant="success">Payment Verified</Badge>
    )}
  </ClientTrustInfo>
</JobCard>
```

---

## 4.6 Report & Flag System

### Files to Create

```
app/dashboard/report/[targetId]/page.tsx (NEW - 380 lines)
components/safety/ReportForm.tsx (NEW - 320 lines)
```

### Features (CLIENT + WORKER SIDE)

#### Report User/Job

**Report Form**:

```typescript
<ReportForm targetType={targetType} targetId={targetId}>
  <Header>
    <Title>Report {targetType === 'user' ? 'User' : 'Job'}</Title>
    <Subtitle>Help us maintain a safe community</Subtitle>
  </Header>

  <ReasonSection>
    <Label>Reason for Report *</Label>
    <RadioGroup value={reason} onChange={setReason}>
      <Radio value="inappropriate_behavior">
        Inappropriate Behavior
      </Radio>
      <Radio value="fraud">
        Fraud or Scam
      </Radio>
      <Radio value="fake_profile">
        Fake Profile
      </Radio>
      <Radio value="harassment">
        Harassment
      </Radio>
      <Radio value="spam">
        Spam
      </Radio>
      <Radio value="other">
        Other
      </Radio>
    </RadioGroup>
  </ReasonSection>

  <DetailsSection>
    <Label>Additional Details *</Label>
    <Textarea
      value={details}
      onChange={e => setDetails(e.target.value)}
      placeholder="Please provide specific details about the issue..."
      minLength={50}
      maxLength={1000}
      rows={6}
    />
    <CharCount>{details.length} / 1000</CharCount>
  </DetailsSection>

  <EvidenceSection>
    <Label>Evidence (Optional)</Label>
    <FileUpload
      accept="image/*"
      multiple
      maxFiles={5}
      onChange={setEvidenceFiles}
    />
    <HelpText>Upload screenshots or other evidence (max 5 files)</HelpText>
  </EvidenceSection>

  <SubmitButton
    onClick={handleSubmitReport}
    disabled={!isValid || isSubmitting}
  >
    {isSubmitting ? 'Submitting...' : 'Submit Report'}
  </SubmitButton>

  <DisclaimerText>
    False reports may result in account suspension. All reports are
    reviewed by our moderation team within 24-48 hours.
  </DisclaimerText>
</ReportForm>
```

#### API Endpoints

**Submit Report**:

```typescript
POST /api/mobile/safety/report
FormData {
  target_type: "user" | "job";
  target_id: number;
  reason: string;
  details: string;
  evidence_files?: File[];
}

Response:
{
  success: true;
  report_id: number;
  message: "Report submitted. We'll review it within 24-48 hours.";
}
```

---

## Implementation Checklist

### Phase 1: KYC System

- [ ] Create KYC upload page
- [ ] Build DocumentUploadZone component
- [ ] Implement multi-step upload flow
- [ ] Add file validation (size, type, dimensions)
- [ ] Create KYC status page
- [ ] Build KYCStatusCard component
- [ ] Wire up KYC upload APIs
- [ ] Add verification badge to profiles
- [ ] Test document upload flow
- [ ] Test status refresh

### Phase 2: Review System

- [ ] Create review submission page
- [ ] Build ReviewForm component
- [ ] Build RatingStars component
- [ ] Add category ratings (role-specific)
- [ ] Add comment validation
- [ ] Create user reviews page
- [ ] Build ReviewCard component
- [ ] Add rating distribution chart
- [ ] Add category averages display
- [ ] Wire up review APIs
- [ ] Test end-to-end review flow

### Phase 3: Trust Indicators

- [ ] Add verified badge to profiles
- [ ] Create trust badge components
- [ ] Add trust indicators to job cards
- [ ] Calculate trust scores
- [ ] Add badge tooltips
- [ ] Test badge display logic

### Phase 4: Report System

- [ ] Create report form page
- [ ] Build ReportForm component
- [ ] Add evidence upload
- [ ] Add report button to profiles/jobs
- [ ] Wire up report API
- [ ] Test report submission

### Phase 5: Testing

- [ ] Test KYC rejection flow
- [ ] Test both parties reviewing
- [ ] Test review filtering
- [ ] Test trust badge conditions
- [ ] Test report submission
- [ ] Security testing for file uploads

---

## Testing Strategy

### Unit Tests

- [ ] File validation functions
- [ ] Rating calculation logic
- [ ] Review filtering logic
- [ ] Trust badge conditions

### Integration Tests

- [ ] KYC document upload
- [ ] KYC status update
- [ ] Review submission
- [ ] Review retrieval
- [ ] Report submission

### E2E Tests (Playwright)

```typescript
test("Complete KYC verification flow", async ({ page }) => {
  await loginAsWorker(page);
  await page.goto("/dashboard/kyc/upload");

  // Upload valid ID
  await uploadFile(page, "valid_id", validIDPath);
  await page.click('button:has-text("Next")');

  // Upload selfie
  await uploadFile(page, "selfie", selfiePath);
  await page.click('button:has-text("Next")');

  // Review and submit
  await page.click('button:has-text("Submit for Verification")');
  await expect(page).toHaveURL("/dashboard/kyc/status");
  await expect(page.locator("text=Under Review")).toBeVisible();
});

test("Submit and view review", async ({ browser }) => {
  const clientContext = await browser.newContext();
  const workerContext = await browser.newContext();

  const clientPage = await clientContext.newPage();
  const workerPage = await workerContext.newPage();

  // Client submits review
  await loginAsClient(clientPage);
  await clientPage.goto(`/dashboard/reviews/submit/${jobId}`);
  await selectRating(clientPage, 5);
  await clientPage.fill("textarea", "Excellent work! Very professional.");
  await clientPage.click('button:has-text("Submit Review")');

  // Worker views review
  await loginAsWorker(workerPage);
  await workerPage.goto("/dashboard/profile");
  await workerPage.click("text=View Reviews");
  await expect(workerPage.locator("text=Excellent work!")).toBeVisible();
});
```

---

## Completion Criteria

Module 4 is complete when:

- [x] KYC upload flow functional
- [x] KYC status tracking working
- [x] Verified badge displays correctly
- [x] Review submission working (both roles)
- [x] Review display page functional
- [x] Category ratings working
- [x] Rating distribution chart displays
- [x] Trust badges display on profiles
- [x] Report system functional
- [x] All file uploads secure
- [x] All validation working
- [x] 0 TypeScript errors
- [x] All E2E tests pass

---

**Next Module**: Module 5 - Discovery & Profiles
