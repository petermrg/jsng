var m68000dasm = require('./m68000dasm.js'),
    m68000 = require('./m68000.js'),
    Memory = require('./memory.js'),
    fs = require('fs');

var instruction = function() {

}


var m68000emu = function(cpu) {

}

m68000emu.prototype.memWrite = function() {

}

m68000emu.prototype.memRead = function() {

}

var memoryMap = {
    program: { start: 0x000000, end: 0x0FFFFF }
    ram    : { start: 0x100000, end: 0x10FFFF }
    system : { start: 0xC00000, end: 0xC1FFFF }
}

var systemROM = new Memory(memoryMap.end - memoryMap.start + 1);

fs.readFileSync('./bin/bios/sp-e.sp1');

var cpu = new m68000(mem);
var e = new m68000emu(cpu);

