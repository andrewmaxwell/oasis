-- ISSUES #12 — parent_order_view silently hid orders with no surviving order_kid rows.
--
-- order_kid is LEFT JOINed, but `WHERE NOT ok.is_deleted` was evaluated after the join, so
-- any row where ok was NULL (a family in the order with no kid rows, or whose kid rows were
-- all soft-deleted) evaluated to NULL, failed the WHERE, and was dropped. That turned the
-- outer join into an inner one and removed families from the historical record entirely.
--
-- The COALESCE(json_agg(ok) FILTER (WHERE ok IS NOT NULL), '[]') below is the proof of
-- intent: it exists precisely to render those families with an empty order_kids array.
--
-- Fix: move the predicate into the LEFT JOIN's ON clause, where it filters the joined rows
-- without eliminating the outer-joined parent row.
--
-- `NOT o.is_deleted` stays in the WHERE deliberately: excluding soft-deleted orders is the
-- intended behavior, and op.order_id is a NOT NULL-ish FK to order_record, so that join
-- always matches.

DROP VIEW IF EXISTS parent_order_view;
CREATE VIEW parent_order_view WITH (security_invoker = ON) AS
SELECT
  o.id,
  o.date_of_order,
  o.notes as order_notes,
  op.parent_id,
  op.deliverer_id,
  d.name as deliverer_name,
  COALESCE(json_agg(ok) FILTER (WHERE ok IS NOT NULL), '[]'::json) as order_kids
FROM order_parent op
LEFT JOIN deliverer d
  ON d.id = op.deliverer_id
LEFT JOIN kid k
  ON k.parent_id = op.parent_id
LEFT JOIN order_kid ok
  ON ok.kid_id = k.id
  AND ok.order_id = op.order_id
  AND ok.is_deleted IS NOT TRUE
LEFT JOIN order_record o
  ON o.id = op.order_id
WHERE NOT o.is_deleted
GROUP BY o.id, op.parent_id, op.deliverer_id, d.name
ORDER BY o.date_of_order DESC;
