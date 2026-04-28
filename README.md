# Quality Data Manager

A full-stack textile quality data management system with a clean, professional interface for recording and managing loom specifications.

## Features

- **Quality Data Entry**: Spreadsheet-style form for textile specifications
- **Live Database**: MongoDB backend with REST API
- **Search & Filter**: Find qualities by name, date, or filter by recency
- **Export Options**: Print and JPG export functionality
- **Responsive Design**: Works on desktop and mobile devices
- **Modal Interface**: Clean popup-based interactions

## Tech Stack

### Frontend
- Vanilla JavaScript (ES6+)
- HTML5 Canvas for JPG export
- CSS3 with modern responsive design
- Google Fonts (DM Sans, IBM Plex Mono)

### Backend
- Node.js with Express.js
- MongoDB with Mongoose ODM
- RESTful API design
- Security middleware (Helmet, CORS, Rate Limiting)

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local installation or cloud service like MongoDB Atlas)
- npm or yarn

### Installation

1. **Clone or download the project files**

2. **Install backend dependencies:**
   ```bash
   npm install
   ```

### Database Setup

**Option 1: MongoDB Atlas (Recommended for beginners)**
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free account and cluster
3. Get your connection string from "Connect" > "Connect your application"
4. Update `.env` file:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/quality-data
   ```

**Option 2: Local MongoDB Installation**
1. Download MongoDB Community Server from [mongodb.com](https://www.mongodb.com/try/download/community)
2. Install and start MongoDB service
3. Use default connection string in `.env`:
   ```
   MONGODB_URI=mongodb://localhost:27017/quality-data
   ```

**Option 3: Docker (Quick setup)**
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   - Frontend: `http://localhost:5000`
   - API Health Check: `http://localhost:5000/api/health`

## API Endpoints

### Qualities
- `GET /api/qualities` - Get all qualities (with search/filter/pagination)
- `GET /api/qualities/:id` - Get single quality
- `POST /api/qualities` - Create new quality
- `PUT /api/qualities/:id` - Update quality
- `DELETE /api/qualities/:id` - Delete quality

### Health Check
- `GET /api/health` - Server health status

## Usage

1. **View Records**: The main page shows all quality records
2. **Add New**: Click "+ New Entry" to open the data entry form
3. **Search**: Use the search bar to find specific qualities
4. **Filter**: Use Recently Added, Month-wise, or Year-wise filters
5. **View Details**: Click "View" on any record to see full preview
6. **Edit/Delete**: Use action buttons in preview modal

## Data Structure

Each quality record contains:
- Basic Info: Loom number, dates, quality/mother names
- Specifications: Design, beam type, ends, reed count, picks, width, weight
- Yarn Details: Name yarn, zameen yarn
- Mix Rows: Configurable warp and weft yarn combinations
- Layout Mode: Auto-detected or manual (SINGLE/SAME/DIFFERENT)

## Deployment

### For Production
1. Set `NODE_ENV=production` in environment
2. Use a production MongoDB instance
3. Consider using PM2 for process management
4. Set up proper SSL certificates
5. Configure firewall and security groups

### Environment Variables
```env
PORT=5000
NODE_ENV=production
MONGODB_URI=your_production_mongodb_uri
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

ISC License - feel free to use for personal or commercial projects.

## Support

For issues or questions, please check the code comments or create an issue in the repository.