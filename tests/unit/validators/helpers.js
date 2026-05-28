import { validationResult } from 'express-validator';

/**
 * Runs an array of express-validator middleware against a mock request
 * and returns the validation result.
 *
 * @param {Array} validatorChain - Array of express-validator middleware
 * @param {Object} req - Mock request { body, params, query }
 * @returns {Promise<{ errors: Array, isValid: boolean }>}
 */
export async function runValidator(validatorChain, req = {}) {
  const mockReq = {
    body: req.body || {},
    params: req.params || {},
    query: req.query || {},
    headers: req.headers || {},
  };
  const mockRes = {};
  const mockNext = () => {};

  for (const middleware of validatorChain) {
    await middleware(mockReq, mockRes, mockNext);
  }

  const result = validationResult(mockReq);
  return {
    errors: result.array(),
    isValid: result.isEmpty(),
    getError: (field) => result.array().find((e) => e.path === field),
    getErrors: (field) => result.array().filter((e) => e.path === field),
  };
}
