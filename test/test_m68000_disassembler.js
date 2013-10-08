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
			assert.deepEqual(m68k.disassemble(1), { bytes: 2, str: 'ABCD D4, D7' });

			m68k.memory.setInt16(2, bin('1100 111 10000 1 101'));
			assert.deepEqual(m68k.disassemble(2), { bytes: 2, str: 'ABCD -(A5), -(A7)' });
		});

	});

});