import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {App} from './App.tsx';
import {
  createTheme,
  ThemeProvider,
  CssBaseline,
  Box,
  Container,
} from '@mui/material';
import {OasisToolbar} from './components/OasisToolbar.tsx';

const darkTheme = createTheme({palette: {mode: 'dark'}});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box sx={{flexGrow: 1}}>
        <OasisToolbar />
        <Container sx={{pb: 10}}>
          <App />
        </Container>
      </Box>
    </ThemeProvider>
  </StrictMode>,
);
