import { BlogPost } from '../models/BlogPost.js';
import { Portfolio } from '../models/Portfolio.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { blogSlugify, normalizeBlogBody } from '../validators/blogInput.js';

const ID_PATTERN = /^[a-f0-9]{24}$/i;

const findOwnedPost = async (id, userId) => {
  if (!ID_PATTERN.test(String(id))) throw ApiError.badRequest('That post id is not valid.');
  const post = await BlogPost.findById(id);
  if (!post) throw ApiError.notFound('Post not found.');
  if (post.userId.toString() !== userId.toString()) throw ApiError.notFound('Post not found.');
  return post;
};

const assertOwnedPortfolio = async (portfolioId, userId) => {
  if (!ID_PATTERN.test(String(portfolioId))) throw ApiError.badRequest('That portfolio id is not valid.');
  const portfolio = await Portfolio.findById(portfolioId);
  if (!portfolio || portfolio.userId.toString() !== userId.toString()) {
    throw ApiError.notFound('Portfolio not found.');
  }
  return portfolio;
};

const uniqueSlug = async (portfolioId, desired, ignoreId) => {
  const base = blogSlugify(desired);
  let candidate = base;
  for (let attempt = 0; attempt < 25; attempt += 1) {
    const query = { portfolioId, slug: candidate };
    if (ignoreId) query._id = { $ne: ignoreId };
    if (!(await BlogPost.exists(query))) return candidate;
    candidate = `${base}-${attempt + 2}`.slice(0, 90);
  }
  return `${base}-${Date.now().toString(36)}`.slice(0, 90);
};

export const listPosts = asyncHandler(async (req, res) => {
  const { portfolioId, status = 'all', search = '' } = req.query;
  const query = { userId: req.user._id };
  if (portfolioId) {
    if (!ID_PATTERN.test(String(portfolioId))) throw ApiError.badRequest('That portfolio id is not valid.');
    await assertOwnedPortfolio(portfolioId, req.user._id);
    query.portfolioId = portfolioId;
  }
  if (status === 'published') query.published = true;
  if (status === 'draft') query.published = false;
  if (String(search).trim()) {
    const term = String(search).trim().slice(0, 80);
    query.$or = [{ title: { $regex: term, $options: 'i' } }, { excerpt: { $regex: term, $options: 'i' } }];
  }

  const posts = await BlogPost.find(query).sort({ updatedAt: -1 }).limit(200);
  res.json({
    success: true,
    data: {
      posts: posts.map((post) => post.toOwnerJSON()),
      stats: {
        total: posts.length,
        published: posts.filter((post) => post.published).length,
        drafts: posts.filter((post) => !post.published).length,
      },
    },
  });
});

export const createPost = asyncHandler(async (req, res) => {
  const body = req.body || {};
  await assertOwnedPortfolio(body.portfolioId, req.user._id);
  const fields = normalizeBlogBody(body);
  if (!fields.title) throw ApiError.badRequest('A post title is required.');

  const post = await BlogPost.create({
    ...fields,
    slug: await uniqueSlug(body.portfolioId, fields.slug || fields.title),
    userId: req.user._id,
    portfolioId: body.portfolioId,
    published: false,
  });

  res.status(201).json({ success: true, data: { post: post.toOwnerJSON() } });
});

export const getPost = asyncHandler(async (req, res) => {
  const post = await findOwnedPost(req.params.id, req.user._id);
  res.json({ success: true, data: { post: post.toOwnerJSON() } });
});

export const updatePost = asyncHandler(async (req, res) => {
  const post = await findOwnedPost(req.params.id, req.user._id);
  const fields = normalizeBlogBody(req.body || {});
  if (!Object.keys(fields).length) throw ApiError.badRequest('No post fields were supplied.');

  if (fields.slug && fields.slug !== post.slug) {
    fields.slug = await uniqueSlug(post.portfolioId, fields.slug, post._id);
  }
  if (fields.title === '') throw ApiError.badRequest('A post title is required.');

  Object.assign(post, fields);
  await post.save();
  res.json({ success: true, data: { post: post.toOwnerJSON() } });
});

export const setPublishState = asyncHandler(async (req, res) => {
  const post = await findOwnedPost(req.params.id, req.user._id);
  const { published } = req.body || {};
  if (typeof published !== 'boolean') throw ApiError.badRequest('`published` must be true or false.');

  if (published && !post.content.trim()) {
    throw ApiError.badRequest('Write some content before publishing this post.');
  }

  const portfolio = await assertOwnedPortfolio(post.portfolioId, req.user._id);
  if (published) {
    // Publishing a post implies the portfolio's blog page should be reachable.
    if (!portfolio.blog?.enabled) {
      portfolio.blog = { ...(portfolio.blog || {}), enabled: true };
      await portfolio.save();
    }
  }

  post.published = published;
  post.publishedAt = published ? post.publishedAt || new Date() : null;
  await post.save();

  res.json({ success: true, data: { post: post.toOwnerJSON() } });
});

export const deletePost = asyncHandler(async (req, res) => {
  const post = await findOwnedPost(req.params.id, req.user._id);
  await BlogPost.deleteOne({ _id: post._id });
  res.json({ success: true, data: { message: 'Post deleted.' } });
});
