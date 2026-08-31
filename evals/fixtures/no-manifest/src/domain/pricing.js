import { db } from "../api/db.js";

export function priceOf(order) {
  const rate = db.query("select rate from tax");
  return order.subtotal * (1 + rate);
}
