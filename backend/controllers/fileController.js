import File from "../models/File.js";

// Upload File
export const uploadFile = async (req, res) => {
  try {
    const { filename, path, size, type } = req.body;
    const newFile = new File({ filename, path, size, type });
    await newFile.save();
    res.status(201).json(newFile);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get All Files
export const getFiles = async (req, res) => {
  try {
    const files = await File.find();
    res.json(files);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete File
export const deleteFile = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedFile = await File.findByIdAndDelete(id);
    if (!deletedFile) {
      return res.status(404).json({ message: "File not found" });
    }
    res.json({ message: "File deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
