const fs = require('fs');
const path = require('path');

// Define source and destination directories
const sourceDir = path.join(__dirname, 'tfjs_model');
const destDir = path.join(__dirname, '..', 'public', 'model', 'tfjs_model');

// Function to create directory if it doesn't exist
function ensureDirectoryExistence(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Created directory: ${dirPath}`);
  }
}

// Function to copy a file
function copyFile(source, dest) {
  try {
    fs.copyFileSync(source, dest);
    console.log(`Copied: ${source} -> ${dest}`);
  } catch (err) {
    console.error(`Error copying ${source}:`, err);
  }
}

// Function to copy directory recursively
function copyDirectory(source, dest) {
  // Make sure destination directory exists
  ensureDirectoryExistence(dest);
  
  // Get all files and folders in the source directory
  const entries = fs.readdirSync(source, { withFileTypes: true });
  
  // Process each entry
  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      // If entry is a directory, recursively copy it
      copyDirectory(sourcePath, destPath);
    } else {
      // If entry is a file, copy it
      copyFile(sourcePath, destPath);
    }
  }
}

// Main execution
console.log('Starting model copy process...');

// Check if source directory exists
if (!fs.existsSync(sourceDir)) {
  console.error(`Source directory not found: ${sourceDir}`);
  console.log('The model may not have been trained yet. Run the training script first.');
  process.exit(1);
}

// Copy the model directory to public folder
try {
  copyDirectory(sourceDir, destDir);
  console.log('Model successfully copied to public directory!');
  console.log(`You can now access it at: /model/tfjs_model/ in your web app`);
} catch (err) {
  console.error('Error during copy process:', err);
  process.exit(1);
} 