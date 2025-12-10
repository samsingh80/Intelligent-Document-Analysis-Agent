const axios = require('axios');

class AIcoreService {
  constructor() {
    // AI Core credentials
    this.config = {
      serviceurls: {
        AI_API_URL: "https://api.ai.prod.us-east-1.aws.ml.hana.ondemand.com"
      },
      clientid: "sb-1b96193e-7ab9-40af-af9f-b5c038c2bd18!b111507|aicore!b164",
      clientsecret: "23f9345d-c63f-44e9-bb64-78a7fd8dc4b5$m_u8QjzvUCr_UzVQaLoK84J5EJzwV2oILM5R54mMHfw=",
      url: "https://development-40qq74qu.authentication.us10.hana.ondemand.com",
      identityzone: "development-40qq74qu"
    };
    
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  /**
   * Get OAuth access token for AI Core
   */
  async getAccessToken() {
    // Check if token is still valid
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const tokenUrl = `${this.config.url}/oauth/token`;
      const params = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.config.clientid,
        client_secret: this.config.clientsecret
      });

      const response = await axios.post(tokenUrl, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      this.accessToken = response.data.access_token;
      // Set expiry to 5 minutes before actual expiry
      this.tokenExpiry = Date.now() + ((response.data.expires_in - 300) * 1000);
      
      return this.accessToken;
    } catch (error) {
      console.error('Error getting access token:', error.response?.data || error.message);
      throw new Error('Failed to authenticate with AI Core');
    }
  }

  /**
   * Get list of deployments from AI Core
   */
  async getDeployments() {
    try {
      const token = await this.getAccessToken();
      const url = `${this.config.serviceurls.AI_API_URL}/v2/lm/deployments`;

      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'AI-Resource-Group': 'default',
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching deployments:', error.response?.data || error.message);
      throw new Error('Failed to fetch AI Core deployments');
    }
  }

  /**
   * Call AI model for document comparison
   */
  async callModel(deploymentId, prompt, systemPrompt = null) {
    try {
      const token = await this.getAccessToken();
      
      // Use /invoke endpoint for Claude models (Anthropic format)
      const url = `${this.config.serviceurls.AI_API_URL}/v2/inference/deployments/${deploymentId}/invoke`;
      
      const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;

      const payload = {
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 4000,
        temperature: 0.1, // Lower temperature for more consistent scoring
        messages: [
          {
            role: 'user',
            content: fullPrompt
          }
        ]
      };

      const response = await axios.post(url, payload, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'AI-Resource-Group': 'default',
          'Content-Type': 'application/json'
        },
        timeout: 120000 // 2 minutes timeout
      });
      
      // Convert Anthropic response to OpenAI-like format
      return {
        choices: [{
          message: {
            content: response.data.content[0].text
          }
        }]
      };
    } catch (error) {
      console.error('Error calling AI model:', error.response?.data || error.message);
      throw new Error('Failed to call AI model');
    }
  }

  /**
   * Analyze document comparison using AI
   */
  async analyzeComparison(fsDocument, jouleResponse, deploymentId) {
    const systemPrompt = `You are an expert document analyzer. Your task is to:
1. First, intelligently detect what type of documents are being compared
2. Then provide a relevant comparison based on the document type

Return your analysis in JSON format with the following structure:
{
  "categories": [
    {
      "name": "Category Name (relevant to document type)",
      "weight": 0.10,
      "fsScore": 84.0,
      "weightedScore": 8.4,
      "status": "GOOD|EXCELLENT|CRITICAL GAP",
      "keyFinding": "Detailed finding description"
    }
  ],
  "overallScore": 75.5,
  "summary": "Overall assessment summary"
}

For different document types, use relevant categories:
- **Technical Specs/Requirements**: Solution Architecture, Business Process Coverage, Error Handling, Testing, Deployment
- **Invoices/Bills**: Amount Accuracy, Line Items Match, Dates & Periods, Vendor/Customer Info, Tax Calculations, Payment Terms
- **Contracts**: Terms & Conditions, Obligations, Deliverables, Timeline, Payment Terms, Legal Compliance
- **Reports**: Data Accuracy, Completeness, Insights Quality, Formatting, Timeliness
- **General Documents**: Content Accuracy, Completeness, Structure, Clarity, Relevance

Always use 4-6 categories with weights summing to 1.0.

Status criteria:
- EXCELLENT: Score >= 85
- GOOD: Score >= 70
- CRITICAL GAP: Score < 70`;

    const userPrompt = `Please analyze and compare the following two documents. First detect what type of documents these are, then provide a relevant comparison:

DOCUMENT 1:
${fsDocument.substring(0, 15000)}

DOCUMENT 2:
${jouleResponse.substring(0, 15000)}

Provide a detailed comparison with appropriate categories based on the document type.`;

    const response = await this.callModel(deploymentId, userPrompt, systemPrompt);
    
    try {
      // Extract JSON from response
      const content = response.choices[0].message.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('No valid JSON found in response');
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      // Return a default structure if parsing fails
      return this.getDefaultComparisonResult();
    }
  }

  /**
   * Get default comparison result structure
   */
  getDefaultComparisonResult() {
    return {
      categories: [
        {
          name: "Solution Architecture & Design",
          weight: 0.10,
          fsScore: 0,
          weightedScore: 0,
          status: "PENDING",
          keyFinding: "Analysis in progress"
        },
        {
          name: "Business Process Coverage",
          weight: 0.30,
          fsScore: 0,
          weightedScore: 0,
          status: "PENDING",
          keyFinding: "Analysis in progress"
        },
        {
          name: "Notification Design & UX",
          weight: 0.20,
          fsScore: 0,
          weightedScore: 0,
          status: "PENDING",
          keyFinding: "Analysis in progress"
        },
        {
          name: "Error Handling & Robustness",
          weight: 0.20,
          fsScore: 0,
          weightedScore: 0,
          status: "PENDING",
          keyFinding: "Analysis in progress"
        },
        {
          name: "Testing & Quality Assurance",
          weight: 0.10,
          fsScore: 0,
          weightedScore: 0,
          status: "PENDING",
          keyFinding: "Analysis in progress"
        },
        {
          name: "Deployment & Project Management",
          weight: 0.10,
          fsScore: 0,
          weightedScore: 0,
          status: "PENDING",
          keyFinding: "Analysis in progress"
        }
      ],
      overallScore: 0,
      summary: "Document comparison analysis is being processed"
    };
  }
}

module.exports = new AIcoreService();
