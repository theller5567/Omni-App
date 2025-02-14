export const updateUsername = async (req, res) => {
    try {
      const { userId, newUsername } = req.body;
  
      // Check if the new username is already taken
      const existingUser = await User.findOne({ username: newUsername });
      if (existingUser) {
        return res.status(400).json({ message: "Username already taken" });
      }
  
      // Update the user's username
      const user = await User.findByIdAndUpdate(userId, { username: newUsername }, { new: true });
  
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      res.status(200).json({ message: "Username updated successfully", user });
    } catch (error) {
      console.error("Error in updateUsername:", error);  // Log the error
      res.status(500).json({ message: "Server error", error: error.message });
    }
  };