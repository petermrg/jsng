/*

### Single- And Double Operand Operations ###

+                 Arithmetic addition or postincrement indicator.
–                 Arithmetic subtraction or predecrement indicator.
×                 Arithmetic multiplication.
÷                 Arithmetic division or conjunction symbol.
~                 Invert; operand is logically complemented.
Λ                 Logical AND
V                 Logical OR
⊕                 Logical exclusive OR
→                 Source operand is moved to destination operand.
←→                Two operands are exchanged.
<op>              Any double-operand operation.
<operand>tested   Operand is compared to zero and the condition codes are set appropriately.
sign-extended     All bits of the upper portion are made equal to the high-order bit of the lower portion.

### Other Operations ###

TRAP              Equivalent to Format ÷Offset Word → (SSP); SSP – 2 → SSP; PC → (SSP); SSP – 4 → SSP; SR
                  → (SSP); SSP – 2 → SSP; (Vector) → PC
STOP              Enter the stopped state, waiting for interrupts.
<operand>10       The operand is BCD; operations are performed in decimal.
If <condition>    Test the condition. If true, the operations after “then”are performed. If the condition is false and the
then <operations> optional “else”clause is present, the operations after “else”are performed. If the condition is false
else <operations> and else is omitted, the instruction performs no operation. Refer to the Bcc instruction description
                  as an example.

### Register Specifications ###

An                Any Address Register n (example: A3 is address register 3)
Ax, Ay            Source and destination address registers, respectively.
Dc                Data register D7–D0, used during compare.
Dh, Dl            Data register’s high- or low-order 32 bits of product.
Dn                Any Data Register n (example: D5 is data register 5)
Dr, Dq            Data register’s remainder or quotient of divide.
Du                Data register D7–D0, used during update.
Dx, Dy            Source and destination data registers, respectively.
MRn               Any Memory Register n.
Rn                Any Address or Data Register
Rx, Ry            Any source and destination registers, respectively.
Xn                Index Register

### Data Format And Type ###

+ inf             Positive Infinity
<fmt>             Operand Data Format: Byte (B), Word (W), Long (L), Single (S), Double (D), Extended (X), or
                  Packed (P).
B, W, L           Specifies a signed integer data type (twos complement) of byte, word, or long word.
D                 Double-precision real data format (64 bits).
k                 A twos complement signed integer (–64 to +17) specifying a number’s format to be stored in the
                  Packed decimal format.
P                 Packed BCD real data format (96 bits, 12 bytes).
S                 Single-precision real data format (32 bits).
X                 Extended-precision real data format (96 bits, 16 bits unused).
– inf             Negative Infinity

### Subfields and Qualifiers ###

#<xxx> or #<data> Immediate data following the instruction word(s).
()                Identifies an indirect address in a register.
[]                Identifies an indirect address in memory.
bd                Base Displacement
ccc               Index into the MC68881/MC68882 Constant ROM
dn                Displacement Value, n Bits Wide (example: d16 is a 16-bit displacement).
LSB               Least Significant Bit
LSW               Least Significant Word
MSB               Most Significant Bit
MSW               Most Significant Word
od                Outer Displacement
SCALE             A scale factor (1, 2, 4, or 8 for no-word, word, long-word, or quad-word scaling, respectively).
SIZE              The index register’s size (W for word, L for long word).
{offset:width}    Bit field selection.

### Register Names ###

CCR               Condition Code Register (lower byte of status register)
DFC               Destination Function Code Register
FPcr              Any Floating-Point System Control Register (FPCR, FPSR, or FPIAR)
FPm, FPn          Any Floating-Point Data Register specified as the source or destination, respectively.
IC, DC, IC/DC     Instruction, Data, or Both Caches
MMUSR             MMU Status Register
PC                Program Counter
Rc                Any Non Floating-Point Control Register
SFC               Source Function Code Register
SR                Status Register

### Register Codes ###

*                 General Case
C                 Carry Bit in CCR
cc                Condition Codes from CCR
FC                Function Code
N                 Negative Bit in CCR
U                 Undefined, Reserved for Motorola Use.
V                 Overflow Bit in CCR
X                 Extend Bit in CCR
Z                 Zero Bit in CCR
—                 Not Affected or Applicable.

### Stack Pointers ###

ISP               Supervisor/Interrupt Stack Pointer
MSP               Supervisor/Master Stack Pointer
SP                Active Stack Pointer
SSP               Supervisor (Master or Interrupt) Stack Pointer
USP               User Stack Pointer

### Miscellaneous ###

<ea>              Effective Address
<label>           Assemble Program Label
<list>            List of registers, for example D3–D0.
LB                Lower Bound
m                 Bit m of an Operand
m–n               Bits m through n of Operand
UB                Upper Bound

*/

/*
╭───────────────────────────────┬───────────────────────────────╮
│                               │                               │ D0
├───────────────────────────────┼───────────────────────────────┤ :
│                               │                               │ D7
╰───────────────────────────────┴───────────────────────────────╯
31                              15                             0

╭───────────────────────────────┬───────────────────────────────╮
│                               │                               │ A0
├───────────────────────────────┼───────────────────────────────┤ :
│                               │                               │ A6
├───────────────────────────────┼───────────────────────────────┤
│                               │                               │ A7/USP - User Stack Pointer
╰───────────────────────────────┴───────────────────────────────╯
31                              15                             0

╭───────────────────────────────┬───────────────────────────────╮
│                               │                               │ PC - Program Counter
╰───────────────────────────────┴───────────────────────────────╯
31                              15                             0

╭─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─╮
│                               │ │ │ │ │ │ │ │ │ │ │ │X│N│Z│V│C│ CCR - Condition Code Register
╰─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─╯
31                              15                     4 3 2 1 0

*/

/*

*ABCD
*ADD
*ADDA
*ADDI
*ADDQ
*ADDX
*AND
*ANDI
*ANDI to CCR
ANDI to SR
*ASL,ASR
*Bcc
*BCHG
*BCLR
*BRA
*BSET
*BSR
*BTST
*CHK
*CLR
*CMP
*CMPA
*CMPI
*CMPM
*DBcc
*DIVS
*DIVU
*EOR
*EORI
*EORI to CCR
EORI to SR
*EXG
*EXT
*ILLEGAL
*JMP
*JSR
*LEA
*LINK
*LSL,LSR
*MOVE
*MOVEA
*MOVE to CCR
*MOVE from SR
MOVE to SR
MOVE USP
*MOVEM
*MOVEP
*MOVEQ
*MULS
*MULU
*NBCD
*NEG
*NEGX
*NOP
*NOT
*OR
*ORI
*ORI to CCR
ORI to SR
-PEA
RESET
ROL,ROR
ROXL,ROXR
RTE
RTR
RTS
SBCD
Scc
STOP
SUB
SUBA
SUBI
SUBQ
SUBX
SWAP
TAS
TRAP
TRAPV
TST
UNLK
 */

var m68000 = function(memory) {
    this.memory = memory;
    this.registersBuffer = new ArrayBuffer(18 * 32);
    this.registers = new DataView(this.registersBuffer);
}


module.exports = m68000;