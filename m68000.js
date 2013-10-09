/*

### Single- And Double Operand Operations ###

+ 					Arithmetic addition or postincrement indicator.
– 					Arithmetic subtraction or predecrement indicator.
× 					Arithmetic multiplication.
÷ 					Arithmetic division or conjunction symbol.
~ 					Invert; operand is logically complemented.
Λ 					Logical AND
V 					Logical OR
⊕					Logical exclusive OR
→ 					Source operand is moved to destination operand.
←→ 					Two operands are exchanged.
<op> 				Any double-operand operation.
<operand>tested		Operand is compared to zero and the condition codes are set appropriately.
sign-extended		All bits of the upper portion are made equal to the high-order bit of the lower portion.

### Other Operations ###

TRAP				Equivalent to Format ÷Offset Word → (SSP); SSP – 2 → SSP; PC → (SSP); SSP – 4 → SSP; SR
					→ (SSP); SSP – 2 → SSP; (Vector) → PC
STOP				Enter the stopped state, waiting for interrupts.
<operand>10			The operand is BCD; operations are performed in decimal.
If <condition>		Test the condition. If true, the operations after “then”are performed. If the condition is false and the
then <operations>	optional “else”clause is present, the operations after “else”are performed. If the condition is false
else <operations>	and else is omitted, the instruction performs no operation. Refer to the Bcc instruction description
					as an example.

### Register Specifications ###

An 					Any Address Register n (example: A3 is address register 3)
Ax, Ay 				Source and destination address registers, respectively.
Dc 					Data register D7–D0, used during compare.
Dh, Dl 				Data register’s high- or low-order 32 bits of product.
Dn 					Any Data Register n (example: D5 is data register 5)
Dr, Dq 				Data register’s remainder or quotient of divide.
Du 					Data register D7–D0, used during update.
Dx, Dy 				Source and destination data registers, respectively.
MRn 				Any Memory Register n.
Rn 					Any Address or Data Register
Rx, Ry 				Any source and destination registers, respectively.
Xn 					Index Register

### Data Format And Type ###

+ inf 				Positive Infinity
<fmt> 				Operand Data Format: Byte (B), Word (W), Long (L), Single (S), Double (D), Extended (X), or
					Packed (P).
B, W, L 			Specifies a signed integer data type (twos complement) of byte, word, or long word.
D 					Double-precision real data format (64 bits).
k 					A twos complement signed integer (–64 to +17) specifying a number’s format to be stored in the
					packed decimal format.
P 					Packed BCD real data format (96 bits, 12 bytes).
S 					Single-precision real data format (32 bits).
X 					Extended-precision real data format (96 bits, 16 bits unused).
– inf 				Negative Infinity

### Subfields and Qualifiers ###

#<xxx> or #<data> 	Immediate data following the instruction word(s).
() 					Identifies an indirect address in a register.
[] 					Identifies an indirect address in memory.
bd 					Base Displacement
ccc 				Index into the MC68881/MC68882 Constant ROM
dn 					Displacement Value, n Bits Wide (example: d16 is a 16-bit displacement).
LSB 				Least Significant Bit
LSW 				Least Significant Word
MSB 				Most Significant Bit
MSW					Most Significant Word
od 					Outer Displacement
SCALE 				A scale factor (1, 2, 4, or 8 for no-word, word, long-word, or quad-word scaling, respectively).
SIZE 				The index register’s size (W for word, L for long word).
{offset:width} 		Bit field selection.

### Register Names ###

CCR 				Condition Code Register (lower byte of status register)
DFC 				Destination Function Code Register
FPcr 				Any Floating-Point System Control Register (FPCR, FPSR, or FPIAR)
FPm, FPn 			Any Floating-Point Data Register specified as the source or destination, respectively.
IC, DC, IC/DC 		Instruction, Data, or Both Caches
MMUSR 				MMU Status Register
PC 					Program Counter
Rc 					Any Non Floating-Point Control Register
SFC 				Source Function Code Register
SR 					Status Register

### Register Codes ###

* 					General Case
C 					Carry Bit in CCR
cc 					Condition Codes from CCR
FC 					Function Code
N 					Negative Bit in CCR
U 					Undefined, Reserved for Motorola Use.
V 					Overflow Bit in CCR
X 					Extend Bit in CCR
Z 					Zero Bit in CCR
—					Not Affected or Applicable.

### Stack Pointers ###

ISP 				Supervisor/Interrupt Stack Pointer
MSP					Supervisor/Master Stack Pointer
SP 					Active Stack Pointer
SSP 				Supervisor (Master or Interrupt) Stack Pointer
USP 				User Stack Pointer

### Miscellaneous ###

<ea> 				Effective Address
<label> 			Assemble Program Label
<list> 				List of registers, for example D3–D0.
LB 					Lower Bound
m 					Bit m of an Operand
m–n 				Bits m through n of Operand
UB 					Upper Bound

*/

/*
 ______________________________ ______________________________
[______________________________|______________________________] D0
[______________________________|______________________________] :
[______________________________|______________________________] D7
31                             15                             0
 ______________________________ ______________________________
[______________________________|______________________________] A0
[______________________________|______________________________] :
[______________________________|______________________________] A6
31                             15                             0
 ______________________________ ______________________________
[______________________________|______________________________] A7 USP - User Stack Pointer
31                             15                             0
 ______________________________ ______________________________
[______________________________|______________________________] PC - Program Counter
31                             15                             0
                                _ _ _ _ _ _ _ _ ______________
                               |_ _ _ _ _ _ _ _|____X_N_Z_V_C_] CCR - Condition Code Register
                               15              7              0
*/

var m68000 = function(memory) {
	this.memory = memory;
	this.registersBuffer = new ArrayBuffer(18 * 32);
	this.registers = new DataView(this.registersBuffer);
}

m68000.prototype.disassemble = function (address) {
	var instruction = this.memory.getUint16(address);
	var opcode = (instruction >> 12) & 0x0F,
		Rx, Ry, opmode, mode, Dn;
	switch (opcode) {

		// 0000 Bit Manipulation/MOVEP/Immediate
		// 0001 Move Byte
		// 0010 Move Long
		// 0011 Move Word
		// 0100 Miscellaneous
		// 0101 ADDQ/SUBQ/Scc/DBcc/TRAPc c
		// 0110 Bcc/BSR/BRA
		// 0111 MOVEQ
		// 1000 OR/DIV/SBCD
		// 1001 SUB/SUBX
		// 1010 (Unassigned, Reserved)
		// 1011 CMP/EOR

		// 1100 AND/MUL/ABCD/EXG
		case 12:
			if (((instruction >> 4) & 0x1F) == 0x10) {
				// ABCD: Source10 + Destination10 + X → Destination #106
				Rx = (instruction >> 9) & 0x07;
				Ry = instruction & 0x07;
				mode = (instruction >> 3) & 0x01;
				if (mode == 0) {
					return { bytes: 2, str: 'ABCD D'+Ry+', D'+Rx };
				} else {
					return { bytes: 2, str: 'ABCD -(A'+Ry+'), -(A'+Rx+')' };
				}
			}
			break;

		// 1101 ADD/ADDX
		case 13:
			// ADD: Source + Destination → Destination #108
			Rx = (instruction >> 9) & 0x07;
			opmode = (instruction >> 6) & 0x07;
			mode = (instruction >> 3) & 0x07;
			Ry = instruction & 0x07;
			if (opmode <= 7) {

			} else {

			}
			break;

		// 1110 Shift/Rotate/Bit Field
		// 1111 Coprocessor Interface/MC68040 and CPU32 Extensions

	}
	throw Error('Unknown instruction');
}

m68000.prototype.addressingModeToStr = function (address, mode, n) {
	switch (mode) {

		// Data Register Direct Mode #46
		case 0:
			return { bytes: 0, str: 'D'+n };

		// Address Register Direct Mode  #46
		case 1:
			return { bytes: 0, str: 'A'+n };

		// Address Register Indirect Mode  #46
		case 2:
			return { bytes: 0, str: '(A'+n+')' };

		// Address Register Indirect with Postincrement Mode #47
		case 3:
			return { bytes: 0, str: '(A'+n+')+' };

		// Address Register Indirect with Predecrement Mode #48
		case 4:
			return { bytes: 0, str: '-(A'+n+')' };

		/* Address Register Indirect with Displacement Mode (1 extension word: xn and displ) #49
		In the address register indirect with displacement mode, the operand is in memory. The sum
		of the address in the address register, which the effective address specifies, plus the sign-
		extended 16-bit displacement integer in the extension word is the operand’s address in
		memory. */
		case 5:
			var d = this.memory.getInt8(address+1);
			return { bytes: 1, str: '(d,A'+n+')' }; //d16

		/* Address Register Indirect with Index (8-Bit Displacement) (1 extension word) Mode #50
		This addressing mode requires one extension word that contains an index register indicator
		and an 8-bit displacement. The index register indicator includes size and scale information.
		In this mode, the operand is in memory. The operand’s address is the sum of the address
		register’s contents; the sign-extended displacement value in the extension word’s low-order
		eight bits; and the index register’s sign-extended contents (possibly scaled). The user must
		specify the address register, the displacement, and the index register in this mode. */
		case 6:
			return { bytes: 0, str: '(d,A'+n+',X'+n+')' }; //d8

		case 7:
			switch (n) {
				// (xxx).W
				case 0:

				// (xxx).L
				case 1:

				// (d16,PC)
				case 2:

				// (d8,PC,Xn)
				case 3:
			}
	}
}

module.exports = m68000;