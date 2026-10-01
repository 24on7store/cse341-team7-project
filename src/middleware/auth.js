
//WEEK04 #2 STEP 5 HELPER: Loads the user dynamically for views and request states
export const loadSessionUser = (req, res, next) => {
  req.user = req.session.user || null;
// Ties user info to all EJS files automatically (Step 4 overlap!)
  res.locals.user = req.user; 
  return next();
};

// Internal validation abstractions specified by Step 5
const isLoggedIn = (req) => { return Boolean(req.user); };
const hasRole = (req, role) => { return req.user && req.user.role === role; };

//WEEK04 #2 STEP 5 HELPER: Protects backend endpoints (returns raw JSON format)
export const requireApiLogin = (req, res, next) => {
  if (!isLoggedIn(req)) {
    return res.status(401).json({ message: 'Authentication required' });
  }
 return next();
};

//WEEK04 #2 STEP 5 HELPER: Protects view rendering pages (handles web browser redirects)
export const requirePageLogin = (req, res, next) => {
  if (!isLoggedIn(req)) {
    // Points to your team's specific login path
    return res.redirect('/auth/login'); 
  }
  return next();
};

//WEEK04 #2 STEP 5 HELPER: Checks custom authorization levels on standard JSON API requests
export const requireApiRole = (role) => (req, res, next) => {
  if (!isLoggedIn(req)) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  if (!hasRole(req, role)) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  return next();
};


//WEEK04 #2 STEP 5 HELPER: Checks permissions on views (renders your team's 403 error page if blocked)
export const requirePageRole = (role) => (req, res, next) => {
  if (!isLoggedIn(req)) {
    return res.redirect('/auth/login');
  }
  if (!hasRole(req, role)) {
    // Uses your team's exact error view path discovered in app.js
    return res.status(403).render('errors/403', { 
      title: 'Access Denied',
      error: 'Forbidden'
    });
  }
  return next();
};
