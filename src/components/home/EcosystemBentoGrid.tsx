import Link from '@/components/SmartLink';
import { Button } from '@/components/ui/button';

const areas = [
  {
    label: 'ENERGY',
    title: 'Power, stored and shared',
    description: 'Browse home energy and grid storage products.',
    image: '/assets/images/tesla_energy_hero.webp',
    alt: 'Home energy storage installation',
    href: '/inventory',
    className: 'lg:col-span-2',
  },
  {
    label: 'ROBOTICS',
    title: 'Automation, reimagined',
    description: 'Explore robotics and technology listings.',
    image: '/assets/images/tesla_optimus_robotics.webp',
    alt: 'Humanoid robot in a technology setting',
    href: '/inventory',
    className: '',
  },
  {
    label: 'SPACE & LAUNCH',
    title: 'A wider horizon',
    description: 'Discover space and launch topics in the broader ecosystem.',
    image: '/assets/images/spacex_starship_launch.webp',
    alt: 'Rocket launching at dusk',
    href: '/ecosystem',
    className: 'lg:col-span-3',
  },
];

export default function EcosystemBentoGrid() {
  return (
    <section className="px-5 py-16 sm:px-8 sm:py-20" aria-labelledby="ecosystem-title">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 max-w-2xl">
          <p className="lux-label">Beyond the vehicle</p>
          <h2 id="ecosystem-title" className="mt-2 text-3xl font-medium sm:text-4xl">Explore the ecosystem</h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {areas.map((area) => (
            <article key={area.label} className={`home-bento-card relative isolate flex min-h-[310px] flex-col justify-end overflow-hidden border border-border ${area.className}`}>
              <img src={area.image} alt={area.alt} loading="lazy" decoding="async" className="absolute inset-0 -z-10 h-full w-full object-cover transition-transform duration-700 hover:scale-[1.03]" />
              <div className="relative z-10 p-6 text-white sm:p-8">
                <p className="lux-label text-white/80">{area.label}</p>
                <h3 className="mt-2 text-2xl font-medium sm:text-3xl">{area.title}</h3>
                <p className="mt-2 max-w-xl text-sm text-white/85">{area.description}</p>
                <Button asChild variant="outline" className="mt-5 border-white/70 bg-white/10 text-white hover:bg-white/20 hover:text-white">
                  <Link href={area.href}>Explore</Link>
                </Button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}