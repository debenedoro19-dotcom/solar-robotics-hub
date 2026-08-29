
const ScrollAnimations = dynamic(() => import('./ScrollAnimations'), { ssr: false });

export default function ScrollAnimationsClient() {
  return <ScrollAnimations />;
}
