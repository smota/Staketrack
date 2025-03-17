// import { analytics } from '../../firebase/firebaseConfig.js';
import { promptBuilder } from '../utils/promptBuilder.js';

/**
 * LLM Service - Handles interactions with Anthropic's Claude API
 */
export class LLMService {
  constructor(apiKey = null) {
    this.apiKey = apiKey;
    this.apiEndpoint = 'https://api.anthropic.com/v1/messages';
    this.model = 'claude-3-opus-20240229'; // Default model

    // Get analytics from window
    this.analytics = window.firebaseAnalytics;
  }

  /**
   * Set the API key for Claude
   * @param {string} apiKey - Anthropic API key
   */
  setApiKey(apiKey) {
    this.apiKey = apiKey;
  }

  /**
   * Get stakeholder engagement advice
   * @param {Stakeholder} stakeholder - Stakeholder to get advice for
   * @returns {Promise<string>} - Formatted advice text
   */
  async getStakeholderAdvice(stakeholder) {
    try {
      // Track analytics
      this.analytics.logEvent('get_stakeholder_advice', {
        stakeholder_id: stakeholder.id,
        stakeholder_category: stakeholder.category
      });

      // Build prompt using the prompt builder
      const prompt = promptBuilder.buildStakeholderAdvicePrompt(stakeholder);

      // Call Claude API
      const response = await this._callClaudeAPI(prompt);

      return response;
    } catch (error) {
      console.error('Error getting stakeholder advice:', error);
      throw error;
    }
  }

  /**
   * Get next best action recommendations for the entire map
   * @param {StakeholderMap} map - Map to get recommendations for
   * @returns {Promise<string>} - Formatted recommendations text
   */
  async getMapRecommendations(map) {
    try {
      // Track analytics
      this.analytics.logEvent('get_map_recommendations', {
        map_id: map.id,
        stakeholders_count: map.stakeholders.length
      });

      // Build prompt using the prompt builder
      const prompt = promptBuilder.buildMapRecommendationsPrompt(map);

      // Call Claude API
      const response = await this._callClaudeAPI(prompt);

      return response;
    } catch (error) {
      console.error('Error getting map recommendations:', error);
      throw error;
    }
  }

  /**
   * Call the Claude API
   * @param {Object} prompt - Prompt object with instruction, context, and output format
   * @returns {Promise<string>} - API response text
   * @private
   */
  async _callClaudeAPI(prompt) {
    if (!this.apiKey) {
      throw new Error('Claude API key not set. Please set your API key in the settings.');
    }

    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 1500,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `${prompt.instruction}\n\nCONTEXT:\n${prompt.context}\n\nOUTPUT FORMAT:\n${prompt.outputFormat}`
                }
              ]
            }
          ]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Claude API error (${response.status}): ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      return data.content[0].text;
    } catch (error) {
      console.error('Claude API call error:', error);
      throw error;
    }
  }
}

// Singleton instance
export default new LLMService();
