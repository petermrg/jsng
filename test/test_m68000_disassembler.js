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

            dasm.memory.setInt32(9, bin('00000110 01 100 101  11111111 00000001'));
            assert.equal(dasm.disassemble(9), 'ADDI.W #-255,-(A5)');

            dasm.memory.setInt16(7, bin('00000110 10 011 111'));
            dasm.memory.setInt32(9, bin('000001100 1000101 11111111 00000001'));
            assert.equal(dasm.disassemble(7), 'ADDI.L #105250561,(A7)+');
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

        it('disassembles AND', function () {
            dasm.memory.setInt16(1, bin('1100 111 000 010 010'));
            assert.equal(dasm.disassemble(1), 'AND (A2),D7');

            dasm.memory.setInt16(1, bin('1100 111 001 011 010'));
            assert.equal(dasm.disassemble(1), 'AND.W (A2)+,D7');

            dasm.memory.setInt16(1, bin('1100 111 010 100 011'));
            assert.equal(dasm.disassemble(1), 'AND.L -(A3),D7');

            dasm.memory.setInt32(1, bin('1100 111 100 101 110  01000000 00000001'));
            assert.equal(dasm.disassemble(1), 'AND D7,(16385,A6)');

            dasm.memory.setInt16(1, bin('1100 111 101 010 010'));
            assert.equal(dasm.disassemble(1), 'AND.W D7,(A2)');

            dasm.memory.setInt16(1, bin('1100 111 110 010 010'));
            assert.equal(dasm.disassemble(1), 'AND.L D7,(A2)');
        });

        it('disassembles ANDI', function () {
            dasm.memory.setInt32(9, bin('00000010 00 000 101  11111111 00000001'));
            assert.equal(dasm.disassemble(9), 'ANDI #1,D5');

            dasm.memory.setInt32(9, bin('00000010 01 100 101  11111111 00000001'));
            assert.equal(dasm.disassemble(9), 'ANDI.W #-255,-(A5)');

            dasm.memory.setInt16(7, bin('00000010 10 010 111'));
            dasm.memory.setInt32(9, bin('000001100 1000101 11111111 00000001'));
            assert.equal(dasm.disassemble(7), 'ANDI.L #105250561,(A7)');
        });

        it('disassembles ANDI to CCR', function () {
            dasm.memory.setInt32(9, bin('00000010 00111100 00000000 00000001'));
            assert.equal(dasm.disassemble(9), 'ANDI #1,CCR');
        });

        it('disassembles ASL', function () {
            dasm.memory.setInt16(9, bin('1110 001 1 00 1 00 010'));
            assert.equal(dasm.disassemble(9), 'ASL D1,D2');

            dasm.memory.setInt16(9, bin('1110 101 1 01 0 00 110'));
            assert.equal(dasm.disassemble(9), 'ASL.W #5,D6');

            dasm.memory.setInt16(9, bin('1110 101 1 10 0 00 110'));
            assert.equal(dasm.disassemble(9), 'ASL.L #5,D6');

            dasm.memory.setInt16(9, bin('1110 000 1 11 010 110'));
            assert.equal(dasm.disassemble(9), 'ASL (A6)');

            dasm.memory.setInt16(9, bin('1110 000 1 11 100 110'));
            assert.equal(dasm.disassemble(9), 'ASL -(A6)');
        });

        it('disassembles ASR', function () {
            dasm.memory.setInt16(0, bin('1110 001 1 00 1 00 010'));
            assert.equal(dasm.disassemble(0), 'ASL D1,D2');

            dasm.memory.setInt16(0, bin('1110 101 1 01 0 00 110'));
            assert.equal(dasm.disassemble(0), 'ASL.W #5,D6');

            dasm.memory.setInt16(0, bin('1110 101 1 10 0 00 110'));
            assert.equal(dasm.disassemble(0), 'ASL.L #5,D6');

            dasm.memory.setInt16(0, bin('1110 000 1 11 010 110'));
            assert.equal(dasm.disassemble(0), 'ASL (A6)');

            dasm.memory.setInt16(0, bin('1110 000 1 11 100 110'));
            assert.equal(dasm.disassemble(0), 'ASL -(A6)');
        });

        it('dissasembles Bcc (with all possible condition codes)', function() {
            dasm.memory.setInt16(0, bin('0110 0100 10000001'));
            assert.equal(dasm.disassemble(0), 'BCC *-127');

            dasm.memory.setInt32(0, bin('0110 0101 00000000  00000001 10000000'));
            assert.equal(dasm.disassemble(0), 'BCS *+384');

            dasm.memory.setInt16(0, bin('0110 0111 10000001'));
            assert.equal(dasm.disassemble(0), 'BEQ *-127');

            dasm.memory.setInt32(0, bin('0110 1100 00000000  10000001 10000001'));
            assert.equal(dasm.disassemble(0), 'BGE *-32383');

            dasm.memory.setInt16(0, bin('0110 1110 10000001'));
            assert.equal(dasm.disassemble(0), 'BGT *-127');

            dasm.memory.setInt32(0, bin('0110 0010 00000000  00000001 10000000'));
            assert.equal(dasm.disassemble(0), 'BHI *+384');

            dasm.memory.setInt16(0, bin('0110 1111 10000001'));
            assert.equal(dasm.disassemble(0), 'BLE *-127');

            dasm.memory.setInt32(0, bin('0110 0011 00000000  00000001 10000000'));
            assert.equal(dasm.disassemble(0), 'BLS *+384');

            dasm.memory.setInt16(0, bin('0110 1101 10000001'));
            assert.equal(dasm.disassemble(0), 'BLT *-127');

            dasm.memory.setInt32(0, bin('0110 1011 00000000  00000001 10000000'));
            assert.equal(dasm.disassemble(0), 'BMI *+384');

            dasm.memory.setInt16(0, bin('0110 0110 10000001'));
            assert.equal(dasm.disassemble(0), 'BNE *-127');

            dasm.memory.setInt32(0, bin('0110 1010 00000000  00000001 10000000'));
            assert.equal(dasm.disassemble(0), 'BPL *+384');

            dasm.memory.setInt16(0, bin('0110 1000 10000001'));
            assert.equal(dasm.disassemble(0), 'BVC *-127');

            dasm.memory.setInt32(0, bin('0110 1001 00000000  00000001 10000000'));
            assert.equal(dasm.disassemble(0), 'BVS *+384');
        });

        it('disassembles BCHG', function() {
            dasm.memory.setInt16(0, bin('0000 111 101 000 100'));
            assert.equal(dasm.disassemble(0), 'BCHG D7,D4');

            dasm.memory.setInt32(0, bin('0000 100001 010 100  0000 0000 0000 1010'));
            assert.equal(dasm.disassemble(0), 'BCHG #10,(A4)');
        });

        it('disassembles BCLR', function() {
            dasm.memory.setInt16(0, bin('0000 111 110 000 101'));
            assert.equal(dasm.disassemble(0), 'BCLR D7,D5');

            dasm.memory.setInt32(0, bin('0000 100010 010 110  0000 0000 0000 1001'));
            assert.equal(dasm.disassemble(0), 'BCLR #9,(A6)');
        });

        it('dissasembles BRA', function() {
            dasm.memory.setInt16(0, bin('0110 0000 10000001'));
            assert.equal(dasm.disassemble(0), 'BRA *-127');

            dasm.memory.setInt32(0, bin('0110 0000 00000000  11000001 10000011'));
            assert.equal(dasm.disassemble(0), 'BRA *-15997');
        });

        it('disassembles BSET', function() {
            dasm.memory.setInt16(0, bin('0000 111 111 000 101'));
            assert.equal(dasm.disassemble(0), 'BSET D7,D5');

            dasm.memory.setInt32(0, bin('0000 100011 010 110  0000 0000 0000 1001'));
            assert.equal(dasm.disassemble(0), 'BSET #9,(A6)');
        });

        it('dissasembles BSR', function() {
            dasm.memory.setInt16(0, bin('0110 0001 10000001'));
            assert.equal(dasm.disassemble(0), 'BSR *-127');

            dasm.memory.setInt32(0, bin('0110 0001 00000000  01000001 10000011'));
            assert.equal(dasm.disassemble(0), 'BSR *+16771');
        });

        it('disassembles BTST', function() {
            dasm.memory.setInt16(0, bin('0000 111 100 000 101'));
            assert.equal(dasm.disassemble(0), 'BTST D7,D5');

            dasm.memory.setInt32(0, bin('0000 100000 010 110  0000 0000 0000 1001'));
            assert.equal(dasm.disassemble(0), 'BTST #9,(A6)');
        });

        it('disassembles CHK', function() {
            dasm.memory.setInt16(5, bin('0100 111 110 000 101'));
            assert.equal(dasm.disassemble(5), 'CHK D5,D7');
        });

        it('disassembles CLR', function() {
            dasm.memory.setInt16(5, bin('0100 0010 00 000 111'));
            assert.equal(dasm.disassemble(5), 'CLR D7');

            dasm.memory.setInt16(5, bin('0100 0010 01 000 110'));
            assert.equal(dasm.disassemble(5), 'CLR.W D6');

            dasm.memory.setInt16(5, bin('0100 0010 10 000 101'));
            assert.equal(dasm.disassemble(5), 'CLR.L D5');
        });

        it('dissasembles CPM', function() {
            dasm.memory.setInt16(5, bin('1011 111 000 000 101'));
            assert.equal(dasm.disassemble(5), 'CMP D5,D7');

            dasm.memory.setInt16(5, bin('1011 111 001 010 101'));
            assert.equal(dasm.disassemble(5), 'CMP.W (A5),D7');

            dasm.memory.setInt16(5, bin('1011 111 010 001 101'));
            assert.equal(dasm.disassemble(5), 'CMP.L A5,D7');
        });

        it('dissasembles CPMA', function() {
            dasm.memory.setInt16(5, bin('1011 111 011 010 101'));
            assert.equal(dasm.disassemble(5), 'CMPA.W (A5),D7');

            dasm.memory.setInt16(5, bin('1011 111 111 001 101'));
            assert.equal(dasm.disassemble(5), 'CMPA.L A5,D7');
        });

        it('dissasembles CMPI', function() {
            dasm.memory.setInt32(9, bin('00001100 00 000 101  11111111 00000001'));
            assert.equal(dasm.disassemble(9), 'CMPI #1,D5');

            dasm.memory.setInt32(9, bin('00001100 01 100 101  11111111 00000001'));
            assert.equal(dasm.disassemble(9), 'CMPI.W #-255,-(A5)');

            dasm.memory.setInt16(7, bin('00001100 10 010 111'));
            dasm.memory.setInt32(9, bin('000001100 1000101 11111111 00000001'));
            assert.equal(dasm.disassemble(7), 'CMPI.L #105250561,(A7)');
        });
    });

});