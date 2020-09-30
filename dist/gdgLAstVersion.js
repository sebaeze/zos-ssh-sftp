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

var log = require('debug')('ZOS-SSH-SFTP:GDG_UTIL'); //


var gdgLAstVersion = function gdgLAstVersion(argArr, argFile) {
  try {
    //
    var outNewVersion = 1;
    var outFileLastVersion = "";
    var fileInterface = argArr.find(function (fileEnc) {
      return fileEnc.localFullFilePath == argFile.localFullFilePath;
    });

    if (!fileInterface) {
      return "";
    } //


    var logListcat = fileInterface.log || "";
    outFileLastVersion = regexFile.exec(logListcat || "  ");

    if (outFileLastVersion === null) {
      outFileLastVersion = [];
    }

    ;

    if (outFileLastVersion.length < 2) {
      console.log('...ERROR:: Probably It is not a GDG or there is no entry:: log: ', logListcat, ' outFileLastVersion: ', outFileLastVersion);
      outFileLastVersion = fileInterface.GDG_BASE + ".G0000V00";

      if (logListcat.length === 0) {
        logListcat = outFileLastVersion;
      }

      ; // throw new Error("ERROR: regex GDG entry");
    } else {
      outFileLastVersion = String(outFileLastVersion[1]).trim();
    }

    ; //

    var dsnLastPart = logListcat.split(".");
    dsnLastPart = dsnLastPart[dsnLastPart.length - 1];
    var currentVersion = regexVersion.exec(".".concat(dsnLastPart)); //log("..currentVersion: ",currentVersion," logListcat: ",logListcat,";") ;

    if (currentVersion && currentVersion.length > 1) {
      outNewVersion = currentVersion[1];

      if (typeof outNewVersion == "string") {
        outNewVersion = parseInt(outNewVersion.trim());
      }

      outNewVersion = outNewVersion + 1;
    } else {
      log("....no existe currentVersion:: ");
      currentVersion = 1;
    }

    ; //

    outNewVersion = "0000" + outNewVersion;
    outNewVersion = outNewVersion.substr(outNewVersion.length - 4, 4);
    outFileLastVersion = outFileLastVersion.replace(currentVersion[0], ".G".concat(outNewVersion, "V")); //

    return outFileLastVersion; //
  } catch (errGDG) {
    throw errGDG;
  }
}; //


exports.gdgLAstVersion = gdgLAstVersion;