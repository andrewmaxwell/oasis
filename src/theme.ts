import {createTheme, alpha} from '@mui/material';

/**
 * The single source of truth for palette, shape, and component defaults. Prefer adding a
 * default here over repeating the same `sx` on every instance of a component.
 *
 * Dark-only for now; ROADMAP §10 tracks the light/system toggle.
 */
export const theme = createTheme({
  palette: {
    mode: 'dark',
    background: {default: '#0e1114', paper: '#181c21'},
    divider: alpha('#ffffff', 0.1),
  },
  shape: {borderRadius: 10},
  typography: {
    // Uppercased button labels read as shouting next to the sentence-case nav and headings.
    button: {textTransform: 'none', fontWeight: 600, letterSpacing: 0},
    h4: {fontWeight: 700, letterSpacing: '-0.02em'},
    h5: {fontWeight: 700, letterSpacing: '-0.01em'},
  },
  components: {
    MuiAppBar: {
      defaultProps: {elevation: 0, color: 'transparent'},
      styleOverrides: {
        root: ({theme}) => ({
          // MUI paints a lightening gradient over dark AppBars; a flat surface plus a
          // hairline border separates it from the page more cleanly.
          backgroundImage: 'none',
          backgroundColor: theme.palette.background.paper,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }),
      },
    },
    MuiCard: {
      styleOverrides: {
        root: ({theme}) => ({
          backgroundImage: 'none',
          border: `1px solid ${theme.palette.divider}`,
          transition: theme.transitions.create(['border-color', 'transform']),
          '&:hover': {borderColor: alpha(theme.palette.common.white, 0.25)},
        }),
      },
    },
    MuiCardActionArea: {
      styleOverrides: {
        // The default overlay washes the whole card out on hover. Dial it back, but keep
        // it visible on keyboard focus — it is the only focus indicator these cards have.
        focusHighlight: {opacity: 0},
        root: ({theme}) => ({
          '&:hover .MuiCardActionArea-focusHighlight': {opacity: 0.02},
          '&.Mui-focusVisible .MuiCardActionArea-focusHighlight': {
            opacity: 0.1,
          },
          '&.Mui-focusVisible': {
            outline: `2px solid ${theme.palette.primary.main}`,
            outlineOffset: 2,
          },
        }),
      },
    },
  },
});
