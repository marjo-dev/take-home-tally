# Feature Roadmap

This document tracks planned features and enhancements for the Income Tracker app.

## Planned Features

### Edit Daily Entry
**Status:** Planned  
**Priority:** Medium  
**Estimated Effort:** 30-60 minutes

Add the ability to edit existing daily entries from the weekly details view.

**Current State:**
- Delete functionality exists for entries in the weekly details toggle
- Each entry has: `date`, `role`, `hours`, `tips`, `cashTips`, `tipOuts`, `id`, `settingsSnapshot`

**Implementation Requirements:**
1. Add "Edit" button next to "Delete" button in weekly details table (`renderers.js`)
2. Create edit handler that:
   - Finds entry by ID
   - Populates form fields with entry data
   - Tracks which entry is being edited
   - Changes button text from "Add Entry" to "Update Entry"
3. Modify add entry handler to:
   - Check if in edit mode
   - If editing: update existing entry (preserve ID, update `settingsSnapshot` with current settings)
   - If not: create new entry (current behavior)
4. Clear edit state after save
5. Optional: Add "Cancel" button to exit edit mode

**Considerations:**
- Settings snapshot should be updated to current settings when editing (for accurate recalculation)
- Form validation should remain the same
- UI feedback to indicate edit mode (visual indicator, button text change)

**Files to Modify:**
- `js/ui/renderers.js` - Add Edit button to weekly details table
- `js/app.js` - Add edit handler and modify add entry handler

---

## Future Considerations

_Additional features and enhancements can be added here as they are identified._

