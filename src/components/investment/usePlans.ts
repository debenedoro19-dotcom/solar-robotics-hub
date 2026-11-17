import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { InvestmentPlan } from './planCard';

/**
 * Proportional investment packages:
 * Rate scales strictly with term duration at 1.00% daily:
 *  - 15 Days -> 15% return (min $500)
 *  - 30 Days -> 30% return (min $1,000)
 *  - 45 Days -> 45% return (min $2,500)
 *  - 60 Days -> 60% return (min $5,000)
 *  - 90 Days -> 90% return (min $10,000)
 *  - 180 Days -> 180% return (min $25,000)
 */
export const CANONICAL_PROPORTIONAL_PLANS: InvestmentPlan[] = [
  {
    id: "canonical-powerwall-15",
    name: "Powerwall Energy Reserve",
    category: "Powerwall Energy",
    description: "Entry-tier residential and commercial battery reserve program supporting local virtual power plant grid stabilization.",
    daily_roi: 1.0,
    duration_days: 15,
    min_deposit: 500,
    max_deposit: 10000,
    sort_order: 1,
    is_active: true,
  },
  {
    id: "canonical-solar-30",
    name: "Solar Roof & Microgrid",
    category: "Solar Megapack",
    description: "Decentralized rooftop solar tile and microgrid storage installations across high-irradiance Sun Belt communities.",
    daily_roi: 1.0,
    duration_days: 30,
    min_deposit: 1000,
    max_deposit: 25000,
    sort_order: 2,
    is_active: true,
  },
  {
    id: "canonical-supercharger-45",
    name: "Supercharger V4 Expansion",
    category: "Supercharger Network",
    description: "High-capacity V4 Supercharger corridor installations and megawatt charging systems along major logistics corridors.",
    daily_roi: 1.0,
    duration_days: 45,
    min_deposit: 2500,
    max_deposit: 50000,
    sort_order: 3,
    is_active: true,
  },
  {
    id: "canonical-optimus-60",
    name: "Optimus Robotics Line",
    category: "Optimus Robotics",
    description: "Next-generation humanoid robotics tooling, sub-assembly testing cells, and tactile actuation deployment lines.",
    daily_roi: 1.0,
    duration_days: 60,
    min_deposit: 5000,
    max_deposit: 100000,
    sort_order: 4,
    is_active: true,
  },
  {
    id: "canonical-megapack-90",
    name: "Megapack 2 XL Utility Grid",
    category: "Solar Megapack",
    description: "Utility-scale multi-megawatt-hour battery storage farms providing frequency regulation and wholesale grid capacity.",
    daily_roi: 1.0,
    duration_days: 90,
    min_deposit: 10000,
    max_deposit: 250000,
    sort_order: 5,
    is_active: true,
  },
  {
    id: "canonical-cybercab-180",
    name: "Autonomous Fleet Sovereign",
    category: "Vehicle Fleet",
    description: "Institutional capital allocation powering dedicated Cybercab fleet manufacturing, sensor suites, and depot infrastructure.",
    daily_roi: 1.0,
    duration_days: 180,
    min_deposit: 25000,
    max_deposit: 1000000,
    sort_order: 6,
    is_active: true,
  },
];

export function useInvestmentPlans() {
  const [plans, setPlans] = useState<InvestmentPlan[]>(CANONICAL_PROPORTIONAL_PLANS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('investment_plans')
          .select('id,name,category,description,daily_roi,duration_days,min_deposit,max_deposit,sort_order')
          .eq('is_active', true)
          .order('duration_days', { ascending: true });

        if (!cancelled) {
          if (!error && data && data.length > 0) {
            // Sort ascending by duration days so entry tier (15d) is always first
            const sorted = [...data].sort((a, b) => Number(a.duration_days) - Number(b.duration_days));
            setPlans(sorted as unknown as InvestmentPlan[]);
          } else {
            setPlans(CANONICAL_PROPORTIONAL_PLANS);
          }
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setPlans(CANONICAL_PROPORTIONAL_PLANS);
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { plans, loading };
}
