import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/recipes_db';
await mongoose.connect(mongoUri, { dbName: 'recipes_db' });

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

const recipeSchema = new mongoose.Schema(
  {
    cuisine: { type: String, index: true },
    title: { type: String, index: true },
    rating: { type: Number, index: true },
    prep_time: { type: Number },
    cook_time: { type: Number },
    total_time: { type: Number, index: true },
    description: { type: String },
    nutrients: nutrientsSchema,
    serves: { type: String }
  },
  { timestamps: true }
);

const Recipe = mongoose.model('Recipe', recipeSchema);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/recipes', async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page, 10) || 1;
    const limit = Number.parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      Recipe.find({})
        .sort({ rating: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Recipe.countDocuments()
    ]);

    res.json({ page, limit, total, data });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

function parseNumericFilter(input) {
  if (!input) return null;
  const match = String(input).match(/^(<=|>=|=|<|>)(\s*)?(\d+(?:\.\d+)?)$/);
  if (!match) return null;
  const operator = match[1];
  const value = Number(match[3]);
  const map = {
    '=': '$eq',
    '<=': '$lte',
    '>=': '$gte',
    '<': '$lt',
    '>': '$gt'
  };
  return { [map[operator]]: value };
}

app.get('/api/recipes/search', async (req, res) => {
  try {
    const { calories, title, cuisine, total_time, rating } = req.query;
    const query = {};

    if (title) {
      query.title = { $regex: String(title), $options: 'i' };
    }
    if (cuisine) {
      query.cuisine = String(cuisine);
    }
    if (rating) {
      const f = parseNumericFilter(rating);
      if (!f) return res.status(400).json({ error: 'Invalid rating filter' });
      query.rating = f;
    }
    if (total_time) {
      const f = parseNumericFilter(total_time);
      if (!f) return res.status(400).json({ error: 'Invalid total_time filter' });
      query.total_time = f;
    }
    if (calories) {
      const f = parseNumericFilter(calories);
      if (!f) return res.status(400).json({ error: 'Invalid calories filter' });
      // Extract numeric from string like "389 kcal" before comparing
      const numericCaloriesExpr = {
        $expr: {
          $and: [
            { $ne: ['$nutrients.calories', null] },
            {
              [Object.keys(f)[0]]: [
                {
                  $toDouble: {
                    $ifNull: [
                      {
                        $trim: {
                          input: {
                            $replaceAll: {
                              input: '$nutrients.calories',
                              find: ' kcal',
                              replacement: ''
                            }
                          }
                        }
                      },
                      'NaN'
                    ]
                  }
                },
                Object.values(f)[0]
              ]
            }
          ]
        }
      };
      Object.assign(query, numericCaloriesExpr);
    }

    const results = await Recipe.find(query).sort({ rating: -1 }).limit(200).lean();
    res.json({ data: results });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running on http://localhost:${port}`);
});


