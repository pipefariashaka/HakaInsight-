import { defineConfig } from '@vscode/test-cli';

export default defineConfig({
	files: ['out/test/**/*.test.js', 'out/services/**/*.test.js', 'out/models/**/*.test.js'],
});
