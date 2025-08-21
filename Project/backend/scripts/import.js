import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/recipes_db';

function toNullableNumber(value) {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

const nutrientsFields = [
  'calories',
  'carbohydrateContent',
  'cholesterolContent',
  'fiberContent',
  'proteinContent',
  'saturatedFatContent',
  'sodiumContent',
  'sugarContent',
  'fatContent',
  'unsaturatedFatContent'
];

const nutrientsSchema = new mongoose.Schema(
  {
    calories: String,
    carbohydrateContent: String,
    cholesterolContent: String,
    fiberContent: String,
    proteinContent: String,
    saturatedFatContent: String,
    sodiumContent: String,
    sugarContent: String,
    fatContent: String,
    unsaturatedFatContent: String
  },
  { _id: false }
);

const recipeSchema = new mongoose.Schema({
  cuisine: String,
  title: String,
  rating: Number,
  prep_time: Number,
  cook_time: Number,
  total_time: Number,
  description: String,
  nutrients: nutrientsSchema,
  serves: String
});

const Recipe = mongoose.model('Recipe', recipeSchema);

async function main() {
  const jsonPath = process.argv[2];
  if (!jsonPath) {
    console.error('Usage: node scripts/import.js <path-to-US_recipes.json>');
    process.exit(1);
  }

  const absPath = path.isAbsolute(jsonPath) ? jsonPath : path.join(process.cwd(), jsonPath);
  if (!fs.existsSync(absPath)) {
    console.error(`File not found: ${absPath}`);
    process.exit(1);
  }

  const fileContent = fs.readFileSync(absPath, 'utf-8');
  const parsed = JSON.parse(fileContent);
  const recipesArray = Array.isArray(parsed) ? parsed : Object.values(parsed);

  const cleaned = recipesArray.map((r) => ({
    cuisine: r.cuisine ?? null,
    title: r.title ?? null,
    rating: toNullableNumber(r.rating),
    prep_time: toNullableNumber(r.prep_time),
    cook_time: toNullableNumber(r.cook_time),
    total_time: toNullableNumber(r.total_time),
    description: r.description ?? null,
    nutrients: nutrientsFields.reduce((acc, key) => {
      if (r.nutrients && r.nutrients[key] !== undefined) acc[key] = String(r.nutrients[key]);
      return acc;
    }, {}),
    serves: r.serves ?? null
  }));

  await mongoose.connect(mongoUri, { dbName: 'recipes_db' });
  await Recipe.deleteMany({});
  await Recipe.insertMany(cleaned, { ordered: false });
  await mongoose.disconnect();
  console.log(`Imported ${cleaned.length} recipes`);
}

main().catch(async (err) => {
  console.error(err);
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
});


