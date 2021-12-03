//imports
const fs = require("fs");
const os = require("os");
const https = require("https");
const path = require("path");
const AdmZip = require("adm-zip");

//vars
const appName = "cfx-server-get";
const numArgs = 2;
const helpMsg = `
	${appName} usage:
	node index.js <version> <output-directory> <optional: update-check>
		<version>:
			- recommended
			- optional
			- latest
			- critical
		<output-directory>:
			- C:\\Path\\To\\File
		<optional: update-check>
			- Any value
`;
const versions = ["recommended", "optional", "latest", "critical"];
const platforms = ["win32", "linux"];
const platform = os.platform();
const infoFilename = "info.txt";

let args = process.argv.slice(2);
let version = args[0];
let output = args[1];
let fileCheck = args[2];

function log(tag, msg) {
	console.log(`${appName}/${tag}: ${msg}`);
}

function StoreBuildInfo(buildNum) {
	let data = version + "," + buildNum;
	fs.writeFile(path.join(output, infoFilename), data, (error) => {
		if (error) {
			log("ERROR", `Couldn't cache the build info [${error.message}]`);
			return;
		}
	})
}

function ExtractBuild(fileBuffer, buildNum) {
	try {
		const zip = new AdmZip(fileBuffer);
		zip.extractAllTo(output, true);
		console.log(`Installed ${version}:${buildNum}`);
	} catch(error) {
		log("ERROR", `Couldn't extract the ${version} build to ${output}`);
		return;
	}

	StoreBuildInfo(buildNum);
}

function ShowDownloadProgress(current, max, buildNum) {
	if (current > max)
		return;

	process.stdout.clearLine();
	process.stdout.cursorTo(0);

	let percentage = Math.floor(current / max * 100);
	let bar = "";
	let barCount = Math.floor(percentage / 4);

	for (let i = 1; i < 25; i++) {
		bar += (i <= barCount) ? "=" : "-";
	}

	if (current == max) {
		console.log(`Downloaded ${version}:${buildNum} [${bar}] ${percentage}% | ${current}/${max} chunks`);
		return;
	}

	process.stdout.write(`Downloading... [${bar}] ${percentage}% | ${current}/${max} chunks`);
}

function DownloadBuild(downloadURL, buildNum) {
	https.get(downloadURL, (response) => {
		const { statusCode } = response;
		const contentType = response.headers['content-type'];
		const contentLength = response.headers['content-length'];
		let contentReceived = 0;
		let error;

		if (statusCode !== 200) {
			error = new Error(`Request failed with status code: ${statusCode}`);
		} else if (!/^application\/zip/.test(contentType)) {
			error = new Error(`Invalid content-type, expected "application/zip" but received "${contentType}"`);
		}

		if (error) {
			log("ERROR", error.message);
			response.resume();
			return;
		}

		let rawBuffer = [];

		response.on("data", (chunk) => {
			rawBuffer.push(chunk);
			contentReceived += chunk.length;
			ShowDownloadProgress(contentReceived, contentLength, buildNum);
		});

		response.on("end", () => {
			try {
				let buffer = Buffer.concat(rawBuffer);
				ExtractBuild(buffer, buildNum);
			} catch (error) {
				log("ERROR", error.message);
			}
		});
	});
}

function UpdateAvailable(buildNum) {
	fileCheck = fileCheck !== undefined;

	if (!fileCheck)
		return true;

	try {
		const data = fs.readFileSync(path.join(output, "info.txt"), "utf8");
		const info = data.split(",");

		if (info.length < 1)
			return true;

		if (info[0] != version)
			return true;

		if (info[1] != buildNum)
			return true;

		return false;
	} catch(error) {
		log("ERROR", "Cache not found");
		return true;
	}
}

function OnBuildInfo(data) {
	let buildNum = data[version];
	let downloadURL = data[version + "_download"];

	if (!UpdateAvailable(buildNum)) {
		log("INFO", "Skipping server download..");
		return;
	}

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