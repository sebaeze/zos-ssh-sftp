"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.gdgLAstVersion = void 0;

/*
*
*/
var regexFile = /NONVSAM ---- (.*)/g;
var regexVersion = /.G(.*)V/g; //

var gdgLAstVersion = function gdgLAstVersion(argArr, argFile) {
  try {
    //
    var outNewVersion = 1;
    var outFileLastVersion = "";
    var fileInterface = argArr.find(function (fileEnc) {
      return fileEnc.localFullFilePath == argFile.localFullFilePath;
    }); // console.log('...fileInterface: ',fileInterface) ;

    if (!fileInterface | fileInterface.log.length == 0) {
      return "";
    } //


    outFileLastVersion = regexFile.exec(fileInterface.log); // console.log('...regex::  fileInterface.log: ',fileInterface.log,' outFileLastVersion: ',outFileLastVersion);

    if (outFileLastVersion.length < 2) {
      console.log('...ERROR en regex::  fileInterface.log: ', fileInterface.log, ' outFileLastVersion: ', outFileLastVersion);
      throw new Error("ERROR: regex GDG entry");
    }

    outFileLastVersion = String(outFileLastVersion[1]).trim(); //

    var currentVersion = regexVersion.exec(fileInterface.log);

    if (currentVersion && currentVersion.length > 1) {
      outNewVersion = currentVersion[1];

      if (typeof outNewVersion == "string") {
        outNewVersion = parseInt(outNewVersion.trim());
      }

      outNewVersion = outNewVersion + 1;
    } //


    outNewVersion = "0000" + outNewVersion;
    outNewVersion = outNewVersion.substr(outNewVersion.length - 4, 4);
    outFileLastVersion = outFileLastVersion.replace(currentVersion[0], ".G".concat(outNewVersion, "V")); //

    return outFileLastVersion; //
  } catch (errGDG) {
    throw errGDG;
  }
}; //


exports.gdgLAstVersion = gdgLAstVersion;