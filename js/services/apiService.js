import { env } from '../utils/environmentLoader.js';

/**
 * Service for making secure API calls
 */
class ApiService {
  /**
   * Make a secure call to the Anthropic API
   * @param {Object} params - API call parameters
   * @returns {Promise<Object>} API response
   */
  async callAnthropic(params) {
    if (!env.ANTHROPIC_API_KEY) {
      throw new Error('Anthropic API key not found in environment variables');
    }
    
    try {
      const response = await fetch(env.ANTHROPIC_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify(params)
      });
      
      if (!response.ok) {
        throw new Error(`API call failed with status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error calling Anthropic API:', error);
      throw error;
    }
  }
}

export default new ApiService(); 