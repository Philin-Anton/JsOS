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

		return http.get(opt, res => {
			let str = "";
			res.setEncoding("utf8");
			res.on("data", chunk => {
				str += chunk;
			});
			res.on("end", () => {
				if(cb) {
					cb(str);
				}
			});
		});
	}

	corsGet(url, cb) {
		return this.get("http://cors-anywhere.herokuapp.com/" + url, cb);
	}

	api(path, cb) {
		this.corsGet("https://api.github.com/" + path, str => {
			cb(JSON.parse(str));
		});
	}

	readFile(path, cb) {
		this.api("repos/JsOS-Team/NPI-pkg/contents/" + path, file => {
			if(file.type !== "file") {
				cb(null);
			} else {
				file.content = Buffer.from(file.content, "base64");
				cb(file);
			}
		});
	}
	readDir(path, cb) {
		this.api("repos/JsOS-Team/NPI-pkg/contents/" + path, files => {
			if(!Array.isArray(files)) {
				cb(null);
			} else {
				cb(files);
			}
		});
	}

	getInfo(cb) {
		let info = {
			name: this.name
		};

		// Get package
		this.readDir(`packages`, packages => {
			let pkg = packages.find(file => file.name == this.name);
			if(!pkg) {
				return cb(null);
			}
			info.url = pkg.html_url;

			// Get module
			this.readFile(`packages/${this.name}/module`, module => {
				if(module) {
					info.module = module.content.toString("ascii");
				} else {
					info.module = null;
				}

				cb(info);
			});
		});
	}
};

module.exports = Package;