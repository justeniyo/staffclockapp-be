/**
 * Pagination utility for consistent pagination handling
 */
class Pagination {
  /**
   * Default pagination settings
   */
  static DEFAULTS = Object.freeze({
    page: 1,
    limit: 20,
    maxLimit: 100,
  });

  /**
   * Parses pagination parameters from query
   * @param {Object} query - Express query object
   * @returns {Object} Parsed pagination options
   */
  static parse(query) {
    const page = Math.max(1, parseInt(query.page, 10) || this.DEFAULTS.page);
    const limit = Math.min(
      Math.max(1, parseInt(query.limit, 10) || this.DEFAULTS.limit),
      this.DEFAULTS.maxLimit
    );
    const offset = (page - 1) * limit;

    return { page, limit, offset };
  }

  /**
   * Builds pagination metadata
   * @param {number} total - Total number of items
   * @param {number} page - Current page
   * @param {number} limit - Items per page
   * @returns {Object} Pagination metadata
   */
  static buildMeta(total, page, limit) {
    const totalPages = Math.ceil(total / limit);

    return {
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }

  /**
   * Formats paginated response data
   * @param {Array} items - Data items
   * @param {number} total - Total count
   * @param {Object} options - Pagination options
   * @returns {Object} Formatted response
   */
  static format(items, total, { page, limit }) {
    return {
      data: items,
      pagination: this.buildMeta(total, page, limit),
    };
  }
}

export default Pagination;
