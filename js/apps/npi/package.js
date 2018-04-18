const http = require("http");
const url = require("url");

class Package {
	constructor(name) {
		this.name = name;
	}

	get(path, cb) {
		const opt = url.parse(path);
		opt.headers = {
			"X-Requested-With": "JsOS/NPI",
			"User-Agent": "JsOS/NPI"
		};

		return new Promise((resolve, reject) => {
			http.get(opt, res => {
				let str = "";
				res.setEncoding("utf8");
				res.on("data", chunk => {
					str += chunk;
				});
				res.on("end", () => {
					resolve(str);
				});
				res.on("error", reject);
			});
		});
	}

	corsGet(url) {
		return this.get("http://cors-anywhere.herokuapp.com/" + url);
	}

	api(path) {
		return this.corsGet("https://api.github.com/" + path)
			.then(JSON.parse);
	}

	readFile(path) {
		return this.api("repos/JsOS-Team/NPI-pkg/contents/" + path)
			.then(file => {
				if(file.type !== "file") {
					throw new Error(path + " is not a file");
				} else {
					file.content = Buffer.from(file.content, "base64");
					return file;
				}
			});
	}
	readDir(path) {
		return this.api("repos/JsOS-Team/NPI-pkg/contents/" + path)
			.then(files => {
				if(!Array.isArray(files)) {
					throw new Error(path + " is not a directory");
				} else {
					return files;
				}
			});
	}
	readBlob(sha) {
		return this.api("repos/JsOS-Team/NPI-pkg/git/blobs/" + sha)
			.then(blob => {
				blob.content = Buffer.from(blob.content, blob.encoding);
				return blob;
			});
	}
	readTree(sha) {
		return this.api("repos/JsOS-Team/NPI-pkg/git/trees/" + sha + "?recursive=1");
	}

	getInfo() {
		let info = {
			name: this.name
		};
		let pkg;

		// Get package
		return this.readDir("packages")
			.then(packages => {
				pkg = packages.find(file => file.name == this.name);
				if(!pkg) {
					throw new Error("Package not found");
				}
				info.url = pkg.html_url;
				info.sha = pkg.sha;

				// Get module
				return this.readFile(`packages/${this.name}/module`)
					.then(module => {
						info.module = module.content.toString("ascii");
					}, () => {
						info.module = null;
					});
			})
			.then(() => {
				// Read files
				return this.readTree(pkg.sha);
			}).then(tree => {
				info.files = 0;
				info.size = 0;
				tree.tree.forEach(file => {
					if(file.type == "blob") {
						info.files++;
						info.size += file.size;
					}
				});
			})
			.then(() => info);
	}

	install(io) {
		return this.getInfo()
			.then(info => {
				return this.readTree(info.sha);
			})
			.then(tree => {
				return Promise.all(tree.tree.map(file => this.installFile(file, io)));
			});
	}
	installFile(file, io) {
		if(file.type != "blob") {
			return;
		}

		io.writeLine("Downloading " + file.path);
		// TODO
	}
};

module.exports = Package;