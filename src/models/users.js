import User from './schemas/users.js';
//Added on week 03 based on #3 step 4 activities
import Role from './schemas/roles.js';
import bcrypt from 'bcrypt';

export async function createUser(userData) {
  const user = new User(userData);
  await user.save();

  return user.toObject();
}

export async function getUserByUsername(username) {
  // return User.findOne({ username }).lean();
  //Added the populate role related to step 2
  return User.findOne({ username }).populate('role').lean();
}

export async function getUserByEmail(email) {
  return User.findOne({ email }).lean();
}

export async function getUserById(id) {
  // return User.findById(id).lean();
  //Added .populate('role') so sthat dashborad work on all requests
  return User.findById(id).populate('role').lean();
}



export async function findUserByEmail(email) {
  // Fetches a user by their email address and populates the explicit Role model data
  return User.findOne({ email }).populate('role');
}

export async function verifyPassword(password, passwordHash) {
  // Securely evaluates plain-text user login inputs against the database hash via bcrypt
  return bcrypt.compare(password, passwordHash);
}