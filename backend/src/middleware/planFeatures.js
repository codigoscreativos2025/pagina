const getPlanFeatures = async (pool, userId) => {
  const result = await pool.query(
    `SELECT p.features FROM plans p
     JOIN users u ON u.plan_id = p.id
     WHERE u.id = $1`,
    [userId]
  );
  if (result.rows.length === 0) return {};
  const features = result.rows[0].features;
  if (!features || typeof features === 'string') {
    try { return JSON.parse(features || '{}'); } catch { return {}; }
  }
  return features;
};

module.exports = function planFeatureMiddleware(featureKey) {
  return async (req, res, next) => {
    try {
      const features = await getPlanFeatures(req.pool, req.user.id);
      if (!features[featureKey]) {
        return res.status(403).json({
          error: 'Feature not available on your plan',
          feature: featureKey,
          upgrade_required: true
        });
      }
      next();
    } catch (error) {
      console.error('[PlanFeatures] Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
};

module.exports.getPlanFeatures = getPlanFeatures;