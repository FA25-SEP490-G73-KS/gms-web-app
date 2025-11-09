import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import CustomerLayout from '../../layouts/CustomerLayout';
import LazyImage from '../../components/common/LazyImage';
import { blogPosts } from '../../data/blogPosts';
import '../../styles/pages/blog/blog.css';

export default function BlogList() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Blog',
      name: 'Blog Garage Hoàng Tuấn',
      description: 'Blog chia sẻ kiến thức về sơn xe, bảo dưỡng, phục hồi xe ô tô',
      url: 'https://garagehoangtuan.vn/blog',
      publisher: {
        '@type': 'Organization',
        name: 'Garage Hoàng Tuấn',
        logo: {
          '@type': 'ImageObject',
          url: 'https://garagehoangtuan.vn/image/mainlogo.png'
        }
      },
      blogPost: blogPosts.map(post => ({
        '@type': 'BlogPosting',
        headline: post.title,
        description: post.excerpt,
        image: `https://garagehoangtuan.vn${post.image}`,
        datePublished: post.publishDate,
        author: {
          '@type': 'Organization',
          name: post.author
        },
        publisher: {
          '@type': 'Organization',
          name: 'Garage Hoàng Tuấn'
        }
      }))
    });
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, [isClient]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <CustomerLayout>
      <article className="blog-list-page">
        <header className="blog-header">
          <h1>Blog Kiến Thức Ô Tô</h1>
          <p className="blog-subtitle">Chia sẻ kiến thức về sơn xe, bảo dưỡng, phục hồi và chăm sóc xe ô tô</p>
        </header>

        <section className="blog-posts">
          <div className="blog-grid">
            {blogPosts.map((post, index) => (
              <article key={post.id} className="blog-card" itemScope itemType="https://schema.org/BlogPosting">
                <Link to={`/blog/${post.slug}`} className="blog-card-link">
                  <div className="blog-card-image">
                    <LazyImage
                      src={post.image}
                      alt={post.title}
                      width="100%"
                      height="220px"
                      itemProp="image"
                      className="blog-card-img"
                    />
                    <span className="blog-category">{post.category}</span>
                  </div>
                  <div className="blog-card-content">
                    <h2 className="blog-card-title" itemProp="headline">
                      {post.title}
                    </h2>
                    <p className="blog-card-excerpt" itemProp="description">
                      {post.excerpt}
                    </p>
                    <div className="blog-card-meta">
                      <time dateTime={post.publishDate} itemProp="datePublished">
                        {formatDate(post.publishDate)}
                      </time>
                      <span className="blog-reading-time">{post.readingTime} phút đọc</span>
                    </div>
                    <div className="blog-card-tags">
                      {post.tags.slice(0, 3).map((tag, tagIndex) => (
                        <span key={tagIndex} className="blog-tag">{tag}</span>
                      ))}
                    </div>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        </section>
      </article>
    </CustomerLayout>
  );
}

