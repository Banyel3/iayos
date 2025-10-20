# Job Application Modal - Budget Option Update

## ✅ Changes Made

### Updated Budget Selection Interface

**Before:** Single text input field for worker to enter their proposed budget

**After:** Two-button selection system:

1. **"Accept Client's Budget"** button
   - Worker agrees with the posted budget
   - No additional input required
   - Budget sent to backend = client's posted budget

2. **"Negotiate a Different Budget"** button
   - Worker wants to propose a custom amount
   - Reveals a budget input field below when selected
   - Budget sent to backend = worker's entered amount

---

## 🎨 Visual Design

### Budget Selection Buttons

- Large, full-width clickable buttons
- Clear radio-style selection with checkmark indicators
- Blue highlight on selection (border-blue-500, bg-blue-50)
- Gray border when unselected (border-gray-300)
- Hover effects for better UX
- Descriptive text under each option

### Conditional Budget Input

- Only appears when "Negotiate" is selected
- Indented with blue left border for visual connection
- Shows client's budget as helper text
- Standard number input with validation

---

## 💻 State Management

### Added State Variable

```typescript
const [budgetOption, setBudgetOption] = useState<"accept" | "negotiate" | null>(
  null
);
```

### Updated Validation Logic

```typescript
// Requires both proposal message AND budget option
if (!proposalMessage || !budgetOption) {
  alert("Please fill in all required fields");
  return;
}

// If negotiate is selected, requires budget amount
if (budgetOption === "negotiate" && !proposedBudget) {
  alert("Please enter your proposed budget");
  return;
}
```

### Updated API Call

```typescript
// Determine budget based on option
const budgetToSend =
  budgetOption === "accept"
    ? parseFloat(selectedJob?.budget.replace(/[₱,]/g, "") || "0")
    : parseFloat(proposedBudget);

// Send to backend with budget_option field
body: JSON.stringify({
  job_posting_id: selectedJob?.id,
  proposal_message: proposalMessage,
  proposed_budget: budgetToSend,
  budget_option: budgetOption, // NEW
  estimated_duration: estimatedDuration || null,
});
```

---

## 🔄 User Experience Flow

1. Worker opens proposal modal
2. Fills in proposal message
3. **Sees two budget options:**
   - If they agree with client's price → Click "Accept Client's Budget"
   - If they want different price → Click "Negotiate a Different Budget"
4. **If "Negotiate" is selected:**
   - Budget input field appears
   - Worker enters their proposed amount
   - Client's budget shown for reference
5. Optionally enters estimated duration
6. Clicks "Submit Proposal"
7. **Backend receives:**
   - Proposal message
   - Final budget (either client's or worker's)
   - Budget option indicator ("accept" or "negotiate")
   - Estimated duration (optional)

---

## 📦 Updated API Contract

### Request Body

```json
{
  "job_posting_id": 123,
  "proposal_message": "I have 5 years of experience...",
  "proposed_budget": 5000.0,
  "budget_option": "accept", // NEW FIELD: "accept" or "negotiate"
  "estimated_duration": "3 days"
}
```

### Field Details

- `budget_option`: Indicates whether worker accepted client's budget or proposed custom amount
- `proposed_budget`:
  - If `budget_option = "accept"`: Contains client's posted budget
  - If `budget_option = "negotiate"`: Contains worker's custom proposal

---

## 🎯 Benefits

1. **Clearer Intent**: Backend knows if worker wants to negotiate or accept
2. **Faster Application**: Workers can quickly accept without typing
3. **Better UX**: No need to manually copy client's budget into input field
4. **Flexible Options**: Supports both scenarios seamlessly
5. **Visual Clarity**: Button-based selection is more intuitive than text input alone

---

## 📁 Files Modified

- `apps/frontend_web/app/dashboard/home/page.tsx`
  - Added `budgetOption` state variable
  - Updated `handleSendProposal()` to reset budget option
  - Updated `handleSubmitProposal()` validation and API call
  - Replaced budget input section with button selection UI (mobile modal)
  - Replaced budget input section with button selection UI (desktop modal)
  - Added conditional rendering for budget input field

**Total Changes:** ~150 lines modified/added

---

## ✅ Testing Checklist

- [ ] Modal opens successfully
- [ ] Both budget buttons are clickable
- [ ] Selecting "Accept" highlights button with checkmark
- [ ] Selecting "Negotiate" highlights button and shows input field
- [ ] Switching between options works correctly
- [ ] Budget input only appears when "Negotiate" is selected
- [ ] Validation prevents submission without budget option
- [ ] Validation prevents submission without amount when "Negotiate" is selected
- [ ] API call sends correct budget based on option
- [ ] API call includes `budget_option` field
- [ ] Success flow works (modal closes, form resets)
- [ ] Error handling works correctly
- [ ] Works on mobile view
- [ ] Works on desktop view

---

## 🚀 Next Steps (Backend)

1. Update `CreateJobApplicationSchema` to include `budget_option` field:

```python
class CreateJobApplicationSchema(Schema):
    job_posting_id: int
    proposal_message: str
    proposed_budget: float
    budget_option: str  # NEW: "accept" or "negotiate"
    estimated_duration: Optional[str] = None
```

2. Update `JobApplication` model to store budget option:

```python
class JobApplication(models.Model):
    # ... existing fields ...
    budgetOption = models.CharField(
        max_length=20,
        choices=[("ACCEPT", "Accept"), ("NEGOTIATE", "Negotiate")],
        default="NEGOTIATE"
    )
```

3. Display budget option in client's application view
4. Consider using budget_option for filtering/sorting applications

---

## 📊 Implementation Summary

**State:** ✅ Complete
**Validation:** ✅ Implemented
**UI:** ✅ Responsive (mobile + desktop)
**API Integration:** ✅ Ready (endpoint needs backend implementation)
**Errors:** ✅ None (TypeScript compilation successful)

The modal is ready for user testing! 🎉
