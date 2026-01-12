-- Create table for analysis history
CREATE TABLE public.analysis_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    text TEXT NOT NULL,
    sentiment TEXT NOT NULL CHECK (sentiment IN ('positif', 'negatif', 'netral')),
    confidence NUMERIC(4,3) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    method TEXT NOT NULL CHECK (method IN ('ml', 'llm')),
    model TEXT,
    reasoning TEXT,
    source_url TEXT,
    source_title TEXT,
    probabilities JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.analysis_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see and manage their own history
CREATE POLICY "Users can view their own history"
ON public.analysis_history
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own history"
ON public.analysis_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own history"
ON public.analysis_history
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_analysis_history_user_id ON public.analysis_history(user_id);
CREATE INDEX idx_analysis_history_created_at ON public.analysis_history(created_at DESC);