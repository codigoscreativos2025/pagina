const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const UPLOAD_BASE = process.env.MEDIA_STORAGE_PATH || '/data/uploads';
const URL_SECRET = process.env.MEDIA_URL_SECRET || 'pivot-media-secret-change-me';
const URL_EXPIRY_SECONDS = 3600;

class MediaService {
  _getUserDir(userId) {
    return path.join(UPLOAD_BASE, String(userId));
  }

  _ensureDir(dir) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  _generateSignedToken(mediaId, expirySec = URL_EXPIRY_SECONDS) {
    const expires = Math.floor(Date.now() / 1000) + expirySec;
    const payload = `${mediaId}:${expires}`;
    const sig = crypto.createHmac('sha256', URL_SECRET).update(payload).digest('hex');
    return `${expires}:${sig}`;
  }

  verifySignedToken(mediaId, token) {
    try {
      const [expiresStr, sig] = token.split(':');
      const expires = parseInt(expiresStr, 10);
      if (isNaN(expires) || expires < Math.floor(Date.now() / 1000)) return false;
      const expected = crypto.createHmac('sha256', URL_SECRET).update(`${mediaId}:${expires}`).digest('hex');
      return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
    } catch {
      return false;
    }
  }

  getSignedUrl(mediaId, host, expirySec) {
    const token = this._generateSignedToken(mediaId, expirySec);
    return `${host}/api/media/${mediaId}?token=${token}`;
  }

  async saveLocalFile(userId, file) {
    const userDir = this._getUserDir(userId);
    this._ensureDir(userDir);

    const ext = path.extname(file.originalname) || path.extname(file.filename || '') || '';
    const uniqueName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
    const storagePath = path.join(userDir, uniqueName);

    fs.writeFileSync(storagePath, file.buffer || fs.readFileSync(file.path || file.tmpfile || ''));

    return {
      storage_path: storagePath,
      filename: file.originalname || file.filename || uniqueName,
      size_bytes: file.size || fs.statSync(storagePath).size
    };
  }

  async saveBuffer(userId, buffer, originalName, mimeType) {
    const userDir = this._getUserDir(userId);
    this._ensureDir(userDir);

    const ext = path.extname(originalName) || this._extFromMime(mimeType) || '.bin';
    const uniqueName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
    const storagePath = path.join(userDir, uniqueName);

    fs.writeFileSync(storagePath, buffer);

    return {
      storage_path: storagePath,
      filename: originalName,
      size_bytes: buffer.length
    };
  }

  async downloadFromMeta(mediaId, accessToken) {
    try {
      const urlRes = await fetch(
        `https://graph.facebook.com/v18.0/${mediaId}`,
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
      );
      const urlData = await urlRes.json();

      if (urlData.error) {
        console.error('[MediaService] Error getting media URL:', JSON.stringify(urlData.error));
        return { success: false, error: urlData.error.message };
      }

      const downloadUrl = urlData.url;
      const mimeType = urlData.mime_type || 'application/octet-stream';
      const filename = urlData.filename || `media_${mediaId}`;

      const fileRes = await fetch(downloadUrl, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      if (!fileRes.ok) {
        return { success: false, error: `Download failed: ${fileRes.status}` };
      }

      const arrayBuffer = await fileRes.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      return {
        success: true,
        buffer,
        filename,
        mime_type: mimeType,
        size_bytes: buffer.length,
        meta_media_id: mediaId
      };
    } catch (error) {
      console.error('[MediaService] Error downloading from Meta:', error);
      return { success: false, error: error.message };
    }
  }

  async uploadToMeta(userId, filePath, mimeType, accessToken, phoneNumberId) {
    try {
      const fileBuffer = fs.readFileSync(filePath);
      const filename = path.basename(filePath);

      const formData = new FormData();
      formData.append('file', new Blob([fileBuffer], { type: mimeType }), filename);
      formData.append('messaging_product', 'whatsapp');

      const response = await fetch(
        `https://graph.facebook.com/v18.0/${phoneNumberId}/media`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${accessToken}` },
          body: formData
        }
      );

      const data = await response.json();
      if (data.error) {
        console.error('[MediaService] Meta upload error:', JSON.stringify(data.error));
        return { success: false, error: data.error.message };
      }

      return { success: true, media_id: data.id };
    } catch (error) {
      console.error('[MediaService] Error uploading to Meta:', error);
      return { success: false, error: error.message };
    }
  }

  async deleteLocalFile(storagePath) {
    try {
      if (fs.existsSync(storagePath)) {
        fs.unlinkSync(storagePath);
      }
      return { success: true };
    } catch (error) {
      console.error('[MediaService] Error deleting file:', error);
      return { success: false, error: error.message };
    }
  }

  async calculateExpiration(userId, pool) {
    const planResult = await pool.query(
      `SELECT p.features FROM plans p JOIN users u ON u.plan_id = p.id WHERE u.id = $1`,
      [userId]
    );

    const features = planResult.rows[0]?.features || {};
    if (typeof features === 'string') {
      try { Object.assign(features, JSON.parse(features)); } catch {}
    }

    const retentionDays = features.media_retention_days || 30;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + retentionDays);

    return expiresAt;
  }

  classifyMedia(messageType, mimeType) {
    const mimeMap = {
      'audio': ['audio/'],
      'image': ['image/'],
      'video': ['video/'],
      'document': ['application/pdf', 'application/msword', 'application/vnd.', 'text/']
    };

    if (messageType === 'audio' || mimeType?.startsWith('audio/')) return 'audio';
    if (messageType === 'image' || mimeType?.startsWith('image/')) return 'image';
    if (messageType === 'video' || mimeType?.startsWith('video/')) return 'video';
    if (messageType === 'document') return 'document';

    for (const [type, prefixes] of Object.entries(mimeMap)) {
      if (prefixes.some(p => mimeType?.startsWith(p))) return type;
    }

    return 'document';
  }

  _extFromMime(mimeType) {
    const map = {
      'image/jpeg': '.jpg', 'image/png': '.png', 'image/gif': '.gif', 'image/webp': '.webp',
      'audio/ogg': '.ogg', 'audio/ogg; codecs=opus': '.ogg', 'audio/mp4': '.m4a',
      'audio/mpeg': '.mp3', 'audio/amr': '.amr',
      'video/mp4': '.mp4', 'video/3gpp': '.3gp',
      'application/pdf': '.pdf',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
      'application/vnd.ms-excel': '.xls',
      'application/msword': '.doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
      'text/plain': '.txt', 'text/csv': '.csv'
    };
    return map[mimeType] || '';
  }
}

module.exports = new MediaService();