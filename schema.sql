-- Create the qualities table with camelCase to match app.js
CREATE TABLE IF NOT EXISTS qualities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "loomNumber" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "qualityName" TEXT NOT NULL,
    "motherName" TEXT NOT NULL,
    design TEXT,
    "beamType" TEXT CHECK ("beamType" IN ('SIZING', 'WARPING')) DEFAULT 'SIZING',
    ends TEXT,
    "reedCount" TEXT,
    "pickLoom" TEXT,
    "pickTable" TEXT,
    width TEXT,
    "qualityWeight" TEXT,
    "nameYarn" TEXT,
    "zameenYarn" TEXT,
    "layoutMode" TEXT CHECK ("layoutMode" IN ('AUTO', 'SINGLE', 'SAME', 'DIFFERENT')) DEFAULT 'AUTO',
    "warpRows" JSONB DEFAULT '[]'::jsonb,
    "weftRows" JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE qualities ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows anyone to read/write for now
CREATE POLICY "Allow public access" ON qualities
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to call the function on update
CREATE TRIGGER update_qualities_updated_at
    BEFORE UPDATE ON qualities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
