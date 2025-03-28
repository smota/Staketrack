/**
 * AI Service
 * Handles interactions with the Anthropic Claude API for stakeholder recommendations
 */
import config from '@/config'

class AIService {
  /**
   * Default API options
   */
  defaultOptions = {
    model: 'claude-3-opus-20240229',
    temperature: 0.7,
    maxTokens: 1500,
    apiVersion: '2023-06-01'
  }

  /**
   * Get AI-powered stakeholder engagement recommendations
   * @param {StakeholderMap} map - The stakeholder map
   * @param {Object} options - Options for the request
   * @returns {Promise<Object>} Recommendations data
   */
  async getStakeholderRecommendations(map, options = {}) {
    try {
      // Check for API key
      const apiKey = config.env.anthropicApiKey

      if (!apiKey) {
        console.error('Anthropic API key not found')
        return this._getFallbackRecommendations(map)
      }

      // Build prompt from map data
      const prompt = this._buildStakeholderRecommendationsPrompt(map, options)

      // Prepare request
      const requestOptions = {
        ...this.defaultOptions,
        ...options
      }

      // Make request to Anthropic API
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': requestOptions.apiVersion
        },
        body: JSON.stringify({
          model: requestOptions.model,
          temperature: requestOptions.temperature,
          max_tokens: requestOptions.maxTokens,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          response_format: { type: 'json_object' }
        })
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      // Process and format the AI response
      return this._processAIResponse(data, map)
    } catch (error) {
      console.error('Error getting AI recommendations:', error)

      // Provide fallback recommendations if something goes wrong
      return this._getFallbackRecommendations(map)
    }
  }

  /**
   * Build a detailed prompt for stakeholder recommendations
   * @param {StakeholderMap} map - The stakeholder map
   * @param {Object} options - Options for customizing the prompt
   * @returns {string} Formatted prompt string
   * @private
   */
  _buildStakeholderRecommendationsPrompt(map, options = {}) {
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

    // Build the complete prompt
    const prompt = `As an expert stakeholder engagement analyst, please provide strategic recommendations for the following stakeholder map:

MAP INFORMATION:
Name: ${name}
Description: ${description}
${projectName ? `Project Name: ${projectName}` : ''}
${projectGoals ? `Project Goals: ${projectGoals}` : ''}
${projectScope ? `Project Scope: ${projectScope}` : ''}

STAKEHOLDERS:
${stakeholderData}

${options.specificFocus ? `Please focus specifically on: ${options.specificFocus}` : ''}

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

    return prompt
  }

  /**
   * Process and format the AI response
   * @param {Object} response - Raw API response
   * @param {StakeholderMap} map - The stakeholder map
   * @returns {Object} Processed recommendations
   * @private
   */
  _processAIResponse(response, map) {
    try {
      // Get the AI-generated content
      const content = response.content || response.choices?.[0]?.message?.content

      if (!content) {
        throw new Error('No content found in AI response')
      }

      let parsedContent

      // If the response is already JSON, use it
      if (typeof content === 'object') {
        parsedContent = content
      } else {
        // Parse JSON string
        // First try to extract JSON if it's wrapped in markdown code blocks
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
        const jsonString = jsonMatch ? jsonMatch[1] : content

        parsedContent = JSON.parse(jsonString)
      }

      // Add metadata
      return {
        ...parsedContent,
        metadata: {
          generatedAt: new Date().toISOString(),
          model: response.model || this.defaultOptions.model,
          mapId: map.id,
          mapName: map.name
        }
      }
    } catch (error) {
      console.error('Error processing AI response:', error)
      return this._getFallbackRecommendations(map)
    }
  }

  /**
   * Generate fallback recommendations when the AI service fails
   * @param {StakeholderMap} map - The stakeholder map
   * @returns {Object} Simple fallback recommendations
   * @private
   */
  _getFallbackRecommendations(map) {
    // Get high-influence stakeholders
    const highInfluence = map.stakeholders
      .filter(s => s.influence >= 7)
      .map(s => s.name)

    // Get stakeholders in the "manage closely" quadrant
    const manageClosely = map.stakeholders
      .filter(s => s.quadrant === 'manage-closely')
      .map(s => s.name)

    // Basic stakeholder-specific recommendations
    const stakeholderRecsByName = {}
    map.stakeholders.forEach(s => {
      stakeholderRecsByName[s.name] = {
        engagementApproach: this._getBasicEngagementApproach(s),
        communicationChannels: this._getBasicCommunicationChannels(s),
        keyMessages: ['Focus on project benefits', 'Address specific concerns'],
        riskMitigation: s.risk || 'Maintain regular communication'
      }
    })

    return {
      overallStrategy: {
        summary: 'Focus on regular communication with key stakeholders while maintaining transparency across all groups',
        keyPriorities: [
          'Establish regular communication cadence',
          'Develop clear messaging about project goals',
          'Identify and address stakeholder concerns early'
        ],
        criticalStakeholders: highInfluence.length > 0 ? highInfluence : ['No high-influence stakeholders identified'],
        recommendedActions: [
          'Schedule individual meetings with high-influence stakeholders',
          'Create a communication plan with regular updates',
          'Document and address stakeholder feedback'
        ]
      },
      stakeholderSpecificRecommendations: stakeholderRecsByName,
      communicationPriorities: [
        'Ensure all stakeholders understand project goals and timeline',
        'Provide regular status updates to maintain transparency',
        'Create tailored messages for different stakeholder groups'
      ],
      riskManagement: {
        topRisks: [
          {
            description: 'Lack of stakeholder buy-in for project approach',
            stakeholdersInvolved: manageClosely.length > 0 ? manageClosely : ['All stakeholders'],
            mitigationStrategy: 'Increase communication frequency and collect regular feedback'
          }
        ]
      },
      opportunityAreas: [
        {
          description: 'Improve stakeholder relationships through more regular engagement',
          stakeholdersInvolved: ['All stakeholders'],
          potentialApproach: 'Implement regular check-ins and feedback mechanisms'
        }
      ],
      metadata: {
        generatedAt: new Date().toISOString(),
        mapId: map.id,
        mapName: map.name,
        note: 'These are fallback recommendations. For more personalized insights, please try again later.'
      }
    }
  }

  /**
   * Get basic engagement approach based on stakeholder quadrant
   * @param {Stakeholder} stakeholder - The stakeholder
   * @returns {string} Basic engagement approach
   * @private
   */
  _getBasicEngagementApproach(stakeholder) {
    switch (stakeholder.quadrant) {
    case 'manage-closely':
      return 'Regular personal meetings and proactive engagement'
    case 'keep-satisfied':
      return 'Regular updates and consultation on decisions'
    case 'keep-informed':
      return 'Regular communication and updates'
    case 'monitor':
      return 'Periodic updates and monitoring of needs'
    default:
      return 'Maintain appropriate level of communication'
    }
  }

  /**
   * Get basic communication channels based on stakeholder category
   * @param {Stakeholder} stakeholder - The stakeholder
   * @returns {string[]} Suggested communication channels
   * @private
   */
  _getBasicCommunicationChannels(stakeholder) {
    const category = stakeholder.category

    const channels = ['Email', 'Project updates']

    if (category === 'internal' || category === 'employee') {
      channels.push('Team meetings', 'Internal communication tools')
    }

    if (stakeholder.quadrant === 'manage-closely' || stakeholder.quadrant === 'keep-satisfied') {
      channels.push('One-on-one meetings', 'Phone calls')
    }

    if (category === 'external' || category === 'community') {
      channels.push('Public communications')
    }

    if (category === 'customer') {
      channels.push('Customer feedback sessions')
    }

    if (category === 'regulator') {
      channels.push('Formal written communications')
    }

    return channels
  }
}

export default new AIService()
