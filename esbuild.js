const esbuild = require("esbuild");
const fs = require("fs");
const path = require("path");

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

/**
 * Copy directory recursively
 */
function copyDir(src, dest) {
	if (!fs.existsSync(dest)) {
		fs.mkdirSync(dest, { recursive: true });
	}
	
	const entries = fs.readdirSync(src, { withFileTypes: true });
	
	for (const entry of entries) {
		const srcPath = path.join(src, entry.name);
		const destPath = path.join(dest, entry.name);
		
		if (entry.isDirectory()) {
			copyDir(srcPath, destPath);
		} else {
			fs.copyFileSync(srcPath, destPath);
		}
	}
}

/**
 * Copy webview assets
 */
function copyWebviewAssets() {
	console.log('[copy] Copying webview assets...');
	
	// Copy templates
	const templatesSource = path.join(__dirname, 'src', 'webview', 'templates');
	const templatesDest = path.join(__dirname, 'dist', 'webview', 'templates');
	if (fs.existsSync(templatesSource)) {
		copyDir(templatesSource, templatesDest);
		console.log('[copy] Templates copied');
	}
	
	// Copy styles
	const stylesSource = path.join(__dirname, 'src', 'webview', 'styles');
	const stylesDest = path.join(__dirname, 'dist', 'webview', 'styles');
	if (fs.existsSync(stylesSource)) {
		copyDir(stylesSource, stylesDest);
		console.log('[copy] Styles copied');
	}
	
	// Copy scripts
	const scriptsSource = path.join(__dirname, 'src', 'webview', 'scripts');
	const scriptsDest = path.join(__dirname, 'dist', 'webview', 'scripts');
	if (fs.existsSync(scriptsSource)) {
		copyDir(scriptsSource, scriptsDest);
		console.log('[copy] Scripts copied');
	}
	
	console.log('[copy] Webview assets copied successfully');
}

/**
 * @type {import('esbuild').Plugin}
 */
const esbuildProblemMatcherPlugin = {
	name: 'esbuild-problem-matcher',

	setup(build) {
		build.onStart(() => {
			console.log('[watch] build started');
		});
		build.onEnd((result) => {
			result.errors.forEach(({ text, location }) => {
				console.error(`✘ [ERROR] ${text}`);
				console.error(`    ${location.file}:${location.line}:${location.column}:`);
			});
			console.log('[watch] build finished');
		});
	},
};

async function main() {
	// Copy webview assets before building
	copyWebviewAssets();
	
	const ctx = await esbuild.context({
		entryPoints: [
			'src/extension.ts'
		],
		bundle: true,
		format: 'cjs',
		minify: production,
		sourcemap: !production,
		sourcesContent: false,
		platform: 'node',
		outfile: 'dist/extension.js',
		external: ['vscode'],
		logLevel: 'silent',
		plugins: [
			/* add to the end of plugins array */
			esbuildProblemMatcherPlugin,
		],
	});
	if (watch) {
		await ctx.watch();
	} else {
		await ctx.rebuild();
		await ctx.dispose();
	}
}

main().catch(e => {
	console.error(e);
	process.exit(1);
});
