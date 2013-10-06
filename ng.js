
var KILOBYTE = 1024;
var MEGABYTE = 1024 * KILOBYTE;
var MEGABIT = MEGABYTE >> 3;


// CPU: HD68HC000PS12 12 MHz

var programROM = new Buffer(2 * MEGABYTE);

var RAM = new Buffer(64 * KILOBYTE);

var fixCharacter = new Buffer(128 * KILOBYTE);

var line3DSpriteCharacter = new Buffer(128 * MEGABIT);

var VRAM = new Buffer (64 * KILOBYTE + 4 * KILOBYTE);

// color: 16 bits
// b1 b2 b3 b4 g1 g2 g3 g4 r1 r2 r3 r4 b0 g0 r0 x
// x=rgb-1

var background = 0x000000;

var color = 0x000000;

// RGB Output

// Memory card

// Interrupts:
// * VBlank
// * Timer

// var sound = ...
// 1) 1 	YM-2610
// 2) 62KB	Program
// 3) 2KB	Working RAM
// 4) 16MB	ADPCM-A
// 5) 16MB	ADPCM-B
// 6) Z80A	CPU 4MHz

// var Screen
// * NTSC
// * PAL

// 1 RESET
// 2 System Initialization
// 3 Game Initialization
// 4 Eye catcher
// 6 Game loop
