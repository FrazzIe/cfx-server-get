//imports
const fs = require("fs");
const os = require("os");

//vars
const appName = "cfx-server-get";
const numArgs = 2;
const helpMsg = `
	${appName} usage:
	node index.js <version> <output directory>
		<version>:
			- recommended
			- latest
			- critical
		<output directory>:
			- C:\\Path\\To\\File
`;
const versions = ["recommended", "latest", "critical"];
const platforms = ["win32", "linux"];
const platform = os.platform();

let args = process.argv.slice(2);
let version = args[0];
let output = args[1];

function log(tag, msg) {
	console.log(`${appName}/${tag}: ${msg}`);
}

if (!platforms.includes(platform)) {
	log("ERROR", `${platform} is not a supported os, terminating.`);
	return;
}

if (args.length == 0) {
	log("INFO", helpMsg);
	return;
}

if (args.length <= 1) {
	log("ERROR", `Invalid arguments (got: ${args.length} expected: ${numArgs})`);
	return;
}

if (!versions.includes(version)) {
	log("ERROR", `${version} is an invalid <version> (versions: ${versions.join(", ")})`);
	return;
}

let pathInfo;

try {
	pathInfo = fs.statSync(output);
} catch(error) {
	log("ERROR", `${output} is an invalid <output directory>`);
	return;
}

if (!pathInfo.isDirectory()) {
	log("ERROR", `${output} is an invalid <output directory>`);
}

log("SUCCESS", "DO STUFF");