const http = require("http");
const url = require("url");

class GitLab {
	constructor() {
		this.repoId = 6119839;
	}

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
		return this.corsGet("https://gitlab.com/api/v3/" + path)
			.then(JSON.parse);
	}


	readDir(path) {
		return this.api(`projects/${this.repoId}/repository/tree/?path=${path}`)
			.then(files => {
				if(!Array.isArray(files)) {
					throw new Error(path + " is not a directory");
				}

				for(const file of files) {
					file.sha = file.id;
				}
				return files;
			});
	}
	readDirRecursively(path) {
		return this.api(`projects/${this.repoId}/repository/tree/?path=${path}&recursive=true`);
	}
};

module.exports = GitLab;