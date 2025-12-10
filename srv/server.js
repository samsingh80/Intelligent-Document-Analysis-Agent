const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const aiCoreService = require('./services/aicore-service');
const documentService = require('./services/document-service');
const comparisonService = require('./services/comparison-service');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOCX, DOC, and TXT files are allowed.'));
    }
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Get AI Core deployments
app.get('/api/deployments', async (req, res) => {
  try {
    const deployments = await aiCoreService.getDeployments();
    res.json(deployments);
  } catch (error) {
    console.error('Error fetching deployments:', error);
    res.status(500).json({ 
      error: 'Failed to fetch deployments',
      message: error.message 
    });
  }
});

// Upload and compare documents
app.post('/api/compare', upload.fields([
  { name: 'fsDocument', maxCount: 1 },
  { name: 'jouleResponse', maxCount: 1 }
]), async (req, res) => {
  try {
    if (!req.files || !req.files.fsDocument || !req.files.jouleResponse) {
      return res.status(400).json({ 
        error: 'Both FS document and Joule response files are required' 
      });
    }

    const fsFile = req.files.fsDocument[0];
    const jouleFile = req.files.jouleResponse[0];

    console.log('Processing files:', {
      fs: fsFile.originalname,
      joule: jouleFile.originalname
    });

    // Extract text from documents
    const fsText = await documentService.extractText(fsFile);
    const jouleText = await documentService.extractText(jouleFile);

    // Perform AI-based comparison
    const comparisonResult = await comparisonService.compareDocuments(
      fsText,
      jouleText,
      req.body.deploymentId
    );

    res.json({
      success: true,
      comparison: comparisonResult,
      metadata: {
        fsDocument: {
          name: fsFile.originalname,
          size: fsFile.size,
          type: fsFile.mimetype
        },
        jouleResponse: {
          name: jouleFile.originalname,
          size: jouleFile.size,
          type: jouleFile.mimetype
        },
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error comparing documents:', error);
    res.status(500).json({ 
      error: 'Failed to compare documents',
      message: error.message 
    });
  }
});

// Get comparison history (placeholder for future implementation)
app.get('/api/history', async (req, res) => {
  try {
    // TODO: Implement history storage and retrieval
    res.json({
      success: true,
      history: []
    });
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ 
      error: 'Failed to fetch history',
      message: error.message 
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  res.status(error.status || 500).json({
    error: error.message || 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`BPFS Agent server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
