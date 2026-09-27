import User from './schemas/users.js';

export async function createUser(userData) {
  const user = new User(userData);
  await user.save();

  return user.toObject();
}

export async function getUserByUsername(username) {
  return User.findOne({ username }).lean();
}

export async function getUserByEmail(email) {
  return User.findOne({ email }).lean();
}

export async function getUserById(id) {
  return User.findById(id).lean();
}