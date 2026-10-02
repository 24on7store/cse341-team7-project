import mongoose from 'mongoose';
import {
    deleteUser as deleteUserModel,
    getAllUsers,
    getRoleByName,
    getUserById,
    updateUser as updateUserModel
} from '../models/users.js';

const hasUserAccess = (req, id) =>
    req.user.role === 'admin' || req.user.id === id;

const isValidProfile = ({ displayName, username, email }) =>
    [displayName, username, email].every(
        (value) => typeof value === 'string' && value.trim().length > 0
    );

const isBadUserInput = (error) =>
    error?.code === 11000 || error?.name === 'ValidationError';

export function usersAdminPage(req, res) {
    return res.render('users', {
        title: 'User Administration'
    });
}

export async function getUsers(req, res) {
    try {
        const users = req.user.role === 'admin'
            ? await getAllUsers()
            : await getUserById(req.user.id);

        if (req.user.role !== 'admin' && !users) {
            return res.status(404).json({ error: 'User not found' });
        }

        return res.status(200).json(req.user.role === 'admin' ? users : [users]);
    } catch (error) {
        console.error('Error fetching users:', error);
        return res.status(500).json({ error: 'Failed to fetch users' });
    }
}

export async function updateUser(req, res) {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (!hasUserAccess(req, id)) {
            return res.status(403).json({ error: 'You do not have permission to update this user.' });
        }

        if (!isValidProfile(req.body)) {
            return res.status(400).json({
                error: 'Display name, username, and email are required.'
            });
        }

        const userData = {
            displayName: req.body.displayName.trim(),
            username: req.body.username.trim(),
            email: req.body.email.trim().toLowerCase()
        };

        if (req.user.role === 'admin' && req.body.role !== undefined) {
            const role = await getRoleByName(req.body.role);
            if (!role) {
                return res.status(400).json({ error: 'Role must be user or admin.' });
            }
            userData.role = role._id;
        }

        const updatedUser = await updateUserModel(id, userData);
        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (req.user.id === id) {
            req.session.user = {
                ...req.session.user,
                displayName: updatedUser.displayName,
                username: updatedUser.username,
                email: updatedUser.email,
                role: updatedUser.role.name
            };
        }

        return res.status(200).json(updatedUser);
    } catch (error) {
        console.error('Error updating user:', error);
        if (isBadUserInput(error)) {
            return res.status(400).json({ error: 'Username or email is already in use.' });
        }
        return res.status(500).json({ error: 'Failed to update user' });
    }
}

export async function deleteUser(req, res) {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (!hasUserAccess(req, id)) {
            return res.status(403).json({ error: 'You do not have permission to delete this user.' });
        }

        const deletedUser = await deleteUserModel(id);
        if (!deletedUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (req.user.id === id) {
            req.session.user = null;
        }

        return res.status(204).send();
    } catch (error) {
        console.error('Error deleting user:', error);
        return res.status(500).json({ error: 'Failed to delete user' });
    }
}
