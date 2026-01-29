const paginate = (total, page, limit) => {
  const pages = Math.ceil(total / limit);
  const hasNext = page < pages;
  const hasPrev = page > 1;
  
  return {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    pages,
    hasNext,
    hasPrev
  };
};

const getPaginationParams = (req) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;
  
  return { page, limit, skip };
};

module.exports = {
  paginate,
  getPaginationParams
};