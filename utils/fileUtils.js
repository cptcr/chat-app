import fs from 'fs';
import path from 'path';

export const readFromFile = (filePath) => {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error(`Error reading file ${filePath}:`, err);
    return [];
  }
};

export const writeToFile = (filePath, data) => {
  console.log(`Writing to file: ${filePath}`);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`Successfully wrote to file: ${filePath}`);
  } catch (err) {
    console.error(`Error writing to file ${filePath}:`, err);
  }
};
