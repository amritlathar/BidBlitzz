export const verifyAdmin = async (req, res, next) => {
  try {
    // User should already be attached to req by verifyJwt middleware
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    next();
  } catch (error) {
    console.error('Admin Verification Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}; 