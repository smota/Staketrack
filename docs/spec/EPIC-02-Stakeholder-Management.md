# EPIC-02: Stakeholder Management

## Overview

The Stakeholder Management epic covers the creation, editing, and organization of stakeholder profiles. This core functionality allows users to document stakeholders with detailed attributes, categorize them, and manage multiple stakeholder maps for different projects or initiatives.

## Features

### Feature 2.1: Stakeholder Maps

Allow users to create and manage multiple stakeholder maps for different projects or contexts.

#### Stories

##### Story 2.1.1: Create Stakeholder Map

**As a** user,
**I want to** create a new stakeholder map,
**So that** I can organize stakeholders for a specific project or initiative.

**Acceptance Criteria:**
- User can click "Create New Map" button from dashboard
- User can enter a name for the map
- User can provide an optional description
- System creates a new empty map
- The new map becomes the active map
- The map is saved to local storage and cloud (if authenticated)

**Notes:**
- Maps should have a unique identifier for reference
- Consider default naming convention for untitled maps (e.g., "Untitled Map - [Date]")

##### Story 2.1.2: Rename Stakeholder Map

**As a** user,
**I want to** rename an existing stakeholder map,
**So that** I can better identify its purpose or project.

**Acceptance Criteria:**
- User can click "Edit" button on a map
- User can modify the map name and description
- System updates the map metadata
- Changes are saved automatically
- Updated name appears in map selection dropdown

**Notes:**
- Validate that the new name is not empty

##### Story 2.1.3: Delete Stakeholder Map

**As a** user,
**I want to** delete a stakeholder map I no longer need,
**So that** I can keep my workspace organized.

**Acceptance Criteria:**
- User can click delete button on a map
- System prompts for confirmation before deletion
- After confirmation, the map and all its stakeholders are deleted
- If the deleted map was active, another map is selected, or the dashboard is shown
- User receives confirmation of successful deletion

**Notes:**
- Consider implementing soft delete with recovery option
- Ensure deletion cascades to all stakeholders in the map

##### Story 2.1.4: Select Active Map

**As a** user with multiple stakeholder maps,
**I want to** switch between maps,
**So that** I can work on different projects or initiatives.

**Acceptance Criteria:**
- User can select a map from the dropdown in the navigation bar
- Selected map loads with all its stakeholders
- Matrix view updates to show selected map stakeholders
- Map name displayed in the interface updates

**Notes:**
- Ensure proper saving of any changes before switching maps
- Consider preloading frequently used maps for faster switching

### Feature 2.2: Stakeholder Profiles

Allow users to create and manage detailed profiles for each stakeholder.

#### Stories

##### Story 2.2.1: Add Stakeholder

**As a** user,
**I want to** add a new stakeholder to my map,
**So that** I can track their attributes and relationships.

**Acceptance Criteria:**
- User can click "Add Stakeholder" button
- System displays a form with fields for stakeholder attributes
- Required fields are marked with an asterisk
- User can enter stakeholder information (name, influence, impact, etc.)
- User can save the stakeholder to add it to the map
- New stakeholder appears in both matrix and list views

**Notes:**
- Required fields: Name, Influence (1-10), Impact (1-10), Relationship Quality (1-10)
- Optional fields: Category, Interests, Contribution, Risk, Communication Style, Engagement Strategy, Measurement Approach

##### Story 2.2.2: Edit Stakeholder

**As a** user,
**I want to** edit an existing stakeholder's information,
**So that** I can keep their profile up to date.

**Acceptance Criteria:**
- User can click "Edit" for a stakeholder in the list or matrix view
- System displays the stakeholder form with current values
- User can modify any field
- User can save changes or cancel
- Changes are reflected immediately in all views
- System provides feedback on successful save

**Notes:**
- Consider tracking edit history for auditing purposes
- Implement optimistic updates for better user experience

##### Story 2.2.3: Delete Stakeholder

**As a** user,
**I want to** remove a stakeholder from my map,
**So that** I can keep my map relevant and current.

**Acceptance Criteria:**
- User can click "Delete" for a stakeholder
- System prompts for confirmation
- After confirmation, stakeholder is removed from the map
- Stakeholder disappears from both matrix and list views
- User receives confirmation of successful deletion

**Notes:**
- Consider implementing soft delete with recovery option
- Ensure all related data (e.g., interaction logs) is also removed or handled appropriately

##### Story 2.2.4: Duplicate Stakeholder

**As a** user,
**I want to** duplicate an existing stakeholder,
**So that** I can quickly create similar profiles without re-entering all data.

**Acceptance Criteria:**
- User can select "Duplicate" option for a stakeholder
- System creates a copy with "(Copy)" appended to the name
- All fields except unique identifiers are copied
- The new stakeholder form opens with pre-filled data for editing
- User can modify the copy before saving
- New stakeholder appears in the map after saving

**Notes:**
- Ensure proper handling of relationships and references when duplicating

### Feature 2.3: Stakeholder Categorization

Allow users to organize stakeholders into categories for better management.

#### Stories

##### Story 2.3.1: Assign Category

**As a** user,
**I want to** assign a category to a stakeholder,
**So that** I can group similar stakeholders together.

**Acceptance Criteria:**
- User can select a category from a dropdown when creating/editing a stakeholder
- Predefined categories include: Executive, Manager, Team Member, Customer, Partner, Regulator, Other
- Category is displayed in the list view and stakeholder details
- Stakeholders can be filtered by category in list view

**Notes:**
- Consider allowing color coding by category in the matrix view

##### Story 2.3.2: Filter by Category

**As a** user,
**I want to** filter stakeholders by category,
**So that** I can focus on specific groups.

**Acceptance Criteria:**
- User can select a category filter in the list view
- Only stakeholders matching the selected category are displayed
- Matrix view updates to show only filtered stakeholders
- Multiple selection of categories is supported
- User can clear filters to view all stakeholders

**Notes:**
- Consider visual indication that filters are active
- Save filter preferences for individual users

##### Story 2.3.3: Custom Categories

**As a** user,
**I want to** create custom stakeholder categories,
**So that** I can tailor categorization to my specific needs.

**Acceptance Criteria:**
- User can add custom categories via settings
- Custom categories appear in the category dropdown
- User can edit and delete custom categories
- System prevents deletion of categories in use
- Custom categories are saved with the user's profile

**Notes:**
- Consider a limit on the number of custom categories (e.g., 10)
- Allow import/export of custom category sets

### Feature 2.4: Batch Operations

Allow users to perform operations on multiple stakeholders simultaneously.

#### Stories

##### Story 2.4.1: Bulk Select

**As a** user,
**I want to** select multiple stakeholders at once,
**So that** I can perform actions on them as a group.

**Acceptance Criteria:**
- User can select multiple stakeholders via checkboxes in list view
- User can use Shift+click to select a range
- User can use Ctrl+click (Cmd+click on Mac) to select individual items
- User can see a count of selected stakeholders
- User can select all/none via a master checkbox

**Notes:**
- Provide visual indication of selected stakeholders
- Ensure selection state persists during view changes

##### Story 2.4.2: Bulk Category Assignment

**As a** user,
**I want to** assign a category to multiple stakeholders at once,
**So that** I can quickly organize my stakeholder map.

**Acceptance Criteria:**
- User can select multiple stakeholders
- User can access a "Set Category" option from actions menu
- User can choose a category to apply to all selected stakeholders
- System updates all selected stakeholders with the new category
- User receives confirmation of the bulk update

**Notes:**
- Provide undo functionality for accidental bulk changes

##### Story 2.4.3: Bulk Export

**As a** user,
**I want to** export data for multiple selected stakeholders,
**So that** I can use the information in other tools or reports.

**Acceptance Criteria:**
- User can select multiple stakeholders
- User can choose "Export Selected" from actions menu
- User can select export format (CSV, JSON, PDF)
- System generates a file with selected stakeholders' data
- File is downloaded to the user's device

**Notes:**
- Consider export templates for different use cases
- Include comprehensive metadata in exports 