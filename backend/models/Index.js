import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Convert import.meta.url to a file path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const models = {};

// Function to recursively read files from a directory
const readFilesRecursively = (dir) => {
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      // Recursively read subdirectory
      readFilesRecursively(fullPath);
    } else if (file !== 'Index.js' && file.endsWith('.js')) {
      // Import the model file
      import(fullPath).then((modelModule) => {
        const modelName = path.basename(file, '.js');
        models[modelName] = modelModule.default || modelModule; // Ensure default export is used if available
      }).catch((error) => {
        console.error(`Failed to import model from file ${file}:`, error);
      });
    }
  });
};

// Start reading files from the base directory
readFilesRecursively(__dirname);

// Log the models after all imports are complete
setTimeout(() => {
  console.log('Registered models:', models);
}, 1000);

export default models;
