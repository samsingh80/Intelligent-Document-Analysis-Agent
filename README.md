# Intelligent Document Analysis Agent

AI-powered document comparison and analysis application using SAP AI Core with Claude 3.7 Sonnet.

## Features

- 🤖 **AI-Powered Analysis**: Uses Claude 3.7 Sonnet for intelligent document comparison
- 📄 **Multi-Format Support**: PDF, DOCX, DOC, TXT files (up to 10MB)
- 🎯 **Adaptive Categories**: Automatically detects document types and applies relevant comparison categories
- 📊 **Detailed Scoring**: Category-based scoring with weighted overall assessment
- 🔒 **Enterprise Security**: XSUAA authentication and SAP BTP deployment
- 🎨 **Modern UI**: SAPUI5 interface with drag-and-drop file upload
- ⚡ **Consistent Results**: Temperature-controlled AI for reproducible analysis

## Architecture

```
┌─────────────────┐
│   SAPUI5 App    │ (Frontend)
└────────┬────────┘
         │
┌────────▼────────┐
│   Approuter     │ (Routing & Auth)
└────────┬────────┘
         │
┌────────▼────────┐
│  Node.js API    │ (Backend)
└────────┬────────┘
         │
┌────────▼────────┐
│  SAP AI Core    │ (Claude 3.7 Sonnet)
└─────────────────┘
```

## Tech Stack

- **Frontend**: SAPUI5 1.120, UI5 Tooling
- **Backend**: Node.js, Express, Multer
- **AI**: SAP AI Core with Claude 3.7 Sonnet
- **Deployment**: SAP BTP Cloud Foundry, MTA
- **Authentication**: XSUAA
- **Document Processing**: pdf-parse, mammoth

## Quick Start

### Prerequisites

- Node.js 18+
- Cloud Foundry CLI
- MBT (Multi-Target Application Build Tool)
- SAP BTP account with AI Core enabled

### Local Development

1. **Install dependencies**:
```bash
# Backend
cd srv && npm install && cd ..

# Frontend
cd app && npm install && cd ..

# Approuter
cd approuter && npm install && cd ..
```

2. **Start backend**:
```bash
cd srv
node server.js
```

3. **Start UI** (in another terminal):
```bash
cd app
npm start
```

4. Access at `http://localhost:8080`

### Deploy to SAP BTP

1. **Build MTA**:
```bash
mbt build
```

2. **Deploy**:
```bash
cf deploy mta_archives/bpfs-agent_1.0.0.mtar
```

3. **Access**:
```
https://<your-subdomain>-dev-bpfs-agent-approuter.cfapps.<region>.hana.ondemand.com
```

## Configuration

### AI Core Setup

Update `srv/services/aicore-service.js` with your AI Core credentials:

```javascript
this.config = {
  serviceurls: {
    AI_API_URL: "https://api.ai.prod.<region>.aws.ml.hana.ondemand.com"
  },
  clientid: "your-client-id",
  clientsecret: "your-client-secret",
  url: "https://<subdomain>.authentication.<region>.hana.ondemand.com",
  identityzone: "your-identity-zone"
};
```

### Deployment ID

The app uses Claude 3.7 Sonnet deployment. Update the deployment ID in `srv/services/comparison-service.js`:

```javascript
const defaultDeploymentId = 'your-deployment-id'; // claude-3.7-sonnet
```

## Document Types Supported

The AI automatically detects and adapts to:

- **Technical Specifications**: Solution Architecture, Business Process Coverage, Testing, Deployment
- **Invoices/Bills**: Amount Accuracy, Line Items, Tax Calculations, Vendor Info
- **Contracts**: Terms & Conditions, Obligations, Deliverables, Legal Compliance
- **Reports**: Data Accuracy, Completeness, Insights Quality
- **General Documents**: Content Accuracy, Structure, Clarity, Relevance

## API Endpoints

- `GET /api/deployments` - List available AI Core deployments
- `POST /api/compare` - Compare two documents
  - Body: `multipart/form-data`
  - Fields: `fsDocument`, `jouleResponse` (files)

## Project Structure

```
.
├── app/                    # SAPUI5 Frontend
│   ├── webapp/
│   │   ├── controller/    # UI Controllers
│   │   ├── view/          # XML Views
│   │   ├── model/         # Data Models
│   │   └── manifest.json  # App Descriptor
│   ├── package.json
│   └── ui5.yaml
├── srv/                   # Node.js Backend
│   ├── services/
│   │   ├── aicore-service.js
│   │   ├── comparison-service.js
│   │   └── document-service.js
│   ├── server.js
│   └── package.json
├── approuter/            # SAP Approuter
│   ├── xs-app.json
│   └── package.json
├── mta.yaml             # MTA Descriptor
└── xs-security.json     # XSUAA Config
```

## Features in Detail

### Intelligent Category Detection

The AI analyzes document content and automatically selects relevant comparison categories:

```javascript
// Example for invoices
categories: [
  { name: "Amount Accuracy", weight: 0.25 },
  { name: "Line Items Match", weight: 0.20 },
  { name: "Tax Calculations", weight: 0.20 },
  { name: "Dates & Periods", weight: 0.15 },
  { name: "Vendor Info", weight: 0.20 }
]
```

### Consistent Scoring

Temperature set to 0.1 for reproducible results:

```javascript
temperature: 0.1  // Lower = more consistent
```

### Progress Indication

Custom BusyDialog shows AI analysis progress:

```xml
<BusyDialog
    title="AI Analysis in Progress"
    text="Analyzing your documents with AI powered system. Please stand by..."
/>
```

## Troubleshooting

### 503 Error on Approuter

- Check XSUAA service binding
- Verify `xs-security.json` configuration
- Ensure approuter has correct service requirements

### AI Core 404 Error

- Verify deployment ID is correct
- Check AI Core credentials
- Ensure deployment is RUNNING status

### Document Upload Fails

- Check file size (max 10MB)
- Verify file format (PDF, DOCX, DOC, TXT)
- Check backend logs for parsing errors

## License

MIT

## Author

Built with ❤️ using SAP BTP and AI Core

---

**Darling Diana** 🤖✨
