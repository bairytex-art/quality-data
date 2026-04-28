require('dotenv').config();
const mongoose = require('mongoose');

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

// Vercel serverless function handler
module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { url, method } = req;
    
    // Parse URL to get path
    const path = url.split('?')[0];
    
    // Handle different routes
    if (path === '/api/qualities' && method === 'GET') {
      await handleGetQualities(req, res);
    } else if (path.match(/^\/api\/qualities\/[^\/]+$/) && method === 'GET') {
      await handleGetQuality(req, res);
    } else if (path === '/api/qualities' && method === 'POST') {
      await handleCreateQuality(req, res);
    } else if (path.match(/^\/api\/qualities\/[^\/]+$/) && method === 'PUT') {
      await handleUpdateQuality(req, res);
    } else if (path.match(/^\/api\/qualities\/[^\/]+$/) && method === 'DELETE') {
      await handleDeleteQuality(req, res);
    } else if (path === '/api/health' && method === 'GET') {
      res.json({ status: 'OK', timestamp: new Date().toISOString() });
    } else {
      res.status(404).json({ message: 'Route not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

async function handleGetQualities(req, res) {
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
}

async function handleGetQuality(req, res) {
  try {
    const id = req.url.split('/')[3];
    const quality = await Quality.findById(id);
    if (!quality) return res.status(404).json({ message: 'Quality not found' });
    res.json(quality);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

async function handleCreateQuality(req, res) {
  try {
    const quality = new Quality(req.body);
    const savedQuality = await quality.save();
    res.status(201).json(savedQuality);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

async function handleUpdateQuality(req, res) {
  try {
    const id = req.url.split('/')[3];
    const quality = await Quality.findByIdAndUpdate(id, req.body, { new: true });
    if (!quality) return res.status(404).json({ message: 'Quality not found' });
    res.json(quality);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

async function handleDeleteQuality(req, res) {
  try {
    const id = req.url.split('/')[3];
    const quality = await Quality.findByIdAndDelete(id);
    if (!quality) return res.status(404).json({ message: 'Quality not found' });
    res.json({ message: 'Quality deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
