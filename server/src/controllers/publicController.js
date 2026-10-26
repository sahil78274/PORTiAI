import { Portfolio } from '../models/Portfolio.js';
import { BlogPost } from '../models/BlogPost.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * Public portfolio endpoint. Only published portfolios are ever returned:
 * drafts answer 404 so unpublished work cannot be reached by guessed slugs.
 */
export const getPublicPortfolio = asyncHandler(async (req, res) => {
  const slug = String(req.params.slug || '').toLowerCase().trim();
  if (!/^[a-z0-9-]{3,72}$/.test(slug)) throw ApiError.notFound('Portfolio not found.');

  const portfolio = await Portfolio.findOne({ slug, published: true });
  if (!portfolio) throw ApiError.notFound('This portfolio does not exist or is not published.');

  res.json({ success: true, data: { portfolio: portfolio.toPublicJSON() } });
});

/** Published posts for a published portfolio. */
export const listPublicPosts = asyncHandler(async (req, res) => {
  const slug = String(req.params.slug || '').toLowerCase().trim();
  if (!/^[a-z0-9-]{3,72}$/.test(slug)) throw ApiError.notFound('Portfolio not found.');

  const portfolio = await Portfolio.findOne({ slug, published: true });
  if (!portfolio) throw ApiError.notFound('This portfolio does not exist or is not published.');
  if (!portfolio.blog?.enabled) throw ApiError.notFound('This portfolio does not have a blog.');

  const posts = await BlogPost.find({ portfolioId: portfolio._id, published: true }).sort({
    publishedAt: -1,
    createdAt: -1,
  });

  res.json({
    success: true,
    data: {
      blog: {
        title: portfolio.blog?.title || `${portfolio.profile?.fullName || 'Portfolio'} — Blog`,
        intro: portfolio.blog?.intro || '',
      },
      posts: posts.map((post) => {
        const json = post.toPublicJSON();
        return {
          title: json.title,
          slug: json.slug,
          excerpt: json.excerpt,
          coverUrl: json.coverUrl,
          tags: json.tags,
          publishedAt: json.publishedAt,
        };
      }),
    },
  });
});

/** One published post. Draft posts are never exposed publicly. */
export const getPublicPost = asyncHandler(async (req, res) => {
  const slug = String(req.params.slug || '').toLowerCase().trim();
  const postSlug = String(req.params.postSlug || '').toLowerCase().trim();
  if (!/^[a-z0-9-]{3,72}$/.test(slug) || !/^[a-z0-9-]{1,90}$/.test(postSlug)) {
    throw ApiError.notFound('Post not found.');
  }

  const portfolio = await Portfolio.findOne({ slug, published: true });
  if (!portfolio || !portfolio.blog?.enabled) throw ApiError.notFound('Post not found.');

  const post = await BlogPost.findOne({ portfolioId: portfolio._id, slug: postSlug, published: true });
  if (!post) throw ApiError.notFound('Post not found.');

  res.json({
    success: true,
    data: {
      post: post.toPublicJSON(),
      portfolio: {
        slug: portfolio.slug,
        ownerName: portfolio.profile?.fullName || '',
        templateId: portfolio.templateId,
        blogTitle: portfolio.blog?.title || '',
        socialLinks: portfolio.socialLinks,
      },
    },
  });
});
