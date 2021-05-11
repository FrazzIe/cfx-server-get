# cfx-server-get

Fetch and unpack selected cfx server builds using cfx changelog API

## Dependencies

* [Node.js](https://nodejs.org/en/download/) in your PATH as `node`
* [Yarn](https://classic.yarnpkg.com/en/docs/install/) in your PATH as `yarn`.

## Setup

Execute the following commands in a `cmd.exe` shell:
```bat
git clone https://github.com/FrazzIe/cfx-server-get.git
cd cfx-server-get
yarn install
```

## Usage

Execute the following commands in a `cmd.exe` shell:
```js
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
```

* `<version>`: The type of server build
* `<output directory>`: The directory the server build will be extracted to (must exist)
* `<optional: update-check>`: An optional argument that will match a cached file and only re-download if a newer version is available