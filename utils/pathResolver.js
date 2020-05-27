const fs = require("fs");
const path = require("path");
const extensions = [".js", ".jsx", ".ts", ".tsx"];

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
		? path.resolve(context, fp + "/package.json")
		: path.resolve(dir, fp + "/package.json");
	if (fs.existsSync(pkgPath)) {
		const mainFile = require(pkgPath).main;
		return context
			? getWithExt([context, fp], mainFile)
			: getWithExt([dir, fp], mainFile);
	}
	return null;
}

function resolveWithExt(fp, ext, { context, dir }) {
	const fyle = context
		? path.resolve(context, fp + ext)
		: path.resolve(dir, fp + ext);
	return fs.existsSync(fyle) ? fyle : null;
}

// If using relative paths
// process.cwd(),

function resolveWithNothing(fp, { context, dir }) {
	const fyle = context
		? path.resolve(context, fp)
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

exports.getFilePath = getFilePath;