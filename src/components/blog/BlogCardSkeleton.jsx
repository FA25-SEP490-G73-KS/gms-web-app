export default function BlogCardSkeleton() {
  return (
    <article className="blog-card blog-card-skeleton">
      <div className="blog-card-image skeleton-image">
        <div className="skeleton-shimmer" />
      </div>
      <div className="blog-card-content">
        <div className="skeleton-title">
          <div className="skeleton-shimmer" style={{ height: '24px', marginBottom: '12px' }} />
          <div className="skeleton-shimmer" style={{ height: '24px', width: '80%' }} />
        </div>
        <div className="skeleton-excerpt">
          <div className="skeleton-shimmer" style={{ height: '16px', marginBottom: '8px' }} />
          <div className="skeleton-shimmer" style={{ height: '16px', marginBottom: '8px' }} />
          <div className="skeleton-shimmer" style={{ height: '16px', width: '60%' }} />
        </div>
        <div className="skeleton-meta">
          <div className="skeleton-shimmer" style={{ height: '14px', width: '120px' }} />
          <div className="skeleton-shimmer" style={{ height: '14px', width: '80px' }} />
        </div>
        <div className="skeleton-tags">
          <div className="skeleton-shimmer" style={{ height: '24px', width: '60px', borderRadius: '12px', marginRight: '8px' }} />
          <div className="skeleton-shimmer" style={{ height: '24px', width: '80px', borderRadius: '12px', marginRight: '8px' }} />
          <div className="skeleton-shimmer" style={{ height: '24px', width: '70px', borderRadius: '12px' }} />
        </div>
      </div>
      <style>{`
        .blog-card-skeleton {
          pointer-events: none;
        }
        .skeleton-image {
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }
        .skeleton-shimmer {
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 4px;
        }
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
      `}</style>
    </article>
  );
}

