const http = require("http");
const url = require("url");

class Package {
	constructor(name) {
		this.name = name;
		this.installationStopped = false;
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

	gitHubApi(path) {
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

	readFile(path) {
		return this.gitHubApi("repos/JsOS-Team/NPI-pkg/contents/" + path)
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
		return this.gitHubApi("repos/JsOS-Team/NPI-pkg/contents/" + path)
			.then(files => {
				if(!Array.isArray(files)) {
					throw new Error(path + " is not a directory");
				} else {
					return files;
				}
			});
	}
	readModule(path) {
		return this.gitHubApi("repos/JsOS-Team/NPI-pkg/contents/" + path)
			.then(module => {
				if(module.type !== "submodule") {
					throw new Error(path + " is not a module");
				} else {
					return module;
				}
			});
	}
	readBlob(sha) {
		return this.gitHubApi("repos/JsOS-Team/NPI-pkg/git/blobs/" + sha)
			.then(blob => {
				blob.content = Buffer.from(blob.content, blob.encoding);
				return blob;
			});
	}
	readTree(sha) {
		return this.gitHubApi("repos/JsOS-Team/NPI-pkg/git/trees/" + sha + "?recursive=1");
	}
	readFilePages(path) {
		return this.corsGet("https://jsos-team.github.io/NPI-pkg/" + path);
	}

	getInfo() {
		let info = {
			name: this.name
		};
		let pkg;

		// Get package
		return this.readDir("packages")
			.then(packages => {
				pkg = packages.find(file => file.name === this.name);
				if(!pkg) {
					throw new Error("Package not found");
				}
				info.url = pkg.html_url;
				info.sha = pkg.sha;

				// Get module
				return this.readModule(`packages/${this.name}`)
					.then(module => {
						info.module = module.submodule_git_url;
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
					if(file.type === "blob") {
						info.files++;
						info.size += file.size;
					}
				});
			})
			.then(() => info);
	}

	install(io) {
		this.installationStopped = false;

		io.writeLine("Getting information");
		return this.getInfo()
			.then(info => {
				io.writeLine("Gathering package");
				return this.readTree(info.sha);
			})
			.then(tree => {
				return Promise.all(tree.tree.map(file => this.installFile(file, io)))
					.catch(e => {
						this.installationStopped = true;
						throw e;
					});
			})
			.then(() => {
				io.writeLine(`Installing package ${this.name}`);

				const app = require(`npi/${this.name}`);

				// Install application
				PERSISTENCE.Apps[this.name] = {
					run: app.call,
					commands: app.commands
				};

				// Create links
				for(const command of app.commands) {
					PERSISTENCE.Apps._commands[command] = this.name;
				}

				io.writeLine(`Installed package ${this.name}`);
			});
	}
	installFile(file, io) {
		if(file.type != "blob") {
			return;
		}

		io.writeLine("Downloading " + file.path);

		return this.readFilePages(`packages/${this.name}/${file.path}`)
			.then(code => {
				if(this.installationStopped) {
					return;
				}

				require.register(`/node_modules/npi/${this.name}/${file.path}`, code);
				io.writeLine("Installed " + file.path);
			});
	}
};

module.exports = Package;