/**
 * Prompt Builder - Utility for building structured prompts for the LLM service
 * Centralizes all AI prompt templates and configuration options
 */

/**
 * Model configuration options for different use cases
 */
export const ModelConfig = {
  // Default config for balanced responses
  default: {
    model: 'gemini-1.5-pro',
    temperature: 0.7,
    maxTokens: 1500,
    topK: 40,
    topP: 0.8
  },
  // Lower temperature for factual/analytical responses
  analytical: {
    model: 'gemini-1.5-pro',
    temperature: 0.4,
    maxTokens: 1500,
    topK: 40,
    topP: 0.8
  },
  // Higher temperature for creative recommendations
  creative: {
    model: 'gemini-1.5-pro',
    temperature: 0.8,
    maxTokens: 2000,
    topK: 60,
    topP: 0.9
  }
}

/**
 * Safety settings applied to all AI requests
 */
export const SafetySettings = [
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

export class PromptBuilder {
  /**
   * Build a prompt for stakeholder engagement advice
   * @param {Stakeholder} stakeholder - Stakeholder to get advice for
   * @returns {Object} - Prompt object with instruction, context, and output format
   */
  buildStakeholderAdvicePrompt(stakeholder) {
    const instruction = `
    You are an expert stakeholder management consultant with deep experience in relationship building,
    strategic communication, and influence. Please provide tailored, actionable advice for engaging with
    the stakeholder described below.
    
    Analyze their profile carefully (including their influence, impact, relationship quality, and recent
    interactions) and provide specific, practical recommendations for how to effectively engage with them,
    strengthen the relationship, and address any potential challenges.
    `

    const context = stakeholder.toLLMContext(5)

    const outputFormat = `
    # Stakeholder Engagement Strategy for ${stakeholder.name}
    
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
    [Provide a prioritized list of 3-5 specific actions to take in the next 30 days]
    `

    return {
      instruction,
      context,
      outputFormat,
      modelConfig: ModelConfig.default
    }
  }

  /**
   * Build a prompt for map-level next best action recommendations
   * @param {StakeholderMap} map - Map to get recommendations for
   * @returns {Object} - Prompt object with instruction, context, and output format
   */
  buildMapRecommendationsPrompt(map) {
    const instruction = `
    You are an expert stakeholder management consultant with deep experience in relationship building,
    strategic communication, and influence. Please analyze the stakeholder map described below and
    provide prioritized, actionable recommendations for the most impactful next actions across the
    entire stakeholder ecosystem.
    
    Consider the influence-impact matrix positions, current relationship quality, recent interactions,
    and any gaps or imbalances in the stakeholder portfolio. Focus on strategic opportunities to
    strengthen key relationships, mitigate risks, and maximize overall stakeholder engagement effectiveness.
    `

    const context = map.toLLMContext(3)

    const outputFormat = `
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
    [Outline key focus areas for the next 30, 60, and 90 days]
    `

    return {
      instruction,
      context,
      outputFormat,
      modelConfig: ModelConfig.analytical
    }
  }

  /**
   * Build a detailed prompt for stakeholder recommendations with JSON output
   * @param {StakeholderMap} map - The stakeholder map
   * @param {Object} options - Options for customizing the prompt
   * @returns {Object} Formatted prompt with structure and model config
   */
  buildStakeholderRecommendationsJSONPrompt(map, options = {}) {
    // Extract relevant information from the map
    const { stakeholders, name, description, projectName, projectGoals, projectScope } = map

    // Format stakeholder data for the prompt
    const stakeholderData = stakeholders.map(s => {
      // Get recent interactions (limited to 3)
      const recentInteractions = s.interactions
        .slice(0, 3)
        .map(i => `- Date: ${i.date.toISOString().split('T')[0]}, Type: ${i.type}, Notes: ${i.notes}`)
        .join('\n')

      return `
Stakeholder: ${s.name}
Category: ${s.category}
Influence: ${s.influence}/10
Impact: ${s.impact}/10
Current Relationship: ${s.relationship}/10
Quadrant: ${s.quadrant}
Interests: ${s.interests}
Contribution: ${s.contribution}
Risk: ${s.risk}
Current Communication Strategy: ${s.communication}
Current Engagement Strategy: ${s.strategy}
Recent Interactions:
${recentInteractions || '- No recent interactions recorded'}`
    }).join('\n\n')

    // Build the instruction part
    const instruction = 'As an expert stakeholder engagement analyst, please provide strategic recommendations for the following stakeholder map:'

    // Build the context part
    const context = `
MAP INFORMATION:
Name: ${name}
Description: ${description}
${projectName ? `Project Name: ${projectName}` : ''}
${projectGoals ? `Project Goals: ${projectGoals}` : ''}
${projectScope ? `Project Scope: ${projectScope}` : ''}

STAKEHOLDERS:
${stakeholderData}

${options.specificFocus ? `Please focus specifically on: ${options.specificFocus}` : ''}`

    // Build the output format part
    const outputFormat = `
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
}`

    return {
      instruction,
      context,
      outputFormat,
      modelConfig: ModelConfig.analytical
    }
  }

  /**
   * Build a prompt for issue-specific engagement recommendations
   * @param {StakeholderMap} map - The stakeholder map
   * @param {string} issue - The specific issue to analyze
   * @returns {Object} - Prompt object with instruction, context, and output format
   */
  buildIssueSpecificPrompt(map, issue) {
    const instruction = `
    You are an expert stakeholder management consultant specializing in issue-based engagement strategies.
    Please analyze the stakeholder map and the specific issue described below to provide tailored
    recommendations for engaging key stakeholders around this issue.
    `

    const context = `
    MAP INFORMATION:
    Name: ${map.name}
    Description: ${map.description}
    
    SPECIFIC ISSUE TO ADDRESS:
    ${issue}
    
    STAKEHOLDERS:
    ${map.toLLMContext(2)}
    `

    const outputFormat = `
    # Issue-Based Engagement Strategy: ${issue}
    
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
    [Suggest potential alliances or stakeholder groupings around this issue]
    `

    return {
      instruction,
      context,
      outputFormat,
      modelConfig: ModelConfig.creative
    }
  }

  /**
   * Build a prompt for influence network analysis
   * @param {StakeholderMap} map - The stakeholder map to analyze
   * @returns {Object} - Prompt object with components
   */
  buildInfluenceNetworkPrompt(map) {
    const instruction = `
    You are an expert network analyst specializing in organizational influence mapping.
    Please analyze the stakeholder ecosystem described below and identify influence
    relationships, coalitions, and influence pathways.
    `

    const context = map.toLLMContext(3)

    const outputFormat = `
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
    [Identify any gaps or weak points in the influence network]
    `

    return {
      instruction,
      context,
      outputFormat,
      modelConfig: ModelConfig.analytical
    }
  }

  /**
   * Format a complete prompt from components
   * @param {Object} promptComponents - The prompt components (instruction, context, outputFormat)
   * @returns {string} - The formatted complete prompt
   */
  formatCompletePrompt(promptComponents) {
    return `${promptComponents.instruction.trim()}

${promptComponents.context.trim()}

${promptComponents.outputFormat.trim()}`
  }
}

// Singleton instance
export const promptBuilder = new PromptBuilder()
