-- Create vaults table
CREATE TABLE public.vaults (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    country TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    total_capital DECIMAL(15, 2) NOT NULL DEFAULT 0,
    community_members INTEGER NOT NULL DEFAULT 0,
    carbon_offset_tons INTEGER NOT NULL DEFAULT 0,
    projects_funded INTEGER NOT NULL DEFAULT 0,
    position_x DECIMAL(5, 2) NOT NULL,
    position_y DECIMAL(5, 2) NOT NULL,
    position_z DECIMAL(5, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create investors table
CREATE TABLE public.investors (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    region TEXT NOT NULL,
    total_invested DECIMAL(15, 2) NOT NULL DEFAULT 0,
    position_x DECIMAL(5, 2) NOT NULL,
    position_y DECIMAL(5, 2) NOT NULL,
    position_z DECIMAL(5, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create transactions table for capital flows
CREATE TABLE public.transactions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    from_investor_id UUID REFERENCES public.investors(id) ON DELETE CASCADE,
    to_vault_id UUID REFERENCES public.vaults(id) ON DELETE CASCADE,
    amount DECIMAL(15, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    transaction_type TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS (public read for this demo data)
ALTER TABLE public.vaults ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Public read policies for demo data
CREATE POLICY "Anyone can view vaults" ON public.vaults FOR SELECT USING (true);
CREATE POLICY "Anyone can view investors" ON public.investors FOR SELECT USING (true);
CREATE POLICY "Anyone can view transactions" ON public.transactions FOR SELECT USING (true);

-- Enable realtime for transactions
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;

-- Insert sample vault data
INSERT INTO public.vaults (name, country, status, total_capital, community_members, carbon_offset_tons, projects_funded, position_x, position_y, position_z) VALUES
('Kenya Sovereign Vault', 'Kenya', 'active', 420000000, 125000, 45000, 156, -2, 1, 0),
('Rwanda Green Fund', 'Rwanda', 'active', 280000000, 85000, 32000, 98, -1, -1.5, 0),
('Ghana Climate Hub', 'Ghana', 'active', 350000000, 110000, 38000, 134, 0, 0.5, 0),
('Nigeria Development Vault', 'Nigeria', 'planned', 0, 0, 0, 0, 1.5, -0.5, 0);

-- Insert sample investor data
INSERT INTO public.investors (name, type, region, total_invested, position_x, position_y, position_z) VALUES
('EU Impact Funds', 'institutional', 'Europe', 270000000, -4, 3, -2),
('Asian Development Bank', 'development_bank', 'Asia', 200000000, 3, 2, -1),
('US Climate Investors', 'private_equity', 'North America', 150000000, -3, -2, -1.5),
('Universities Network', 'academic', 'Global', 200000000, 4, -1, -2);

-- Insert sample transactions
INSERT INTO public.transactions (from_investor_id, to_vault_id, amount, transaction_type, description)
SELECT 
    i.id, v.id, 
    CASE 
        WHEN i.name = 'EU Impact Funds' AND v.country = 'Kenya' THEN 180000000
        WHEN i.name = 'Asian Development Bank' AND v.country = 'Kenya' THEN 120000000
        WHEN i.name = 'US Climate Investors' AND v.country = 'Rwanda' THEN 150000000
        WHEN i.name = 'Universities Network' AND v.country = 'Ghana' THEN 200000000
        WHEN i.name = 'EU Impact Funds' AND v.country = 'Ghana' THEN 90000000
        WHEN i.name = 'Asian Development Bank' AND v.country = 'Rwanda' THEN 80000000
        ELSE 50000000
    END,
    'investment',
    'Regenerative development capital allocation'
FROM public.investors i, public.vaults v
WHERE v.status = 'active'
AND (
    (i.name = 'EU Impact Funds' AND v.country IN ('Kenya', 'Ghana'))
    OR (i.name = 'Asian Development Bank' AND v.country IN ('Kenya', 'Rwanda'))
    OR (i.name = 'US Climate Investors' AND v.country = 'Rwanda')
    OR (i.name = 'Universities Network' AND v.country = 'Ghana')
);