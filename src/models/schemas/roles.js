import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      //Added enum restriction to the name to prevent ramdom string entries
      enum: ['customer', 'admin', 'user']
    },
  },
  {
    timestamps: true,
  }
);

const Role = mongoose.model('Role', roleSchema, 'roles');

export default Role;