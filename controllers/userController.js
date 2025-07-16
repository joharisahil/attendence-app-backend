// Dummy controller for user profile
export const getUserProfile = (req, res) => {
  res.json({
    message: 'User profile accessed successfully',
    user: req.user, // Comes from middleware
  });
};
