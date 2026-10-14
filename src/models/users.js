import User from './schemas/users.js';
import Role from './schemas/roles.js';
import bcrypt from 'bcrypt';

export async function createUser(userData) {
const user = new User(userData);
await user.save();

const result = user.toObject();
delete result.passwordHash;

return result;
}

export async function getUserByUsername(username) {
return User.findOne({ username })
.select('-passwordHash')
.populate('role')
.lean();
}

export async function getUserByEmail(email) {
return User.findOne({ email })
.select('-passwordHash')
.populate('role')
.lean();
}

export async function getUserById(id) {
return User.findById(id)
.select('-passwordHash')
.populate('role')
.lean();
}

export async function getAllUsers() {
return User.find({})
.select('-passwordHash')
.populate('role')
.sort({ username: 1 })
.lean();
}

export async function getUsersPage({ page = 1, limit = 10, query, roleId } = {}) {
const safePage = Number.isInteger(Number(page)) && Number(page) > 0
? Number(page)
: 1;

const safeLimit = Number.isInteger(Number(limit)) && Number(limit) > 0
? Math.min(Number(limit), 100)
: 10;

const filter = {};

if (typeof query === 'string' && query.trim()) {
const escapedQuery = query.trim().replace(/[.*+?^${}()|[]\]/g, '\$&');
const searchRegex = new RegExp(escapedQuery, 'i');

```
filter.$or = [
  { displayName: searchRegex },
  { username: searchRegex },
  { email: searchRegex }
];
```

}

if (roleId) {
filter.role = roleId;
}

const [users, totalItems] = await Promise.all([
User.find(filter)
.select('-passwordHash')
.populate('role')
.sort({ username: 1 })
.skip((safePage - 1) * safeLimit)
.limit(safeLimit)
.lean(),
User.countDocuments(filter)
]);

return { users, totalItems };
}

export async function updateUser(id, userData) {
const updatedUser = await User.findByIdAndUpdate(id, userData, {
returnDocument: 'after',
runValidators: true
})
.select('-passwordHash')
.populate('role')
.lean();

return updatedUser;
}

export async function deleteUser(id) {
const deletedUser = await User.findByIdAndDelete(id)
.select('-passwordHash')
.lean();

return deletedUser;
}

export async function getRoleByName(name) {
return Role.findOne({ name }).lean();
}

export async function getAllRoles() {
return Role.find({})
.select('name -_id')
.sort({ name: 1 })
.lean();
}

export async function findUserByEmail(email) {
return User.findOne({ email })
.populate('role')
.lean();
}

export async function verifyPassword(password, passwordHash) {
return bcrypt.compare(password, passwordHash);
}
