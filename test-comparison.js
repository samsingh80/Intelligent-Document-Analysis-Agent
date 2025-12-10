const aiCoreService = require('./srv/services/aicore-service');
const comparisonService = require('./srv/services/comparison-service');

async function testComparison() {
  console.log('🧪 Testing AI-powered document comparison...\n');
  
  const fsText = `
Functional Specification Document

1. User Authentication
- Users must authenticate using OAuth 2.0
- Session timeout: 30 minutes
- Multi-factor authentication required

2. Data Processing
- Maximum file size: 10MB
- Supported formats: PDF, DOCX, TXT
- Processing time: < 5 seconds

3. Security Requirements
- All data encrypted at rest
- TLS 1.3 for data in transit
- Regular security audits
  `;
  
  const jouleText = `
Joule Solution Proposal

1. Authentication Implementation
- We will implement OAuth 2.0 authentication
- Session timeout set to 20 minutes
- Two-factor authentication included

2. File Processing
- Maximum file size: 5MB
- Supported formats: PDF, DOCX
- Processing time: < 10 seconds

3. Security Measures
- Data encryption at rest using AES-256
- TLS 1.2 for secure transmission
- Monthly security reviews
  `;
  
  try {
    console.log('📄 FS Document length:', fsText.length, 'characters');
    console.log('📄 Joule Response length:', jouleText.length, 'characters');
    console.log('\n🤖 Calling AI Core for comparison...\n');
    
    const result = await comparisonService.compareDocuments(fsText, jouleText);
    
    console.log('✅ Comparison completed successfully!\n');
    console.log('📊 Results:');
    console.log('─'.repeat(60));
    console.log(JSON.stringify(result, null, 2));
    console.log('─'.repeat(60));
    
    if (result.categories && result.categories.length > 0) {
      console.log('\n📈 Category Scores:');
      result.categories.forEach(cat => {
        console.log(`  ${cat.name}: ${cat.fsScore}/100 - ${cat.status}`);
      });
    }
    
    console.log(`\n🎯 Overall Score: ${result.overallScore}/100`);
    console.log(`\n✨ AI Model Used: ${result.comparisonMetadata?.modelName || 'Unknown'}`);
    console.log(`📍 Deployment ID: ${result.comparisonMetadata?.deploymentId || 'Unknown'}`);
    
    return true;
  } catch (error) {
    console.error('❌ Comparison failed:', error.message);
    console.error('Error details:', error);
    return false;
  }
}

testComparison()
  .then(success => {
    if (success) {
      console.log('\n🎉 Test passed! AI comparison is working!');
      process.exit(0);
    } else {
      console.log('\n💔 Test failed!');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('\n💥 Unexpected error:', error);
    process.exit(1);
  });
