const path = require("path");
const _get = require("lodash/get");

const regex = /.js$|.jsx$|.ts$|.tsx$/g;

function isJsFile(filePath) {
	const ext = path.extname(filePath);
	return !ext || ext.match(regex);
}

function getChunkNameFromArgument(arg) {
	const comment = _get(arg, "leadingComments[0].value");
	if (comment) {
		const res = comment.match(/webpackChunkName\s*:\s*"([^."].*)"/);
		return res ? res[1] : null;
	}
}

exports.getChunkNameFromArgument = getChunkNameFromArgument;
exports.isJsFile = isJsFile;