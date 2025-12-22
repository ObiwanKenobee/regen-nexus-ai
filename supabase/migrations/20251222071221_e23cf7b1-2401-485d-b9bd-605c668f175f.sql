-- Allow anyone to insert vaults
CREATE POLICY "Anyone can create vaults"
ON public.vaults
FOR INSERT
WITH CHECK (true);

-- Allow anyone to insert investors
CREATE POLICY "Anyone can create investors"
ON public.investors
FOR INSERT
WITH CHECK (true);

-- Allow anyone to insert transactions
CREATE POLICY "Anyone can create transactions"
ON public.transactions
FOR INSERT
WITH CHECK (true);