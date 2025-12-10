const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

class DocumentService {
  /**
   * Extract text from uploaded file based on file type
   */
  async extractText(file) {
    try {
      const mimeType = file.mimetype;
      
      switch (mimeType) {
        case 'application/pdf':
          return await this.extractFromPDF(file.buffer);
        
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        case 'application/msword':
          return await this.extractFromWord(file.buffer);
        
        case 'text/plain':
          return file.buffer.toString('utf-8');
        
        default:
          throw new Error(`Unsupported file type: ${mimeType}`);
      }
    } catch (error) {
      console.error('Error extracting text from document:', error);
      throw new Error(`Failed to extract text: ${error.message}`);
    }
  }

  /**
   * Extract text from PDF file
   */
  async extractFromPDF(buffer) {
    try {
      const data = await pdfParse(buffer);
      return data.text;
    } catch (error) {
      console.error('Error parsing PDF:', error);
      throw new Error('Failed to parse PDF file');
    }
  }

  /**
   * Extract text from Word document
   */
  async extractFromWord(buffer) {
    try {
      const result = await mammoth.extractRawText({ buffer: buffer });
      return result.value;
    } catch (error) {
      console.error('Error parsing Word document:', error);
      throw new Error('Failed to parse Word document');
    }
  }

  /**
   * Clean and normalize extracted text
   */
  cleanText(text) {
    return text
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  /**
   * Get document statistics
   */
  getDocumentStats(text) {
    const words = text.split(/\s+/).filter(word => word.length > 0);
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    
    return {
      characters: text.length,
      words: words.length,
      lines: lines.length,
      paragraphs: text.split(/\n\n+/).filter(p => p.trim().length > 0).length
    };
  }
}

module.exports = new DocumentService();
