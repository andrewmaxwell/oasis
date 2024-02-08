const modifiedAtTables = ['parent', 'deliverer', 'kid', 'order_record'];
const allTables = [...modifiedAtTables, 'order_parent', 'order_kid'];

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

const policies = allTables
  .map(
    (t) => `
DROP POLICY IF EXISTS access_for_logged_in_users ON ${t};
CREATE POLICY access_for_logged_in_users ON ${t}
AS PERMISSIVE
FOR ALL
TO PUBLIC
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);
`,
  )
  .join('\n');

console.log(policies);
