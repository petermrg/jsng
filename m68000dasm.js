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
 * Disassemble instruction at address. If no address is given, it uses the internal pointer.
 *
 * Common instruction parts:
 *                                ┌─────────────────┐
 *                                │effective address│
 *  ┌───────────┬────────┬────────┼────────┬────────┤
 *  │  opcode   │   rx   │ opmode │  mode  │   ry   │
 *  ├───────────┼────────┼────────┼────────┼────────┤
 * 15          12        9        6        3        0
 *
 * @param  {integer} address (Optional)
 * @return {string}  Assembler syntax
 */
m68000dasm.prototype.disassemble = function (address) {
    if (arguments.length == 1) this.pointer = address;
    var instruction = this.memory.getUint16(this.pointer);
    this.pointer+= 2;

    var opcode = (instruction >> 12) & 0x0F,
        rx = (instruction >> 9) & 0x07,
        opmode = (instruction >> 6) & 0x07,
        mode = (instruction >> 3) & 0x07,
        ry = instruction & 0x07;

    var dr, // direction
        sz, // size
        cc, // condition code
        data;

    switch (opcode) {

        // 0000 Bit Manipulation/MOVEP/Immediate
        case 0x00:
            // ORItoCCR : 0000 000 000 111 100
            // ORI to SR: 0000 000 001 111 100
            // ORI      : 0000 000 0sz mod reg - sz = 00|01|10
            // ANDItoCCR: 0000 001 000 111 100
            // ANDItoSR : 0000 001 001 111 100
            // ANDI     : 0000 001 0sz mod reg - sz = 00|01|10
            // SUBI     : 0000 010 0sz mod reg - sz = 00|01|10
            // ADDI     : 0000 011 0sz mod reg - sz = 00|01|10
            // RETM     : 0000 011 011 00d reg
            // BTST imm : 0000 100 000 mod reg
            // BCHG imm : 0000 100 001 mod reg
            // BCLR imm : 0000 100 010 mod reg
            // BSET imm : 0000 100 011 mod reg
            // EORItoCCR: 0000 101 000 111 100
            // EORItoSR : 0000 101 001 111 100
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
                            if (mode == 0x07 && ry == 0x04) {
                                // ORI to SR: Inclusive-OR Immediate to the Status Register;
                                // If Supervisor State Then Source V SR → SR Else TRAP (p.481)
                                return format('ORI #%d,SR', this.getImmediateData(SIZE_WORD));
                            }
                            // intentional fall-through
                        case 0x02:
                            // ORI: Inclusive-OR; Immediate Data V Destination → Destination (p.257)
                            sz = opmode;
                            data = this.getImmediateData(sz);
                            return format('ORI%s #%d,%s', SIZES[sz], data, this.getEffectiveAddress(mode, ry, sz));
                    }
                    break;

                case 0x01:
                    if (instruction == 0x023C) {
                        // ANDI to CCR: CCR AND Immediate; Source Λ CCR → CCR (p.124)
                        data = this.getImmediateData(SIZE_WORD);
                        return format('ANDI #%d,CCR', data);
                    }
                    switch (opmode) {
                        case 0x00:
                            // intentional fall-through
                        case 0x01:
                            // ANDI to SSR: AND Immediate to the Status Register;
                            // If Supervisor State Then Source L SR → SR ELSE TRAP (p.456)
                            if (mode == 0x07 && ry == 0x04) {
                                data = this.getImmediateData(SIZE_WORD);
                                return format('ANDI #%d,SR', data);
                            }
                            // intentional fall-through
                        case 0x02:
                            // ANDI: AND Immediate: Immediate Data Λ Destination → Destination (p.122)
                            sz = opmode;
                            data = this.getImmediateData(sz);
                            return format('ANDI%s #%d,%s', SIZES[sz], data, this.getEffectiveAddress(mode, ry, sz));
                    }
                    break;

                case 0x02:
                    if (opmode <= 0x02) {
                        // SUBI: Subtract Immediate: Destination – Immediate Data → Destination (p.283)
                        sz = opmode;
                        data = this.getImmediateData(sz);
                        return format('SUBI%s #%d,%s', SIZES[sz], data, this.getEffectiveAddress(mode, ry, sz));
                    }
                    break;

                case 0x03:
                    if (opmode <= 0x02) {
                        // ADDI: Add Immediate; Immediate Data + Destination → Destination (p.113)
                        sz = opmode;
                        data = this.getImmediateData(sz);
                        return format('ADDI%s #%d,%s', SIZES[sz], data, this.getEffectiveAddress(mode, ry, sz));
                    }
                    break;

                case 0x04:
                    switch (opmode) {
                        case 0x00:
                            // BTST: Test a Bit; bit number static, specified as immediate data (p.166)
                            data = this.getImmediateData(SIZE_WORD) % 32;
                            return format('BTST #%d,%s', data, this.getEffectiveAddress(mode, ry, SIZE_BYTE));
                        case 0x01:
                            // BCHG: Test a Bit and Change; bit number static, specified as immediate data (p.133)
                            data = this.getImmediateData(SIZE_WORD) % 32;
                            return format('BCHG #%d,%s', data, this.getEffectiveAddress(mode, ry, SIZE_BYTE));
                        case 0x02:
                            // BCLR: Test a Bit and clear; bit number static, specified as immediate data (p.135)
                            data = this.getImmediateData(SIZE_WORD) % 32;
                            return format('BCLR #%d,%s', data, this.getEffectiveAddress(mode, ry, SIZE_BYTE));
                        case 0x03:
                            // BSET: Test Bit and Set; bit number static, specified as immediate data (p.161)
                            data = this.getImmediateData(SIZE_WORD) % 32;
                            return format('BSET #%d,%s', data, this.getEffectiveAddress(mode, ry, SIZE_BYTE));
                    }
                    break;

                case 0x05:
                    switch (opmode) {
                        case 0x00:
                            // EORI to CCR: Exclusive-OR Immediate to CCR; Source ⊕ CCR → CCR → Destination (p.208)
                            if (mode == 0x07 && ry == 0x04) {
                                data = this.getImmediateData(SIZE_WORD);
                                return format('EORI #%d,CCR', data);
                            }
                            // intentional fall-through
                        case 0x01:
                            // EORI to SR: Exclusive-OR Immediate to the Status Register;
                            // If Supervisor State Then Source ⊕ SR → SR ELSE TRAP (p.464)
                            if (mode == 0x07 && ry == 0x04) {
                                data = this.getImmediateData(SIZE_WORD);
                                return format('EORI #%d,SR', data);
                            }
                            // intentional fall-through
                        case 0x02:
                            // EORI: Exclusive-OR Immediate; Immediate Data ⊕ Destination → Destination (p.206)
                            sz = opmode;
                            data = this.getImmediateData(sz);
                            return format('EORI%s #%d,%s', SIZES[sz], data, this.getEffectiveAddress(mode, ry, sz));
                    }
                    break;

                case 0x06:
                    if (opmode <= 0x02) {
                        // CMPI: Compare Immediate: Destination - Immediate Data → cc (p.183)
                        sz = (instruction >> 6) & 0x03;
                        data = this.getImmediateData(sz);
                        return format('CMPI%s #%d,%s', SIZES[sz], data, this.getEffectiveAddress(mode, ry, sz));
                    }
                    break;
            }
            // rest of cases
            if (opmode >= 0x04 && mode == 0x01) {
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
                    return format('BTST D%d,%s', rx, this.getEffectiveAddress(mode, ry, SIZE_BYTE));
                case 0x05:
                    // BCHG: Test Bit and Set; bit number dynamic, specified in a register (p.133)
                    return format('BCHG D%d,%s', rx, this.getEffectiveAddress(mode, ry, SIZE_BYTE));
                case 0x06:
                    // BCLR: Test Bit and Clear; bit number dynamic, specified in a register (p.135)
                    return format('BCLR D%d,%s', rx, this.getEffectiveAddress(mode, ry, SIZE_BYTE));
                case 0x07:
                    // BSET: Test Bit and Set; bit number dynamic, specified in a register (p.162)
                    return format('BSET D%d,%s', rx, this.getEffectiveAddress(mode, ry, SIZE_BYTE));
            }
            break;

        // 0001 Move Byte
        case 0x01:
            // MOVE: Move Data from Source to Destination; Source → Destination (p.220)
            data = this.getEffectiveAddress(mode, rx);
            return format('MOVE %s,%s', this.getEffectiveAddress(mode, ry, SIZE_BYTE), data);
            break;

        // 0010 Move Long
        case 0x02:
            switch (opmode) {
                case 0x01:
                    // MOVEA: Move Address; Source → Destination (p.223)
                    return format('MOVE.L %s,A%d', this.getEffectiveAddress(mode, ry, SIZE_LONG), rx);
                default:
                    // MOVE: Move Data from Source to Destination; Source → Destination (p.220)
                    data = this.getEffectiveAddress(opmode, rx);
                    return format('MOVE.L %s,%s', this.getEffectiveAddress(mode, ry, SIZE_LONG), data);
                break;
            }
            break;

        // 0011 Move Word
        case 0x03:
            switch (opmode) {
                case 0x01:
                    // MOVEA: Move Address; Source → Destination (p.223)
                    return format('MOVE.W %s,A%d', this.getEffectiveAddress(mode, ry, SIZE_LONG), rx);
                default:
                    // MOVE: Move Data from Source to Destination; Source → Destination (p.220)
                    data = this.getEffectiveAddress(opmode, rx);
                    return format('MOVE.W %s,%s', this.getEffectiveAddress(mode, ry, SIZE_LONG), data);
                break;
            }
            break;

        // 0100 Miscellaneous
        case 0x04:
            // NEGX       : 0100 000 0sz mod reg - sz = 00|01|10
            // MOVEfromSR : 0100 000 011 mod reg
            // CLR        : 0100 001 0sz mod reg - sz = 00|01|10
            // MOVEfromCCR: 0100 001 011 mod reg
            // NEG        : 0100 010 0sz mod reg - sz = 00|01|10
            // MOVEtoCCR  : 0100 010 011 mod reg
            // NOT        : 0100 011 0sz mod reg - sz = 00|01|10
            // MOVEtoSR   : 0100 011 011 mod reg
            // NBCD       : 0100 100 000 mod reg
            // SWAP       : 0100 100 001 000 reg
            // PEA        : 0100 100 001 mod reg
            // EXT        : 0100 100 opm 000 reg - opm = 010|011
            // TST        : 0100 101 0sz mod reg - sz = 00|01|10
            // Illegal    : 0100 101 011 111 100
            // TAS        : 0100 101 011 mod reg
            // MOVEM      : 0100 1d0 01s mod reg
            // TRAP       : 0100 111 001 00 vect
            // LINK       : 0100 111 001 010 reg
            // UNLK       : 0100 111 001 011 reg
            // MOVE USP   : 0100 111 001 10d reg
            // RESET      : 0100 111 001 110 000
            // NOP        : 0100 111 001 110 001
            // STOP       : 0100 111 001 110 010
            // RTE        : 0100 111 001 110 011
            // RTS        : 0100 111 001 110 101
            // TRAPV      : 0100 111 001 110 110
            // RTR        : 0100 111 001 110 111
            // JSR        : 0100 111 010 mod reg
            // JMP        : 0100 111 011 mod reg
            // LEA        : 0100 reg 111 mod reg
            // CHK        : 0100 reg sz0 mod reg - sz = 11|10
            switch (rx) {
                case 0x00:
                    switch (opmode) {
                        case 0x00:
                            // intentional fall-through
                        case 0x01:
                            // intentional fall-through
                        case 0x02:
                            // NEGX: Negate with Extend; 0 – Destination – X → Destination (p.249)
                            sz = opmode;
                            return format('NEGX%s %s', SIZES[sz], this.getEffectiveAddress(mode, ry, sz));
                        case 0x03:
                            // MOVE from SR: Move from the Status Register; SR → Destination (p.229)
                            return format('MOVE SR,%s', this.getEffectiveAddress(mode, ry));
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
                            sz = opmode;
                            return format('CLR%s %s', SIZES[sz], this.getEffectiveAddress(mode, ry, sz));
                        case 0x03:
                            // MOVE from CCR: Move from the Condition Code Register; CCR → Destination (p.225)
                            return format('MOVE CCR,%s', this.getEffectiveAddress(mode, ry));
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
                            sz = opmode;
                            return format('NEG%s %s', SIZES[sz], this.getEffectiveAddress(mode, ry, sz));
                        case 0x03:
                            // MOVE to CCR: Move to Condition Code Register; Source → CCR (p.227)
                            return format('MOVE %s,CCR', this.getEffectiveAddress(mode, ry));
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
                            sz = opmode;
                            return format('NOT%s %s', SIZES[sz], this.getEffectiveAddress(mode, ry, sz));
                        case 0x03:
                            // MOVE to SR: Move to the Status Register;
                            // If Supervisor State Then Source → SR Else TRAP (p.473)
                            return format('MOVE %s,SR', this.getEffectiveAddress(mode, ry, SIZE_WORD));
                    }
                    break;

                case 0x04:
                    switch (opmode) {
                        case 0x00:
                            // NBCD: Negate Decimal with Extend; 0 – Destination(Base10) – X → Destination (p.245)
                            return format('NBCD %s', this.getEffectiveAddress(mode, ry));
                        case 0x01:
                            if (mode == 0x00) {
                                // SWAP: Swap Register Halves; Register 31 – 16 ←→ Register 15 – 0 (p.289)
                                return format('SWAP D%d', ry);
                            } else {
                                // PEA: Push Effective Address; SP – 4 → SP; <ea> → (SP) (p.263)
                                return format('PEA %s', this.getEffectiveAddress(mode, ry));
                            }
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
                        case 0x00:
                            // intentional fall-through
                        case 0x01:
                            // intentional fall-through
                        case 0x02:
                            // TST: Test an Operand; Destination Tested → Condition Codes (p.296)
                            sz = opmode;
                            return format('TST%s %s', SIZES[sz], this.getEffectiveAddress(mode, ry));
                        case 0x03:
                            if (mode == 0x07 && ry == 0x04) {
                                // ILLEGAL: Take Illegal Instruction Trap (p.211)
                                return format('ILLEGAL');
                            }
                            // TAS: Test and Set an Operand;
                            // Destination Tested → Condition Codes; 1 → Bit 7 of Destination (p.290)
                            return format('TAS %s', this.getEffectiveAddress(mode, ry));
                    }
                    break;

                case 0x07:
                    switch (opmode) {
                        case 0x01:
                            switch (mode) {
                                case 0x00:
                                    // intentional fall-through
                                case 0x01:
                                    // TRAP: Trap; (p.292)
                                    return format('TRAP #%d', instruction & 0x0F);
                                case 0x02:
                                    // LINK: Link and Allocate; SP – 4 → SP; An → (SP); SP → An; SP + dn → SP (p.215)
                                    return format('LINK A%d,#%d', ry, this.getImmediateData(SIZE_WORD));
                                case 0x03:
                                    // UNLK: Unlink; An → SP; (SP) → An; SP + 4 → SP (p.298)
                                    return format('UNLK A%d', ry);
                                case 0x04:
                                    // MOVE USP: Move User Stack Pointer;
                                    // If Supervisor State Then USP → An or An → USP Else TRAP (p.475)
                                    return format('MOVE A%d,USP', ry);
                                case 0x05:
                                    return format('MOVE USP,A%d', ry);
                                case 0x06:
                                    switch (ry) {
                                        case 0x00:
                                            // RESET: Reset External Devices;
                                            // If Supervisor State Then Assert RESET Line Else TRAP (p.537)
                                            return format('RESET');
                                        case 0x01:
                                            // NOP: No Operation; (p.251)
                                            return format('NOP');
                                        case 0x02:
                                            // STOP: Load Status Register and Stop;
                                            // If Supervisor State Then Immediate Data → SR; STOP Else TRAP (p.539)
                                            return format('STOP');
                                        case 0x03:
                                            // RTE: Return from Exception
                                            // If Supervisor State Then (SP) → SR; SP + 2 → SP; (SP) → PC; SP + 4 → SP;
                                            // Restore State and Deallocate Stack According to (SP) Else TRAP (p.538)
                                            return format('RTE');
                                        case 0x05:
                                            // RTS: Return from Subroutine; (SP) → PC; SP + 4 → SP (p.273)
                                            return format('RTS');
                                        case 0x06:
                                            // TRAPV: Trap on Overflow; If V Then TRAP (p.295)
                                            return format('TRAPV');
                                        case 0x07:
                                            // RTR: Return and Restore Condition Codes;
                                            // (SP) → CCR; SP + 2 → SP; (SP) → PC; SP + 4 → SP (p.272)
                                            return format('RTR');
                                    }
                            }
                            break;
                        case 0x02:
                            // JSR: Jump to Subroutine; SP – 4 → Sp; PC → (SP); Destination Address → PC (p.213)
                            return format('JSR %s', this.getEffectiveAddress(mode, ry));
                        case 0x03:
                            // JMP: Jump; Destination Address → PC (p.212)
                            return format('JMP %s', this.getEffectiveAddress(mode, ry));
                    }
                    break;
            }
            // rest of cases
            if ((rx == 0x04 || rx == 0x06) && (opmode == 0x02 || opmode == 0x03)) {
                // MOVEM: Move Multiple Registers (p.233)
                dr = (instruction >> 10) & 0x01; // 0: reg to mem; 1: mem to reg
                sz = (instruction >> 6) & 0x01; // 0: word; 1: long
                data = this.registerMaskToStr(this.getImmediateData(SIZE_WORD), dr);
                if (dr == 0x00) {
                    return format('MOVEM.%s %s,%s', sz?'L':'W', data, this.getEffectiveAddress(mode, ry));
                } else {
                    return format('MOVEM.%s %s,%s', sz?'L':'W', this.getEffectiveAddress(mode, ry), data);
                }
            }
            switch (opmode) {
                case 0x07:
                    // LEA: Load Effective Address (p.214)
                    return format('LEA %s,A%d', this.getEffectiveAddress(mode, ry), rx);
                default:
                    data = (instruction >> 6) & 0x01;
                    sz = (instruction >> 7) & 0x03;
                    if (data == 0x00 && sz == 3) {
                        // CHK: Check Register Against Bounds; If Dn < 0 or Dn > Source Then TRAP (p.173)
                        // Note: in this case size == 0x03 means Word! Long is not supported in 68000.
                        return format('CHK %s,D%d', this.getEffectiveAddress(mode, ry, SIZE_WORD), rx);
                    }
            }
            break;

        // 0101 ADDQ/SUBQ/Scc/DBcc/TRAPc c
        case 0x05:
            // ADDQ: 0101 dat 0sz mod reg - dat = 000..111; sz = 00..10
            // SUBQ: 0101 dat 1sz mod reg - sz = 00|01|10
            // DBcc: 0101 cond 11 001 reg - cond = 0000..1111
            // Scc : 0101 cond 11 mod reg - cond = 0000..1111
            sz = opmode & 0x03;
            data = rx;
            if (sz < 0x03) {
                if (opmode < 0x04) {
                    // ADDQ: Add Quick; Immediate Data + Destination → Destination (p.115)
                    return format('ADDQ%s #%d,%s', SIZES[sz], data, this.getEffectiveAddress(mode, ry, sz));
                } else {
                    // SUBQ: Subtract Quick; Destination – Immediate Data → Destination (p.285)
                    return format('SUBQ%s #%d,%s', SIZES[sz], data, this.getEffectiveAddress(mode, ry, sz));
                }
            } else {
                cc = (instruction >> 8) & 0x0F;
                if (mode == 0x01) {
                    // DBcc: Test Condition, Decrement, and Branch;
                    // If Condition False Then (Dn – 1 → Dn; If Dn != – 1 Then PC + dn → PC) (p.194)
                    data = this.getImmediateData(SIZE_WORD);
                    return format('DB%s D%d,*%s%d', CONDITIONS[cc], ry, (data >= 0)?'+':'', data);
                } else {
                    //Scc: Set According to Condition; If Condition True Then 1s → Dest. Else 0s → Destination (p.276)
                    return format('S%s %s', CONDITIONS[cc], this.getEffectiveAddress(mode, ry));
                }
            }
            break;

        // 0110 Bcc/BSR/BRA
        case 0x06:
            cc = (instruction >> 8) & 0x0F;
            data = instruction & 0xFF;
            if (data == 0x00) {
                data = this.getImmediateData(SIZE_WORD);
            } else if (data >= 0x80) {
                data|= 0xFFFFFF00; // sign extension
            }
            switch (cc) {
                case 0:
                    // BRA: Branch Always: PC + dn → PC (p.159)
                    return format('BRA *%s%d', (data >= 0)?'+':'', data);
                case 1:
                    // BSR: Branch to Soubroutine; SP-4 → SP; PC → (SP); PC + dn → PC (p.163)
                    return format('BSR *%s%d', (data >= 0)?'+':'', data);
                default:
                    // Bcc: Branch Conditionally; If Condition True Then PC + dn → PC (p.129)
                    return format('B%s *%s%d', CONDITIONS[cc], (data >= 0)?'+':'', data);
            }
            break;

        // 0111 MOVEQ
        case 0x07:
            // MOVEQ: Move Quick; Immediate Data → Destination (p.238)
            if (((instruction >> 8) & 0x01) == 0x0) {
                data = instruction & 0xFF;
                if (data >= 0x80) {
                    data|= 0xFFFFFF00 // sign extension;
                }
                rx = (instruction >> 9) & 0x07;
                return format('MOVEQ #%d,D%d', data, rx);
            }
            break;

        // 1000 OR/DIV/SBCD
        case 0x08:
            // DIVU: 1000 reg 011 mod reg
            // SBCD: 1000 reg 100 00r reg
            // DIVS: 1000 reg 111 mod reg
            // OR  : 1000 reg opm mod reg - opm = 000|001|010|100|101|110
            rx = (instruction >> 9) & 0x07;
            opmode = (instruction >> 6) & 0x07;
            switch (opmode) {
                case 0x03:
                    // DIVU: Unsigned Divide; Destination ÷ Source → Destination (p.200)
                    // DIVU.W <ea> ,Dn32/16 → 16r – 16q
                    return format('DIVU.W %s,D%d', this.getEffectiveAddress(mode, ry, SIZE_LONG), rx);
                case 0x04:
                    // SBCD: Subtract Decimal with Extend; Destination10 – Source10 – X → Destination (p.274)
                    switch (mode) {
                        case 0x00:
                            return format('SBCD D%d,D%d', ry, rx);
                        case 0x01:
                            return format('SBCD A%d,A%d', ry, rx);
                    }
                    break;
                case 0x07:
                    // DIVS: Signed Divide; Destination ÷ Source → Destination (p.196)
                    // DIVS.W <ea> ,Dn32/16 → 16r – 16q
                    return format('DIVS.W %s,D%d', this.getEffectiveAddress(mode, ry, SIZE_LONG), rx);
            }
            // OR: Inclusive-OR Logical; Source V Destination → Destination (p.254)
            sz = opmode & 0x03;
            if (opmode < 0x04) {
                return format('OR%s %s,D%d', SIZES[sz], this.getEffectiveAddress(mode, ry, sz), rx);
            } else {
                return format('OR%s D%d,%s', SIZES[sz], rx, this.getEffectiveAddress(mode, ry, sz));
            }
            break;

        // 1001 SUB/SUBX
        case 0x09:
            // SUB : 1001 reg opm mod reg - opm = 000|001|010|100|101|110
            // SUBA: 1001 reg opm mod reg - opm = 011|111
            // SUBX: 1001 reg 1sz 00r reg - sz = 00|01|10
            sz = opmode & 0x03;
            if (mode <= 0x01 && opmode >= 0x04 && opmode < 0x07 && sz <= 0x02) {
                // SUBX: Subtract with Extend; Destination – Source – X → Destination (p.287)
                switch (mode) {
                    case 0x00:
                        return format('SUBX%s D%d,D%d', SIZES[sz], ry, rx);
                    case 0x01:
                        return format('SUBX%s A%d,A%d', SIZES[sz], ry, rx);
                }
            }
            if (sz < 0x03) {
                // SUB: Substact; Destination – Source → Destination (p.278)
                if (opmode < 0x04) {
                    return format('SUB%s %s,D%d', SIZES[sz], this.getEffectiveAddress(mode, ry, sz), rx);
                } else {
                    return format('SUB%s D%d,%s', SIZES[sz], rx, this.getEffectiveAddress(mode, ry, sz));
                }
            } else {
                // SUBA: Substact; Destination – Source → Destination (p.281)
                sz = (opmode < 0x04) ? SIZE_WORD : SIZE_LONG;
                return format('SUBA%s %s,D%d', SIZES[sz], this.getEffectiveAddress(mode, ry, sz), rx);
            }
            break;

        // 1010 (Unassigned, Reserved)
        case 0x0A:
            break;

        // 1011 CMP/EOR
        case 0x0B:
            // CMP : 1011 reg opm mod reg
            // CMPA: 1011 reg opm mod reg
            // EOR : 1011 reg opm mod reg - opm = 100|101|110
            // CMPM: 1011 reg 1sz 001 reg
            rx = (instruction >> 9) & 0x07;
            opmode = (instruction >> 6) & 0x07;
            switch (opmode) {
                case 0x00:
                    // intentional fall-through
                case 0x01:
                    // intentional fall-through
                case 0x02:
                    // CMP: Compare; Destination – Source → cc (p.179)
                    sz = opmode;
                    return format('CMP%s %s,D%d', SIZES[sz], this.getEffectiveAddress(mode, ry, sz), rx);
                case 0x03:
                    // CMPA: Compare; Destination – Source → cc (p.181)
                    sz = SIZE_WORD;
                    return format('CMPA%s %s,D%d', SIZES[sz], this.getEffectiveAddress(mode, ry, sz), rx);
                case 0x04:
                    // intentional fall-through
                case 0x05:
                    // intentional fall-through
                case 0x06:
                    mode = (instruction >> 3) & 0x07;
                    ry = instruction & 0x07;
                    sz = opmode & 0x03;
                    if (mode == 0x01) {
                        // CMPM: Compare Memory; Destination – Source → cc (p.185)
                        return format('CMPM%s (A%d)+,(A%d)+', SIZES[sz], ry, rx);
                    } else {
                        // EOR: Exclusive-OR Logical; Source ⊕ Destination → Destination (p.204)
                        return format('EOR%s D%d,%s', SIZES[sz], rx, this.getEffectiveAddress(mode, ry, sz));
                    }
                case 0x07:
                    // CMPA: Compare; Destination – Source → cc (p.181)
                    sz = SIZE_LONG;
                    return format('CMPA%s %s,D%d', SIZES[sz], this.getEffectiveAddress(mode, ry, sz), rx);
            }
            break;

        // 1100 AND/MUL/ABCD/EXG
        case 0x0C:
            // ABCD: 1100 reg 100 00b reg
            // MULS: 1100 reg 111 mod reg
            // MULU: 1100 reg 011 mod reg
            // EXG : 1100 reg 1 opmod reg - opmod = 01000|01001|10001
            // AND : 1100 reg opm mod reg - opm = 000|001|010|110|101|110
            switch (opmode) {
                case 0x03:
                    // MULU: Signed Multiply; Source x Destination → Destination (p.239)
                    return format('MULU.W %s,D%d', this.getEffectiveAddress(mode, ry, SIZE_WORD), rx);
                case 0x04:
                    switch (mode) {
                        // ABCD: Add Decimal with Extend; Source10 + Destination10 + X → Destination (p.106)
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
                    return format('MULS.W %s,D%d', this.getEffectiveAddress(mode, ry, SIZE_WORD), rx);
            }
            // AND: AND Logical; Source Λ Destination → Destination (p.119)
            sz = opmode & 0x03;
            if (opmode < 0x04) {
                return format('AND%s %s,D%d', SIZES[sz], this.getEffectiveAddress(mode, ry, sz), rx);
            } else {
                return format('AND%s D%d,%s', SIZES[sz], rx, this.getEffectiveAddress(mode, ry, sz));
            }
            break;

        // 1101 ADD/ADDX
        case 0x0D:
            rx = (instruction >> 9) & 0x07;
            opmode = (instruction >> 6) & 0x07;
            sz = opmode & 0x3;
            mode = (instruction >> 3) & 0x7;
            if (sz < 3) {
                if (opmode < 4) {
                    // ADD: Add; Source + Destination → Destination; <ea> + Dn → Dn (p.108)
                    return format('ADD%s %s,D%d', SIZES[sz], this.getEffectiveAddress(mode, ry, sz), rx);
                } else {
                    ry = instruction & 0x7;
                    switch (mode) {
                        case 0:
                            // ADDX: Add Extended; Source + Destination + X → Destination (p.117)
                            return format('ADDX%s D%d,D%d', SIZES[sz], ry, rx);
                        case 1:
                            // ADDX: Add Extended; Source + Destination + X → Destination (p.117)
                            return format('ADDX%s -(A%d),-(A%d)', SIZES[sz], ry, rx);
                        default:
                            // ADD: Add; Source + Destination → Destination; Dn + <ea> → <ea> (p.108)
                            return format('ADD%s D%d,%s', SIZES[sz], rx, this.getEffectiveAddress(mode, ry, sz));
                    }
                }
            } else {
                // ADDA: Add Address; Source + Destination → Destination (p.111)
                return format('ADDA.%s %s,A%d', (opmode == 3)?'W':'L', this.getEffectiveAddress(mode, ry, sz), rx);
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
            sz = opmode & 0x03;
            dr = (instruction >> 8) & 0x01;
            data = (instruction >> 5) & 0x1;
            if (sz == 0x03) {
                switch (rx) {
                    case 0x00:
                        // ASL, ASR: Arithmetic Shift (memory shifts);
                        // Destination Shifted By Count → Destination (p.125)
                        return format('AS%s %s', dr?'L':'R', this.getEffectiveAddress(mode, ry));
                    case 0x01:
                        // LSL, LSR: Logical Shift (memory shifts)
                        // Destination Shifted By Count → Destination (p.217)
                        return format('LS%s %s', dr?'L':'R', this.getEffectiveAddress(mode, ry));
                    case 0x02:
                        // ROXL, ROXR; Rotate with Extend (memory shifts)
                        // Destination Rotated By <count> → Destination (p.268)
                        return format('ROX%s %s', dr?'L':'R', this.getEffectiveAddress(mode, ry));
                    case 0x03:
                        // ROL, ROR; Rotate (Without Extend) (memory shifts)
                        // Destination Rotated By <count> → Destination (p.264)
                        return format('RO%s %s', dr?'L':'R', this.getEffectiveAddress(mode, ry));
                }
            } else {
                switch (mode & 0x03) {
                    case 0x00:
                        // ASL, ASR: Arithmetic Shift (register shifts);
                        // Destination Shifted By Count → Destination (p.125)
                        return (data == 0x00)
                            ? format('AS%s%s #%d,D%d', dr?'L':'R', SIZES[sz], rx, ry)
                            : format('AS%s%s D%d,D%d', dr?'L':'R', SIZES[sz], rx, ry);
                    case 0x01:
                        // LSL, LSR: Logical Shift (register shifts);
                        // Destination Shifted By Count → Destination (p.217)
                        return (data == 0x00)
                            ? format('LS%s%s #%d,D%d', dr?'L':'R', SIZES[sz], rx, ry)
                            : format('LS%s%s D%d,D%d', dr?'L':'R', SIZES[sz], rx, ry);
                    case 0x02:
                        // ROXL, ROXR; Rotate with Extend (register shifts);
                        // Destination Rotated By <count> → Destination (p.268)
                        return (data == 0x00)
                            ? format('ROX%s%s #%d,D%d', dr?'L':'R', SIZES[sz], rx, ry)
                            : format('ROX%s%s D%d,D%d', dr?'L':'R', SIZES[sz], rx, ry);
                    case 0x03:
                        // ROL, ROR; Rotate (Without Extend) (register shifts);
                        // Destination Rotated By <count> → Destination (p.264)
                        return (data == 0x00)
                            ? format('RO%s%s #%d,D%d', dr?'L':'R', SIZES[sz], rx, ry)
                            : format('RO%s%s D%d,D%d', dr?'L':'R', SIZES[sz], rx, ry);
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
m68000dasm.prototype.getEffectiveAddress = function(mode, register, size) {
    var data, index;
    switch (mode) {
        // Data Register Direct Mode (p.46)
        case 0:
            return format('D%d', register);
        // Address Register Direct Mode  (p.46)
        case 1:
            return format('A%d', register);
        // Address Register Indirect Mode  (p.46)
        case 2:
            return format('(A%d)', register);
        // Address Register Indirect with Postincrement Mode (p.47)
        case 3:
            return format('(A%d)+', register);
        // Address Register Indirect with Predecrement Mode (p.48)
        case 4:
            return format('-(A%d)', register);
        // Address Register Indirect with Displacement Mode (1 extension word: xn and displ) (p.49)
        case 5:
            return format('(%d,A%d)', this.getImmediateData(SIZE_WORD), register);
        // Address Register Indirect with Index (8-Bit Displacement) (1 extension word) Mode (p.50)
        case 6:
            index = this.memory.getInt8(this.pointer) & 0x7;
            data = this.memory.getInt8(this.pointer + 1);
            this.pointer+= 2;
            return format('(%d,A%d,X%d)', data, register, index);
        case 7:
            switch (register) {
                // Absolute Short Addressing Mode (p.59)
                case 0:
                    return format('(%d).W', this.getImmediateData(SIZE_WORD));
                // Absolute Short Addressing Mode (p.59)
                case 1:
                    return format('(%d).L', this.getImmediateData(SIZE_LONG));
                // Program Counter Indirect with Displacement Mode (p.54)
                case 2:
                    return format('(%d,PC)', this.getImmediateData(SIZE_WORD));
                // Program Counter Indirect with Index (8-Bit Displacement) Mode (p.55)
                case 3:
                    index = this.memory.getInt8(this.pointer) & 0x7;
                    data = this.memory.getInt8(this.pointer + 1);
                    this.pointer+= 2;
                    return format('(%d,PC,X%d)', data, index);
                // Immediate Data (p.60)
                case 4:
                    if (typeof size == 'undefined') throw Error('getEffectiveAddress: undefined size');
                    return format('#%d', this.getImmediateData(size));
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
    var data;
    switch (size) {
        case SIZE_BYTE:
            if (data > 0xFF) throw Error('High Byte of immediate data must be 0');
            data = this.memory.getInt16(this.pointer) & 0xFF;
            this.pointer+= 2;
            return data;
        case SIZE_WORD:
            data = this.memory.getInt16(this.pointer);
            this.pointer+= 2;
            return data;
        case SIZE_LONG:
            data = this.memory.getInt32(this.pointer);
            this.pointer+= 4;
            return data;
        default:
            throw Error('Wrong size value for immediate data')
    }
}

/**
 * Get string representation of register mask
 *
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