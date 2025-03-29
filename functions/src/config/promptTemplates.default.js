/**
 * Default Prompt Templates
 * Provides the base configuration for all AI prompt templates
 */

/**
 * Model configurations for different use cases
 */
const modelConfigs = {
  default: {
    model: 'gemini-1.5-pro',
    temperature: 0.7,
    maxOutputTokens: 1500,
    topK: 40,
    topP: 0.8
  },
  analytical: {
    model: 'gemini-1.5-pro',
    temperature: 0.4,
    maxOutputTokens: 1500,
    topK: 40,
    topP: 0.8
  },
  creative: {
    model: 'gemini-1.5-pro',
    temperature: 0.8,
    maxOutputTokens: 2000,
    topK: 60,
    topP: 0.9
  }
}

/**
 * Safety settings applied to all AI requests
 */
const safetySettings = [
  {
    category: 'HARM_CATEGORY_HARASSMENT',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE'
  },
  {
    category: 'HARM_CATEGORY_HATE_SPEECH',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE'
  },
  {
    category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE'
  },
  {
    category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE'
  }
]

/**
 * Prompt templates library
 */
const templates = {
  // Fallback template used when a requested template isn't found
  fallback: {
    instruction: 'You are an expert stakeholder management consultant. Please provide general advice based on the information below.',
    contextPattern: 'Information:\n${information}',
    outputFormat: 'Please provide your expert advice in a clear, structured format.',
    modelConfig: 'default'
  },

  // Individual stakeholder advice template
  stakeholderAdvice: {
    instruction: `
You are an expert stakeholder management consultant with deep experience in relationship building,
strategic communication, and influence. Please provide tailored, actionable advice for engaging with
the stakeholder described below.

Analyze their profile carefully (including their influence, impact, relationship quality, and recent
interactions) and provide specific, practical recommendations for how to effectively engage with them,
strengthen the relationship, and address any potential challenges.`,
    contextPattern: `
Stakeholder Profile:
Name: \${name}
Category: \${category}
Position: \${position}
Organization: \${organization}
Influence Level: \${influence}/10
Impact Level: \${impact}/10
Current Relationship: \${relationship}/10
Quadrant: \${quadrant}

Interests: \${interests}
Contribution: \${contribution}
Risk Factors: \${risk}

Current Communication Strategy: \${communication}
Current Engagement Strategy: \${strategy}

Recent Interactions:
\${interactions}`,
    arrayFormats: {
      interactions: '- Date: ${date}, Type: ${type}, Notes: ${notes}'
    },
    outputFormat: `
# Stakeholder Engagement Strategy for \${name}

## Relationship Assessment
[Provide a brief assessment of the current relationship status, strengths, and challenges]

## Communication Approach
[Recommend specific communication tactics, frequency, format, and tone that would work best for this stakeholder]

## Key Messages
[Suggest 3-5 key messages or talking points that would resonate with this stakeholder]

## Engagement Opportunities
[Identify 2-3 specific opportunities to strengthen the relationship]

## Potential Challenges
[Highlight any potential challenges or barriers and how to address them]

## Action Plan
[Provide a prioritized list of 3-5 specific actions to take in the next 30 days]`,
    modelConfig: 'default'
  },

  // Map-level recommendations template
  mapRecommendations: {
    instruction: `
You are an expert stakeholder management consultant with deep experience in relationship building,
strategic communication, and influence. Please analyze the stakeholder map described below and
provide prioritized, actionable recommendations for the most impactful next actions across the
entire stakeholder ecosystem.

Consider the influence-impact matrix positions, current relationship quality, recent interactions,
and any gaps or imbalances in the stakeholder portfolio. Focus on strategic opportunities to
strengthen key relationships, mitigate risks, and maximize overall stakeholder engagement effectiveness.`,
    contextPattern: `
MAP INFORMATION:
Name: \${name}
Description: \${description}
Project Name: \${projectName}
Project Goals: \${projectGoals}
Project Scope: \${projectScope}

STAKEHOLDERS:
\${stakeholders}`,
    arrayFormats: {
      stakeholders: `
Stakeholder: \${name}
Category: \${category}
Influence: \${influence}/10
Impact: \${impact}/10
Current Relationship: \${relationship}/10
Quadrant: \${quadrant}
Interests: \${interests}
Contribution: \${contribution}
Risk: \${risk}
Current Communication Strategy: \${communication}
Current Engagement Strategy: \${strategy}
Recent Interactions:
\${interactions}`
    },
    outputFormat: `
# Stakeholder Ecosystem Analysis and Recommendations

## Portfolio Assessment
[Provide a brief assessment of the current stakeholder ecosystem, including any patterns, gaps, or imbalances]

## Key Opportunities
[Identify 3-5 key strategic opportunities across the stakeholder ecosystem]

## Risk Areas
[Highlight 2-3 potential risk areas that need attention]

## Prioritized Recommendations
[Provide a prioritized list of 5-7 specific actions across different stakeholders, ranked by potential impact]

## Key Metrics to Track
[Suggest 3-5 metrics to track stakeholder engagement effectiveness]

## 30-60-90 Day Plan
[Outline key focus areas for the next 30, 60, and 90 days]`,
    modelConfig: 'analytical'
  },

  // JSON stakeholder recommendations template
  stakeholderRecommendationsJSON: {
    instruction: 'As an expert stakeholder engagement analyst, please provide strategic recommendations for the following stakeholder map:',
    contextPattern: `
MAP INFORMATION:
Name: \${name}
Description: \${description}
Project Name: \${projectName}
Project Goals: \${projectGoals}
Project Scope: \${projectScope}

STAKEHOLDERS:
\${stakeholders}`,
    arrayFormats: {
      stakeholders: `
Stakeholder: \${name}
Category: \${category}
Influence: \${influence}/10
Impact: \${impact}/10
Current Relationship: \${relationship}/10
Quadrant: \${quadrant}
Interests: \${interests}
Contribution: \${contribution}
Risk: \${risk}
Current Communication Strategy: \${communication}
Current Engagement Strategy: \${strategy}
Recent Interactions:
\${interactions}`
    },
    outputFormat: `
Based on this information, please provide the following in JSON format:
1. Overall engagement strategy recommendations for the project
2. Specific recommendations for each stakeholder's engagement approach
3. Communication priorities and key messages
4. Risk management strategies
5. Potential opportunities for improving stakeholder relationships

Your response should be in valid JSON format with the following structure:
{
  "overallStrategy": {
    "summary": "Brief summary of overall strategy",
    "keyPriorities": ["Priority 1", "Priority 2", ...],
    "criticalStakeholders": ["Stakeholder 1", "Stakeholder 2", ...],
    "recommendedActions": ["Action 1", "Action 2", ...]
  },
  "stakeholderSpecificRecommendations": {
    "stakeholderName1": {
      "engagementApproach": "Description of approach",
      "communicationChannels": ["Channel 1", "Channel 2", ...],
      "keyMessages": ["Message 1", "Message 2", ...],
      "riskMitigation": "Risk mitigation strategy"
    },
    "stakeholderName2": {
      ...
    }
  },
  "communicationPriorities": [
    "Priority 1",
    "Priority 2",
    ...
  ],
  "riskManagement": {
    "topRisks": [
      {
        "description": "Risk description",
        "stakeholdersInvolved": ["Stakeholder 1", ...],
        "mitigationStrategy": "Strategy description"
      },
      ...
    ]
  },
  "opportunityAreas": [
    {
      "description": "Opportunity description",
      "stakeholdersInvolved": ["Stakeholder 1", ...],
      "potentialApproach": "Approach description"
    },
    ...
  ]
}`,
    modelConfig: 'analytical'
  },

  // Issue-specific engagement recommendations template
  issueSpecific: {
    instruction: `
You are an expert stakeholder management consultant specializing in issue-based engagement strategies.
Please analyze the stakeholder map and the specific issue described below to provide tailored
recommendations for engaging key stakeholders around this issue.`,
    contextPattern: `
MAP INFORMATION:
Name: \${name}
Description: \${description}

SPECIFIC ISSUE TO ADDRESS:
\${issue}

STAKEHOLDERS:
\${stakeholders}`,
    arrayFormats: {
      stakeholders: `
Stakeholder: \${name}
Category: \${category}
Influence: \${influence}/10
Impact: \${impact}/10
Current Relationship: \${relationship}/10
Quadrant: \${quadrant}
Interests: \${interests}
Contribution: \${contribution}
Risk: \${risk}`
    },
    outputFormat: `
# Issue-Based Engagement Strategy: \${issue}

## Stakeholder Impact Analysis
[Analyze how this issue affects different stakeholders, who has the most at stake]

## Key Stakeholders for This Issue
[List the 3-5 most important stakeholders to engage on this issue and why]

## Engagement Approach
[Provide a strategic approach for engaging stakeholders on this issue]

## Talking Points by Stakeholder
[Provide specific talking points customized for each key stakeholder]

## Potential Concerns and Objections
[Identify likely concerns or objections and how to address them]

## Coalition Building Opportunities
[Suggest potential alliances or stakeholder groupings around this issue]`,
    modelConfig: 'creative'
  },

  // Influence network analysis template
  influenceNetwork: {
    instruction: `
You are an expert network analyst specializing in organizational influence mapping.
Please analyze the stakeholder ecosystem described below and identify influence
relationships, coalitions, and influence pathways.`,
    contextPattern: `
MAP INFORMATION:
Name: \${name}
Description: \${description}
Project Name: \${projectName}

STAKEHOLDERS:
\${stakeholders}`,
    arrayFormats: {
      stakeholders: `
Stakeholder: \${name}
Category: \${category}
Position: \${position}
Organization: \${organization}
Influence: \${influence}/10
Impact: \${impact}/10
Current Relationship: \${relationship}/10
Quadrant: \${quadrant}
Interests: \${interests}`
    },
    outputFormat: `
# Influence Network Analysis

## Identified Influence Relationships
[Provide a list of likely influence relationships between stakeholders based on their roles, interests, and positions]

## Potential Coalitions
[Identify 2-4 potential stakeholder coalitions or alliances based on shared interests or objectives]

## Key Influencers
[List the top influential stakeholders and explain their spheres of influence]

## Influence Pathways
[For 2-3 hard-to-reach stakeholders, suggest influence pathways through intermediaries]

## Network Gaps
[Identify any gaps or weak points in the influence network]`,
    modelConfig: 'analytical'
  }
}

module.exports = {
  modelConfigs,
  safetySettings,
  templates
}
