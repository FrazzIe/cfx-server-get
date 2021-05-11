//imports
const fs = require("fs");
const os = require("os");
const https = require("https");

//vars
const appName = "cfx-server-get";
const numArgs = 2;
const helpMsg = `
	${appName} usage:
	node index.js <version> <output directory>
		<version>:
			- recommended
			- optional
			- latest
			- critical
		<output directory>:
			- C:\\Path\\To\\File
`;
const versions = ["recommended", "optional", "latest", "critical"];
const platforms = ["win32", "linux"];
const platform = os.platform();

let args = process.argv.slice(2);
let version = args[0];
let output = args[1];

function log(tag, msg) {
	console.log(`${appName}/${tag}: ${msg}`);
}

function DownloadBuild(downloadURL, buildNum) {

}

function OnBuildInfo(data) {
	let buildNum = data[version];
	let downloadURL = data[version + "_download"];

	if (!buildNum) {
		log("ERROR", `Couldn't fetch ${version} build number`);
		return;
	}

	if (!downloadURL) {
		log("ERROR", `Couldn't fetch ${version} download url`);
		return;
	}

	DownloadBuild(downloadURL, buildNum);
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

https.get(`https://changelogs-live.fivem.net/api/changelog/versions/${platform}/server`, (response) => {
	const { statusCode } = response;
	const contentType = response.headers['content-type'];

	let error;

	if (statusCode !== 200) {
		error = new Error(`Request failed with status code: ${statusCode}`);
	} else if (!/^application\/json/.test(contentType)) {
		error = new Error(`Invalid content-type, expected "application/json" but received "${contentType}"`);
	}

	if (error) {
		log("ERROR", error.message);
		response.resume();
		return;
	}

	let rawData = "";

	response.setEncoding("utf8");
	response.on("data", (chunk) => { rawData += chunk; });
	response.on("end", () => {
		try {
			const parsedData = JSON.parse(rawData);
			OnBuildInfo(parsedData);
		} catch (error) {
			log("ERROR", error.message);
		}
	});
});