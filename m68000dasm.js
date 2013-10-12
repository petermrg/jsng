var SIZES = ['', '.W', '.L'];

/**
 * Motorola 68000 disassembler
 *
 * @param  {Memory} memory
 */
m68000dasm = function(memory) {
	this.memory = memory;
	this.pointer = 0;
}

/**
 * Dissasemble instruction at address
 *
 * @param  {integer} address
 * @return {string}  instruction
 */
m68000dasm.prototype.disassemble = function (address) {
	this.pointer = (arguments.length == 1) ? address : this.pointer;
	var instruction = this.memory.getUint16(address);
	this.pointer+= 2;

	var opcode = (instruction >> 12) & 0x0F,
		opcode2,
		rx, ry, opmode, mode, result, size, data, bit;

	switch (opcode) {

		// 0000 Bit Manipulation/MOVEP/Immediate
		case 0:
			opcode2 = (instruction >> 8) & 0x0F;
			switch (opcode2) {
				case 6:
					// ADDI: Add Immediate; Immediate Data + Destination → Destination (p.113)
					size = (instruction >> 6) & 0x03;
					mode = (instruction >> 3) & 0x01;
					rx = instruction & 0x07;
					data = this.getImmediateData(size);
					return 'ADDI' + SIZES[size] + ' #' + data + ',' + this.getEffectiveAddress(mode, rx, size);
				default:
					throw Error('Unknown instruction');
			}
			break;

		// 0001 Move Byte
		// 0010 Move Long
		// 0011 Move Word
		// 0100 Miscellaneous

		// 0101 ADDQ/SUBQ/Scc/DBcc/TRAPc c
		case 5:
			data = (instruction >> 9) & 0x07;
			size = (instruction >> 6) & 0x03;
			bit = (instruction >> 8) & 0x01;
			mode = (instruction >> 3) & 0x01;
			rx = instruction & 0x07;
			if (bit == 0) {
				// ADDQ: Add Quick; Immediate Data + Destination → Destination (p.115)

			} else {
				throw Error('Wrong bit value');
			}
			break;

		// 0110 Bcc/BSR/BRA
		// 0111 MOVEQ
		// 1000 OR/DIV/SBCD
		// 1001 SUB/SUBX
		// 1010 (Unassigned, Reserved)
		// 1011 CMP/EOR

		// 1100 AND/MUL/ABCD/EXG
		case 12:
			if (((instruction >> 4) & 0x1F) == 0x10) {
				// ABCD: Add Decimal with Extend; Source10 + Destination10 + X → Destination (p.106)
				rx = (instruction >> 9) & 0x07;
				ry = instruction & 0x07;
				mode = (instruction >> 3) & 0x01;
				if (mode == 0) {
					return 'ABCD D' + ry + ',D' + rx;
				} else {
					return 'ABCD -(A' + ry + '),-(A' + rx + ')';
				}
			}
			break;

		// 1101 ADD/ADDX
		case 13:
			rx = (instruction >> 9) & 0x07;
			opmode = (instruction >> 6) & 0x07;
			mode = (instruction >> 3) & 0x07;
			ry = instruction & 0x07;
			size = opmode & 0x3;
			if (size < 3) {
				// ADD: Add; Source + Destination → Destination (p.108)
				result = 'ADD' + SIZES[size] + ' ';
				if (opmode < 4) {
					result+= this.getEffectiveAddress(mode, ry, size)+',D'+rx;
				} else {
					result+= 'D' + rx + ',' + this.getEffectiveAddress(mode, ry, size);
				}
				return result;
			} else {
				// ADDA: Add Address; Source + Destination → Destination (p.111)
				result = 'ADDA.' + ((opmode == 3) ? 'W' : 'L');
				return result + ' ' + this.getEffectiveAddress(mode, ry, size) + ',A' + rx;

			}
			break;

		// 1110 Shift/Rotate/Bit Field
		// 1111 Coprocessor Interface/MC68040 and CPU32 Extensions

	}
	throw Error('Unknown instruction opcode');
}

// var signExtendNibble = function(n) {
// 	return (n < 8) n : (n - 16);
// }

/**
 * Get effective address
 *
 * @param  {integer} mode Mode field in effective addres instruction part (0..7)
 * @param  {integer} reg  Register field in effective addres instruction part (0..7)
 * @param  {integer} size Size field in instruction (0: byte, 1: word, 2: long)
 * @return {string}
 */
m68000dasm.prototype.getEffectiveAddress = function (mode, reg, size) {
	var d, i;
	switch (mode) {

		// Data Register Direct Mode (p.46)
		case 0:
			return 'D'+reg;

		// Address Register Direct Mode  (p.46)
		case 1:
			return 'A'+reg;

		// Address Register Indirect Mode  (p.46)
		case 2:
			return '(A'+reg+')';

		// Address Register Indirect with Postincrement Mode (p.47)
		case 3:
			return '(A'+reg+')+';

		// Address Register Indirect with Predecrement Mode (p.48)
		case 4:
			return '-(A'+reg+')';

		/* Address Register Indirect with Displacement Mode (1 extension word: xn and displ) (p.49)
		In the address register indirect with displacement mode, the operand is in memory. The sum
		of the address in the address register, which the effective address specifies, plus the sign-
		extended 16-bit displacement integer in the extension word is the operand’s address in
		memory. */
		case 5:
			d = this.memory.getInt16(this.pointer);
			this.pointer+= 2;
			return '('+d+',A'+reg+')';

		/* Address Register Indirect with Index (8-Bit Displacement) (1 extension word) Mode (p.50)
		This addressing mode requires one extension word that contains an index register indicator
		and an 8-bit displacement. The index register indicator includes size and scale information.
		In this mode, the operand is in memory. The operand’s address is the sum of the address
		register’s contents; the sign-extended displacement value in the extension word’s low-order
		eight bits; and the index register’s sign-extended contents (possibly scaled). The user must
		specify the address register, the displacement, and the index register in this mode. */
		case 6:
			i = this.memory.getInt8(this.pointer) & 0x7;
			this.pointer+= 1;
			d = this.memory.getInt8(this.pointer);
			this.pointer+= 1;
			return '('+d+',A'+reg+',X'+i+')';

		case 7:
			switch (reg) {
				// Absolute Short Addressing Mode (p.59)
				case 0:
					d = this.memory.getInt16(this.pointer);
					this.pointer+= 2;
					return '('+d+').W';

				// Absolute Short Addressing Mode (p.59)
				case 1:
					d = this.memory.getUint32(this.pointer);
					this.pointer+= 4;
					return '('+d+').L';

				// Program Counter Indirect with Displacement Mode (p.54)
				case 2:
					d = this.memory.getInt16(this.pointer);
					this.pointer+= 2;
					return '('+d+',PC)';

				// Program Counter Indirect with Index (8-Bit Displacement) Mode (p.55)
				case 3:
					i = this.memory.getInt8(this.pointer) & 0x7;
					this.pointer+= 1;
					d = this.memory.getInt8(this.pointer);
					this.pointer+= 1;
					return '('+d+',PC,X'+i+')';

				// Immediate Data (p.60)
				case 4:
					return '#' + this.getImmediateData(size);
			}
	}
	throw Error('Addressing mode not supported');
}

m68000dasm.prototype.getImmediateData = function(size) {
	var d;
	switch (size) {
		case 0:
			d = this.memory.getInt16(this.pointer) & 0xFF;
			this.pointer+= 2;
			return d;

		case 1:
			d = this.memory.getInt16(this.pointer);
			this.pointer+= 2;
			return d;

		case 2:
			d = this.memory.getInt32(this.pointer);
			this.pointer+= 4;
			return d;
		default:
			throw Error('Wrong size value for immediate data')
	}
}

module.exports = m68000dasm;