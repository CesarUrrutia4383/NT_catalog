/**
 * @fileoverview This is the configuration file for Vite.
 * @see https://vitejs.dev/config/
 */

import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  /**
   * @description Server options.
   * @see https://vitejs.dev/config/#server-options
   */
  server: {
    /**
     * @description Specify which hosts are allowed to access the dev server.
     * @see https://vitejs.dev/config/#server-allowedhosts
     */
    allowedHosts: ['nt-catalog.onrender.com'],
  },
  /**
   * @description Build options.
   * @see https://vitejs.dev/config/#build-options
   */
  build: {
    /**
     * @description Rollup options.
     * @see https://vitejs.dev/config/#build-rollupoptions
     */
    rollupOptions: {
      /**
       * @description Input files.
       * @see https://rollupjs.org/guide/en/#input
       */
      input: {
        main: resolve(__dirname, 'index.html'),
        catalog: resolve(__dirname, 'catalog.html'),
        contact: resolve(__dirname, 'contact.html'),
      },
    },
  },
});
