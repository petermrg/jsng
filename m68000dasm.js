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
        rx = (instruction >> 9) & 0x07,
        opmode = (instruction >> 6) & 0x07,
        mode = (instruction >> 3) & 0x07,
        ry = instruction & 0x07;

    var dr, size, data, bit, cc, disp;

    switch (opcode) {

        // 0000 Bit Manipulation/MOVEP/Immediate
        case 0x00:
            // ORI      : 0000 000 0sz mod reg - sz = 00|01|10
            // ORItoCCR : 0000 000 000 111 100
            // ANDItoCCR: 0000 001 000 111 100
            // ANDI     : 0000 001 0sz mod reg - sz = 00|01|10
            // ADDI     : 0000 011 0sz mod reg - sz = 00|01|10
            // RETM     : 0000 011 011 00d reg
            // BTST imm : 0000 100 000 mod reg
            // BCHG imm : 0000 100 001 mod reg
            // BCLR imm : 0000 100 010 mod reg
            // BSET imm : 0000 100 011 mod reg
            // EORItoCCR: 0000 101 000 111 100
            // EORI     : 0000 101 0sz mod reg - sz = 00|01|10
            // CMPI     : 0000 110 0sz mod reg - sz = 00|01|10
            // BTST reg : 0000 reg 100 mod reg
            // BCHG reg : 0000 reg 101 mod reg
            // BCLR reg : 0000 reg 110 mod reg
            // BSET reg : 0000 reg 111 mod reg
            // MOVEP    : 0000 reg 1om 001 reg - om = 00|01|10|11
            switch (rx) {
                case 0x00:
                    switch (opmode) {
                        case 0x00:
                            if (mode == 0x07 && ry == 0x04) {
                                // ORI to CCR: Inclusive-OR Immediate to Condition Codes; Source V CCR → CCR (p.259)
                                data = this.getImmediateData(SIZE_BYTE);
                                return format('ORI #%d,CCR', data);
                            }
                            // intentional fall-through
                        case 0x01:
                            // intentional fall-through
                        case 0x02:
                            // ORI: Inclusive-OR; Immediate Data V Destination → Destination (p.257)
                            size = opmode;
                            data = this.getImmediateData(size);
                            return format('ORI%s #%d,%s', SIZES[size], data, this.getEAFromInstruction(instruction, size));
                    }
                    break;

                case 0x01:
                    if (instruction == 0x023C) {
                        // ANDI to CCR: CCR AND Immediate; Source Λ CCR → CCR (p.124)
                        data = this.getImmediateData(SIZE_WORD);
                        return format('ANDI #%d,CCR', data);
                    }
                    if (opmode <= 0x02) {
                        // ANDI: AND Immediate: Immediate Data Λ Destination → Destination (p.122)
                        size = opmode;
                        data = this.getImmediateData(size);
                        return format('ANDI%s #%d,%s', SIZES[size], data, this.getEAFromInstruction(instruction, size));
                    }
                    break;

                case 0x03:
                    if (opmode <= 0x02) {
                        // ADDI: Add Immediate; Immediate Data + Destination → Destination (p.113)
                        size = opmode;
                        data = this.getImmediateData(size);
                        return format('ADDI%s #%d,%s', SIZES[size], data, this.getEAFromInstruction(instruction, size));
                    }
                    if (opmode == 0x03) {
                        if (mode <= 0x01) {
                            // RTM: Return from Module; Reload Saved Module State from Stack (p.271)
                            return format('RTM %s%d', mode?'A':'D', ry);
                        }
                    }
                    break;

                case 0x04:
                    switch (opmode) {
                        case 0x00:
                            // BTST: Test a Bit; bit number static, specified as immediate data (p.166)
                            bit = this.getImmediateData(SIZE_WORD) % 32;
                            return format('BTST #%d,%s', bit, this.getEAFromInstruction(instruction, SIZE_BYTE));
                        case 0x01:
                            // BCHG: Test a Bit and Change; bit number static, specified as immediate data (p.133)
                            bit = this.getImmediateData(SIZE_WORD) % 32;
                            return format('BCHG #%d,%s', bit, this.getEAFromInstruction(instruction, SIZE_BYTE));
                        case 0x02:
                            // BCLR: Test a Bit and clear; bit number static, specified as immediate data (p.135)
                            bit = this.getImmediateData(SIZE_WORD) % 32;
                            return format('BCLR #%d,%s', bit, this.getEAFromInstruction(instruction, SIZE_BYTE));
                        case 0x03:
                            // BSET: Test Bit and Set; bit number static, specified as immediate data (p.161)
                            bit = this.getImmediateData(SIZE_WORD) % 32;
                            return format('BSET #%d,%s', bit, this.getEAFromInstruction(instruction, SIZE_BYTE));
                    }
                    break;

                case 0x05:
                    if (instruction == 0x0A3C) {
                        // EORI to CCR: Exclusive-OR Immediate to CCR; Source ⊕ CCR → CCR → Destination (p.208)
                        data = this.getImmediateData(SIZE_WORD);
                        return format('EORI #%d,CCR', data);
                    }
                    if (opmode <= 0x02) {
                        // EORI: Exclusive-OR Immediate; Immediate Data ⊕ Destination → Destination (p.206)
                        size = opmode;
                        data = this.getImmediateData(size);
                        return format('EORI%s #%d,%s', SIZES[size], data, this.getEAFromInstruction(instruction, size));
                    }
                    break;

                case 0x06:
                    if (opmode <= 0x02) {
                        // CMPI: Compare Immediate: Destination - Immediate Data → cc (p.183)
                        size = (instruction >> 6) & 0x03;
                        data = this.getImmediateData(size);
                        return format('CMPI%s #%d,%s', SIZES[size], data, this.getEAFromInstruction(instruction, size));
                    }
                    break;
            }
            // rest of cases
            if (((instruction >> 8) & 1) == 0x01 && mode == 0x01) {
                // MOVEP: Move Peripheral Data; Source → Destination (p.235)
                data = this.getImmediateData(SIZE_WORD);
                if (opmode & 0x02) {
                    return format('MOVEP.%s D%d,(%d,A%d)', (opmode & 0x01)?'L':'W', rx, data, ry);
                } else {
                    return format('MOVEP.%s (%d,A%d),D%d', (opmode & 0x01)?'L':'W', data, ry, rx);
                }
            }

            switch (opmode) {
                case 0x04:
                    // BTST: Test Bit; bit number dynamic, specified in a register (p.167)
                    return format('BTST D%d,%s', rx, this.getEAFromInstruction(instruction, SIZE_BYTE));
                case 0x05:
                    // BCHG: Test Bit and Set; bit number dynamic, specified in a register (p.133)
                    return format('BCHG D%d,%s', rx, this.getEAFromInstruction(instruction, SIZE_BYTE));
                case 0x06:
                    // BCLR: Test Bit and Clear; bit number dynamic, specified in a register (p.135)
                    return format('BCLR D%d,%s', rx, this.getEAFromInstruction(instruction, SIZE_BYTE));
                case 0x07:
                    // BSET: Test Bit and Set; bit number dynamic, specified in a register (p.162)
                    return format('BSET D%d,%s', rx, this.getEAFromInstruction(instruction, SIZE_BYTE));
            }
            break;

        // 0001 Move Byte
        case 0x01:
            data = this.getEAFromModeAndReg(mode, rx);
            // MOVE: Move Data from Source to Destination; Source → Destination (p.220)
            return format('MOVE %s,%s', this.getEAFromInstruction(instruction, SIZE_BYTE), data);
            break;

        // 0010 Move Long
        case 0x02:
            data = this.getEAFromModeAndReg(opmode, rx);
            switch (opmode) {
                case 0x01:
                    // MOVEA: Move Address; Source → Destination (p.223)
                    return format('MOVE.L %s,A%d', this.getEAFromInstruction(instruction, SIZE_LONG), rx);
                default:
                    // MOVE: Move Data from Source to Destination; Source → Destination (p.220)
                    return format('MOVE.L %s,%s', this.getEAFromInstruction(instruction, SIZE_LONG), data);
                break;
            }
            break;

        // 0011 Move Word
        case 0x03:
            data = this.getEAFromModeAndReg(opmode, rx);
            switch (opmode) {
                case 0x01:
                    // MOVEA: Move Address; Source → Destination (p.223)
                    return format('MOVE.W %s,A%d', this.getEAFromInstruction(instruction, SIZE_LONG), rx);
                default:
                    // MOVE: Move Data from Source to Destination; Source → Destination (p.220)
                    return format('MOVE.W %s,%s', this.getEAFromInstruction(instruction, SIZE_LONG), data);
                break;
            }
            break;

        // 0100 Miscellaneous
        case 0x04:
            // NEGX       : 0100 000 0sz mod reg - sz = 00|01|10
            // CLR        : 0100 001 0sz mod reg - sz = 00|01|10
            // MOVEfromSR : 0100 000 011 mod reg
            // MOVEfromCCR: 0100 001 011 mod reg
            // NEG        : 0100 010 0sz mod reg - sz = 00|01|10
            // MOVEtoCCR  : 0100 010 011 mod reg
            // NOT        : 0100 011 0sz mod reg - sz = 00|01|10
            // NBCD       : 0100 100 000 mod reg
            // PEA        : 0100 100 001 mod reg
            // EXT        : 0100 100 opm 000 reg - opm = 010|011
            // Illegal    : 0100 101 011 111 100
            // LINK       : 0100 111 001 010 reg
            // NOP        : 0100 111 001 110 001
            // RTR        : 0100 111 001 110 111
            // JSR        : 0100 111 010 mod reg
            // JMP        : 0100 111 011 mod reg
            // LEA        : 0100 reg 111 mod reg
            // CHK        : 0100 reg sz0 mod reg - sz = 11|10
            // MOVEM      : 0100 1d0 01s mod reg
            switch (rx) {
                case 0x00:
                    switch (opmode) {
                        case 0x00:
                            // intentional fall-through
                        case 0x01:
                            // intentional fall-through
                        case 0x02:
                            // NEGX: Negate with Extend; 0 – Destination – X → Destination (p.249)
                            size = opmode;
                            return format('NEGX%s %s', SIZES[size], this.getEAFromInstruction(instruction, size));
                        case 0x03:
                            // MOVE from SR: Move from the Status Register; SR → Destination (p.229)
                            return format('MOVE SR,%s', this.getEAFromInstruction(instruction));
                    }
                    break;

                case 0x01:
                    switch (opmode) {
                        case 0x00:
                            // intentional fall-through
                        case 0x01:
                            // intentional fall-through
                        case 0x02:
                            // CLR: Clear an Operand; 0 → Destination (p.177)
                            size = opmode;
                            return format('CLR%s %s', SIZES[size], this.getEAFromInstruction(instruction, size));
                        case 0x03:
                            // MOVE from CCR: Move from the Condition Code Register; CCR → Destination (p.225)
                            return format('MOVE CCR,%s', this.getEAFromInstruction(instruction));
                    }
                    break;

                case 0x02:
                    switch (opmode) {
                        case 0x00:
                            // intentional fall-through
                        case 0x01:
                            // intentional fall-through
                        case 0x02:
                            // NEG: Negate; 0 – Destination → Destination (p.247)
                            size = opmode;
                            return format('NEG%s %s', SIZES[size], this.getEAFromInstruction(instruction, size));
                        case 0x03:
                            // MOVE to CCR: Move to Condition Code Register; Source → CCR (p.227)
                            return format('MOVE %s,CCR', this.getEAFromInstruction(instruction));
                    }
                    break;

                case 0x03:
                    switch (opmode) {
                        case 0x00:
                            // intentional fall-through
                        case 0x01:
                            // intentional fall-through
                        case 0x02:
                            // NEG: Negate; 0 – Destination → Destination (p.247)
                            size = opmode;
                            return format('NOT%s %s', SIZES[size], this.getEAFromInstruction(instruction, size));
                    }

                case 0x04:
                    switch (opmode) {
                        case 0x00:
                            // NBCD: Negate Decimal with Extend; 0 – Destination(Base10) – X → Destination (p.245)
                            return format('NBCD %s', this.getEAFromInstruction(instruction));
                        case 0x01:
                            // PEA: Push Effective Address; SP – 4 → SP; < ea > → (SP) (p.263)
                            return format('PEA %s', this.getEAFromInstruction(instruction));
                    }
                    // EXT: Sign-Extend; Destination Sign-Extended → Destination (p.210)
                    if (mode == 0x00) {
                        switch (opmode) {
                            case 0x02:
                                return format('EXT.W D%d', ry);
                            case 0x03:
                                return format('EXT.L D%d', ry);
                        }
                    }
                    break;

                case 0x05:
                    switch (opmode) {
                        case 0x03:
                            if ((instruction & 0x3F) == 0x3C) {
                                // ILLEGAL: Take Illegal Instruction Trap (p.211)
                                return format('ILLEGAL');
                            }
                    }
                    break;

                case 0x07:
                    switch (opmode) {
                        case 0x01:
                            switch (mode) {
                                case 0x02:
                                    // LINK: Link and Allocate; SP – 4 → SP; An → (SP); SP → An; SP + dn → SP (p.215)
                                    return format('LINK A%d,#%d', ry, this.getImmediateData(SIZE_WORD));
                                case 0x06:
                                    switch (ry) {
                                        // NOP: No Operation; (p.251)
                                        case 0x01: return format('NOP');
                                        // RTR: Return and Restore Condition Codes;
                                        // (SP) → CCR; SP + 2 → SP; (SP) → PC; SP + 4 → SP (p.272)
                                        case 0x07: return format('RTR');
                                    }
                            }
                            break;
                        case 0x02:
                            // JSR: Jump to Subroutine; SP – 4 → Sp; PC → (SP); Destination Address → PC (p.213)
                            return format('JSR %s', this.getEAFromInstruction(instruction));
                        case 0x03:
                            // JMP: Jump; Destination Address → PC (p.212)
                            return format('JMP %s', this.getEAFromInstruction(instruction));
                    }
                    break;
            }
            // rest of cases
            if ((rx == 0x04 || rx == 0x06) && (opmode == 0x02 || opmode == 0x03)) {
                // MOVEM: Move Multiple Registers (p.233)
                dr = (instruction >> 10) & 0x01; // 0: reg to mem; 1: mem to reg
                size = (instruction >> 6) & 0x01; // 0: word; 1: long
                data = this.registerMaskToStr(this.getImmediateData(SIZE_WORD), dr);
                if (dr == 0x00) {
                    return format('MOVEM.%s %s,%s', size?'L':'W', data, this.getEAFromInstruction(instruction));
                } else {
                    return format('MOVEM.%s %s,%s', size?'L':'W', this.getEAFromInstruction(instruction), data);
                }
            }
            switch (opmode) {
                case 0x07:
                    // LEA: Load Effective Address (p.214)
                    return format('LEA %s,A%d', this.getEAFromInstruction(instruction), rx);
                default:
                    bit = (instruction >> 6) & 0x01;
                    size = (instruction >> 7) & 0x03;
                    if (bit == 0x00) {
                        // CHK: Check Register Against Bounds; If Dn < 0 or Dn > Source Then TRAP (p.173)
                        // Note: in this case 0x03 means Word! Long is not supported in 68000.
                        if (size != 0x03) throw Error('CHK: Unsupported size: ' + size);
                        return format('CHK %s,D%d', this.getEAFromInstruction(instruction, SIZE_WORD), rx);
                    }
            }
            break;

        // 0101 ADDQ/SUBQ/Scc/DBcc/TRAPc c
        case 0x05:
            // ADDQ: 0101 dat 0sz mod reg - dat = 000..111; sz = 00..10
            // DBcc: 0101 cc- -11 001 reg - cc = 0000..1111
            size = (instruction >> 6) & 0x03;
            if (size == 0x03) {
                // DBcc: Test Condition, Decrement, and Branch;
                // If Condition False Then (Dn – 1 → Dn; If Dn != – 1 Then PC + dn → PC) (p.194)
                cc = (instruction >> 8) & 0x0F;
                disp = this.getImmediateData(SIZE_WORD);
                return (format('DB%s D%d,*%s%d', CONDITIONS[cc], ry, (disp >= 0)?'+':'', disp));
            } else {
                // ADDQ: Add Quick; Immediate Data + Destination → Destination (p.115)
                data = (instruction >> 9) & 0x07;
                return format('ADDQ%s #%d,%s', SIZES[size], data, this.getEAFromInstruction(instruction, size));
            }
            break;

        // 0110 Bcc/BSR/BRA
        case 0x06:
            cc = (instruction >> 8) & 0x0F;
            disp = instruction & 0xFF;
            if (disp == 0x00) {
                disp = this.getImmediateData(SIZE_WORD);
            } else if (disp >= 0x80) {
                disp|= 0xFFFFFF00; // convert byte to signed int (sign extension)
            }
            switch (cc) {
                case 0:
                    // BRA: Branch Always: PC + dn → PC (p.159)
                    return format('BRA *%s%d', (disp >= 0)?'+':'', disp);
                case 1:
                    // BSR: Branch to Soubroutine; SP-4 → SP; PC → (SP); PC + dn → PC (p.163)
                    return format('BSR *%s%d', (disp >= 0)?'+':'', disp);
                default:
                    // Bcc: Branch Conditionally; If Condition True Then PC + dn → PC (p.129)
                    return format('B%s *%s%d', CONDITIONS[cc], (disp >= 0)?'+':'', disp);
            }
            break;

        // 0111 MOVEQ
        case 0x07:
            // MOVEQ: Move Quick; Immediate Data → Destination (p.238)
            if (((instruction >> 8) & 0x01) == 0x0) {
                data = instruction & 0xFF;
                if (data >= 0x80) {
                    data|= 0xFFFFFF00;
                }
                rx = (instruction >> 9) & 0x07;
                return format('MOVEQ #%d,D%d', data, rx);
            }
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
                    return format('DIVU.W %s,D%d', this.getEAFromInstruction(instruction, SIZE_LONG), rx);
                case 0x07:
                    // DIVS: Signed Divide; Destination ÷ Source → Destination (p.196)
                    // DIVS.W <ea> ,Dn32/16 → 16r – 16q
                    return format('DIVS.W %s,D%d', this.getEAFromInstruction(instruction, SIZE_LONG), rx);
                default:
                    // OR: Inclusive-OR Logical; Source V Destination → Destination (p.254)
                    size = opmode & 0x03;
                    if (opmode < 0x04) {
                        return format('OR%s %s,D%d', SIZES[size], this.getEAFromInstruction(instruction, size), rx);
                    } else {
                        return format('OR%s D%d,%s', SIZES[size], rx, this.getEAFromInstruction(instruction, size));
                    }
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
            // EOR : 1011 reg opm mod reg - opm = 100|101|110
            rx = (instruction >> 9) & 0x07;
            opmode = (instruction >> 6) & 0x07;
            switch (opmode) {
                case 0x00:
                    // intentional fall-through
                case 0x01:
                    // intentional fall-through
                case 0x02:
                    // CMP: Compare; Destination – Source → cc (p.179)
                    size = opmode;
                    return format('CMP%s %s,D%d', SIZES[size], this.getEAFromInstruction(instruction, size), rx);
                case 0x03:
                    // CMPA: Compare; Destination – Source → cc (p.181)
                    size = SIZE_WORD;
                    return format('CMPA%s %s,D%d', SIZES[size], this.getEAFromInstruction(instruction, size), rx);
                case 0x04:
                    // intentional fall-through
                case 0x05:
                    // intentional fall-through
                case 0x06:
                    mode = (instruction >> 3) & 0x07;
                    ry = instruction & 0x07;
                    size = opmode & 0x03;
                    if (mode == 0x01) {
                        // CMPM: Compare Memory; Destination – Source → cc (p.185)
                        return format('CMPM%s (A%d)+,(A%d)+', SIZES[size], ry, rx);
                    } else {
                        // EOR: Exclusive-OR Logical; Source ⊕ Destination → Destination (p.204)
                        return format('EOR%s D%d,%s', SIZES[size], rx, this.getEAFromInstruction(instruction, size));
                    }
                case 0x07:
                    // CMPA: Compare; Destination – Source → cc (p.181)
                    size = SIZE_LONG;
                    return format('CMPA%s %s,D%d', SIZES[size], this.getEAFromInstruction(instruction, size), rx);
            }
            break;

        // 1100 AND/MUL/ABCD/EXG
        // ABCD: 1100 reg 100 00b reg
        // MULS: 1100 reg 111 mod reg
        // MULU: 1100 reg 011 mod reg
        // EXG : 1100 reg 1op-mod reg - op-mod = 01000|01001|10001
        // AND : 1100 reg opm mod reg - opm = 000|001|010|110|101|110
        case 0x0C:
            switch (opmode) {
                case 0x03:
                    // MULU: Signed Multiply; Source x Destination → Destination (p.239)
                    return format('MULU.W %s,D%d', this.getEAFromInstruction(instruction, SIZE_WORD), rx);
                case 0x04:
                    switch (mode) {
                        case 0:
                            return format('ABCD D%d,D%d', ry, rx);
                        case 1:
                            return format('ABCD -(A%d),-(A%d)', ry, rx);
                    }
                    break;
                case 0x05:
                    switch (mode) {
                        case 0:
                            // EXG: Exchange Registers; Rx ←→ Ry (p.209)
                            return format('EXG D%d,D%d', rx, ry);
                        case 1:
                            // EXG: Exchange Registers; Rx ←→ Ry (p.209)
                            return format('EXG A%d,A%d', rx, ry);
                    }
                    break;
                case 0x06:
                    switch (mode) {
                        case 1:
                            // EXG: Exchange Registers; Rx ←→ Ry (p.209)
                            return format('EXG D%d,A%d', rx, ry);
                    }
                    break;
                case 0x07:
                    // MULS: Signed Multiply; Source x Destination → Destination (p.239)
                    return format('MULS.W %s,D%d', this.getEAFromInstruction(instruction, SIZE_WORD), rx);
            }
            // AND: AND Logical; Source Λ Destination → Destination (p.119)
            size = opmode & 0x03;
            if (opmode < 0x04) {
                return format('AND%s %s,D%d', SIZES[size], this.getEAFromInstruction(instruction, size), rx);
            } else {
                return format('AND%s D%d,%s', SIZES[size], rx, this.getEAFromInstruction(instruction, size));
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
                    return format('ADD%s %s,D%d', SIZES[size], this.getEAFromInstruction(instruction, size), rx);
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
                            return format('ADD%s D%d,%s', SIZES[size], rx, this.getEAFromInstruction(instruction, size));
                    }
                }
            } else {
                // ADDA: Add Address; Source + Destination → Destination (p.111)
                return format('ADDA.%s %s,A%d', (opmode == 3)?'W':'L', this.getEAFromInstruction(instruction, size), rx);
            }
            break;

        // 1110 Shift/Rotate/Bit Field
        case 0x0E:
            // ASL/R Reg : 1110 reg dsz i00 reg - sz = 00|01|10
            // LSL/R Reg : 1110 reg dsz i01 reg - sz = 00|01|10
            // ROXL/R Reg: 1110 reg dsz i10 reg - sz = 00|01|10
            // ROL/R Reg : 1110 reg dsz i11 reg - sz = 00|01|10
            // ASL/R Mem : 1110 000 d11 mod reg
            // LSL/R Mem : 1110 001 d11 mod reg
            // ROXL/R Mem: 1110 010 d11 mod reg
            // ROL/R Mem : 1110 011 d11 mod reg
            size = opmode & 0x03;
            dr = (instruction >> 8) & 0x01;
            bit = (instruction >> 5) & 0x1;
            if (size == 0x03) {
                switch (rx) {
                    case 0x00:
                        // ASL, ASR: Arithmetic Shift (memory shifts);
                        // Destination Shifted By Count → Destination (p.125)
                        return format('AS%s %s', dr?'L':'R', this.getEAFromInstruction(instruction));
                    case 0x01:
                        // LSL, LSR: Logical Shift (memory shifts)
                        // Destination Shifted By Count → Destination (p.217)
                        return format('LS%s %s', dr?'L':'R', this.getEAFromInstruction(instruction));
                    case 0x02:
                        // ROXL, ROXR; Rotate with Extend (memory shifts)
                        // Destination Rotated By < count > → Destination (p.268)
                        return format('ROX%s %s', dr?'L':'R', this.getEAFromInstruction(instruction));
                    case 0x03:
                        // ROL, ROR; Rotate (Without Extend) (memory shifts)
                        // Destination Rotated By < count > → Destination (p.264)
                        return format('RO%s %s', dr?'L':'R', this.getEAFromInstruction(instruction));
                }
            } else {
                switch (mode & 0x03) {
                    case 0x00:
                        // ASL, ASR: Arithmetic Shift (register shifts);
                        // Destination Shifted By Count → Destination (p.125)
                        return (bit == 0x00)
                            ? format('AS%s%s #%d,D%d', dr?'L':'R', SIZES[size], rx, ry)
                            : format('AS%s%s D%d,D%d', dr?'L':'R', SIZES[size], rx, ry);
                    case 0x01:
                        // LSL, LSR: Logical Shift (register shifts);
                        // Destination Shifted By Count → Destination (p.217)
                        return (bit == 0x00)
                            ? format('LS%s%s #%d,D%d', dr?'L':'R', SIZES[size], rx, ry)
                            : format('LS%s%s D%d,D%d', dr?'L':'R', SIZES[size], rx, ry);
                    case 0x02:
                        // ROXL, ROXR; Rotate with Extend (register shifts);
                        // Destination Rotated By < count > → Destination (p.268)
                        return (bit == 0x00)
                            ? format('ROX%s%s #%d,D%d', dr?'L':'R', SIZES[size], rx, ry)
                            : format('ROX%s%s D%d,D%d', dr?'L':'R', SIZES[size], rx, ry);
                    case 0x03:
                        // ROL, ROR; Rotate (Without Extend) (register shifts);
                        // Destination Rotated By < count > → Destination (p.264)
                        return (bit == 0x00)
                            ? format('RO%s%s #%d,D%d', dr?'L':'R', SIZES[size], rx, ry)
                            : format('RO%s%s D%d,D%d', dr?'L':'R', SIZES[size], rx, ry);
                }
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
 * Get effective address from Mode and Register
 *
 * @param  {integer} mode     Addressing mode
 * @param  {integer} register Register number
 * @param  {integer} size     Optional. Size of immediate data.
 * @return {string}
 */
m68000dasm.prototype.getEAFromModeAndReg = function(mode, register, size) {
    var d, i;
    switch (mode) {
        // Data Register Direct Mode (p.46)
        case 0:
            return 'D'+register;
        // Address Register Direct Mode  (p.46)
        case 1:
            return 'A'+register;
        // Address Register Indirect Mode  (p.46)
        case 2:
            return '(A'+register+')';
        // Address Register Indirect with Postincrement Mode (p.47)
        case 3:
            return '(A'+register+')+';
        // Address Register Indirect with Predecrement Mode (p.48)
        case 4:
            return '-(A'+register+')';
        // Address Register Indirect with Displacement Mode (1 extension word: xn and displ) (p.49)
        case 5:
            d = this.memory.getInt16(this.pointer);
            this.pointer+= 2;
            return '('+d+',A'+register+')';
        // Address Register Indirect with Index (8-Bit Displacement) (1 extension word) Mode (p.50)
        case 6:
            i = this.memory.getInt8(this.pointer) & 0x7;
            d = this.memory.getInt8(this.pointer + 1);
            this.pointer+= 2;
            return '('+d+',A'+register+',X'+i+')';
        case 7:
            switch (register) {
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
                    if (typeof size == 'undefined') throw Error('getEAFromModeAndReg: undefined size');
                    return '#' + this.getImmediateData(size);
            }
    }
    throw Error('Addressing mode not supported: ' + mode);
}

/**
 * Get effective address from instruction
 *
 * @param  {integer} instruction Instruction code
 * @param  {integer} size        Optional. Size of immediate data.
 * @return {string}
 */
m68000dasm.prototype.getEAFromInstruction = function(instruction, size) {
    var register = instruction & 0x07,
        mode = (instruction >> 3) & 0x7;
    return this.getEAFromModeAndReg(mode, register, size);
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
            if (d > 0xFF) throw Error('High Byte of immediate data must be 0');
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

/**
 * Get string representation of register mask
 * @param  {integer} mask
 * @param  {integer} direction 0: reg to mem; 1: mem to reg
 * @return {string}
 */
m68000dasm.prototype.registerMaskToStr = function(mask, direction) {
    var result = [],
        regs = [
            ['D0', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'A0', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7'],
            ['A7', 'A6', 'A5', 'A4', 'A3', 'A2', 'A1', 'A0', 'D7', 'D6', 'D5', 'D4', 'D3', 'D2', 'D1', 'D0']];

    for (var i = 0; i < 16; i++) {
        if (((mask >> i) & 0x01) == 0x01) {
            result.push(regs[direction][i]);
        }
    }
    return result.join('/');
}

module.exports = m68000dasm;