const axios = require('axios');
const { client: redisClient } = require('../config/redis');

const LEETCODE_GRAPHQL_URL = 'https://leetcode.com/graphql';
const CACHE_TTL = 60 * 60;

/**
 * Convert a user-friendly tag name to a LeetCode tag slug.
 * Example: "Binary Search" -> "binary-search"
 */
const slugifyTag = (tag) => {
  return tag.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
};

/**
 * Extract the problem slug from a LeetCode URL.
 */
const extractSlug = (url) => {
  const match = url.match(/\/problems\/([^/?#]+)/);
  return match ? match[1] : null;
};

/**
 * Fetch problem details from LeetCode using the GraphQL API.
 */
const fetchProblemDetails = async (url) => {
  const slug = extractSlug(url);
  if (!slug) throw new Error('Invalid LeetCode URL');

  const query = `
    query getProblemDetail($titleSlug: String!) {
      question(titleSlug: $titleSlug) {
        title
        difficulty
        content
        topicTags {
          name
        }
        codeSnippets {
          lang
          code
        }
      }
    }
  `;

  try {
    const response = await axios.post(LEETCODE_GRAPHQL_URL, {
      query,
      variables: { titleSlug: slug },
    });

    const question = response.data?.data?.question;
    if (!question) {
      const error = new Error('Problem not found on LeetCode');
      error.statusCode = 404;
      throw error;
    }

    // Convert codeSnippets array to a Map-friendly object
    const codeSnippets = {};
    if (question.codeSnippets && Array.isArray(question.codeSnippets)) {
      for (const snippet of question.codeSnippets) {
        codeSnippets[snippet.lang] = snippet.code;
      }
    }

    return {
      title: question.title,
      difficulty: question.difficulty,
      tags: question.topicTags.map(t => t.name),
      link: url,
      description: question.content,
      codeSnippets,  // new field
    };
  } catch (error) {
    // If it's a 404 error we already threw, rethrow it as is
    if (error.statusCode === 404) throw error;
    console.error('LeetCode fetch error:', error.message);
    throw new Error('Failed to fetch problem from LeetCode');
  }
};

/**
 * Search LeetCode problems by name or tag, with Redis caching.
 * @param {string} query - The search term.
 * @param {string} filterType - 'name' (default) or 'tag'.
 */
const searchProblems = async (query, filterType = 'name') => {
  const cacheKey = `leetcode:search:${filterType}:${query.toLowerCase()}`;

  // Try to get from cache first
  if (redisClient) {
    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (err) {
      console.warn('Redis cache read error:', err.message);
    }
  }

  // Build filters
  const filters = {};
  if (filterType === 'tag') {
    const tagSlug = slugifyTag(query);
    filters.tags = [tagSlug];
  } else {
    filters.searchKeywords = query;
  }

  const searchQuery = `
    query problemsetQuestionList($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionListFilterInput) {
      problemsetQuestionList: questionList(
        categorySlug: $categorySlug
        limit: $limit
        skip: $skip
        filters: $filters
      ) {
        total: totalNum
        questions: data {
          title
          titleSlug
          difficulty
          topicTags {
            name
          }
        }
      }
    }
  `;

  const variables = {
    categorySlug: "",
    limit: 10,
    skip: 0,
    filters,
  };

  try {
    const response = await axios.post(LEETCODE_GRAPHQL_URL, {
      query: searchQuery,
      variables,
    });

    const questions = response.data?.data?.problemsetQuestionList?.questions || [];
    const results = questions.map(q => ({
      title: q.title,
      slug: q.titleSlug,
      difficulty: q.difficulty,
      tags: q.topicTags.map(t => t.name),
      url: `https://leetcode.com/problems/${q.titleSlug}/`,
    }));

    // Store in cache if we got results
    if (redisClient && results.length > 0) {
      await redisClient.setEx(cacheKey, CACHE_TTL, JSON.stringify(results));
    }

    return results;
  } catch (error) {
    console.error('LeetCode search error:', error.message);
    throw new Error('Failed to search LeetCode');
  }
};

module.exports = {
  fetchProblemDetails,
  searchProblems,
};