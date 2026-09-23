import { getDb } from '../db/connect.js';

export async function tripDetailsPage(req, res) {
  try {
    const { tripId } = req.params;
    const db = getDb();
    const details = await db.collection('trips').findOne({ id: tripId });

    if (!details) {
      return res.status(404).render('errors/404', {
        title: 'Trip Not Found'
      });
    }

    return res.render('trips/details', {
      title: 'Trip Details',
      details
    });
  } catch (error) {
    console.error('Error loading trip details:', error);

    return res.status(500).render('errors/500', {
      title: 'Server Error',
      error: 'Failed to load trip details.',
      stack: error.stack
    });
  }
}
