import { db } from "./db.js";
export const findOrder = (id) => db.query("select * from orders where id = $1", [id]);
