var m68000dasm = require('../m68000dasm.js'),
	Memory = require('../memory.js'),
	assert = require('assert');

var dasm = new m68000dasm(new Memory(256, 0));

var bin = function (b) {
	return parseInt(b.split(' ').join(''), 2);
}

describe('m68000', function () {

	describe('#disassemble()', function () {

		it('disassembles all possible addressing mode combinations <ea> + Dn → Dn', function() {

			// byte size
			dasm.memory.setInt16(1, bin('1101 101 000 000 100'));
			assert.equal(dasm.disassemble(1), 'ADD D4,D5');

			dasm.memory.setInt16(2, bin('1101 101 000 001 100'));
			assert.equal(dasm.disassemble(2), 'ADD A4,D5');

			dasm.memory.setInt16(3, bin('1101 001 000 010 110'));
			assert.equal(dasm.disassemble(3), 'ADD (A6),D1');

			dasm.memory.setInt16(4, bin('1101 001 000 011 111'));
			assert.equal(dasm.disassemble(4), 'ADD (A7)+,D1');

			dasm.memory.setInt16(5, bin('1101 101 000 100 011'));
			assert.equal(dasm.disassemble(5), 'ADD -(A3),D5');

			dasm.memory.setInt32(6, bin('1101 000 000 101 010  01110001 11110011'));
			assert.equal(dasm.disassemble(6), 'ADD (29171,A2),D0');
			dasm.memory.setInt32(7, bin('1101 001 000 101 110  11111111 11110000'));
			assert.equal(dasm.disassemble(7), 'ADD (-16,A6),D1');

			dasm.memory.setInt32(8, bin('1101 100 000 110 010  00000001 01111111'));
			assert.equal(dasm.disassemble(8), 'ADD (127,A2,X1),D4');
			dasm.memory.setInt32(9, bin('1101 100 000 110 010  00000110 10000000'));
			assert.equal(dasm.disassemble(9), 'ADD (-128,A2,X6),D4');

			dasm.memory.setInt32(0, bin('1101 110 000 111 000  00010110 10000000'));
			assert.equal(dasm.disassemble(0), 'ADD (5760).W,D6');
			dasm.memory.setInt32(0, bin('1101 110 000 111 000  10000000 00000000'));
			assert.equal(dasm.disassemble(0), 'ADD (-32768).W,D6');

			dasm.memory.setInt16(1, bin('1101 100 000 111 001'));
			dasm.memory.setInt32(3, bin('0100000000000000 0000000000000000'));
			assert.equal(dasm.disassemble(1), 'ADD (1073741824).L,D4');

			dasm.memory.setInt32(1, bin('1101 101 000 111 100 11001111 00001111'));
			assert.equal(dasm.disassemble(1), 'ADD #15,D5');

			dasm.memory.setInt32(8, bin('1101 100 000 111 010  00000001 01111111'));
			assert.equal(dasm.disassemble(8), 'ADD (383,PC),D4');

			dasm.memory.setInt32(9, bin('1101 100 000 111 011  00000110 10000000'));
			assert.equal(dasm.disassemble(9), 'ADD (-128,PC,X6),D4');

			// word size
			dasm.memory.setInt16(1, bin('1101 101 001 000 100'));
			assert.equal(dasm.disassemble(1), 'ADD.W D4,D5');

			dasm.memory.setInt16(2, bin('1101 101 001 001 100'));
			assert.equal(dasm.disassemble(2), 'ADD.W A4,D5');

			dasm.memory.setInt16(3, bin('1101 001 001 010 110'));
			assert.equal(dasm.disassemble(3), 'ADD.W (A6),D1');

			dasm.memory.setInt16(4, bin('1101 001 001 011 111'));
			assert.equal(dasm.disassemble(4), 'ADD.W (A7)+,D1');

			dasm.memory.setInt16(5, bin('1101 101 001 100 011'));
			assert.equal(dasm.disassemble(5), 'ADD.W -(A3),D5');

			dasm.memory.setInt32(6, bin('1101 000 001 101 010  01110001 11110011'));
			assert.equal(dasm.disassemble(6), 'ADD.W (29171,A2),D0');
			dasm.memory.setInt32(7, bin('1101 001 001 101 110  11111111 11110000'));
			assert.equal(dasm.disassemble(7), 'ADD.W (-16,A6),D1');

			dasm.memory.setInt32(8, bin('1101 100 001 110 010  00000001 01111111'));
			assert.equal(dasm.disassemble(8), 'ADD.W (127,A2,X1),D4');
			dasm.memory.setInt32(9, bin('1101 100 001 110 010  00000110 10000000'));
			assert.equal(dasm.disassemble(9), 'ADD.W (-128,A2,X6),D4');

			dasm.memory.setInt32(0, bin('1101 110 001 111 000  00010110 10000000'));
			assert.equal(dasm.disassemble(0), 'ADD.W (5760).W,D6');
			dasm.memory.setInt32(0, bin('1101 110 001 111 000  10000000 00000000'));
			assert.equal(dasm.disassemble(0), 'ADD.W (-32768).W,D6');

			dasm.memory.setInt16(1, bin('1101 100 001 111 001'));
			dasm.memory.setInt32(3, bin('0100000000000000 0000000000000000'));
			assert.equal(dasm.disassemble(1), 'ADD.W (1073741824).L,D4');

			dasm.memory.setInt32(1, bin('1101 101 001 111 100 00001111 00001111'));
			assert.equal(dasm.disassemble(1), 'ADD.W #3855,D5');

			dasm.memory.setInt32(8, bin('1101 100 001 111 010  00000001 01111111'));
			assert.equal(dasm.disassemble(8), 'ADD.W (383,PC),D4');

			dasm.memory.setInt32(9, bin('1101 100 001 111 011  00000110 10000000'));
			assert.equal(dasm.disassemble(9), 'ADD.W (-128,PC,X6),D4');

			// long size
			dasm.memory.setInt16(1, bin('1101 101 010 000 100'));
			assert.equal(dasm.disassemble(1), 'ADD.L D4,D5');

			dasm.memory.setInt16(2, bin('1101 101 010 001 100'));
			assert.equal(dasm.disassemble(2), 'ADD.L A4,D5');

			dasm.memory.setInt16(3, bin('1101 001 010 010 110'));
			assert.equal(dasm.disassemble(3), 'ADD.L (A6),D1');

			dasm.memory.setInt16(4, bin('1101 001 010 011 111'));
			assert.equal(dasm.disassemble(4), 'ADD.L (A7)+,D1');

			dasm.memory.setInt16(5, bin('1101 101 010 100 011'));
			assert.equal(dasm.disassemble(5), 'ADD.L -(A3),D5');

			dasm.memory.setInt32(6, bin('1101 000 010 101 010  01110001 11110011'));
			assert.equal(dasm.disassemble(6), 'ADD.L (29171,A2),D0');
			dasm.memory.setInt32(7, bin('1101 001 010 101 110  11111111 11110000'));
			assert.equal(dasm.disassemble(7), 'ADD.L (-16,A6),D1');

			dasm.memory.setInt32(8, bin('1101 100 010 110 010  00000001 01111111'));
			assert.equal(dasm.disassemble(8), 'ADD.L (127,A2,X1),D4');
			dasm.memory.setInt32(9, bin('1101 100 010 110 010  00000110 10000000'));
			assert.equal(dasm.disassemble(9), 'ADD.L (-128,A2,X6),D4');

			dasm.memory.setInt32(0, bin('1101 110 010 111 000  00010110 10000000'));
			assert.equal(dasm.disassemble(0), 'ADD.L (5760).W,D6');
			dasm.memory.setInt32(0, bin('1101 110 010 111 000  10000000 00000000'));
			assert.equal(dasm.disassemble(0), 'ADD.L (-32768).W,D6');

			dasm.memory.setInt16(1, bin('1101 100 010 111 001'));
			dasm.memory.setInt32(3, bin('0100000000000000 0000000000000000'));
			assert.equal(dasm.disassemble(1), 'ADD.L (1073741824).L,D4');

			dasm.memory.setInt16(1, bin('1101 101 010 111 100'));
			dasm.memory.setInt32(3, bin('0100000000000000 0000000000000000'));
			assert.equal(dasm.disassemble(1), 'ADD.L #1073741824,D5');

			dasm.memory.setInt32(8, bin('1101 100 010 111 010  00000001 01111111'));
			assert.equal(dasm.disassemble(8), 'ADD.L (383,PC),D4');

			dasm.memory.setInt32(9, bin('1101 100 010 111 011  00000110 10000000'));
			assert.equal(dasm.disassemble(9), 'ADD.L (-128,PC,X6),D4');
		});

		it('disassembles all possible addressing mode combinations Dn + <ea> → <ea>', function() {

			// byte size
			dasm.memory.setInt16(3, bin('1101 001 100 010 110'));
			assert.equal(dasm.disassemble(3), 'ADD D1,(A6)');

			dasm.memory.setInt16(4, bin('1101 001 100 011 111'));
			assert.equal(dasm.disassemble(4), 'ADD D1,(A7)+');

			dasm.memory.setInt16(5, bin('1101 101 100 100 011'));
			assert.equal(dasm.disassemble(5), 'ADD D5,-(A3)');

			dasm.memory.setInt32(6, bin('1101 000 100 101 010  01110001 11110011'));
			assert.equal(dasm.disassemble(6), 'ADD D0,(29171,A2)');
			dasm.memory.setInt32(7, bin('1101 001 100 101 110  11111111 11110000'));
			assert.equal(dasm.disassemble(7), 'ADD D1,(-16,A6)');

			dasm.memory.setInt32(8, bin('1101 100 100 110 010  00000001 01111111'));
			assert.equal(dasm.disassemble(8), 'ADD D4,(127,A2,X1)');
			dasm.memory.setInt32(9, bin('1101 100 100 110 010  00000110 10000000'));
			assert.equal(dasm.disassemble(9), 'ADD D4,(-128,A2,X6)');

			dasm.memory.setInt32(0, bin('1101 110 100 111 000  00010110 10000000'));
			assert.equal(dasm.disassemble(0), 'ADD D6,(5760).W');
			dasm.memory.setInt32(0, bin('1101 110 100 111 000  10000000 00000000'));
			assert.equal(dasm.disassemble(0), 'ADD D6,(-32768).W');

			dasm.memory.setInt16(1, bin('1101 100 100 111 001'));
			dasm.memory.setInt32(3, bin('0100000000000000 0000000000000000'));
			assert.equal(dasm.disassemble(1), 'ADD D4,(1073741824).L');

			// word size
			dasm.memory.setInt16(3, bin('1101 001 101 010 110'));
			assert.equal(dasm.disassemble(3), 'ADD.W D1,(A6)');

			dasm.memory.setInt16(4, bin('1101 001 101 011 111'));
			assert.equal(dasm.disassemble(4), 'ADD.W D1,(A7)+');

			dasm.memory.setInt16(5, bin('1101 101 101 100 011'));
			assert.equal(dasm.disassemble(5), 'ADD.W D5,-(A3)');

			dasm.memory.setInt32(6, bin('1101 000 101 101 010  01110001 11110011'));
			assert.equal(dasm.disassemble(6), 'ADD.W D0,(29171,A2)');
			dasm.memory.setInt32(7, bin('1101 001 101 101 110  11111111 11110000'));
			assert.equal(dasm.disassemble(7), 'ADD.W D1,(-16,A6)');

			dasm.memory.setInt32(8, bin('1101 100 101 110 010  00000001 01111111'));
			assert.equal(dasm.disassemble(8), 'ADD.W D4,(127,A2,X1)');
			dasm.memory.setInt32(9, bin('1101 100 101 110 010  00000110 10000000'));
			assert.equal(dasm.disassemble(9), 'ADD.W D4,(-128,A2,X6)');

			dasm.memory.setInt32(0, bin('1101 110 101 111 000  00010110 10000000'));
			assert.equal(dasm.disassemble(0), 'ADD.W D6,(5760).W');
			dasm.memory.setInt32(0, bin('1101 110 101 111 000  10000000 00000000'));
			assert.equal(dasm.disassemble(0), 'ADD.W D6,(-32768).W');

			dasm.memory.setInt16(1, bin('1101 100 101 111 001'));
			dasm.memory.setInt32(3, bin('0100000000000000 0000000000000000'));
			assert.equal(dasm.disassemble(1), 'ADD.W D4,(1073741824).L');

			// long size
			dasm.memory.setInt16(3, bin('1101 001 110 010 110'));
			assert.equal(dasm.disassemble(3), 'ADD.L D1,(A6)');

			dasm.memory.setInt16(4, bin('1101 001 110 011 111'));
			assert.equal(dasm.disassemble(4), 'ADD.L D1,(A7)+');

			dasm.memory.setInt16(5, bin('1101 101 110 100 011'));
			assert.equal(dasm.disassemble(5), 'ADD.L D5,-(A3)');

			dasm.memory.setInt32(6, bin('1101 000 110 101 010  01110001 11110011'));
			assert.equal(dasm.disassemble(6), 'ADD.L D0,(29171,A2)');
			dasm.memory.setInt32(7, bin('1101 001 110 101 110  11111111 11110000'));
			assert.equal(dasm.disassemble(7), 'ADD.L D1,(-16,A6)');

			dasm.memory.setInt32(8, bin('1101 100 110 110 010  00000001 01111111'));
			assert.equal(dasm.disassemble(8), 'ADD.L D4,(127,A2,X1)');
			dasm.memory.setInt32(9, bin('1101 100 110 110 010  00000110 10000000'));
			assert.equal(dasm.disassemble(9), 'ADD.L D4,(-128,A2,X6)');

			dasm.memory.setInt32(0, bin('1101 110 110 111 000  00010110 10000000'));
			assert.equal(dasm.disassemble(0), 'ADD.L D6,(5760).W');
			dasm.memory.setInt32(0, bin('1101 110 110 111 000  10000000 00000000'));
			assert.equal(dasm.disassemble(0), 'ADD.L D6,(-32768).W');

			dasm.memory.setInt16(1, bin('1101 100 110 111 001'));
			dasm.memory.setInt32(3, bin('0100000000000000 0000000000000000'));
			assert.equal(dasm.disassemble(1), 'ADD.L D4,(1073741824).L');

		});

		it('disassembles ABCD', function () {
			dasm.memory.setInt16(1, bin('1100 111 10000 0 100'));
			assert.equal(dasm.disassemble(1), 'ABCD D4,D7');

			dasm.memory.setInt16(2, bin('1100 111 10000 1 101'));
			assert.equal(dasm.disassemble(2), 'ABCD -(A5),-(A7)');
		});

		it('disassembles ADD', function () {
			dasm.memory.setInt16(1, bin('1101 111 000 000 101'));
			assert.equal(dasm.disassemble(1), 'ADD D5,D7');
		});

		it('disassembles ADDA', function () {
			dasm.memory.setInt16(1, bin('1101 111 011 000 101'));
			assert.equal(dasm.disassemble(1), 'ADDA.W D5,A7');

			dasm.memory.setInt16(1, bin('1101 111 111 111 001'));
			dasm.memory.setInt32(3, bin('0100000000000000 0000000000000000'));
			assert.equal(dasm.disassemble(1), 'ADDA.L (1073741824).L,A7');
		});

		it('disassembles ADDI', function () {
			dasm.memory.setInt32(9, bin('00000110 00 000 101  11111111 00000001'));
			assert.equal(dasm.disassemble(9), 'ADDI #1,D5');

			dasm.memory.setInt32(9, bin('00000110 01 000 101  11111111 00000001'));
			assert.equal(dasm.disassemble(9), 'ADDI.W #-255,D5');

			dasm.memory.setInt16(7, bin('00000110 10 000 111'));
			dasm.memory.setInt32(9, bin('000001100 1000101 11111111 00000001'));
			assert.equal(dasm.disassemble(7), 'ADDI.L #105250561,D7');
		});

		it('disassembles ADDQ', function () {
			dasm.memory.setInt16(9, bin('0101 111 0 00 000 101'));
			assert.equal(dasm.disassemble(9), 'ADDQ #7,D5');

			dasm.memory.setInt16(1, bin('0101 101 0 01 000 001'));
			assert.equal(dasm.disassemble(1), 'ADDQ.W #5,D1');

			dasm.memory.setInt32(9, bin('0101 010 0 10 110 111  00000101 01000000'));
			assert.equal(dasm.disassemble(9), 'ADDQ.L #2,(64,A7,X5)');
		});

		it('disassembles ADDX', function () {
			dasm.memory.setInt16(9, bin('1101 001 1 00 00 0 010'));
			assert.equal(dasm.disassemble(9), 'ADDX D2,D1');

			dasm.memory.setInt16(9, bin('1101 011 1 01 00 0 100'));
			assert.equal(dasm.disassemble(9), 'ADDX.W D4,D3');

			dasm.memory.setInt16(9, bin('1101 110 1 10 00 0 101'));
			assert.equal(dasm.disassemble(9), 'ADDX.L D5,D6');

			dasm.memory.setInt16(0, bin('1101 001 1 00 00 1 010'));
			assert.equal(dasm.disassemble(0), 'ADDX -(A2),-(A1)');

			dasm.memory.setInt16(0, bin('1101 011 1 01 00 1 100'));
			assert.equal(dasm.disassemble(0), 'ADDX.W -(A4),-(A3)');

			dasm.memory.setInt16(0, bin('1101 110 1 10 00 1 101'));
			assert.equal(dasm.disassemble(0), 'ADDX.L -(A5),-(A6)');
		});


	});

});