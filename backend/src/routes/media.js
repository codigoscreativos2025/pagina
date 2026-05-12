const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const multer = require('multer');
const mediaService = require('../services/mediaService');
const transcriptionService = require('../services/transcriptionService');
const planFeature = require('../middleware/planFeatures');
const path = require('path');
const fs = require('fs');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: (parseInt(process.env.MEDIA_MAX_SIZE_MB) || 100) * 1024 * 1024 }
});

const ALLOWED_MIME_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'audio/ogg', 'audio/ogg; codecs=opus', 'audio/mp4', 'audio/mpeg', 'audio/amr', 'audio/aac', 'audio/wav',
  'video/mp4', 'video/3gpp',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain', 'text/csv'
];

router.post('/upload', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided' });

    if (!ALLOWED_MIME_TYPES.includes(req.file.mimetype)) {
      return res.status(400).json({ error: `File type not allowed: ${req.file.mimetype}` });
    }

    const { lead_id, direction, agent_id } = req.body;
    const userId = req.user.id;

    const saved = await mediaService.saveLocalFile(userId, {
      buffer: req.file.buffer,
      originalname: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });

    const messageType = mediaService.classifyMedia(null, req.file.mimetype);
    const expiresAt = await mediaService.calculateExpiration(userId, req.pool);

    const result = await req.pool.query(
      `INSERT INTO media_files (user_id, lead_id, direction, type, mime_type, filename, size_bytes, storage_path, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [userId, lead_id || null, direction || 'outbound', messageType,
       req.file.mimetype, saved.filename, saved.size_bytes, saved.storage_path, expiresAt]
    );

    const media = result.rows[0];
    const host = `${req.protocol}://${req.get('host')}`;
    const url = mediaService.getSignedUrl(media.id, host);

    res.status(201).json({ success: true, media: { ...media, url } });
  } catch (error) {
    console.error('[Media] Upload error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(401).json({ error: 'Missing token' });

    if (!mediaService.verifySignedToken(req.params.id, token)) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    const result = await req.pool.query('SELECT * FROM media_files WHERE id = $1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Media not found' });

    const media = result.rows[0];

    if (media.deleted_at || (media.expires_at && new Date(media.expires_at) < new Date())) {
      return res.status(410).json({ error: 'File has expired or been deleted' });
    }

    if (!fs.existsSync(media.storage_path)) {
      return res.status(404).json({ error: 'File not found on disk' });
    }

    res.setHeader('Content-Type', media.mime_type || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${media.filename}"`);
    res.sendFile(path.resolve(media.storage_path));
  } catch (error) {
    console.error('[Media] Serve error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/lead/:leadId', auth, async (req, res) => {
  try {
    const result = await req.pool.query(
      `SELECT m.* FROM media_files m
       JOIN leads l ON m.lead_id = l.id
       JOIN agents a ON l.agent_id = a.id
       WHERE m.lead_id = $1 AND a.user_id = $2 AND m.deleted_at IS NULL
       ORDER BY m.created_at DESC`,
      [req.params.leadId, req.user.id]
    );

    const host = `${req.protocol}://${req.get('host')}`;
    const medias = result.rows.map(m => ({
      ...m,
      url: mediaService.getSignedUrl(m.id, host)
    }));

    res.json({ success: true, media: medias });
  } catch (error) {
    console.error('[Media] List by lead error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/info/:id', auth, async (req, res) => {
  try {
    const result = await req.pool.query(
      `SELECT m.* FROM media_files m
       WHERE m.id = $1 AND m.user_id = $2`,
      [req.params.id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Media not found' });

    const media = result.rows[0];
    const host = `${req.protocol}://${req.get('host')}`;

    res.json({
      success: true,
      media: {
        ...media,
        url: mediaService.getSignedUrl(media.id, host),
        expired: media.expires_at && new Date(media.expires_at) < new Date()
      }
    });
  } catch (error) {
    console.error('[Media] Info error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/transcribe', auth, planFeature('ai_audio_transcription'), async (req, res) => {
  try {
    const result = await req.pool.query(
      'SELECT * FROM media_files WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Media not found' });

    const media = result.rows[0];
    if (media.type !== 'audio') {
      return res.status(400).json({ error: 'Transcription only available for audio files' });
    }
    if (media.transcription) {
      return res.json({ success: true, transcription: media.transcription });
    }

    if (!fs.existsSync(media.storage_path)) {
      return res.status(404).json({ error: 'Audio file not found on disk' });
    }

    const transcription = await transcriptionService.transcribe(media.storage_path, {
      language: req.body.language
    });

    if (!transcription) {
      return res.status(500).json({ error: 'Transcription failed' });
    }

    await req.pool.query(
      'UPDATE media_files SET transcription = $1 WHERE id = $2',
      [transcription, media.id]
    );

    res.json({ success: true, transcription });
  } catch (error) {
    console.error('[Media] Transcribe error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await req.pool.query(
      'SELECT * FROM media_files WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Media not found' });

    const media = result.rows[0];
    await mediaService.deleteLocalFile(media.storage_path);
    await req.pool.query(
      'UPDATE media_files SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1',
      [req.params.id]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('[Media] Delete error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;