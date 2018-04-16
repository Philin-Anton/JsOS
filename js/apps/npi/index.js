// JsOS/NPI
// By Ivanq

'use strict';

function main(args, api, res) {
	const io = api.stdio;

	if(args == "" || args == "help") {
		io.setColor("yellow");
		io.writeLine("JsOS/NPI - No Problem Installer");
		io.writeLine("Commands:");
		io.writeLine("help      Show command or subcommand help");
		return res(0);
	} else {
		io.setColor("red");
		io.writeLine("Unknown command");
		return res(1);
	}
}

exports.call = (cmd, args, api, res) => main(args, api, res);

exports.commands = ["npi"];