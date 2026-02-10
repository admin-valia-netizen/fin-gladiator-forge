
-- Table to track integrity points for each user
CREATE TABLE public.integrity_points (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  registration_id UUID NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  reason TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Materialized view-like summary table for fast lookups
CREATE TABLE public.points_summary (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  registration_id UUID NOT NULL UNIQUE REFERENCES public.registrations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL UNIQUE,
  total_points INTEGER NOT NULL DEFAULT 0,
  integrity_index INTEGER NOT NULL DEFAULT 100,
  centurion_status BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.integrity_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_summary ENABLE ROW LEVEL SECURITY;

-- RLS for integrity_points
CREATE POLICY "Users can view own points" ON public.integrity_points
  FOR SELECT USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert points" ON public.integrity_points
  FOR INSERT WITH CHECK (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

-- RLS for points_summary
CREATE POLICY "Users can view own summary" ON public.points_summary
  FOR SELECT USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can insert own summary" ON public.points_summary
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own summary" ON public.points_summary
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can update any summary" ON public.points_summary
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

-- Function to add points and update summary
CREATE OR REPLACE FUNCTION public.add_integrity_points(
  p_registration_id UUID,
  p_user_id UUID,
  p_points INTEGER,
  p_reason TEXT
) RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_total INTEGER;
  v_referral_count INTEGER;
  v_centurion BOOLEAN;
BEGIN
  -- Insert the points record
  INSERT INTO integrity_points (registration_id, user_id, points, reason)
  VALUES (p_registration_id, p_user_id, p_points, p_reason);

  -- Get referral count for centurion check
  SELECT COUNT(*) INTO v_referral_count
  FROM registrations
  WHERE referred_by = (SELECT referral_code FROM registrations WHERE id = p_registration_id)
    AND passport_level IN ('bronce', 'dorado');

  v_centurion := v_referral_count >= 50;

  -- Upsert the summary
  INSERT INTO points_summary (registration_id, user_id, total_points, centurion_status, updated_at)
  VALUES (p_registration_id, p_user_id, p_points, v_centurion, now())
  ON CONFLICT (registration_id) DO UPDATE SET
    total_points = (SELECT COALESCE(SUM(points), 0) FROM integrity_points WHERE registration_id = p_registration_id),
    centurion_status = v_centurion,
    updated_at = now();

  SELECT total_points INTO v_total FROM points_summary WHERE registration_id = p_registration_id;
  RETURN v_total;
END;
$$;

-- Trigger: auto-award points when a referral completes registration (reaches bronce)
CREATE OR REPLACE FUNCTION public.award_referral_points()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_referrer RECORD;
BEGIN
  -- Only when passport_level changes to bronce or dorado
  IF (TG_OP = 'UPDATE' AND OLD.passport_level IS DISTINCT FROM NEW.passport_level 
      AND NEW.passport_level IN ('bronce', 'dorado') AND NEW.referred_by IS NOT NULL) THEN
    
    -- Find the referrer
    SELECT id, user_id INTO v_referrer
    FROM registrations
    WHERE referral_code = NEW.referred_by;

    IF v_referrer.user_id IS NOT NULL THEN
      -- Award 10 points for validated referral
      PERFORM add_integrity_points(v_referrer.id, v_referrer.user_id, 10, 'Referido validado: ' || NEW.full_name);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER tr_award_referral_points
  AFTER UPDATE ON public.registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.award_referral_points();
