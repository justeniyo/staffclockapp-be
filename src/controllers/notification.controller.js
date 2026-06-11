import { wrap } from './base.controller.js';

class NotificationController {
  constructor(svc) { this.svc = svc; }

  list = wrap(async (req, res) => {
    const result = await this.svc.listForUser(req.user, { since: req.query.since });
    res.json({ success: true, data: result, message: 'Notifications retrieved' });
  });
}

export default NotificationController;
