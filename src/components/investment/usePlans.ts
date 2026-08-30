import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { InvestmentPlan } from './planCard';

export function useInvestmentPlans() {
  const [plans, setPlans] = useState<InvestmentPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('investment_plans')
        .select('id,name,category,description,daily_roi,duration_days,min_deposit,max_deposit,sort_order')
        .eq('is_active', true)
        .order('sort_order');
      if (!cancelled) {
        setPlans((data ?? []) as unknown as InvestmentPlan[]);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { plans, loading };
}
