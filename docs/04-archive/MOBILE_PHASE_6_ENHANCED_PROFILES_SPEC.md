# [Mobile] Phase 6: Enhanced User Profiles (Certifications & Materials)

**Labels:** `priority:high`, `type:feature`, `area:mobile`, `area:profiles`
**Priority:** HIGH
**Estimated Time:** 80-100 hours

## Summary
Implement comprehensive user profile features including worker certifications, materials/products offered, and profile management.

## Tasks

### Profile Viewing
- [ ] Create ProfileScreen showing complete user information
- [ ] Display profile photo from Supabase
- [ ] Show basic info (name, contact, location)
- [ ] Display specializations/skills
- [ ] Show hourly rate for workers
- [ ] Add bio and description sections
- [ ] Show availability status badge
- [ ] Display ratings and review count

### Worker Certifications
- [ ] Create CertificationsScreen to manage certifications
- [ ] Implement certification card component
- [ ] Add certification upload functionality
  - [ ] Certification name/title
  - [ ] Issuing organization
  - [ ] Issue date and expiry date
  - [ ] Certificate image upload
- [ ] Display certifications on worker profile
- [ ] Add certification verification badge (optional)
- [ ] Implement certification deletion

### Materials/Products Offered
- [ ] Create MaterialsScreen to manage offered materials
- [ ] Implement material card component
- [ ] Add material creation form
  - [ ] Material name
  - [ ] Description
  - [ ] Price
  - [ ] Unit (e.g., per kg, per piece)
  - [ ] Material photos
  - [ ] Availability status
- [ ] Display materials on worker profile
- [ ] Add material search and filtering
- [ ] Implement material editing and deletion

### Profile Editing
- [ ] Create EditProfileScreen
- [ ] Allow profile photo update (camera/gallery)
- [ ] Edit basic information (name, contact, bio)
- [ ] Update specializations/skills
- [ ] Edit hourly rate for workers
- [ ] Update location/address
- [ ] Change availability status
- [ ] Implement form validation

### Portfolio/Gallery
- [ ] Create PortfolioScreen for workers
- [ ] Display worker's completed job photos
- [ ] Implement photo grid layout
- [ ] Add photo lightbox viewer
- [ ] Allow portfolio photo upload
- [ ] Add photo captions/descriptions
- [ ] Implement photo deletion

### Profile Completion Indicator
- [ ] Add profile completion percentage
- [ ] Show missing profile sections
- [ ] Create profile setup wizard for new users
- [ ] Add prompts to complete profile

## Files to Create
- `lib/screens/profile/profile_screen.dart` - View profile
- `lib/screens/profile/edit_profile_screen.dart` - Edit profile
- `lib/screens/profile/certifications_screen.dart` - Manage certifications
- `lib/screens/profile/materials_screen.dart` - Manage materials
- `lib/screens/profile/portfolio_screen.dart` - Worker portfolio
- `lib/components/certification_card.dart` - Certification component
- `lib/components/material_card.dart` - Material component
- `lib/components/profile_completion_indicator.dart` - Progress bar
- `lib/services/profile_service.dart` - Profile API service
- `lib/models/certification.dart` - Certification model
- `lib/models/worker_material.dart` - Material model
- `lib/models/portfolio_item.dart` - Portfolio model
- `lib/providers/profile_provider.dart` - Profile state

## API Endpoints to Integrate
- `GET /api/profiles/{id}` - Get profile
- `PUT /api/profiles/{id}` - Update profile
- `POST /api/profiles/{id}/certifications` - Add certification
- `DELETE /api/profiles/{id}/certifications/{cert_id}` - Delete certification
- `POST /api/profiles/{id}/materials` - Add material
- `PUT /api/profiles/{id}/materials/{material_id}` - Update material
- `DELETE /api/profiles/{id}/materials/{material_id}` - Delete material
- `POST /api/profiles/{id}/portfolio` - Upload portfolio photo

## Acceptance Criteria
- [ ] Users can view complete profile information
- [ ] Workers can add, edit, and delete certifications
- [ ] Workers can add, edit, and delete materials offered
- [ ] Profile photos upload to Supabase correctly
- [ ] All profile edits persist to backend
- [ ] Profile completion percentage calculates correctly
- [ ] Portfolio displays all job completion photos
- [ ] Form validation works for all inputs
- [ ] Image uploads are compressed appropriately

## Dependencies
- **Requires:** Existing profile API endpoints
- **Enhances:** Mobile Phase 1 - Job applications (show certifications)

## Testing
- [ ] Test profile photo upload to Supabase
- [ ] Test certification CRUD operations
- [ ] Test material CRUD operations
- [ ] Verify image compression quality
- [ ] Test profile editing with all fields
- [ ] Verify profile completion calculation
- [ ] Test portfolio photo upload

---
Generated with Claude Code
