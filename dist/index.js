"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.zosSSH = void 0;

var _validations = require("./validations");

var _sshOperations = require("./sshOperations");

/*
*
*/
//
var zosSSH = function zosSSH(argConfig) {
  try {
    //
    var errors = (0, _validations.validaConfiguration)(argConfig);

    if (errors.length > 0) {
      throw new Error({
        error: errors
      });
    } //


    return (0, _sshOperations.sshOperations)(argConfig); //
  } catch (errinit) {
    throw errinit;
  }
}; //


exports.zosSSH = zosSSH;