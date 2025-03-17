/**
 * Prompt Builder - Utility for building structured prompts for the LLM service
 */
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
    `;
    
    const context = stakeholder.toLLMContext(5);
    
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
    `;
    
    return {
      instruction,
      context,
      outputFormat
    };
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
    `;
    
    const context = map.toLLMContext(3);
    
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
    `;
    
    return {
      instruction,
      context,
      outputFormat
    };
  }
}

// Singleton instance
export const promptBuilder = new PromptBuilder();
