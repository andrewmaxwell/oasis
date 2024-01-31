import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {App} from './App.tsx';
import {createTheme, ThemeProvider, CssBaseline} from '@mui/material';

const darkTheme = createTheme({palette: {mode: 'dark'}});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </StrictMode>,
);
