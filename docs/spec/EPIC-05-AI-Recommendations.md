# EPIC-05: AI Recommendations

## Overview

The AI Recommendations epic covers the integration of artificial intelligence capabilities to provide personalized stakeholder engagement advice. Using Firebase's Vertex AI with Gemini models, the system analyzes stakeholder data and interaction history to suggest optimal engagement strategies, predict stakeholder behavior, and recommend best next actions.

## Authentication & Usage Requirements

All AI functionality requires user authentication. Anonymous users will see the AI feature buttons but will be prompted to log in to access the recommendations.

Additionally, a weekly usage limit is enforced for all authenticated users:

1. Each user has a configurable weekly limit on AI recommendation requests
2. The limit is counted from Sunday to Saturday and resets automatically
3. Administrators can grant unlimited access to specific users
4. Users are shown their current usage and limit information when limits are reached

## Features

### Feature 5.1: Stakeholder Engagement Advice

Provide AI-powered recommendations for engaging with individual stakeholders.

#### Stories

##### Story 5.1.1: Individual Stakeholder Recommendations

**As a** logged-in user,
**I want to** receive personalized engagement advice for a specific stakeholder,
**So that** I can optimize my approach and build a stronger relationship.

**Acceptance Criteria:**
- User can request advice for any stakeholder via a "Get Recommendations" button
- System uses the Firebase Vertex AI with Gemini to analyze stakeholder data and generate recommendations
- Recommendations include communication style, engagement frequency, and approach
- Advice is tailored to the stakeholder's influence, impact, and relationship quality
- User can view advice in a dedicated panel within the stakeholder profile
- Loading state is displayed during API processing
- Anonymous users see a login prompt when attempting to use this feature
- Users who have reached their weekly limit see a usage limit message

**Notes:**
- Ensure recommendations consider all stakeholder attributes and history
- Anonymous users can see the function is available but must log in to use it
- Usage is tracked in Firestore for monitoring and billing purposes

##### Story 5.1.2: Contextual Communication Guidelines

**As a** logged-in user,
**I want to** receive guidance on how to communicate effectively with a stakeholder,
**So that** I can adapt my messaging to their preferences and needs.

**Acceptance Criteria:**
- Advice includes specific communication style recommendations
- System suggests optimal communication channels based on stakeholder data
- Recommendations include language framing and messaging approaches
- Advice considers stakeholder's interests and concerns
- User can request specific communication scenarios (e.g., delivering difficult news)
- Examples or templates of effective messages are provided where appropriate
- Anonymous users see a login prompt when attempting to use this feature

**Notes:**
- Consider privacy implications when generating examples
- Base recommendations on successful communication patterns from interaction history

##### Story 5.1.3: Relationship Development Strategy

**As a** logged-in user,
**I want to** receive strategic advice for developing the stakeholder relationship over time,
**So that** I can move stakeholders toward more supportive positions.

**Acceptance Criteria:**
- System provides a phased relationship development plan
- Strategy includes short-term and long-term objectives
- Recommendations acknowledge current relationship status and desired direction
- Strategy includes milestones and indicators of progress
- User can provide feedback on the strategy to refine future recommendations
- System suggests when to reassess and adjust the strategy
- Anonymous users see a login prompt when attempting to use this feature

**Notes:**
- Ensure strategies align with organizational relationship management best practices
- Consider how the strategy changes for different stakeholder matrix positions

### Feature 5.2: Next Best Action Recommendations

Suggest specific actions to take with stakeholders to improve engagement.

#### Stories

##### Story 5.2.1: Prioritized Action Recommendations

**As a** logged-in user,
**I want to** receive prioritized recommendations for stakeholder actions,
**So that** I can focus my limited time on the most impactful engagements.

**Acceptance Criteria:**
- User can request "Next Best Actions" for the entire stakeholder map
- System analyzes all stakeholders and prioritizes recommended actions
- Recommendations are ranked by potential impact and urgency
- Each recommendation includes a stakeholder, action type, and rationale
- User can mark recommendations as complete or dismiss them
- New recommendations are generated based on changing stakeholder data
- Anonymous users see a login prompt when attempting to use this feature

**Notes:**
- Consider stakeholder influence/impact when determining priority
- Balance recommendations across different stakeholder categories

##### Story 5.2.2: Engagement Timing Suggestions

**As a** logged-in user,
**I want to** receive advice on optimal timing for stakeholder interactions,
**So that** I can engage at moments of maximum receptivity and impact.

**Acceptance Criteria:**
- System suggests optimal timing for different types of interactions
- Recommendations consider interaction history and patterns
- System identifies stakeholders overdue for engagement
- Timing suggestions include specific timeframes (e.g., "within the next week")
- User can convert timing suggestions directly into planned interactions
- System adapts suggestions based on user feedback
- Anonymous users see a login prompt when attempting to use this feature

**Notes:**
- Analyze interaction frequency patterns for timing insights
- Consider organizational cycles and external events when available

##### Story 5.2.3: Issue-Specific Engagement Recommendations

**As a** logged-in user,
**I want to** receive recommendations for engaging stakeholders around specific issues or topics,
**So that** I can prepare for focused discussions and decision points.

**Acceptance Criteria:**
- User can input a specific issue or topic
- System identifies stakeholders most relevant to the issue
- Recommendations include talking points tailored to each stakeholder's interests
- System suggests potential coalitions or stakeholders to engage together
- Recommendations include potential concerns or objections to prepare for
- User can save and share issue-specific recommendation sets
- Anonymous users see a login prompt when attempting to use this feature

**Notes:**
- Implement a mechanism for capturing issue details and context
- Consider stakeholder relationships when suggesting coalitions

### Feature 5.3: Influence Network Analysis

Provide AI-driven analysis of stakeholder relationships and influence dynamics.

#### Stories

##### Story 5.3.1: Influence Mapping

**As a** logged-in user,
**I want to** understand the influence relationships between stakeholders,
**So that** I can leverage these connections in my engagement strategy.

**Acceptance Criteria:**
- System identifies potential influence relationships between stakeholders
- User can view a visual network map of stakeholder influences
- Influence strength is indicated visually
- User can add known influence relationships manually
- System suggests key influencers for specific stakeholder groups
- Analysis considers both formal and informal influence
- Anonymous users see a login prompt when attempting to use this feature

**Notes:**
- Allow users to confirm or reject suggested influence relationships
- Consider implementing different types of influence (e.g., authority, expertise, social)

##### Story 5.3.2: Coalition Identification

**As a** logged-in user,
**I want to** identify potential stakeholder coalitions and alliances,
**So that** I can develop group engagement strategies.

**Acceptance Criteria:**
- System suggests potential coalitions based on shared interests and attributes
- User can view stakeholders grouped by potential coalition
- System provides engagement strategies tailored to each coalition
- User can name and save identified coalitions for future reference
- Coalition analysis includes potential shared goals and concerns
- System highlights potential conflicts between different coalitions
- Anonymous users see a login prompt when attempting to use this feature

**Notes:**
- Consider both formal and informal coalitions
- Provide coalition strength assessment based on member influence

##### Story 5.3.3: Influence Pathway Recommendations

**As a** logged-in user,
**I want to** receive recommendations for influence pathways to key stakeholders,
**So that** I can leverage indirect influence when direct access is limited.

**Acceptance Criteria:**
- User can select a target stakeholder
- System identifies potential influence pathways through other stakeholders
- Pathways are ranked by likely effectiveness and feasibility
- Each pathway includes specific recommended actions
- User can view detailed rationale for each suggested pathway
- System considers relationship quality along the entire pathway
- Anonymous users see a login prompt when attempting to use this feature

**Notes:**
- Consider ethical implications of indirect influence strategies
- Ensure recommendations respect organizational hierarchy and protocols

### Feature 5.4: AI Insight Customization

Allow users to tailor AI recommendations to their specific context and needs.

#### Stories

##### Story 5.4.1: Recommendation Preferences

**As a** logged-in user,
**I want to** customize the types of recommendations I receive,
**So that** the advice aligns with my needs and organizational context.

**Acceptance Criteria:**
- User can access AI recommendation settings
- User can set preferences for recommendation focus areas
- User can adjust level of detail for recommendations
- User can specify organizational constraints or requirements
- Settings are saved to user profile
- User can reset to default recommendation settings
- Anonymous users see a login prompt when attempting to use this feature

**Notes:**
- Consider industry-specific recommendation templates
- Allow preference setting at both user and stakeholder map levels

##### Story 5.4.2: Feedback on Recommendations

**As a** logged-in user,
**I want to** provide feedback on AI recommendations,
**So that** future advice becomes more relevant and effective.

**Acceptance Criteria:**
- User can rate the helpfulness of recommendations
- User can provide specific feedback on why advice was or wasn't helpful
- System uses feedback to improve future recommendations
- User can see when recommendations are based on their previous feedback
- User can view history of past recommendations and their feedback
- Feedback integration is transparent to the user
- Anonymous users see a login prompt when attempting to use this feature

**Notes:**
- Implement a learning mechanism to incorporate feedback
- Consider both explicit feedback (ratings) and implicit feedback (which recommendations are followed)

##### Story 5.4.3: Contextual Information Integration

**As a** logged-in user,
**I want to** provide additional contextual information to the AI system,
**So that** recommendations are more relevant to my specific situation.

**Acceptance Criteria:**
- User can input organizational context, goals, or constraints
- User can specify project or initiative details relevant to stakeholders
- System incorporates contextual information into recommendations
- User can update context information as situations change
- System explains how context influences specific recommendations
- Context information is securely stored and handled appropriately
- Anonymous users see a login prompt when attempting to use this feature

**Notes:**
- Consider using structured templates for context gathering
- Ensure context integration follows privacy and data security guidelines

### Feature 5.5: Usage Management

Manage and control usage of AI features to optimize costs and ensure fair access.

#### Stories

##### Story 5.5.1: Weekly Usage Limits

**As an** administrator,
**I want to** set weekly limits on AI feature usage per user,
**So that** I can control costs and ensure fair access to AI capabilities.

**Acceptance Criteria:**
- System enforces a configurable weekly limit on AI recommendation requests
- Limit is applied per user and reset weekly (Sunday to Saturday)
- Usage is tracked in Firestore with appropriate data structure
- Configuration can be managed through Firebase Admin
- Default limit is set to 10 recommendations per week per user
- Usage count includes all AI recommendation types

**Notes:**
- Implement efficient tracking to minimize database operations
- Ensure limits don't interfere with critical user workflows

##### Story 5.5.2: Unlimited Access Bypass

**As an** administrator,
**I want to** grant specific users unlimited access to AI features,
**So that** power users or premium accounts can access advanced capabilities without restrictions.

**Acceptance Criteria:**
- Administrators can flag specific user accounts for unlimited AI access
- Flagged users bypass the weekly usage limit check
- Changes to unlimited access status take effect immediately
- User account details include information about unlimited access status
- Flag can be toggled through Firebase Admin Console

**Notes:**
- Consider security implications of unlimited access
- Include audit trail for unlimited access changes

##### Story 5.5.3: Usage Limit Notifications

**As a** user,
**I want to** be notified when I reach my AI usage limit,
**So that** I understand why AI features are unavailable and when they will be available again.

**Acceptance Criteria:**
- User receives a clear notification when reaching their weekly limit
- Notification includes current usage statistics (used vs. limit)
- Message indicates when the limit will reset
- UI provides guidance on contacting administrators for unlimited access
- Usage limit message is shown in place of AI recommendations
- Visual indicators clearly communicate the limit status

**Notes:**
- Ensure messages are supportive rather than restrictive in tone
- Include visual progress indicator for usage tracking

## Technical Implementation

### Firebase Vertex AI Integration

The AI functionality is implemented using Firebase's Vertex AI service with the Gemini language model. This integration offers several advantages:

1. **Authentication and Security**: Seamless integration with Firebase Authentication ensures only authorized users can access AI features
2. **Cost Management**: Usage tracking in Firestore monitors API usage for billing transparency
3. **Deployment Consistency**: Hosting on the same Firebase infrastructure simplifies deployment and maintenance
4. **Scalability**: Vertex AI automatically scales with usage patterns
5. **Privacy**: Data remains within the Firebase ecosystem, enhancing security

### Usage Management

The system implements a robust usage tracking and limitation system:

1. **Usage Collection**: All AI requests are logged in the `aiUsage` collection for detailed analytics
2. **Weekly Tracking**: Weekly aggregated usage is stored in the `aiWeeklyUsage` collection by user and week
3. **Configuration**: System-wide limits are stored in the `config/aiLimits` document
4. **User Flags**: User bypass flags are stored in the user document as `unlimitedAiAccess` property
5. **Reset Logic**: Usage counters are automatically reset on Sunday at 00:00 by using a week-based document ID

### Data Structure

```
// Collection: aiUsage
{
  userId: "user123",
  timestamp: Timestamp,
  type: "stakeholder-recommendations",
  model: "gemini-1.5-pro",
  promptTokens: 500,
  outputTokens: 800
}

// Collection: aiWeeklyUsage
{
  // Document ID: user123_2023-07-02 (user ID + week start date)
  userId: "user123",
  weekId: "2023-07-02",
  startDate: Timestamp,
  endDate: Timestamp,
  callCount: 5,
  created: Timestamp,
  lastUpdated: Timestamp
}

// Collection: config
// Document: aiLimits
{
  weeklyCallLimit: 10  // Default limit per user per week
}

// Collection: users
// Document: user123
{
  // ... other user data ...
  unlimitedAiAccess: true  // Flag for unlimited access
}
```

### Cloud Functions

AI requests are processed through Firebase Cloud Functions, which handle:

1. Authentication verification
2. Usage limit verification
3. Prompt generation and formatting
4. Vertex AI API communication
5. Response parsing and formatting
6. Usage tracking in Firestore
7. Error handling and fallback responses

### User Experience

The UI is designed to provide a consistent experience for all users while clearly indicating authentication and usage requirements:

1. AI feature buttons are visible to all users
2. Unauthenticated users see a login prompt when attempting to access AI features
3. Users who have reached their limit see usage statistics and reset date
4. Loading states provide visual feedback during API calls
5. Responses are formatted in a clear, actionable way
6. Error states and fallbacks ensure a graceful experience when issues occur 