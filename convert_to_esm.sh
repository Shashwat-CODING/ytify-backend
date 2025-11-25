#!/bin/bash

# Convert all CommonJS files to ESM

# List of files to convert
files=(
  "lib/get_youtube_song.js"
  "lib/lastfm_api.js"
  "lib/jiosaavn.js"
  "lib/youtube-search.js"
  "routes/youtube.js"
  "routes/entities.js"
  "routes/jiosaavn.js"
  "routes/api.js"
  "routes/explore.js"
)

for file in "${files[@]}"; do
  echo "Converting $file..."
  
  # Replace require() with import
  sed -i '' "s/const \(.*\) = require('\(.*\)');/import \1 from '\2.js';/g" "$file"
  sed -i '' "s/const { \(.*\) } = require('\(.*\)');/import { \1 } from '\2.js';/g" "$file"
  sed -i '' "s/require('\(.*\)')/import('\1.js')/g" "$file"
  
  # Replace module.exports with export
  sed -i '' "s/module.exports = \(.*\);/export default \1;/g" "$file"
  sed -i '' "s/module.exports = {/export {/g" "$file"
  
  # Fix .js.js double extension
  sed -i '' "s/\.js\.js/\.js/g" "$file"
  
  # Fix node modules (remove .js for them)
  sed -i '' "s/from 'express\.js'/from 'express'/g" "$file"
  sed -i '' "s/from 'axios\.js'/from 'axios'/g" "$file"
  sed -i '' "s/from 'cors\.js'/from 'cors'/g" "$file"
  sed -i '' "s/from 'helmet\.js'/from 'helmet'/g" "$file"
  sed -i '' "s/from 'morgan\.js'/from 'morgan'/g" "$file"
  sed -i '' "s/from 'dotenv\.js'/from 'dotenv'/g" "$file"
  
done

echo "Conversion complete!"
