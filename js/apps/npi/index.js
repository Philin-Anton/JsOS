// JsOS/NPI
// By Ivanq

'use strict';

function main(args, api, res) {
	const io = api.stdio;

	args = args.split(/\s+/);
	let cmd = args.shift();

	if(cmd == "" || cmd == "help") {
		io.setColor("yellow");
		io.writeLine("JsOS/NPI - No Problem Installer");
		io.writeLine("Commands:");
		io.writeLine("help      Show command or subcommand help");
		io.writeLine("info      Show package info");
		return res(0);
	} else if(cmd == "info") {
		io.setColor("magenta");
		io.writeLine("npi info not implemented");
		return res(1);
	} else {
		io.setColor("red");
		io.writeLine("Unknown command");
		return res(1);
	}
}

exports.call = (cmd, args, api, res) => main(args, api, res);

exports.commands = ["npi"];