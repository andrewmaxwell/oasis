import {
  Button,
  Paper,
  Typography,
  Box,
  InputAdornment,
  TextField,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {useNavigate} from 'react-router-dom';
import {Add, Search} from '@mui/icons-material';
import {
  DataGrid,
  GridColDef,
  GridColumnVisibilityModel,
  GridFilterModel,
  GridValidRowModel,
} from '@mui/x-data-grid';
import {useMemo, useState} from 'react';
import {useCanWrite} from '../hooks/useAccessLevel';
import {EmptyState, ErrorState} from './PageStates.tsx';

/** Module-level: a new function identity here would re-measure every row on every render. */
const autoRowHeight = () => 'auto' as const;

type TableHeaderProps = {
  label: string;
  secondaryLabel?: string;
  newItemUrl?: string;
  search: string;
  onSearch: (value: string) => void;
};

/**
 * The title, count, search box, and Add button.
 *
 * This sits *above* the grid rather than in its `toolbar` slot: that slot has a fixed
 * height and clips whatever spills past it, so on a phone — where this has to wrap onto
 * two rows — the search box and Add button were sliced off by the column headers. Out
 * here the row is free to grow, at the cost of driving the quick filter ourselves through
 * `filterModel` instead of the grid's own `<QuickFilter>`.
 */
const TableHeader = ({
  label,
  secondaryLabel,
  newItemUrl,
  search,
  onSearch,
}: TableHeaderProps) => {
  const navigate = useNavigate();
  const canWrite = useCanWrite();
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: {xs: 'column', md: 'row'},
        alignItems: {xs: 'stretch', md: 'center'},
        justifyContent: 'space-between',
        gap: {xs: 1.5, md: 2},
        pb: 1.5,
      }}
    >
      <Box sx={{minWidth: 0}}>
        <Typography variant="h5" sx={{fontWeight: 'bold'}}>
          {label}s
        </Typography>
        {secondaryLabel && (
          <Typography variant="body2" color="text.secondary">
            {secondaryLabel}
          </Typography>
        )}
      </Box>
      <Box sx={{display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0}}>
        <TextField
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          variant="outlined"
          size="small"
          placeholder="Search..."
          aria-label={`Search ${label.toLowerCase()}s`}
          sx={{flex: '1 1 auto', minWidth: 0}}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            },
          }}
        />
        {canWrite && newItemUrl && (
          <Button
            variant="contained"
            onClick={() => navigate(newItemUrl)}
            startIcon={<Add />}
            disableElevation
            sx={{flexShrink: 0, whiteSpace: 'nowrap'}}
          >
            Add {label}
          </Button>
        )}
      </Box>
    </Box>
  );
};

type OasisTableProps<T extends GridValidRowModel> = {
  data: T[] | undefined;
  label: string;
  columns: readonly GridColDef<T>[];
  newItemUrl?: string;
  secondaryLabel?: string;
  /**
   * The handful of fields worth showing on a phone. Everything else is hidden below the
   * `sm` breakpoint, and these stretch to fill the width, so reading the table doesn't
   * take a sideways scroll. Defaults to the first two columns.
   */
  mobileColumns?: readonly string[];
  /** Shown in place of a blank grid once the data has loaded and there is none. */
  emptyMessage?: string;
  /** A failed load renders an error with a retry instead of an endless loading bar. */
  error?: unknown;
  onRetry?: () => void;
};

export const OasisTable = <T extends {id: string}>({
  data,
  label,
  columns,
  newItemUrl,
  secondaryLabel,
  mobileColumns,
  emptyMessage,
  error,
  onRetry,
}: OasisTableProps<T>) => {
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down('sm'));
  const [search, setSearch] = useState('');

  const filterModel: GridFilterModel = useMemo(
    () => ({
      items: [],
      quickFilterValues: search.split(' ').filter(Boolean),
      // The grid ignores hidden columns when quick-filtering by default, which on a phone
      // would mean searching only the two `mobileColumns` — no finding a family by zip or
      // phone number, which is most of why anyone searches from a car.
      quickFilterExcludeHiddenColumns: false,
    }),
    [search],
  );

  const keep = useMemo(
    () => mobileColumns ?? columns.slice(0, 2).map((c) => c.field),
    [mobileColumns, columns],
  );

  // Fixed pixel widths add up to more than a phone is wide, so on a phone the surviving
  // columns switch to `flex` — keeping their relative proportions — and their contents
  // wrap onto a second line instead of being cut off.
  const phoneColumns = useMemo(
    () =>
      columns.map((c) =>
        keep.includes(c.field)
          ? {...c, flex: (c.width ?? 100) / 100, minWidth: 80, width: undefined}
          : c,
      ),
    [columns, keep],
  );

  // Derived rather than stored, so rotating from portrait to landscape brings the columns
  // back; anything the user hides by hand on a wide screen layers on top.
  const [overrides, setOverrides] = useState<GridColumnVisibilityModel>({});
  const visibility = useMemo(
    () => ({
      ...(isPhone
        ? Object.fromEntries(
            columns
              .filter((c) => !keep.includes(c.field))
              .map((c) => [c.field, false]),
          )
        : {}),
      ...overrides,
    }),
    [isPhone, columns, keep, overrides],
  );

  return (
    <Paper sx={{mt: 2, p: {xs: 1.5, sm: 2}}}>
      {error ? (
        <ErrorState
          error={error}
          onRetry={onRetry}
          title={`Could not load ${label.toLowerCase()}s`}
        />
      ) : (
        <>
          <TableHeader
            label={label}
            secondaryLabel={secondaryLabel}
            newItemUrl={newItemUrl}
            search={search}
            onSearch={setSearch}
          />
          <DataGrid
            sx={{
              border: 0,
              // The "Active" chip is one of the columns a phone hides, so without this an
              // inactive family or a retired volunteer reads exactly like a live one.
              // Sorting puts them last; this is what says why.
              '& .oasis-row--inactive': {opacity: 0.55},
              // Wrapped cells need room to breathe, and the header labels have to wrap
              // with them rather than truncate to two letters.
              ...(isPhone && {
                '& .MuiDataGrid-cell': {
                  whiteSpace: 'normal',
                  lineHeight: 1.4,
                  display: 'flex',
                  alignItems: 'center',
                  py: 1,
                },
                '& .MuiDataGrid-columnHeaderTitle': {whiteSpace: 'normal'},
              }),
            }}
            loading={!data}
            rows={data || []}
            getRowClassName={({row}) =>
              (row as {is_active?: boolean}).is_active === false
                ? 'oasis-row--inactive'
                : ''
            }
            columns={isPhone ? phoneColumns : (columns as GridColDef<T>[])}
            getRowHeight={isPhone ? autoRowHeight : undefined}
            filterModel={filterModel}
            columnVisibilityModel={visibility}
            onColumnVisibilityModelChange={setOverrides}
            // The three-dot menu takes most of a header's width on a phone, and everything
            // behind it is a desktop affordance.
            disableColumnMenu={isPhone}
            slots={{
              noRowsOverlay: () => (
                <EmptyState
                  message={emptyMessage ?? `No ${label.toLowerCase()}s yet.`}
                />
              ),
              // A filtered-empty grid is a different state from an empty one, and says so.
              noResultsOverlay: () => (
                <EmptyState
                  message={`No ${label.toLowerCase()}s match “${search}”.`}
                />
              ),
            }}
          />
        </>
      )}
    </Paper>
  );
};
