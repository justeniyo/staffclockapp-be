import { validationResult } from 'express-validator';

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
