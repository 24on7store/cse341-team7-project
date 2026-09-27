import bcrypt from 'bcrypt';
import {
  createUser,
  getUserByUsername,
  getUserByEmail
} from '../models/users.js';

export function registerPage(req, res) {
  return res.render('auth/register', {
    title: 'Register',
    formData: {}
  });
}

export async function register(req, res) {
  try {
    const { displayName, username, email, password } = req.body;

    if (!displayName || !username || !email || !password) {
      return res.status(400).render('auth/register', {
        title: 'Register',
        error: 'All fields are required.',
        formData: { displayName, username, email }
      });
    }

    const existingUsername = await getUserByUsername(username);

    if (existingUsername) {
      return res.status(409).render('auth/register', {
        title: 'Register',
        error: 'Username is already in use.',
        formData: { displayName, username, email }
      });
    }

    const existingEmail = await getUserByEmail(email);

    if (existingEmail) {
      return res.status(409).render('auth/register', {
        title: 'Register',
        error: 'Email is already in use.',
        formData: { displayName, username, email }
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await createUser({
      displayName,
      username,
      email,
      passwordHash,
      role: 'user'
    });

    return res.redirect('/auth/login');
  } catch (error) {
    console.error('Registration error:', error);

    return res.status(500).render('auth/register', {
      title: 'Register',
      error: 'Unable to create your account.',
      formData: {
        displayName: req.body.displayName,
        username: req.body.username,
        email: req.body.email
      }
    });
  }
}

export function loginPage(req, res) {
  return res.render('auth/login', {
    title: 'Login',
    username: ''
  });
}

export async function login(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).render('auth/login', {
        title: 'Login',
        error: 'Username and password are required.',
        username
      });
    }

    const user = await getUserByUsername(username);

    if (!user) {
      return res.status(401).render('auth/login', {
        title: 'Login',
        error: 'Invalid username or password.',
        username
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!passwordMatches) {
      return res.status(401).render('auth/login', {
        title: 'Login',
        error: 'Invalid username or password.',
        username
      });
    }

    req.session.user = {
      id: user._id.toString(),
      displayName: user.displayName,
      username: user.username,
      email: user.email,
      role: user.role
    };

    return res.redirect('/');
  } catch (error) {
    console.error('Login error:', error);

    return res.status(500).render('auth/login', {
      title: 'Login',
      error: 'Unable to log in.',
      username: req.body.username
    });
  }
}

export function logout(req, res) {
  req.session.destroy((error) => {
    if (error) {
      console.error('Logout error:', error);
      return res.status(500).render('errors/500', {
        title: 'Server Error',
        error: 'Unable to log out.'
      });
    }

    res.clearCookie('connect.sid');
    return res.redirect('/');
  });
}