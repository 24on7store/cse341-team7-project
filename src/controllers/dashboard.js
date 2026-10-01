// src/controllers/dashboard.js

export function userDashboardPage(req, res) {
  // Grab the user data stored in the session by your login engine
//   const user = req.session.user;
  const user = req.user;

  // Render the dashboard page view with the user details
  return res.render('dashboard', {
    title: 'User Dashboard',
    user: user // Passes user.displayName, user.email, etc. to EJS
  });
}
