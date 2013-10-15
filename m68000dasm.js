var format = require('util').format;

const SIZES = ['', '.W', '.L'];
const SIZE_BYTE = 0;
const SIZE_WORD = 1;
const SIZE_LONG = 2;

// Conditional tests (p.90)
const CONDITIONS = ['T', 'F', 'HI', 'LS', 'CC', 'CS', 'NE', 'EQ', 'VC', 'VS', 'PL', 'MI', 'GE', 'LT', 'GT', 'LE'];

/**
 * Motorola 68000 disassembler
 *
 * @param {Memory} memory
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
        opcode2, rx, ry, rm, dr, opmode, size, data, bit, cond, disp;

    switch (opcode) {

        // 0000 Bit Manipulation/MOVEP/Immediate
        case 0x00:
            // ANDItoCCR: 0000 001 000 111 100
            // ANDI     : 0000 001 0sz mod reg
            // ADDI     : 0000 011 0sz mod reg
            // BCHG imm : 0000 100 001 mod reg
            // BSET imm : 0000 100 011 mod reg
            // CMPI     : 0000 110 0sz mod reg
            // BCHG reg : 0000 reg 101 mod reg
            // BCLR     : 0000 reg 110 mod reg
            // BSET reg : 0000 reg 111 mod reg
            opcode2 = (instruction >> 8) & 0x0F;
            switch (opcode2) {
                case 0x02:
                    if ((instruction & 0xFF) == 0x3C) {
                    	// ANDI to CCR: CCR AND Immediate; Source Λ CCR → CCR (p.124)
                        data = this.getImmediateData(SIZE_WORD);
                        if (data >> 8 != 0) {
                            throw Error(format('ANDI to CCR most significant byte (%d) must be 0', data));
                        }
                        return format('ANDI #%d,CCR', data);
                    } else {
                        // ANDI: AND Immediate: Immediate Data Λ Destination → Destination (p.122)
                        size = (instruction >> 6) & 0x03;
                        data = this.getImmediateData(size);
                        return format('ANDI%s #%d,%s', SIZES[size], data, this.getEffectiveAddress(instruction, size));
                    }
                case 0x06:
                    // ADDI: Add Immediate; Immediate Data + Destination → Destination (p.113)
                    size = (instruction >> 6) & 0x03;
                    data = this.getImmediateData(size);
                    return format('ADDI%s #%d,%s', SIZES[size], data, this.getEffectiveAddress(instruction, size));
                case 0x0C:
                    // CMPI: Compare Immediate: Destination - Immediate Data → cc (p.183)
                    size = (instruction >> 6) & 0x03;
                    data = this.getImmediateData(size);
                    return format('CMPI%s #%d,%s', SIZES[size], data, this.getEffectiveAddress(instruction, size));
                default:
                    opcode2 = instruction >> 6;
                    switch (opcode2) {
                        case 0x20:
                            // BTST: Test a Bit; bit number static, specified as immediate data (p.166)
                            bit = this.getImmediateData(SIZE_WORD) % 32;
                            return format('BTST #%d,%s', bit, this.getEffectiveAddress(instruction, SIZE_BYTE));
                        case 0x21:
                            // BCHG: Test a Bit and Change; bit number static, specified as immediate data (p.133)
                            bit = this.getImmediateData(SIZE_WORD) % 32;
                            return format('BCHG #%d,%s', bit, this.getEffectiveAddress(instruction, SIZE_BYTE));
                        case 0x22:
                            // BCLR: Test a Bit and clear; bit number static, specified as immediate data (p.136)
                            bit = this.getImmediateData(SIZE_WORD) % 32;
                            return format('BCLR #%d,%s', bit, this.getEffectiveAddress(instruction, SIZE_BYTE));
                        case 0x23:
                            // BSET: Test Bit and Set; bit number static, specified as immediate data (p.161)
                            bit = this.getImmediateData(SIZE_WORD) % 32;
                            return format('BSET #%d,%s', bit, this.getEffectiveAddress(instruction, SIZE_BYTE));
                        default:
                            opcode2 = opcode2 & 0x07;
                            rx = (instruction >> 9) & 0x07;
                            switch (opcode2) {
                                case 0x04:
                                    // BTST: Test Bit; bit number dynamic, specified in a register (p.167)
                                    return format('BTST D%d,%s', rx, this.getEffectiveAddress(instruction, SIZE_BYTE));
                                case 0x05:
                                    // BCHG: Test Bit and Set; bit number dynamic, specified in a register (p.133)
                                    return format('BCHG D%d,%s', rx, this.getEffectiveAddress(instruction, SIZE_BYTE));
                                case 0x06:
                                    // BCLR: Test Bit and Clear; bit number dynamic, specified in a register (p.137)
                                    return format('BCLR D%d,%s', rx, this.getEffectiveAddress(instruction, SIZE_BYTE));
                                case 0x07:
                                    // BSET: Test Bit and Set; bit number dynamic, specified in a register (p.162)
                                    return format('BSET D%d,%s', rx, this.getEffectiveAddress(instruction, SIZE_BYTE));
                            }
                    }
            }
            break;

        // 0001 Move Byte
        // 0010 Move Long
        // 0011 Move Word
        // 0100 Miscellaneous
        case 0x04:
            // CHK: 0100 reg sz0 mod reg - sz = 11|10
            // CLR: 0100 001 0sz mod reg - sz = 00|01|10
            opcode2 = (instruction >> 8) & 0x0F;
            switch (opcode2) {
                case 0x02:
                    // CLR: Clear an Operand; 0 → Destination (p.177)
                    size = (instruction >> 6) & 0x03;
                    return format('CLR%s %s', SIZES[size], this.getEffectiveAddress(instruction, size));
                default:
                    // CHK: Check Register Against Bounds; If Dn < 0 or Dn > Source Then TRAP (p.173)
                    bit = (instruction >> 6) & 0x01;
                    rx = (instruction >> 9) & 0x07;
                    size = (instruction >> 7) & 0x03;
                    if (bit == 0x00) {
                        // Note: in this case 0x03 means Word! Long is not supported in M68000.
                        if (size != 0x03) throw Error('CHK: Unsupported size: ' + size);
                        return format('CHK %s,D%d', this.getEffectiveAddress(instruction, SIZE_WORD), rx);
                    }
                    throw Error('Unknown Miscellaneous instruction');
            }
            break;

        // 0101 ADDQ/SUBQ/Scc/DBcc/TRAPc c
        case 0x05:
            // ADDQ: 0101 dat 0sz mod reg - dat = 000..111; sz = 00..10
            // DBcc: 0101 cond 11 001 reg - cond = 0000..1111
            size = (instruction >> 6) & 0x03;
            if (size == 0x03) {
                // DBcc: Test Condition, Decrement, and Branch;
                // If Condition False Then (Dn – 1 → Dn; If Dn != – 1 Then PC + dn → PC) (p.194)
                cond = (instruction >> 8) & 0x0F;
                ry = instruction & 0x07;
                disp = this.getImmediateData(SIZE_WORD);
                return (format('DB%s D%d,*%s%d', CONDITIONS[cond], ry, (disp >= 0)?'+':'', disp));
            } else {
                // ADDQ: Add Quick; Immediate Data + Destination → Destination (p.115)
                data = (instruction >> 9) & 0x07;
                return format('ADDQ%s #%d,%s', SIZES[size], data, this.getEffectiveAddress(instruction, size));
            }
            break;

        // 0110 Bcc/BSR/BRA
        case 0x06:
            cond = (instruction >> 8) & 0x0F;
            disp = instruction & 0xFF;
            if (disp == 0x00) {
                disp = this.getImmediateData(SIZE_WORD);
            } else if (disp >= 0x80) {
                disp = (disp | 0xFFFFFF00) | 0; // convert byte to signed int (sign extension)
            }
            switch (cond) {
                case 0:
                    // BRA: Branch Always: PC + dn → PC (p.159)
                    return format('BRA *%s%d', (disp >= 0)?'+':'', disp);
                case 1:
                    // BSR: Branch to Soubroutine; SP-4 → SP; PC → (SP); PC + dn → PC (p.163)
                    return format('BSR *%s%d', (disp >= 0)?'+':'', disp);
                default:
                    // Bcc: Branch Conditionally; If Condition True Then PC + dn → PC (p.129)
                    return format('B%s *%s%d', CONDITIONS[cond], (disp >= 0)?'+':'', disp);
            }
            break;

        // 0111 MOVEQ
        case 0x07:
            break;

        // 1000 OR/DIV/SBCD
        case 0x08:
            // DIVS: 1000 reg 111 mod reg
            rx = (instruction >> 9) & 0x07;
            opmode = (instruction >> 6) & 0x07;
            switch (opmode) {
                case 0x03:
                    // DIVU: Unsigned Divide; Destination ÷ Source → Destination (p.200)
                    // DIVU.W <ea> ,Dn32/16 → 16r – 16q
                    return format('DIVU.W %s,D%d', this.getEffectiveAddress(instruction, SIZE_LONG), rx);
                case 0x07:
                    // DIVS: Signed Divide; Destination ÷ Source → Destination (p.196)
                    // DIVS.W <ea> ,Dn32/16 → 16r – 16q
                    return format('DIVS.W %s,D%d', this.getEffectiveAddress(instruction, SIZE_LONG), rx);
            }
            break;

        // 1001 SUB/SUBX
        case 0x09:
            break;

        // 1010 (Unassigned, Reserved)
        case 0x0A:
            break;

        // 1011 CMP/EOR
        case 0x0B:
            // CMP : 1011 reg opm mod reg
            // CMPA: 1011 reg opm mod reg
            // CMPM: 1011 reg 1sz 001 reg
            rx = (instruction >> 9) & 0x07;
            opmode = (instruction >> 6) & 0x07;
            switch (opmode) {
                case 0x00:
                    // CMP: Compare; Destination – Source → cc (p.179)
                    return format('CMP%s %s,D%d', SIZES[SIZE_BYTE], this.getEffectiveAddress(instruction, SIZE_BYTE), rx);
                case 0x01:
                    // CMP: Compare; Destination – Source → cc (p.179)
                    return format('CMP%s %s,D%d', SIZES[SIZE_WORD], this.getEffectiveAddress(instruction, SIZE_WORD), rx);
                case 0x02:
                    // CMP: Compare; Destination – Source → cc (p.179)
                    return format('CMP%s %s,D%d', SIZES[SIZE_LONG], this.getEffectiveAddress(instruction, SIZE_LONG), rx);
                case 0x03:
                    // CMPA: Compare; Destination – Source → cc (p.181)
                    return format('CMPA%s %s,D%d', SIZES[SIZE_WORD], this.getEffectiveAddress(instruction, SIZE_WORD), rx);
                case 0x04:
                    // intentional fall-through
                case 0x05:
                    // intentional fall-through
                case 0x06:
                    // CMPM: Compare Memory; Destination – Source → cc (p.185)
                    mode = (instruction >> 3) & 0x07;
                    if (mode == 0x01) {
                        size = opmode & 0x03;
                        ry = instruction & 0x07;
                        return format('CMPM%s (A%d)+,(A%d)+', SIZES[size], ry, rx);
                    } else {
                        throw Error('Unknown CMP/EOR instruction');
                    }

                case 0x07:
                    // CMPA: Compare; Destination – Source → cc (p.181)
                    return format('CMPA%s %s,D%d', SIZES[SIZE_LONG], this.getEffectiveAddress(instruction, SIZE_LONG), rx);
            }
            break;

        // 1100 AND/MUL/ABCD/EXG
        case 0x0C:
            if (((instruction >> 4) & 0x1F) == 0x10) {
                // ABCD: Add Decimal with Extend; Source10 + Destination10 + X → Destination (p.106)
                rx = (instruction >> 9) & 0x07;
                ry = instruction & 0x07;
                rm = (instruction >> 3) & 0x01;
                if (rm == 0) {
                    return format('ABCD D%d,D%d', ry, rx);
                } else {
                    return format('ABCD -(A%d),-(A%d)', ry, rx);
                }
            } else {
                // AND: AND Logical; Source Λ Destination → Destination
                rx = (instruction >> 9) & 0x07;
                opmode = (instruction >> 6) & 0x07;
                size = opmode & 0x03;
                if (opmode < 4) {
                    return format('AND%s %s,D%d', SIZES[size], this.getEffectiveAddress(instruction, size), rx);
                } else {
                    return format('AND%s D%d,%s', SIZES[size], rx, this.getEffectiveAddress(instruction, size));
                }
            }
            break;

        // 1101 ADD/ADDX
        case 0x0D:
            rx = (instruction >> 9) & 0x07;
            opmode = (instruction >> 6) & 0x07;
            size = opmode & 0x3;
            mode = (instruction >> 3) & 0x7;
            if (size < 3) {
                if (opmode < 4) {
                    // ADD: Add; Source + Destination → Destination; <ea> + Dn → Dn (p.108)
                    return format('ADD%s %s,D%d', SIZES[size], this.getEffectiveAddress(instruction, size), rx);
                } else {
                    ry = instruction & 0x7;
                    switch (mode) {
                        case 0:
                            // ADDX: Add Extended; Source + Destination + X → Destination (p.117)
                            return format('ADDX%s D%d,D%d', SIZES[size], ry, rx);
                        case 1:
                            // ADDX: Add Extended; Source + Destination + X → Destination (p.117)
                            return format('ADDX%s -(A%d),-(A%d)', SIZES[size], ry, rx);
                        default:
                            // ADD: Add; Source + Destination → Destination; Dn + <ea> → <ea> (p.108)
                            return format('ADD%s D%d,%s', SIZES[size], rx, this.getEffectiveAddress(instruction, size));
                    }
                }
            } else {
                // ADDA: Add Address; Source + Destination → Destination (p.111)
                return format('ADDA.%s %s,A%d', (opmode == 3) ? 'W' : 'L', this.getEffectiveAddress(instruction, size), rx);
            }
            break;

        // 1110 Shift/Rotate/Bit Field
        case 0x0E:
            rx = (instruction >> 9) & 0x07;
            ry = instruction & 0x07;
            size = (instruction >> 6) & 0x03;
            dr = (instruction >> 8) & 0x01;
            mode = (instruction >> 3) & 0x7;
            if (size < 3 && (mode & 0x3) == 0) {
                // ASL, ASR: Arithmetic Shift (register shifts); Destination Shifted By Count → Destination (p.125)
                if (mode == 0) {
                    return format('AS%s%s #%d,D%d', dr?'L':'R', SIZES[size], rx, ry);
                }
                else {
                    return format('AS%s%s D%d,D%d', dr?'L':'R', SIZES[size], rx, ry);
                }
            } else if (rx == 0 && size == 3) {
                // ASL, ASR: Arithmetic Shift (memory shifts) (p.127)
                // @todo size of operation? it's always a byte?
                return format('AS%s %s', dr?'L':'R', this.getEffectiveAddress(instruction, SIZE_BYTE));
            }
            break;

        // 1111 Coprocessor Interface/MC68040 and CPU32 Extensions
        case 0x0F:

    }
    throw Error('Unknown instruction');
}

// var signExtendNibble = function(n) {
//     return (n < 8) n : (n - 16);
// }

/**
 * Get effective address
 *
 * @param  {integer} mode Mode field in effective addres instruction part (0..7)
 * @param  {integer} reg  Register field in effective addres instruction part (0..7)
 * @param  {integer} size Size field in instruction (0: byte, 1: word, 2: long)
 * @return {string}
 */
m68000dasm.prototype.getEffectiveAddress = function (instruction, size) {
    var d, i,
        reg = instruction & 0x07,
        mode = (instruction >> 3) & 0x7;
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
        // Address Register Indirect with Displacement Mode (1 extension word: xn and displ) (p.49)
        case 5:
            d = this.memory.getInt16(this.pointer);
            this.pointer+= 2;
            return '('+d+',A'+reg+')';
        // Address Register Indirect with Index (8-Bit Displacement) (1 extension word) Mode (p.50)
        case 6:
            i = this.memory.getInt8(this.pointer) & 0x7;
            d = this.memory.getInt8(this.pointer + 1);
            this.pointer+= 2;
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
    throw Error('Addressing mode not supported: ' + mode);
}

/**
 * Get immediate data after instruction
 *
 * @param  {integer} size (SIZE_BYTE, SIZE_WORD or SIZE_LONG)
 * @return {integer} data
 */
m68000dasm.prototype.getImmediateData = function(size) {
    var d;
    switch (size) {
        case SIZE_BYTE:
            d = this.memory.getInt16(this.pointer) & 0xFF;
            this.pointer+= 2;
            return d;
        case SIZE_WORD:
            d = this.memory.getInt16(this.pointer);
            this.pointer+= 2;
            return d;
        case SIZE_LONG:
            d = this.memory.getInt32(this.pointer);
            this.pointer+= 4;
            return d;
        default:
            throw Error('Wrong size value for immediate data')
    }
}

module.exports = m68000dasm;