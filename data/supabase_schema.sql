-- ===================================================================
-- The NEW GEN Tutoring Institute - Supabase Database Schema
-- Run this script in the Supabase Dashboard -> SQL Editor -> Run
-- ===================================================================

-- 1. Create App Data Table (JSONB Store - ยืดหยุ่นสูงสุด รองรับโครงสร้างข้อมูลเดิม 100%)
CREATE TABLE IF NOT EXISTS public.app_data (
  key TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.app_data ENABLE ROW LEVEL SECURITY;

-- Policy 1: ใครก็อ่านข้อมูลได้ (Public Read) เพื่อให้หน้าเว็บโหลดข้อมูลได้ทันที
CREATE POLICY "Public Read Access" 
ON public.app_data 
FOR SELECT 
USING (true);

-- Policy 2: อนุญาตให้แอดมินหรือ Service Role เพิ่ม/แก้ไข/ลบ ข้อมูลได้
CREATE POLICY "Service Role / Authenticated Write Access" 
ON public.app_data 
FOR ALL 
USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- Trigger to auto update updated_at timestamp
CREATE OR REPLACE FUNCTION update_app_data_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_app_data_timestamp ON public.app_data;
CREATE TRIGGER tr_app_data_timestamp
BEFORE UPDATE ON public.app_data
FOR EACH ROW
EXECUTE FUNCTION update_app_data_timestamp();

-- ===================================================================
-- 2. Storage Bucket สำหรับรูปภาพ (Uploads)
-- สามารถสร้างผ่านหน้าเว็บ Supabase เมนู Storage -> New Bucket ชื่อ "uploads" (Public)
-- หรือรันคำสั่ง SQL ด้านล่าง:
-- ===================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Policy สำหรับให้ทุกคนดูรูปใน Storage ได้ (Public Read Image)
CREATE POLICY "Public Bucket View"
ON storage.objects
FOR SELECT
USING (bucket_id = 'uploads');

-- Policy สำหรับให้อัปโหลดรูปได้
CREATE POLICY "Allow Image Uploads"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'uploads');
