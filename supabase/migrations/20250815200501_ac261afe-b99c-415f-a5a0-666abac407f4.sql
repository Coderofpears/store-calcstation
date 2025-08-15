-- Add preorder support to purchases table
ALTER TABLE public.purchases 
ADD COLUMN is_preorder BOOLEAN DEFAULT false,
ADD COLUMN preorder_release_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN order_status TEXT DEFAULT 'completed';

-- Create index for better performance on purchase queries
CREATE INDEX idx_purchases_user_id_created_at ON public.purchases(user_id, created_at DESC);
CREATE INDEX idx_purchases_is_preorder ON public.purchases(is_preorder);

-- Update games table to support preorder dates
ALTER TABLE public.games
ADD COLUMN release_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN is_preorder_available BOOLEAN DEFAULT false;