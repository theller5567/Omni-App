import User from '../models/User.js'; // Adjust the import path as necessary

export const getUsernameById = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return user.username; // Assuming the user's name is stored in the 'name' field
  } catch (error) {
    console.error('Error fetching user name:', error);
    throw error;
  }
};

/**
 * Get public user profile by ID
 * @param {string} userId - The ID of the user
 * @returns {Promise<Object>} - The public user profile
 */
export const getUserPublicProfileById = async (userId) => {
  try {
    const user = await User.findById(userId).select('username firstName lastName avatar createdAt'); // Specify public fields
    // const user = await User.findById(userId); // Let's try without .select first for debugging
    if (!user) {
      // console.log(`User not found in DB for ID: ${userId}`); // Added log
      throw new Error('User not found');
    }
    // console.log(`User found in DB: ${user.username}`); // Added log
    // Once confirmed working, we can re-add .select with only desired public fields
    // For now, return the whole user object for debugging if found
    return user;
  } catch (error) {
    console.error('Error fetching public user profile by ID:', error); // Reverted log
    throw error; // Re-throw to be caught by the route handler
  }
};
