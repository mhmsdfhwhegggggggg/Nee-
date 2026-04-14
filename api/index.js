// Vercel serverless function - CJS wrapper for ESM api-server
  let _app = null;

  async function getApp() {
    if (!_app) {
      const { default: app } = await import('../artifacts/api-server/dist/app.mjs');
      _app = app;
    }
    return _app;
  }

  module.exports = async (req, res) => {
    try {
      const app = await getApp();
      app(req, res);
    } catch (err) {
      console.error('Failed to load app:', err);
      res.status(500).json({ error: 'Internal server error', message: err.message });
    }
  };
  