require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/quality-data', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Quality Schema
const qualitySchema = new mongoose.Schema({
  loomNumber: { type: String, required: true },
  startDate: { type: Date, required: true },
  qualityName: { type: String, required: true },
  motherName: { type: String, required: true },
  design: String,
  beamType: { type: String, enum: ['SIZING', 'WARPING'], default: 'SIZING' },
  ends: String,
  reedCount: String,
  pickLoom: String,
  pickTable: String,
  width: String,
  qualityWeight: String,
  nameYarn: String,
  zameenYarn: String,
  layoutMode: { type: String, enum: ['AUTO', 'SINGLE', 'SAME', 'DIFFERENT'], default: 'AUTO' },
  warpRows: [{
    qty: String,
    text: String
  }],
  weftRows: [{
    qty: String,
    text: String
  }]
}, { timestamps: true });

const Quality = mongoose.model('Quality', qualitySchema);

// Routes
app.get('/api/qualities', async (req, res) => {
  try {
    const { search, filter, page = 1, limit = 50 } = req.query;
    let query = {};

    // Search functionality
    if (search) {
      query.$or = [
        { qualityName: { $regex: search, $options: 'i' } },
        { motherName: { $regex: search, $options: 'i' } },
        { loomNumber: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter functionality
    let sortOption = { createdAt: -1 }; // Default: recently added

    if (filter === 'month') {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      query.startDate = { $gte: startOfMonth };
      sortOption = { startDate: -1 };
    } else if (filter === 'year') {
      const now = new Date();
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      query.startDate = { $gte: startOfYear };
      sortOption = { startDate: -1 };
    }

    const qualities = await Quality.find(query)
      .sort(sortOption)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Quality.countDocuments(query);

    res.json({
      qualities,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/qualities/:id', async (req, res) => {
  try {
    const quality = await Quality.findById(req.params.id);
    if (!quality) return res.status(404).json({ message: 'Quality not found' });
    res.json(quality);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/qualities', async (req, res) => {
  try {
    const quality = new Quality(req.body);
    const savedQuality = await quality.save();
    res.status(201).json(savedQuality);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.put('/api/qualities/:id', async (req, res) => {
  try {
    const quality = await Quality.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!quality) return res.status(404).json({ message: 'Quality not found' });
    res.json(quality);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.delete('/api/qualities/:id', async (req, res) => {
  try {
    const quality = await Quality.findByIdAndDelete(req.params.id);
    if (!quality) return res.status(404).json({ message: 'Quality not found' });
    res.json({ message: 'Quality deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve static files (frontend)
app.use(express.static('.'));

// Root route - serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// Catch-all handler for client-side routing
app.get('*', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// Start server
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Export for Vercel
module.exports = app;