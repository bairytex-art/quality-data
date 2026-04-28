# Quality Data Manager (Supabase Edition)

A full-stack textile quality data management system with a clean, professional interface for recording and managing loom specifications, now powered by Supabase.

## Features

- **Quality Data Entry**: Spreadsheet-style form for textile specifications
- **Supabase Integration**: Direct client-side interaction with PostgreSQL database
- **Search & Filter**: Find qualities by name, date, or filter by recency
- **Export Options**: Print and JPG export functionality
- **Responsive Design**: Works on desktop and mobile devices
- **Modal Interface**: Clean popup-based interactions

## Tech Stack

### Frontend
- Vanilla JavaScript (ES6+)
- Supabase JS Client (v2)
- HTML5 Canvas for JPG export
- CSS3 with modern responsive design
- Google Fonts (DM Sans, IBM Plex Mono)

### Backend (Infrastructure)
- Supabase (PostgreSQL + Auth + Storage)
- Local Node.js server for static file serving

## Setup Instructions

### 1. Supabase Project Setup

1. Create a new project on [Supabase](https://supabase.com/).
2. Go to the **SQL Editor** in your Supabase dashboard.
3. Copy the contents of `schema.sql` from this project and run it to create the `qualities` table and setup RLS policies.
4. Go to **Project Settings** > **API** to get your `Project URL` and `anon public` key.

### 2. Configure Frontend

1. Open `app.js`.
2. Replace `YOUR_SUPABASE_URL` and `YOUR_SUPABASE_ANON_KEY` with your project credentials.

### 3. Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the local server:
   ```bash
   npm start
   ```

3. Open your browser:
   - Frontend: `http://localhost:5000`

## Data Structure

The system uses a PostgreSQL table named `qualities` with the following fields:
- `id`: UUID (Primary Key)
- `loomNumber`: Text
- `startDate`: Date
- `qualityName`: Text
- `motherName`: Text
- `design`: Text
- `beamType`: Text (SIZING/WARPING)
- `ends`: Text
- `reedCount`: Text
- `pickLoom`: Text
- `pickTable`: Text
- `width`: Text
- `qualityWeight`: Text
- `nameYarn`: Text
- `zameenYarn`: Text
- `layoutMode`: Text (AUTO/SINGLE/SAME/DIFFERENT)
- `warpRows`: JSONB (Array of objects)
- `weftRows`: JSONB (Array of objects)
- `created_at`: Timestamp
- `updated_at`: Timestamp
