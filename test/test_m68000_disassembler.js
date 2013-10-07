var m68000 = require('../m68000.js'),
	m68k = new m68000(),
	assert = require('assert');

var bin = function (b) {
	return parseInt(b.split(' ').join(''), 2);
}

describe('m68000', function () {

	describe('#disassemble()', function () {

		it('disassembles ABCD', function () {
			assert.equal(m68k.disassemble(bin('1100 111 10000 0 000')), 'ABCD D0, D7');
			assert.equal(m68k.disassemble(bin('1100 111 10000 1 101')), 'ABCD -(A5), -(A7)');
		});

	});

});