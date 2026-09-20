import { getAllTrains } from '../controllers/trains.js';

const trainsPage = (req, res) => {
    res.render('trains', { title: 'Trains' });
};

const trainsApi = getAllTrains;

export { trainsApi, trainsPage };
