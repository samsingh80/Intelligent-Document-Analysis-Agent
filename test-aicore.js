const axios = require('axios');

const config = {
  serviceurls: {
    AI_API_URL: "https://api.ai.prod.us-east-1.aws.ml.hana.ondemand.com"
  },
  clientid: "sb-1b96193e-7ab9-40af-af9f-b5c038c2bd18!b111507|aicore!b164",
  clientsecret: "23f9345d-c63f-44e9-bb64-78a7fd8dc4b5$m_u8QjzvUCr_UzVQaLoK84J5EJzwV2oILM5R54mMHfw=",
  url: "https://development-40qq74qu.authentication.us10.hana.ondemand.com",
  identityzone: "development-40qq74qu"
};

async function getAccessToken() {
  const tokenUrl = `${config.url}/oauth/token`;
  const auth = Buffer.from(`${config.clientid}:${config.clientsecret}`).toString('base64');
  
  const response = await axios.post(tokenUrl, 
    'grant_type=client_credentials',
    {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }
  );
  
  return response.data.access_token;
}

async function testChatEndpoint(deploymentId) {
  try {
    console.log(`\n🧪 Testing deployment: ${deploymentId}`);
    const token = await getAccessToken();
    console.log('✅ Got access token');
    
    // Try chat/completions
    const chatUrl = `${config.serviceurls.AI_API_URL}/v2/inference/deployments/${deploymentId}/chat/completions`;
    console.log(`📡 Trying: ${chatUrl}`);
    
    try {
      const response = await axios.post(chatUrl, {
        messages: [
          { role: 'user', content: 'Say "Hello from AI Core!"' }
        ],
        max_tokens: 50
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'AI-Resource-Group': 'default',
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });
      
      console.log('✅ chat/completions works!');
      console.log('Response:', response.data.choices[0].message.content);
      return true;
    } catch (chatError) {
      if (chatError.response?.status === 404) {
        console.log('❌ chat/completions returned 404, trying completions...');
        
        // Try completions
        const completionsUrl = `${config.serviceurls.AI_API_URL}/v2/inference/deployments/${deploymentId}/completions`;
        console.log(`📡 Trying: ${completionsUrl}`);
        
        try {
          const response = await axios.post(completionsUrl, {
            prompt: 'Say "Hello from AI Core!"',
            max_tokens: 50
          }, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'AI-Resource-Group': 'default',
              'Content-Type': 'application/json'
            },
            timeout: 30000
          });
          
          console.log('✅ completions works!');
          console.log('Response:', response.data.choices[0].text);
          return true;
        } catch (completionsError) {
          console.log('❌ completions also failed, trying foundation-models format...');
          
          // Try foundation-models specific endpoint
          const fmUrl = `${config.serviceurls.AI_API_URL}/v2/inference/deployments/${deploymentId}`;
          console.log(`📡 Trying: ${fmUrl} (POST with messages)`);
          
          const response = await axios.post(fmUrl, {
            messages: [
              { role: 'user', content: 'Say "Hello from AI Core!"' }
            ],
            max_tokens: 50
          }, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'AI-Resource-Group': 'default',
              'Content-Type': 'application/json'
            },
            timeout: 30000
          });
          
          console.log('✅ foundation-models format works!');
          console.log('Response:', JSON.stringify(response.data, null, 2));
          return true;
        }
      } else if (chatError.response?.data?.error === 'BadRequest') {
        // Claude models use different endpoint
        console.log('❌ BadRequest - trying /invoke endpoint...');
        
        const invokeUrl = `${config.serviceurls.AI_API_URL}/v2/inference/deployments/${deploymentId}/invoke`;
        console.log(`📡 Trying: ${invokeUrl}`);
        
        const response = await axios.post(invokeUrl, {
          anthropic_version: "bedrock-2023-05-31",
          max_tokens: 50,
          messages: [
            { role: 'user', content: 'Say "Hello from AI Core!"' }
          ]
        }, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'AI-Resource-Group': 'default',
            'Content-Type': 'application/json'
          },
          timeout: 30000
        });
        
        console.log('✅ /invoke works!');
        console.log('Response:', JSON.stringify(response.data, null, 2));
        return true;
      }
      throw chatError;
    }
  } catch (error) {
    console.log('❌ Error:', error.response?.data || error.message);
    return false;
  }
}

async function main() {
  const deployments = [
    'dbc88cbc32f1206e', // gpt-4o
    'd89776dc8de6c669', // gpt-5
    'dc3ee26c175a1d47', // claude-3.7-sonnet
    'd633127e0b89e2a5'  // claude-4-sonnet
  ];
  
  for (const deploymentId of deployments) {
    const success = await testChatEndpoint(deploymentId);
    if (success) {
      console.log(`\n✨ Found working deployment: ${deploymentId}`);
      break;
    }
  }
}

main().catch(console.error);
