import ConfidenceStars from '@/shared/components/ConfidenceStars/ConfidenceStars';

export default function Page() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <h2>ConfidenceStars Test</h2>

      <ConfidenceStars level={1} />
      <ConfidenceStars level={3} />
      <ConfidenceStars level={5} />

      <ConfidenceStars level={10} />
      <ConfidenceStars level={0} />

      <ConfidenceStars level={4} size={30} />
      <ConfidenceStars level={3} showEmpty={false} />

      <ConfidenceStars level={4} ariaLabel="Article confidence rating" />
      <ConfidenceStars level={2} className="my-custom-style" />
    </div>
  );
}