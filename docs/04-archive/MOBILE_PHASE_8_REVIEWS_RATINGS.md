# [Mobile] Phase 8: Reviews & Ratings System

**Labels:** `priority:medium`, `type:feature`, `area:mobile`, `area:reviews`
**Priority:** MEDIUM
**Estimated Time:** 60-80 hours

## Summary
Implement comprehensive review and rating system for workers and clients after job completion.

## Tasks

### Review Submission
- [ ] Create ReviewScreen for rating workers/clients
- [ ] Implement 5-star rating component
- [ ] Add review text input with character limit
- [ ] Create review category tags (quality, punctuality, communication)
- [ ] Add photo attachment to reviews (optional)
- [ ] Implement review preview before submission
- [ ] Handle review submission via API
- [ ] Integrate with `/api/reviews/submit`

### Rating Categories
- [ ] Implement multi-category rating
  - [ ] Overall rating (required)
  - [ ] Quality of work (workers)
  - [ ] Communication (both)
  - [ ] Professionalism (both)
  - [ ] Punctuality (workers)
  - [ ] Payment timeliness (clients)
- [ ] Calculate average across categories
- [ ] Display category breakdown

### Review Display
- [ ] Create ReviewsListScreen
- [ ] Display reviews on worker profile
- [ ] Show average rating prominently
- [ ] Add rating breakdown chart (5-star, 4-star, etc.)
- [ ] Implement review filtering (rating, date)
- [ ] Show reviewer name and photo
- [ ] Display review timestamp
- [ ] Add review photos gallery

### Review Prompts
- [ ] Show review prompt after job completion
- [ ] Send reminder notification if review not submitted
- [ ] Display pending reviews list
- [ ] Add incentives messaging for leaving reviews

### Review Responses
- [ ] Allow workers to respond to reviews
- [ ] Display worker responses below reviews
- [ ] Limit response to one per review
- [ ] Add response timestamp

### Rating Analytics
- [ ] Create RatingAnalyticsScreen for workers
- [ ] Display overall rating average
- [ ] Show total review count
- [ ] Display rating distribution chart
- [ ] Show category averages
- [ ] Add rating trend over time
- [ ] Display recent reviews

### Review Management
- [ ] Create MyReviewsScreen
- [ ] Show reviews written by user
- [ ] Show reviews received by user
- [ ] Allow editing reviews within 24 hours
- [ ] Implement review reporting (inappropriate content)

## Files to Create
- `lib/screens/reviews/review_screen.dart` - Submit review
- `lib/screens/reviews/reviews_list_screen.dart` - View reviews
- `lib/screens/reviews/rating_analytics_screen.dart` - Rating dashboard
- `lib/screens/reviews/my_reviews_screen.dart` - User's reviews
- `lib/components/star_rating.dart` - Rating component
- `lib/components/review_card.dart` - Review display
- `lib/components/rating_breakdown.dart` - Rating chart
- `lib/components/category_rating.dart` - Category ratings
- `lib/services/review_service.dart` - Review API service
- `lib/models/review.dart` - Review model
- `lib/models/rating_analytics.dart` - Analytics model
- `lib/providers/review_provider.dart` - Review state

## API Endpoints to Integrate
- `POST /api/reviews/submit` - Submit review
- `GET /api/reviews/worker/{id}` - Get worker reviews
- `GET /api/reviews/client/{id}` - Get client reviews
- `PUT /api/reviews/{id}` - Edit review
- `POST /api/reviews/{id}/respond` - Respond to review
- `POST /api/reviews/{id}/report` - Report review

## Acceptance Criteria
- [ ] Users can submit reviews after job completion
- [ ] Multi-category ratings display correctly
- [ ] Reviews appear on worker/client profiles
- [ ] Average ratings calculate accurately
- [ ] Rating breakdown chart renders correctly
- [ ] Workers can respond to reviews
- [ ] Review photos display in gallery
- [ ] Users can edit reviews within 24 hours
- [ ] Inappropriate reviews can be reported
- [ ] Review prompts appear at correct times

## Dependencies
- **Requires:** Mobile Phase 2 - Job completion workflow
- **Requires:** Mobile Phase 4 - Final payment (review after payment)

## Testing
- [ ] Test review submission with all categories
- [ ] Test rating calculation accuracy
- [ ] Test review editing within 24-hour window
- [ ] Verify review responses
- [ ] Test photo upload in reviews
- [ ] Test review filtering and sorting
- [ ] Verify rating analytics accuracy

---
Generated with Claude Code
