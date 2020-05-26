const fs = require("fs");
const path = require("path");
const _get = require("lodash/get");

const extensions = [".js", ".jsx", ".ts", ".tsx"];

function getChunkNameFromArgument(arg) {
	const comment = _get(arg, "leadingComments[0].value");
	if (comment) {
		const res = comment.match(/webpackChunkName\s*:\s*"([^."].*)"/);
		return res ? res[1] : null;
	}
}

function getWithExt(pathResolveParams, mainFile) {
	let ans = path.resolve(...pathResolveParams, mainFile);
	if (fs.existsSync(ans)) {
		return ans;
	}
	for (ext of extensions) {
		const fp = path.resolve(...pathResolveParams, mainFile + ext);
		if (fs.existsSync(fp)) {
			return fp;
		}
	}
	return null;
}

function resolveWithPackageJson(fp, { context, dir }) {
	const pkgPath = context
		? path.resolve(process.cwd(), context, fp + "/package.json")
		: path.resolve(dir, fp + "/package.json");
	if (fs.existsSync(pkgPath)) {
		const mainFile = require(pkgPath).main;
		return context
			? getWithExt([process.cwd(), context, fp], mainFile)
			: getWithExt([dir, fp], mainFile);
	}
	return null;
}

function resolveWithExt(fp, ext, { context, dir }) {
	const fyle = context
		? path.resolve(  process.cwd(),  context, fp + ext)
		: path.resolve(dir, fp + ext);
	return fs.existsSync(fyle) ? fyle : null;
}

function resolveWithNothing(fp, { context, dir }) {
	const fyle = context
		? path.resolve(process.cwd(), context, fp)
		: path.resolve(dir, fp);
	return fs.existsSync(fyle) && fs.lstatSync(fyle).isFile() ? fyle : null;
}

function resolveFilePathWithExts(filePath, opts) {
	for (ext of extensions) {
        const fp = resolveWithExt(filePath, ext, opts);
		if (fp) {
			return fp;
		}
	}
	return null;
}

function resolveWithIndexFile(fp, opts) {
	return resolveFilePathWithExts(fp + "/index", opts);
}

function resolveFilePath(fp, opts) {
	let ans = resolveFilePathWithExts(fp, opts);
	if (ans) {
        // console.log("resolveFilePathWithExts: ", ans);
		return ans;
	}
    
	ans = resolveWithPackageJson(fp, opts);
	if (ans) {
        // console.log("resolveWithPackageJson: ", ans);
		return ans;
	}
    
	ans = resolveWithIndexFile(fp, opts);
	if (ans) {
        // console.log("resolveWithIndexFile: ", ans);
		return ans;
	}
    
	ans = resolveWithNothing(fp, opts);
	if (ans) {
        // console.log("resolveWithNothing: ", ans);
		return ans;
    }
    
    // console.log("Unresolved")
	return null;
}

function getFilePath(dir, srcContext, filePath) {
	return filePath.startsWith(".")
		? resolveFilePath(filePath, { dir }) 
		: resolveFilePath(filePath, { context: srcContext }); 
}

const regex = /.js$|.jsx$|.ts$|.tsx$/g;

function isJsFile(filePath) {
	const ext = path.extname(filePath);
	return !ext || ext.match(regex);
}

exports.getChunkNameFromArgument = getChunkNameFromArgument;
exports.getFilePath = getFilePath;
exports.isJsFile = isJsFile;