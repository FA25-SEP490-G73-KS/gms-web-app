import { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import CustomerLayout from '../../layouts/CustomerLayout';
import LazyImage from '../../components/common/LazyImage';
import { getBlogPostBySlug, getRelatedPosts } from '../../data/blogPosts';
import '../../styles/pages/blog/blog.css';

export default function BlogDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [isClient, setIsClient] = useState(false);
  
  const post = useMemo(() => getBlogPostBySlug(slug), [slug]);
  const relatedPosts = useMemo(() => post ? getRelatedPosts(post, 3) : [], [post]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    
    if (!post) {
      navigate('/blog', { replace: true });
      return;
    }

    document.title = `${post.title} | Blog Garage Hoàng Tuấn`;

    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', post.excerpt);
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = post.excerpt;
      document.head.appendChild(meta);
    }

    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute('content', post.title);
    }

    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) {
      ogDescription.setAttribute('content', post.excerpt);
    }

    const ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage) {
      ogImage.setAttribute('content', `https://garagehoangtuan.vn${post.image}`);
    }

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.excerpt,
      image: `https://garagehoangtuan.vn${post.image}`,
      datePublished: post.publishDate,
      dateModified: post.publishDate,
      author: {
        '@type': 'Organization',
        name: post.author,
        url: 'https://garagehoangtuan.vn'
      },
      publisher: {
        '@type': 'Organization',
        name: 'Garage Hoàng Tuấn',
        logo: {
          '@type': 'ImageObject',
          url: 'https://garagehoangtuan.vn/image/mainlogo.png'
        }
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': `https://garagehoangtuan.vn/blog/${post.slug}`
      },
      keywords: post.seoKeywords,
      articleSection: post.category,
      inLanguage: 'vi-VN'
    });
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, [post, navigate, slug, isClient]);

  if (!post) {
    return null;
  }

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
      <article className="blog-detail-page" itemScope itemType="https://schema.org/BlogPosting">
        <header className="blog-detail-header">
          <Link to="/blog" className="back-to-blog">
            ← Quay lại danh sách bài viết
          </Link>
          <div className="blog-detail-meta">
            <span className="blog-category-large">{post.category}</span>
            <time dateTime={post.publishDate} itemProp="datePublished" className="blog-date">
              {formatDate(post.publishDate)}
            </time>
            <span className="blog-reading-time-large">{post.readingTime} phút đọc</span>
          </div>
          <h1 itemProp="headline" className="blog-detail-title">{post.title}</h1>
          <p className="blog-detail-excerpt" itemProp="description">{post.excerpt}</p>
          <div className="blog-detail-author">
            <span itemProp="author" itemScope itemType="https://schema.org/Organization">
              <span itemProp="name">{post.author}</span>
            </span>
          </div>
        </header>

        <div className="blog-detail-image">
          <LazyImage
            src={post.image}
            alt={post.title}
            itemProp="image"
            width="100%"
            height="400px"
            className="blog-detail-img"
          />
        </div>

        <div className="blog-detail-content">
          <div 
            className="blog-content" 
            itemProp="articleBody"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </div>

        <div className="blog-detail-tags">
          <h3>Tags:</h3>
          <div className="tags-list">
            {post.tags.map((tag, index) => (
              <span key={index} className="blog-tag-large">{tag}</span>
            ))}
          </div>
        </div>

        {relatedPosts.length > 0 && (
          <section className="related-posts">
            <h2>Bài Viết Liên Quan</h2>
            <div className="related-posts-grid">
              {relatedPosts.map((relatedPost) => (
                <article key={relatedPost.id} className="related-post-card">
                  <Link to={`/blog/${relatedPost.slug}`} className="related-post-link">
                    <div className="related-post-image">
                      <LazyImage
                        src={relatedPost.image}
                        alt={relatedPost.title}
                        width="100%"
                        height="180px"
                        className="related-post-img"
                      />
                    </div>
                    <div className="related-post-content">
                      <h3>{relatedPost.title}</h3>
                      <p>{relatedPost.excerpt.substring(0, 100)}...</p>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          </section>
        )}

        <div className="blog-detail-cta">
          <h3>Cần Tư Vấn Thêm?</h3>
          <p>Liên hệ với Garage Hoàng Tuấn để được tư vấn miễn phí về dịch vụ sơn xe, bảo dưỡng và phục hồi xe ô tô.</p>
          <Link to="/contact" className="cta-button">Liên Hệ Ngay</Link>
        </div>
      </article>
    </CustomerLayout>
  );
}

