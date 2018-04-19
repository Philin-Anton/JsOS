const http = require("http");
const url = require("url");

class GitHub {
	get(path, cb) {
		const opt = url.parse(path);
		opt.headers = {
			"X-Requested-With": "JsOS/NPI",
			"User-Agent": "JsOS/NPI"
		};

		function once(resolve, reject, tries) {
			let done = false;

			http.get(opt, res => {
				let str = "";
				res.setEncoding("utf8");
				res.on("data", chunk => {
					str += chunk;
				});
				res.on("end", () => {
					done = true;
					resolve(str);
				});
				res.on("error", e => {
					done = true;
					reject(e);
				});

				setTimeout(() => {
					if(done) {
						return;
					}

					if(tries === 0) {
						reject(new Error("Timeout on " + path));
					} else {
						once(resolve, reject, tries - 1);
					}
				}, 20000);
			});
		}

		// Try 3 times on timeout
		return new Promise((resolve, reject) => {
			once(resolve, reject, 3);
		});
	}

	corsGet(url) {
		return this.get("http://cors-anywhere.herokuapp.com/" + url)
			.then(res => {
				if(res.toLowerCase().indexOf("//www.herokucdn.com") > -1) {
					throw new Error("cors-anywhere.herokuapp.com is down");
				}

				return res;
			});
	}

	api(path) {
		return this.corsGet("https://api.github.com/" + path)
			.then(JSON.parse)
			.then(res => {
				if(typeof res.message === "string") {
					if(res.message.indexOf("rate limit") > -1) {
						throw new Error("GitHub API rate limit exceeded");
					}
					throw new Error(res.message);
				}

				return res;
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
	readModule(path) {
		return this.api("repos/JsOS-Team/NPI-pkg/contents/" + path)
			.then(module => {
				if(module.type !== "submodule") {
					throw new Error(path + " is not a module");
				} else {
					return module;
				}
			});
	}
	readTree(sha) {
		return this.api("repos/JsOS-Team/NPI-pkg/git/trees/" + sha + "?recursive=1");
	}
	readFilePages(path) {
		return this.corsGet("https://jsos-team.github.io/NPI-pkg/" + path);
	}
};

module.exports = GitHub;