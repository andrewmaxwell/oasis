const modifiedAtTables = ['parent', 'deliverer', 'kid', 'order_record'];
const allTables = [...modifiedAtTables, 'order_parent', 'order_kid'];
const views = [
  'parent_view',
  'finished_order_view',
  'kid_view',
  'parent_options',
  'deliverer_options',
  'kid_order_view',
  'parent_order_view',
];

const triggers = modifiedAtTables
  .map(
    (t) => `
CREATE TRIGGER update_${t}_modified_at
BEFORE UPDATE ON ${t}
FOR EACH ROW
EXECUTE FUNCTION update_modified_at();
`,
  )
  .join('\n');
console.log(triggers);

const tablePolicies = allTables
  .map(
    (t) => `
ALTER TABLE ${t} ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS access_for_logged_in_users ON ${t};
CREATE POLICY access_for_logged_in_users ON ${t}
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
REVOKE ALL ON TABLE ${t} FROM anon;`,
  )
  .join('\n');

console.log(tablePolicies);

const viewGrants = views
  .map(
    (v) => `
GRANT SELECT ON ${v} TO authenticated;
REVOKE ALL ON ${v} FROM anon;`,
  )
  .join('\n');

console.log(viewGrants);
