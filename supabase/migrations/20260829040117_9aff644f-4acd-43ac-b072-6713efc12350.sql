CREATE TABLE public.inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price text NOT NULL DEFAULT '',
  badge text NOT NULL DEFAULT 'NEW',
  badge_type text NOT NULL DEFAULT 'new',
  category text NOT NULL DEFAULT 'Vehicles',
  image_url text NOT NULL DEFAULT '',
  alt text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.inventory_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventory_items TO authenticated;
GRANT ALL ON public.inventory_items TO service_role;

ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "inventory_public_read_active" ON public.inventory_items
  FOR SELECT TO anon, authenticated USING (is_active = true);

CREATE POLICY "inventory_admin_all" ON public.inventory_items
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TRIGGER trg_inventory_items_updated_at BEFORE UPDATE ON public.inventory_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_inventory_items_sort ON public.inventory_items (category, sort_order);

INSERT INTO public.inventory_items (name, price, badge, badge_type, category, image_url, alt, sort_order) VALUES
('2025 Tesla Cybertruck AWD','$79,990','NEW','new','Vehicles','https://images.unsplash.com/photo-1715135755172-4605bd091ba2?auto=format&fit=crop&w=640&q=65','Tesla Cybertruck AWD stainless steel pickup parked on open road at dusk',1),
('2025 Cybertruck Cyberbeast','$99,990','NEW','new','Vehicles','https://images.unsplash.com/photo-1715135755172-4605bd091ba2?auto=format&fit=crop&w=640&q=65','Tesla Cybertruck Cyberbeast tri-motor edition on desert terrain',2),
('2025 Model S Plaid','$89,990','NEW','new','Vehicles','https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&w=640&q=65','Tesla Model S Plaid electric sedan, sleek aerodynamic profile',3),
('2025 Model S Long Range','$74,990','NEW','new','Vehicles','https://images.unsplash.com/photo-1554744512-d6c603f27c54?auto=format&fit=crop&w=640&q=65','Tesla Model S Long Range luxury electric sedan side profile',4),
('CPO Model S Long Range','$69,990','CPO','cpo','Vehicles','https://images.unsplash.com/photo-1554744512-d6c603f27c54?auto=format&fit=crop&w=640&q=65','Certified pre-owned Tesla Model S Long Range electric sedan',5),
('2025 Model 3 Highland Performance','$54,990','NEW','new','Vehicles','https://images.unsplash.com/photo-1591628360686-06bc9367d09a?auto=format&fit=crop&w=640&q=65','Tesla Model 3 Highland Performance compact sport sedan',6),
('2025 Model 3 Highland Long Range AWD','$47,990','NEW','new','Vehicles','https://images.unsplash.com/photo-1655792290994-93437dc0482c?auto=format&fit=crop&w=640&q=65','Tesla Model 3 Highland Long Range all-wheel-drive sedan',7),
('2025 Model 3 Highland RWD','$38,990','NEW','new','Vehicles','https://images.unsplash.com/photo-1655792290994-93437dc0482c?auto=format&fit=crop&w=640&q=65','Tesla Model 3 Highland rear-wheel-drive sedan in urban setting',8),
('CPO Model 3 2024','$32,990','CPO','cpo','Vehicles','https://images.unsplash.com/photo-1591628360686-06bc9367d09a?auto=format&fit=crop&w=640&q=65','Certified pre-owned 2024 Tesla Model 3 compact electric sedan',9),
('2025 Model X Plaid','$94,990','NEW','new','Vehicles','https://images.unsplash.com/photo-1650938777875-a375b33cd705?auto=format&fit=crop&w=640&q=65','Tesla Model X Plaid SUV with falcon wing doors',10),
('2025 Model X Long Range','$84,990','NEW','new','Vehicles','https://images.unsplash.com/photo-1650938777875-a375b33cd705?auto=format&fit=crop&w=640&q=65','Tesla Model X Long Range full-size electric SUV',11),
('CPO Model X Long Range','$79,990','CPO','cpo','Vehicles','https://images.unsplash.com/photo-1650938777875-a375b33cd705?auto=format&fit=crop&w=640&q=65','Certified pre-owned Tesla Model X Long Range electric SUV',12),
('2025 Model Y Juniper Performance','$59,990','NEW','new','Vehicles','/assets/inventory/model_y.jpg','Tesla Model Y Juniper Performance electric crossover',13),
('2025 Model Y Juniper Long Range AWD','$52,990','NEW','new','Vehicles','/assets/inventory/model_y.jpg','Tesla Model Y Juniper Long Range AWD compact SUV',14),
('2025 Model Y Juniper RWD','$44,990','NEW','new','Vehicles','/assets/inventory/model_y.jpg','Tesla Model Y Juniper RWD electric crossover',15),
('CPO Model Y 2024','$36,990','CPO','cpo','Vehicles','/assets/inventory/model_y.jpg','Certified pre-owned 2024 Tesla Model Y crossover',16),
('Tesla Semi – 500 Mile Range','$150,000','NEW','new','Vehicles','https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=640&q=65','Tesla Semi electric long-haul truck on highway',17),
('Tesla Semi – 300 Mile Range','$120,000','NEW','new','Vehicles','https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=640&q=65','Tesla Semi 300 mile regional electric freight truck',18),
('Tesla Cybercab – Reservation','$30,000','NEW','new','Vehicles','/assets/inventory/cybercab.jpg','Tesla Cybercab autonomous robotaxi two-door concept vehicle',19),
('Roadster Gen 2 – Founders Slot','$250,000','NEW','new','Vehicles','https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=640&q=65','Next generation Tesla Roadster electric hypercar',20),
('Powerwall 3 – 13.5 kWh','$11,500','ENERGY','energy','Energy','https://images.unsplash.com/photo-1706699778556-a9f9da002139?auto=format&fit=crop&w=640&q=65','Tesla Powerwall 3 home battery mounted on exterior wall',21),
('Powerwall 3 – Two-Unit System','$21,500','ENERGY','energy','Energy','https://images.unsplash.com/photo-1706699778556-a9f9da002139?auto=format&fit=crop&w=640&q=65','Two Tesla Powerwall 3 home batteries installed side by side',22),
('Powerwall 3 – Four-Unit Estate System','$41,000','ENERGY','energy','Energy','/assets/inventory/megapack.jpg','Multi-unit Tesla Powerwall estate energy storage installation',23),
('Backup Gateway 2 + Whole-Home Kit','$3,200','ENERGY','energy','Energy','https://images.unsplash.com/photo-1548337138-e87d889cc369?auto=format&fit=crop&w=640&q=65','Tesla Backup Gateway whole-home energy management hardware',24),
('Megapack 2 XL – 3.9 MWh','$1,200,000','ENERGY','energy','Energy','/assets/inventory/megapack.jpg','Tesla Megapack utility-scale battery storage unit',25),
('Megapack Array – 20 MWh Utility','$6,400,000','ENERGY','energy','Energy','/assets/inventory/megapack.jpg','Large Tesla Megapack array at a utility-scale storage site',26),
('Powerpack Commercial – 232 kWh','$185,000','ENERGY','energy','Energy','/assets/inventory/megapack.jpg','Tesla Powerpack commercial battery storage cabinets',27),
('Wall Connector Gen 3 – 48A','$475','ENERGY','energy','Energy','https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&w=640&q=65','Tesla Wall Connector home EV charger mounted in garage',28),
('Supercharger V4 Cabinet – Host Package','$95,000','ENERGY','energy','Energy','https://images.unsplash.com/photo-1633158829585-23ba8f7c8caf?auto=format&fit=crop&w=640&q=65','Tesla Supercharger V4 charging station cabinet and stalls',29),
('Virtual Power Plant – Grid Allocation','$60,000','ENERGY','energy','Energy','https://images.unsplash.com/photo-1548337138-e87d889cc369?auto=format&fit=crop&w=640&q=65','Clean energy grid infrastructure for virtual power plant program',30),
('Tesla Solar Roof V3 – 10 kW','$35,000','SOLAR','solar','Solar','/assets/inventory/solar_roof.jpg','Tesla Solar Roof tiles integrated into a modern home rooftop',31),
('Tesla Solar Roof V3 – 16 kW','$52,000','SOLAR','solar','Solar','/assets/inventory/solar_roof.jpg','Large Tesla Solar Roof tile installation on residential home',32),
('Tesla Solar Panels – 4.80 kW','$13,500','SOLAR','solar','Solar','https://images.unsplash.com/photo-1613665813446-82a78c468a1d?auto=format&fit=crop&w=640&q=65','Small Tesla solar panel array on a residential roof',33),
('Tesla Solar Panels – 8.16 kW','$22,000','SOLAR','solar','Solar','https://images.unsplash.com/photo-1613665813446-82a78c468a1d?auto=format&fit=crop&w=640&q=65','Tesla solar panel array on modern home roof under blue sky',34),
('Tesla Solar Panels – 12.24 kW','$30,000','SOLAR','solar','Solar','https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=640&q=65','Large Tesla solar panel installation on building rooftop',35),
('Solar + Powerwall 3 Bundle','$44,500','SOLAR','solar','Solar','https://images.unsplash.com/photo-1613665813446-82a78c468a1d?auto=format&fit=crop&w=640&q=65','Tesla solar panels paired with Powerwall home battery system',36),
('Commercial Solar Array – 100 kW','$180,000','SOLAR','solar','Solar','https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=640&q=65','Commercial scale solar array field generating clean power',37),
('Solar Farm Participation – 1 MW Block','$900,000','SOLAR','solar','Solar','https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=640&q=65','Utility scale solar farm with rows of photovoltaic panels',38),
('Optimus Gen 2 – Production Allocation','$25,000','ROBOTICS','robotics','Robotics','/assets/images/tesla_optimus_robotics.webp','Tesla Optimus Gen 2 humanoid robot standing in modern facility',39),
('Optimus Gen 2 – Industrial Pack','$45,000','ROBOTICS','robotics','Robotics','https://images.unsplash.com/photo-1531746790731-6c087fecd65a?auto=format&fit=crop&w=640&q=65','Humanoid robot in industrial configuration performing a factory task',40),
('Optimus Fleet – 10 Unit Deployment','$420,000','ROBOTICS','robotics','Robotics','https://images.unsplash.com/photo-1531746790731-6c087fecd65a?auto=format&fit=crop&w=640&q=65','Fleet of humanoid robots deployed in a manufacturing facility',41),
('Optimus End-Effector Toolkit','$8,500','ROBOTICS','robotics','Robotics','https://images.unsplash.com/photo-1567789884554-0b844b597180?auto=format&fit=crop&w=640&q=65','Precision robotic hand and end-effector engineering components',42),
('Autonomous Factory Robot Package','$150,000','ROBOTICS','robotics','Robotics','https://images.unsplash.com/photo-1567789884554-0b844b597180?auto=format&fit=crop&w=640&q=65','Industrial robotic arm in an automated Gigafactory line',43),
('Dojo AI Training Compute – Allocation','$300,000','ROBOTICS','robotics','Robotics','https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=640&q=65','AI supercomputer training cluster hardware racks',44),
('FSD Inference Module – Fleet Bundle','$65,000','ROBOTICS','robotics','Robotics','https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=640&q=65','Autonomous driving inference compute modules for vehicle fleets',45);