import { useState } from 'react';
import Link from '@/components/SmartLink';
import { Button } from '@/components/ui/button';

const featured = [
  {
    label: 'Model Y',
    eyebrow: 'VEHICLES',
    title: 'Explore the Model Y',
    description: 'Browse vehicle listings and find the right configuration for you.',
    image: '/assets/inventory/model_y.webp',
    alt: 'Model Y listing image',
    action: 'Browse vehicles',
    href: '/inventory',
  },
  {
    label: 'Cybertruck',
    eyebrow: 'VEHICLES',
    title: 'Built for a different road',
    description: 'Explore electric truck listings in the vehicle catalog.',
    image: '/assets/images/tesla_vehicles_hero.webp',
    alt: 'Electric truck featured in the vehicle catalog',
    action: 'View listings',
    href: '/inventory',
  },
  {
    label: 'Energy',
    eyebrow: 'ENERGY',
    title: 'Energy for every scale',
    description: 'Explore home energy, solar and grid storage listings.',
    image: '/assets/images/tesla_energy_hero.webp',
    alt: 'Home energy and storage installation',
    action: 'Explore energy',
    href: '/ecosystem',
  },
  {
    label: 'Robotics',
    eyebrow: 'TECHNOLOGY',
    title: 'A new kind of machine',
    description: 'Discover robotics and technology resources across the ecosystem.',
    image: '/assets/images/tesla_optimus_robotics.webp',
    alt: 'Humanoid robotics technology',
    action: 'Explore technology',
    href: '/ecosystem',
  },
  {
    label: 'Space & launch',
    eyebrow: 'SPACE',
    title: 'Look beyond the horizon',
    description: 'Explore space and launch themes in the wider technology ecosystem.',
    image: '/assets/images/spacex_starship_launch.webp',
    alt: 'Rocket launch at dusk',
    action: 'Explore ecosystem',
    href: '/ecosystem',
  },
];

export default function HeroModelSwitcher() {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = featured[activeIndex] ?? featured[0];

  return (
    <section className="home-hero relative isolate flex flex-col justify-between overflow-hidden text-center text-white">
      <img
        key={active.image}
        src={active.image}
        alt={active.alt}
        fetchPriority="high"
        decoding="async"
        className="home-hero-media absolute inset-0 -z-10 h-full w-full object-cover"
      />
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-5 pb-8 pt-24 sm:px-8">
        <p className="lux-label text-white/80">{active.eyebrow} · TRADE TESLA</p>
        <h1 className="mt-3 max-w-4xl text-4xl font-medium sm:text-6xl">{active.title}</h1>
        <p className="mt-4 max-w-xl text-sm text-white/85 sm:text-base">{active.description}</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Button asChild className="min-w-44 rounded-md bg-white px-6 text-foreground hover:bg-white/90">
            <Link href={active.href}>{active.action}</Link>
          </Button>
          <Button asChild variant="outline" className="min-w-44 rounded-md border-white/70 bg-white/10 px-6 text-white hover:bg-white/20 hover:text-white">
            <Link href="/invest">Explore programs</Link>
          </Button>
        </div>
      </div>

      <div className="relative z-10 mx-auto mb-5 flex max-w-full flex-wrap items-center justify-center gap-2 px-4 sm:mb-8">
        {featured.map((item, index) => (
          <Button
            key={item.label}
            type="button"
            variant="ghost"
            aria-pressed={activeIndex === index}
            onClick={() => setActiveIndex(index)}
            className="home-hero-tab h-10 border border-white/30 px-4 text-xs text-white/90 hover:bg-white/15 hover:text-white sm:text-sm"
          >
            {item.label}
          </Button>
        ))}
      </div>
    </section>
  );
}