import { nxE2EPreset } from '@nx/cypress/plugins/cypress-preset';
import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    ...nxE2EPreset(__filename, {
      cypressDir: 'src',
      bundler: 'vite',
      webServerCommands: {
        default: 'npx nx run @jukebox/frontend:dev',
        production: 'npx nx run @jukebox/frontend:preview',
      },
      ciWebServerCommand: 'npx nx run @jukebox/frontend:preview',
      ciBaseUrl: 'http://localhost:8000',
    }),
    baseUrl: 'http://localhost:8000',
  },
});
