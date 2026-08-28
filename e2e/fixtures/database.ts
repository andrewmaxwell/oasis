/**
 * An in-memory stand-in for the Postgres schema in dataModel.sql.
 *
 * The E2E suite mocks Supabase at the network boundary rather than running a real stack
 * (ROADMAP §6.3): it needs no Docker, so it runs identically on a laptop and in CI. The
 * trade-off is that it exercises the app, not the SQL — real view semantics and RLS are
 * ROADMAP §6.4's job. Keep the view functions below in step with dataModel.sql; if they
 * drift, the tests stay green while the app breaks, which is the one failure mode this
 * approach has.
 */

export type Row = Record<string, unknown>;

export type Database = {
  deliverer: Row[];
  parent: Row[];
  kid: Row[];
  order_record: Row[];
  order_parent: Row[];
  order_kid: Row[];
};

export const DELIVERER_ID = '11111111-1111-4111-8111-111111111111';
export const PARENT_ID = '22222222-2222-4222-8222-222222222222';
export const KID_ID = '33333333-3333-4333-8333-333333333333';

/**
 * One deliverer, one family, one child — the smallest roster that still produces a
 * non-empty order. Tests add to it; each test gets its own copy.
 */
export const seed = (): Database => ({
  deliverer: [
    {
      id: DELIVERER_ID,
      name: 'Rosa Delgado',
      email: 'rosa@example.org',
      phone_number: '555-0100',
      is_active: true,
      is_deleted: false,
      notes: null,
    },
  ],
  parent: [
    {
      id: PARENT_ID,
      first_name: 'Amara',
      last_name: 'Okafor',
      address: '120 Maple St',
      city: 'Springfield',
      zip: '62704',
      phone_number: '555-0111',
      country_of_origin: 'Nigeria',
      rough_family_income: 24000,
      deliverer_id: DELIVERER_ID,
      is_active: true,
      is_deleted: false,
      notes: null,
    },
  ],
  kid: [
    {
      id: KID_ID,
      parent_id: PARENT_ID,
      first_name: 'Chidi',
      last_name: 'Okafor',
      gender: 'M',
      birth_date: '2024-03-02',
      // Size 3 → 50 diapers, per calcDiaperSizes.
      diaper_size: '3',
      is_active: true,
      is_deleted: false,
      notes: null,
    },
  ],
  order_record: [],
  order_parent: [],
  order_kid: [],
});

const live = (rows: Row[]) => rows.filter((r) => !r.is_deleted);

const fullName = (row: Row) => `${row.first_name} ${row.last_name}`;

/**
 * The views carry their own `ORDER BY` (dataModel.sql) and the app leans on it — the roster
 * pages render rows in the order they arrive. Mirror it here, or the suite and production
 * disagree about what the top of a list is.
 */
const byName = (rows: Row[], nameOf: (row: Row) => string) =>
  [...rows].sort((a, b) => nameOf(a).localeCompare(nameOf(b)));

const activeFirstByName = (rows: Row[], nameOf: (row: Row) => string) =>
  byName(rows, nameOf).sort(
    (a, b) => Number(b.is_active) - Number(a.is_active),
  );

const byId = (rows: Row[], id: unknown) => rows.find((r) => r.id === id);

/**
 * The `order_kids` aggregate shared by finished_order_view and parent_order_view: the
 * order_kid rows for this order belonging to children of this family. Soft-deleted
 * order_kid rows drop out, but the family itself survives with `[]` — that outer-join
 * behavior is ISSUES #12, and `orderKidsForDeletedRows` in the spec pins it.
 */
const orderKidsFor = (db: Database, op: Row) =>
  live(db.order_kid).filter(
    (ok) =>
      ok.order_id === op.order_id &&
      db.kid.some((k) => k.id === ok.kid_id && k.parent_id === op.parent_id),
  );

/**
 * The SQL views, recomputed on read. Names and column shapes mirror dataModel.sql:88-215.
 */
export const views: Record<string, (db: Database) => Row[]> = {
  parent_view: (db) =>
    activeFirstByName(live(db.parent), fullName).map((p) => {
      const deliverer = live(db.deliverer).find(
        (d) => d.id === p.deliverer_id && d.is_active,
      );
      return {
        id: p.id,
        name: `${p.first_name} ${p.last_name}`,
        address: p.address,
        city: p.city,
        zip: p.zip,
        phone_number: p.phone_number,
        deliverer_id: p.deliverer_id,
        deliverer_name: deliverer?.name ?? null,
        is_active: p.is_active,
        diaper_sizes: live(db.kid)
          .filter((k) => k.parent_id === p.id && k.is_active)
          .map((k) => k.diaper_size),
      };
    }),

  kid_view: (db) =>
    activeFirstByName(live(db.kid), fullName).flatMap((k) => {
      const parent = byId(live(db.parent), k.parent_id);
      // An INNER JOIN in SQL: a kid whose parent is soft-deleted drops out.
      if (!parent) return [];
      return [
        {
          id: k.id,
          name: `${k.first_name} ${k.last_name}`,
          gender: k.gender,
          birth_date: k.birth_date,
          diaper_size: k.diaper_size,
          is_active: k.is_active,
          notes: k.notes,
          parent_id: k.parent_id,
          parent_name: `${parent.first_name} ${parent.last_name}`,
        },
      ];
    }),

  // The dashboard's kid count. Kid's own columns, filtered to families that are still
  // live AND active — note that is more than kid_view drops, which only excludes deleted
  // parents. The caller adds the kid's own is_active / is_deleted filters.
  rostered_kid_view: (db) =>
    db.kid.filter((k) => {
      const parent = byId(live(db.parent), k.parent_id);
      return Boolean(parent?.is_active);
    }),

  parent_options: (db) =>
    byName(live(db.parent), fullName).map((p) => ({
      value: p.id,
      label: fullName(p),
    })),

  deliverer_options: (db) =>
    activeFirstByName(live(db.deliverer), (d) => String(d.name)).map((d) => ({
      value: d.id,
      label: d.is_active ? d.name : `${d.name} (INACTIVE)`,
    })),

  finished_order_view: (db) =>
    db.order_parent.map((op) => {
      const parent = byId(db.parent, op.parent_id);
      const deliverer = byId(db.deliverer, op.deliverer_id);
      return {
        order_id: op.order_id,
        parent_id: op.parent_id,
        parent_name: parent && `${parent.first_name} ${parent.last_name}`,
        address: parent?.address,
        city: parent?.city,
        zip: parent?.zip,
        phone_number: parent?.phone_number,
        deliverer_id: op.deliverer_id,
        deliverer_name: deliverer?.name ?? null,
        deliverer_email: deliverer?.email ?? null,
        order_kids: orderKidsFor(db, op),
      };
    }),

  parent_order_view: (db) =>
    db.order_parent.flatMap((op) => {
      const order = byId(live(db.order_record), op.order_id);
      if (!order) return [];
      const deliverer = byId(db.deliverer, op.deliverer_id);
      return [
        {
          id: order.id,
          date_of_order: order.date_of_order,
          order_notes: order.notes,
          parent_id: op.parent_id,
          deliverer_id: op.deliverer_id,
          deliverer_name: deliverer?.name ?? null,
          order_kids: orderKidsFor(db, op),
        },
      ];
    }),

  kid_order_view: (db) =>
    live(db.order_kid).flatMap((ok) => {
      const order = byId(live(db.order_record), ok.order_id);
      if (!order) return [];
      return [
        {
          id: ok.order_id,
          kid_id: ok.kid_id,
          diaper_size: ok.diaper_size,
          diaper_quantity: ok.diaper_quantity,
          date_of_order: order.date_of_order,
          order_notes: order.notes,
        },
      ];
    }),
};
