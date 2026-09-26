// import { 
//   getDb } from '../db/connect.js';

//src/controllers/trips.js
//Refactored on week03 by Mackison
import {
  getTripById as findTripById,
  getAllTrips as findAllTrips,
} from "../models/trips.js";

//Added on week03 by Mackison
// export async function getTripById(req, res) { ... }

// export async function getAllTrips(req, res) { ... }

// export async function renderTripsList(req, res) { ... }

//export async function tripDetailsPage(req, res) { ... }


// export async function tripDetailsPage(req, res) 
export async function getTripById(req, res){
  try {
    // const { tripId } = req.params;
    // const db = getDb();
    // const details = await db.collection('trips').findOne({ id: tripId });
    const { id } = req.params;
    const trip = await findTripById(id);

    if (!trip) {
      return res.status(404).json({ error: "Trip not found" });
    }

    // if (!details) {
    //   return res.status(404).render('errors/404', {
    //     title: 'Trip Not Found'
    //   });
    // }

  return res.status(200).json(trip);
  } catch (error) {
    console.error("Error fetching trip API:", error);
    return res.status(500).json({ error: "Failed to fetch trip" });
  }
}

export async function getAllTrips(req, res) {
  try {
    const trips = await findAllTrips();
    return res.status(200).json(trips);
  } catch (error) {
    console.error("Error fetching trips API:", error);
    return res.status(500).json({ error: "Failed to fetch trips" });
  }
}




    // return res.render('trips/details', {
    //   title: 'Trip Details',
    //   details
    // });


//   } catch (error) {
//     console.error('Error loading trip details:', error);

//     return res.status(500).render('errors/500', {
//       title: 'Server Error',
//       error: 'Failed to load trip details.',
//       stack: error.stack
//     });
//   }
// }
//src/controllers/trips.js
//Refactored on week03 by Mackison


// ==========================================
// 2. EJS VIEW CONTROLLER FUNCTIONS (HTML Pages)
// ==========================================

export async function renderTripsList(req, res) {
  try {
    // Populated dynamically via client-side hydration, no model call needed here!
    return res.render("trips/list", { title: "Our Scenic Rail Trips" });
  } catch (error) {
    console.error("Error rendering trips list page:", error);
    return res.status(500).render("errors/500", { title: "Server Error", error: "Failed to load page" });
  }
}

export async function tripDetailsPage(req, res) {
  try {
    const { tripId } = req.params;
    
    // Clean Mongoose refactor! Swapped out raw MongoDB collection driver.
    const details = await findTripById(tripId);

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
    console.error('Error loading trip details page:', error);

    return res.status(500).render('errors/500', {
      title: 'Server Error',
      error: 'Failed to load trip details.',
      stack: error.stack
    });
  }
}

