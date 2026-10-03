//src/controllers/trains.js
import {
  getTrainById as findTrainById,
  getAllTrains as findAllTrains,
} from "../models/trains.js";

export async function getTrainById(req, res) {
  try {
    const { id } = req.params;

    const train = await findTrainById(id);

    if (!train) {
      return res.status(404).json({
        error: "Train not found",
      });
    }

    return res.status(200).json(train);
  } catch (error) {
    console.error("Error fetching train:", error);

    return res.status(500).json({
      error: "Failed to fetch train",
    });
  }
}

export async function getAllTrains(req, res) {
  try {
    const pageValue = req.query.page ?? '1';
    const limitValue = req.query.limit ?? '10';

    if (!/^\d+$/.test(pageValue) || !/^\d+$/.test(limitValue)) {
      return res.status(400).json({
        error: 'Page and limit must be positive integers.'
      });
    }

    const page = Number(pageValue);
    const limit = Number(limitValue);

    if (page < 1 || limit < 1) {
      return res.status(400).json({
        error: 'Page and limit must be positive integers.'
      });
    }

    if (limit > 50) {
      return res.status(400).json({
        error: 'Limit cannot exceed 50.'
      });
    }

    const { data, totalItems } = await findAllTrains({
      page,
      limit
    });

    const totalPages = totalItems === 0
      ? 0
      : Math.ceil(totalItems / limit);

    return res.status(200).json({
      data,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching trains:', error);

    return res.status(500).json({
      error: 'Failed to fetch trains'
    });
  }
}