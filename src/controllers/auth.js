import bcrypt from 'bcrypt';
import {
  createUser,
  getUserByUsername,
  getUserByEmail
} from '../models/users.js';

//Import the role model for solving ID objects
import Role from '../models/schemas/roles.js';

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

    //Added to resolve the objectID  for the new user role
    let defaultRole = await Role.findOne({ name: 'user' });
    if (!defaultRole) {
      defaultRole = await Role.findOne({ name: 'customer' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await createUser({
      displayName,
      username,
      email,
      passwordHash,
      //Added to save the Mongoose reference required by step 2
      // role: 'user'
      role: defaultRole._id
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

    // Determine the text name of the role 
    const roleName = user.role && typeof user.role === 'object' ? user.role.name : user.role;


    req.session.user = {
      id: user._id.toString(),
      displayName: user.displayName,
      username: user.username,
      email: user.email,
      // role: user.role
      role: roleName
    };

    //Feature set 2 conditional redirection dynamic logic
    if (roleName === 'admin'){
      return res.redirect('/admin');
    } else {
      return res.redirect('/dashboard');
    }
    // return res.redirect('/');
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