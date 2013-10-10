var m68000 = require('../m68000.js'),
	Memory = require('../memory.js'),
	assert = require('assert');

var m68k = new m68000(new Memory(256, 0));

var bin = function (b) {
	return parseInt(b.split(' ').join(''), 2);
}

describe('m68000', function () {

	describe('#disassemble()', function () {

		it('disassembles ABCD', function () {
			m68k.memory.setInt16(1, bin('1100 111 10000 0 100'));
			assert.equal(m68k.disassemble(1), 'ABCD D4, D7');

			m68k.memory.setInt16(2, bin('1100 111 10000 1 101'));
			assert.equal(m68k.disassemble(2), 'ABCD -(A5), -(A7)');
		});

		it('disassembles ADD', function () {
			m68k.memory.setInt16(1, bin('1101 111 000 000 101'));
			assert.equal(m68k.disassemble(1), 'ADD D5, D7');
		});

		it('disassembles all possible addressing mode combinations', function() {
			m68k.memory.setInt16(1, bin('1101 101 000 000 100'));
			assert.equal(m68k.disassemble(1), 'ADD D4, D5');

			m68k.memory.setInt16(2, bin('1101 101 000 001 100'));
			assert.equal(m68k.disassemble(2), 'ADD A4, D5');

			m68k.memory.setInt16(3, bin('1101 001 000 010 110'));
			assert.equal(m68k.disassemble(3), 'ADD (A6), D1');

			m68k.memory.setInt16(4, bin('1101 001 000 011 111'));
			assert.equal(m68k.disassemble(4), 'ADD (A7)+, D1');

			m68k.memory.setInt16(5, bin('1101 101 000 100 011'));
			assert.equal(m68k.disassemble(5), 'ADD -(A3), D5');

			m68k.memory.setInt32(6, bin('1101 000 000 101 010  01110001 11110011'));
			assert.equal(m68k.disassemble(6), 'ADD (29171,A2), D0');

			m68k.memory.setInt32(7, bin('1101 001 000 101 110  11111111 11110000'));
			assert.equal(m68k.disassemble(7), 'ADD (-16,A6), D1');

			m68k.memory.setInt32(8, bin('1101 000 000 110 010'));
			assert.equal(m68k.disassemble(8), 'ADD (-16,A2), D0');

		});

	});

});