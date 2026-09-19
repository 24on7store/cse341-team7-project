import mongoose from 'mongoose';

const { Schema } = mongoose;

const passengerSchema = new Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true }
  },
  { _id: false }
);

const bookingSchema = new Schema({
  id: { type: String, required: true, unique: true },
  scheduleId: { type: Number, required: true },
  tripId: { type: String, required: true },
  ticketClass: { type: String, required: true },
  selectedDay: { type: String, required: true },
  passengers: {
    type: [passengerSchema],
    validate: {
      validator: (arr) => Array.isArray(arr) && arr.length > 0,
      message: 'At least one passenger is required.'
    }
  },
  createdAt: { type: Date, default: Date.now }
});

const Booking = mongoose.model('Booking', bookingSchema, 'bookings');

export default Booking;