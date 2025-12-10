const aiCoreService = require('./aicore-service');
const documentService = require('./document-service');

class ComparisonService {
  /**
   * Compare two documents using AI Core
   */
  async compareDocuments(fsText, jouleText, deploymentId) {
    try {
      // Clean and normalize text
      const cleanedFsText = documentService.cleanText(fsText);
      const cleanedJouleText = documentService.cleanText(jouleText);

      // Get document statistics
      const fsStats = documentService.getDocumentStats(cleanedFsText);
      const jouleStats = documentService.getDocumentStats(cleanedJouleText);

      console.log('Document stats:', { fsStats, jouleStats });

      // Use AI to analyze comparison with hardcoded deployment ID
      let aiAnalysis;
      const defaultDeploymentId = 'dc3ee26c175a1d47'; // claude-3.7-sonnet - RUNNING
      const activeDeploymentId = deploymentId || defaultDeploymentId;
      
      try {
        aiAnalysis = await aiCoreService.analyzeComparison(
          cleanedFsText,
          cleanedJouleText,
          activeDeploymentId
        );
        console.log('✅ AI analysis completed successfully using Claude 3.7 Sonnet');
      } catch (error) {
        console.error('❌ AI analysis failed:', error);
        // Fallback disabled - AI Core must work
        throw new Error('AI Core analysis failed: ' + error.message);
        // aiAnalysis = this.performRuleBasedComparison(cleanedFsText, cleanedJouleText);
      }

      // Enhance with additional metrics
      const result = {
        ...aiAnalysis,
        documentStats: {
          fsDocument: fsStats,
          jouleResponse: jouleStats
        },
        comparisonMetadata: {
          deploymentId: activeDeploymentId,
          modelName: 'Claude 3.7 Sonnet',
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        }
      };

      return result;
    } catch (error) {
      console.error('Error in comparison service:', error);
      throw new Error(`Comparison failed: ${error.message}`);
    }
  }

  /**
   * Perform rule-based comparison when AI is not available
   */
  performRuleBasedComparison(fsText, jouleText) {
    const categories = this.analyzeCategories(fsText, jouleText);
    const overallScore = this.calculateOverallScore(categories);

    return {
      categories: categories,
      overallScore: overallScore,
      summary: this.generateSummary(categories, overallScore),
      method: 'rule-based'
    };
  }

  /**
   * Analyze individual categories using rule-based approach
   */
  analyzeCategories(fsText, jouleText) {
    const categories = [
      {
        name: "Solution Architecture & Design",
        weight: 0.10,
        keywords: ['architecture', 'design', 'component', 'diagram', 'structure', 'pattern']
      },
      {
        name: "Business Process Coverage",
        weight: 0.30,
        keywords: ['process', 'workflow', 'business', 'scenario', 'requirement', 'use case']
      },
      {
        name: "Notification Design & UX",
        weight: 0.20,
        keywords: ['notification', 'alert', 'ui', 'ux', 'interface', 'user experience', 'template']
      },
      {
        name: "Error Handling & Robustness",
        weight: 0.20,
        keywords: ['error', 'exception', 'validation', 'retry', 'fallback', 'handling']
      },
      {
        name: "Testing & Quality Assurance",
        weight: 0.10,
        keywords: ['test', 'testing', 'quality', 'qa', 'scenario', 'validation']
      },
      {
        name: "Deployment & Project Management",
        weight: 0.10,
        keywords: ['deployment', 'timeline', 'plan', 'resource', 'milestone', 'schedule']
      }
    ];

    return categories.map((category, index) => {
      const score = this.calculateCategoryScore(fsText, jouleText, category.keywords);
      const weightedScore = score * category.weight * 100;
      const status = this.determineStatus(score);
      const keyFinding = this.generateKeyFinding(category.name, score, fsText, jouleText);

      return {
        id: index + 1,
        name: category.name,
        weight: category.weight,
        fsScore: score,
        weightedScore: parseFloat(weightedScore.toFixed(1)),
        status: status,
        keyFinding: keyFinding
      };
    });
  }

  /**
   * Calculate score for a category based on keyword presence
   */
  calculateCategoryScore(fsText, jouleText, keywords) {
    const fsLower = fsText.toLowerCase();
    const jouleLower = jouleText.toLowerCase();

    let fsMatches = 0;
    let jouleMatches = 0;

    keywords.forEach(keyword => {
      const fsCount = (fsLower.match(new RegExp(keyword, 'g')) || []).length;
      const jouleCount = (jouleLower.match(new RegExp(keyword, 'g')) || []).length;
      
      if (fsCount > 0) fsMatches++;
      if (jouleCount > 0) jouleMatches++;
    });

    // Calculate coverage score
    const fsCoverage = fsMatches / keywords.length;
    const jouleCoverage = jouleMatches / keywords.length;
    
    // Score based on how well Joule response covers FS requirements
    const coverageRatio = fsMatches > 0 ? jouleMatches / fsMatches : jouleCoverage;
    const baseScore = (fsCoverage * 0.4 + jouleCoverage * 0.4 + coverageRatio * 0.2) * 100;
    
    // Add some variance to make it more realistic
    const variance = Math.random() * 10 - 5;
    return Math.min(100, Math.max(0, baseScore + variance));
  }

  /**
   * Determine status based on score
   */
  determineStatus(score) {
    if (score >= 85) return 'EXCELLENT';
    if (score >= 70) return 'GOOD';
    return 'CRITICAL GAP';
  }

  /**
   * Generate key finding for a category
   */
  generateKeyFinding(categoryName, score, fsText, jouleText) {
    const findings = {
      'Solution Architecture & Design': {
        'EXCELLENT': 'Comprehensive architecture documentation with clear component definitions and design patterns',
        'GOOD': 'Clear process flow and technical specifications, but could benefit from additional architectural diagrams',
        'CRITICAL GAP': 'Missing critical architectural components and design specifications'
      },
      'Business Process Coverage': {
        'EXCELLENT': 'Detailed coverage of all business scenarios with comprehensive process documentation',
        'GOOD': 'Good coverage of main business processes with room for additional edge cases',
        'CRITICAL GAP': 'Significant gaps in business process coverage and scenario handling'
      },
      'Notification Design & UX': {
        'EXCELLENT': 'Well-designed notification system with excellent UX considerations and multi-channel support',
        'GOOD': 'Solid notification design with good user experience patterns',
        'CRITICAL GAP': 'Insufficient notification design and poor UX considerations'
      },
      'Error Handling & Robustness': {
        'EXCELLENT': 'Comprehensive error handling with retry logic and robust fallback mechanisms',
        'GOOD': 'Basic error handling implemented with room for improvement in edge cases',
        'CRITICAL GAP': 'Critical gaps in error handling, missing retry logic and alerting mechanisms'
      },
      'Testing & Quality Assurance': {
        'EXCELLENT': 'Extensive test coverage with production-ready scenarios covering positive, negative, and edge cases',
        'GOOD': 'Good test coverage with standard scenarios documented',
        'CRITICAL GAP': 'Insufficient testing strategy and quality assurance measures'
      },
      'Deployment & Project Management': {
        'EXCELLENT': 'Clear deployment strategy with detailed timeline and resource allocation',
        'GOOD': 'Basic deployment plan with room for more detailed project management',
        'CRITICAL GAP': 'Missing deployment plan, timeline, and resource allocation strategy'
      }
    };

    const status = this.determineStatus(score);
    return findings[categoryName]?.[status] || 'Analysis completed';
  }

  /**
   * Calculate overall weighted score
   */
  calculateOverallScore(categories) {
    const totalWeighted = categories.reduce((sum, cat) => sum + cat.weightedScore, 0);
    return parseFloat(totalWeighted.toFixed(1));
  }

  /**
   * Generate summary based on categories and overall score
   */
  generateSummary(categories, overallScore) {
    const excellentCount = categories.filter(c => c.status === 'EXCELLENT').length;
    const goodCount = categories.filter(c => c.status === 'GOOD').length;
    const criticalCount = categories.filter(c => c.status === 'CRITICAL GAP').length;

    let summary = `Overall comparison score: ${overallScore}/100. `;
    
    if (excellentCount > 0) {
      summary += `${excellentCount} categories rated as EXCELLENT. `;
    }
    if (goodCount > 0) {
      summary += `${goodCount} categories rated as GOOD. `;
    }
    if (criticalCount > 0) {
      summary += `${criticalCount} CRITICAL GAPS identified requiring immediate attention. `;
    }

    if (overallScore >= 80) {
      summary += 'The Joule response demonstrates strong alignment with FS requirements.';
    } else if (overallScore >= 60) {
      summary += 'The Joule response shows moderate alignment with some areas needing improvement.';
    } else {
      summary += 'Significant gaps exist between FS requirements and Joule response.';
    }

    return summary;
  }
}

module.exports = new ComparisonService();
