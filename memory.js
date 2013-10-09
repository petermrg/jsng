/**
 * Memory
 *
 * @param {integer} size
 * @param {integer} startAddress
 */
var Memory = function(size, startAddress) {
	this.buffer = new ArrayBuffer(size);
	this.data = new DataView(this.buffer); // https://developer.mozilla.org/en-US/docs/Web/API/DataView
	this.startAddress = startAddress || 0;
	this.littleEndian = false;
}

Memory.prototype.getInt8 = function (address) {
	return this.data.getInt8(address - this.startAddress);
}

Memory.prototype.getUint8 = function (address) {
	return this.data.getUint8(address - this.startAddress);
}

Memory.prototype.getInt16 = function (address) {
	return this.data.getInt16(address - this.startAddress, this.littleEndian);
}

Memory.prototype.getUint16 = function (address) {
	return this.data.getUint16(address - this.startAddress, this.littleEndian);
}

Memory.prototype.getInt32 = function (address) {
	return this.data.getInt32(address - this.startAddress, this.littleEndian);
}

Memory.prototype.setInt8 = function (address, value) {
	this.data.setInt8(address - this.startAddress, value);
}

Memory.prototype.setInt16 = function (address, value) {
	this.data.setInt16(address - this.startAddress, value, this.littleEndian);
}

Memory.prototype.setUint16 = function (address, value) {
	this.data.setUint16(address - this.startAddress, value, this.littleEndian);
}

Memory.prototype.setInt32 = function (address, value) {
	this.data.setInt32(address - this.startAddress, value, this.littleEndian);
}

module.exports = Memory;