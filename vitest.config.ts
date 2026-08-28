import {mergeConfig} from 'vite';
import {defineConfig} from 'vitest/config';
import viteConfig from './vite.config.ts';

/**
 * The app config plus what tests need, rather than a second copy of it — otherwise a plugin
 * added to vite.config.ts would build fine and fail only under test.
 */
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      // Set for every test, including src/utils/. Those are pure functions that neither
      // need jsdom nor notice it, and one environment is one less thing to get wrong.
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      // Required for React Testing Library's automatic cleanup between tests: it registers
      // its `afterEach(cleanup)` only when the globals are present. Tests still import
      // `describe`/`it`/`expect` explicitly, so no ambient types are needed.
      globals: true,
    },
  }),
);
