import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    //Replacing string enum with objectId referenved required by Week 04: Authentication and Authorization
    // #2 step 03 activies
    role: {
      //type: String,
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Role',
      required: true,
      // enum: ['user', 'admin'],
      // default: 'user',
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model('User', userSchema, 'users');

export default User;