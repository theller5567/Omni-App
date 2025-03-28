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
