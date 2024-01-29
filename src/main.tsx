import React from 'react';
import ReactDOM from 'react-dom/client';
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

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box sx={{flexGrow: 1}}>
        <OasisToolbar />
        <Container maxWidth="sm">
          <App />
        </Container>
      </Box>
    </ThemeProvider>
  </React.StrictMode>,
);
