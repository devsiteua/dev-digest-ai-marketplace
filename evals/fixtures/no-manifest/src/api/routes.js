import { findOrder } from "./repository.js";
import { priceOf } from "../domain/pricing.js";

export async function getOrder(req, res) {
  const order = await findOrder(req.params.id);
  res.json({ ...order, total: priceOf(order) });
}
