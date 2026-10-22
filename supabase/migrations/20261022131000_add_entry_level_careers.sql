-- Add high-demand entry-level and accessible career roles to job_postings

INSERT INTO public.job_postings (id, title, slug, department, location, job_type, description, requirements, status)
VALUES
  (
    '4a112f45-8c01-443b-81d0-6bc7185ebc01',
    'Remote AI Data Specialist & Robotics Annotator',
    'remote-ai-data-specialist',
    'Robotics & AI',
    'Remote (Global)',
    'Full-time',
    'Help teach Tesla Optimus and Full Self-Driving neural networks how to perceive the physical world. In this accessible, remote entry-level role, you will annotate multi-camera video streams, label 3D lidar and sensor trajectories, and evaluate edge-case simulations. Complete training and hardware guidance provided.',
    '• No prior engineering or coding degree required.
• Strong attention to visual detail and ability to work methodically.
• Comfortable with modern web interfaces and computer navigation.
• Reliable high-speed internet connection for remote data tools.
• Passion for autonomous robotics, AI, and Tesla technology.',
    'open'
  ),
  (
    '4a112f45-8c01-443b-81d0-6bc7185ebc02',
    'Solar & Energy Customer Onboarding Specialist',
    'solar-energy-customer-onboarding',
    'Customer Care',
    'Remote (US)',
    'Full-time',
    'Be the welcoming voice guiding homeowners and business clients as they transition to clean energy. You will coordinate initial utility surveys, guide customers through the Powerwall 3 and Solar Roof installation timeline, and ensure their mobile app monitoring is set up seamlessly.',
    '• High school diploma or equivalent; zero years of solar experience needed (we train you!).
• Warm, patient, and articulate written and verbal communication.
• Empathy and eagerness to solve customer questions.
• Ability to juggle schedules and communicate updates promptly.',
    'open'
  ),
  (
    '4a112f45-8c01-443b-81d0-6bc7185ebc03',
    'Junior Field Solar Technician / Apprentice',
    'junior-field-solar-technician',
    'Energy Operations',
    'Austin, TX',
    'Full-time',
    'Launch your career in renewable energy with hands-on apprenticeship. Work side-by-side with master solar installers and electricians staging hardware, running conduit, assembling mounting structures, and commissioning residential Solar Roof systems.',
    '• Must be comfortable working outdoors and at heights with full safety harness gear.
• Positive attitude, strong team work ethic, and eagerness to learn electrical fundamentals.
• Valid driver’s license with a clean driving record.
• All safety gear, specialized tools, and OSHA certification courses covered.',
    'open'
  ),
  (
    '4a112f45-8c01-443b-81d0-6bc7185ebc04',
    'Virtual Tesla Sales & Delivery Advisor',
    'virtual-tesla-sales-advisor',
    'Sales & Operations',
    'Remote',
    'Full-time',
    'Connect directly with prospective Cybertruck, Model 3/Y, and Megapack investors. Guide them through online configuration, trade-ins, financing options, and trade settlement. You will handle chat, email, and scheduled virtual test consultation calls.',
    '• Energetic communication and genuine excitement for Tesla products.
• Ability to explain technical electric vehicle and battery benefits in plain language.
• Basic comfort with digital CRM systems (training provided).
• Flexible schedule including occasional weekend consultation hours.',
    'open'
  ),
  (
    '4a112f45-8c01-443b-81d0-6bc7185ebc05',
    'Logistics & Inventory Operations Associate',
    'logistics-inventory-associate',
    'Supply Chain',
    'Fremont, CA',
    'Full-time',
    'Support the heartbeat of our Gigafactory supply chain. Receive, audit, and organize shipments of battery cells, charging posts, Powerwalls, and robotic actuator components. Maintain warehouse digital records and stage parts for dispatch.',
    '• Detail-oriented with ability to lift and stage hardware packages (up to 40 lbs).
• Basic familiarity with inventory tracking or barcode scanners (training provided).
• Forklift certification is a plus, or willingness to complete paid on-site certification.',
    'open'
  ),
  (
    '4a112f45-8c01-443b-81d0-6bc7185ebc06',
    'Junior QA Analyst & Web Platform Tester',
    'junior-qa-platform-tester',
    'Engineering',
    'Remote',
    'Full-time',
    'Ensure every prospective investor and customer enjoys a flawless digital experience. Test new web releases, verify checkout modals, test crypto payment proof uploads, and document bug reports across mobile and desktop browsers.',
    '• Curiosity, sharp eye for user interface imperfections, and strong problem-solving skills.
• Familiarity with modern web browsers and mobile devices.
• Clear written communication when describing steps to reproduce bugs.
• Background or bootcamp coursework in tech is a plus, but self-taught enthusiasts welcome!',
    'open'
  )
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  department = EXCLUDED.department,
  location = EXCLUDED.location,
  job_type = EXCLUDED.job_type,
  description = EXCLUDED.description,
  requirements = EXCLUDED.requirements,
  status = EXCLUDED.status;

