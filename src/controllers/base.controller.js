// Wraps async controller methods so thrown errors flow to Express's next().
export const wrap = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Factory for simple CRUD controllers.
export function createCrudController(ServiceClass) {
  return {
    create: wrap(async (req, res) => {
      const item = await req.service.create(req.body);
      res.status(201).json({ success: true, message: 'Created', data: item });
    }),

    getAll: wrap(async (req, res) => {
      const result = await req.service.findAll(req.query);
      res.json({ success: true, ...result });
    }),

    getById: wrap(async (req, res) => {
      const item = await req.service.findById(req.params.id);
      res.json({ success: true, data: item });
    }),

    update: wrap(async (req, res) => {
      const item = await req.service.update(req.params.id, req.body);
      res.json({ success: true, message: 'Updated', data: item });
    }),

    delete: wrap(async (req, res) => {
      const result = await req.service.delete(req.params.id);
      res.json({ success: true, message: result.message });
    }),

    // Attaches the service instance to req for the handlers above.
    attachService: (service) => (req, _res, next) => {
      req.service = service;
      next();
    },
  };
}
