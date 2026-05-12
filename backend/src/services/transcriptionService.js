const fs = require('fs');
const path = require('path');

class TranscriptionService {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    this.model = process.env.WHISPER_MODEL || 'whisper-1';
    this.language = process.env.WHISPER_LANGUAGE || 'es';
  }

  async transcribe(filePath, options = {}) {
    if (!this.apiKey) {
      console.error('[Transcription] OPENAI_API_KEY not configured');
      return null;
    }

    try {
      if (!fs.existsSync(filePath)) {
        console.error('[Transcription] File not found:', filePath);
        return null;
      }

      const formData = new FormData();
      const fileBuffer = fs.readFileSync(filePath);
      formData.append('file', new Blob([fileBuffer]), path.basename(filePath));
      formData.append('model', this.model);
      formData.append('language', options.language || this.language);

      if (options.prompt) {
        formData.append('prompt', options.prompt);
      }

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Transcription] API error:', response.status, errorText);
        return null;
      }

      const data = await response.json();
      console.log('[Transcription] Success, length:', data.text?.length);
      return data.text;
    } catch (error) {
      console.error('[Transcription] Error:', error.message);
      return null;
    }
  }
}

module.exports = new TranscriptionService();