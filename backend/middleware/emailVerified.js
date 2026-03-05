const emailVerified = (req, res, next) => {
  // Skip check in development
  if (process.env.NODE_ENV === 'development' && process.env.SKIP_EMAIL_VERIFY === 'true') {
    return next();
  }

  if (req.user && req.user.email_verified === 0) {
    return res.status(403).json({
      success: false,
      message: 'Please verify your email first',
      code: 'EMAIL_NOT_VERIFIED'
    });
  }
  next();
};

module.exports = emailVerified;