"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.sshOperations = void 0;

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

var _ssh = require("ssh2");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

//
var log = require('debug')('ZOS-SSH-SFTP:sshOperations'); //


var logDebug = function logDebug(argLine) {
  console.log('...logDebug: ', argLine);
}; //


var options = {
  mode: 511,
  chunkSize: 32768,
  concurrency: 64,
  step: function step(total_transferred, chunk, total) {
    console.log("Total Transferred: ".concat(total_transferred, " Chunk: ").concat(chunk) + " Total: ".concat(total));
  }
}; //

var fileCert2String = function fileCert2String(argFile) {
  try {
    //
    var outStrCert = _fs["default"].readFileSync(argFile.pathPrivateKey, 'utf-8').trim(); //


    return outStrCert; //
  } catch (errGSC) {
    console.log('...ERROR: ', errGSC);
    throw errGSC;
  }

  ;
}; //


var getSShConnection = function getSShConnection(argConfig) {
  return new Promise(function (respOk, respRech) {
    try {
      //
      var configConnection = {
        keepaliveInterval: 2000,
        keepaliveCountMax: 20,
        host: argConfig.host,
        port: argConfig.port || "22",
        username: argConfig.username
      }; //

      if (argConfig.pathPrivateKey) {
        configConnection.privateKey = fileCert2String(argConfig.pathPrivateKey);

        if (argConfig.passphrase) {
          configConnection.passphrase = argConfig.passphrase;
        }
      } else {
        configConnection.password = argConfig.password;
      } //


      log('...configConnection: ', configConnection); //

      var sftpConn = new _ssh.Client();
      sftpConn.on('ready', function () {
        respOk(sftpConn);
      }.bind(this)).on('error', function (argErr) {
        console.log('error: ', argErr, ';');
        respRech(argErr);
      }.bind(this)).on('rekey', function () {
        console.log('...rekey ');
      }.bind(this)).connect(configConnection); //
    } catch (errGSC) {
      console.log('...ERROR: ', errGSC);
      respRech(errGSC);
    }
  });
}; //


var getSftpConn = function getSftpConn(argSSHconn) {
  return new Promise(function (respOk, respRech) {
    try {
      argSSHconn.sftp(function (err, sftpConn) {
        if (err) {
          respRech(err);
        } else {
          respOk(sftpConn);
        }
      }.bind(this));
    } catch (errGSC) {
      console.log('...ERROR: ', errGSC);
      respRech(errGSC);
    }
  });
}; //


var sftpFastPut = function sftpFastPut(argSftp, argFile, argOpt) {
  return new Promise(function (respOk, respRech) {
    try {
      //
      console.log('...sftpFastPut:: argFile: ', argFile.localFullFilePath, ' argSftp.fastPut: ', argSftp.fastPut);
      console.log('.....EXISTE:: ', _fs["default"].existsSync(argFile.localFullFilePath), ';'); //

      argSftp.fastPut(argFile.localFullFilePath, argFile.remoteFullFilePath, argOpt, function (err) {
        if (err) {
          console.log('....ERROR EN FASTPUT:: ', err);
          respRech(_objectSpread(_objectSpread({
            resultCode: 1001
          }, argFile), err));
        } else {
          console.log('File uploaded:: local: ', argFile.fileName, ' remote: ', argFile.remoteFullFilePath, ';');
          respOk(_objectSpread(_objectSpread({
            resultCode: 0
          }, argFile), {}, {
            msg: 'file uploaded'
          }));
        }
      }); //
    } catch (errGSC) {
      console.log('...ERROR: ', errGSC);
      respRech(_objectSpread(_objectSpread({
        resultCode: 1000
      }, argFile), errGSC));
    }
  });
}; //


var sshCommand = function sshCommand(argSSHconn, argFile, argCmd) {
  return new Promise(function (respOk, respRech) {
    try {
      //
      var strLog = "";
      argSSHconn.exec(argFile[argCmd], function (errCmd, stream) {
        if (errCmd) {
          respRech(_objectSpread(_objectSpread({
            resultCode: 1003
          }, argFile), errCmd));
        } else {
          stream.on('data', function (data, extended) {
            console.log('......RESULTADO: ' + data.toString().trim());

            if (strLog.length > 0) {
              strLog = strLog + "\n";
            }

            strLog = strLog + data.toString().trim();
          }.bind(this)).stderr.on('data', function (data) {
            // console.log('STDERR: type: ',(typeof data),' data: ',data) ;
            respRech(_objectSpread(_objectSpread({
              resultCode: 1005,
              message: "ERROR ejecutando '".concat(argFile[argCmd], "'  ")
            }, argFile), {}, {
              errorSSH: typeof data == "string" ? data : data.toString('utf8')
            }));
          }.bind(this));
          stream.on('exit', function () {
            /* console.log('....no exit') ; */
          });
          stream.on('end', function () {
            respOk(_objectSpread(_objectSpread({
              resultCode: 0
            }, argFile), {}, {
              msg: 'command executed',
              log: strLog
            }));
          }.bind(this)); //
        }
      }.bind(this)); //
    } catch (errGSC) {
      console.log('...ERROR: ', errGSC);
      respRech(_objectSpread(_objectSpread({
        resultCode: 1004
      }, argFile), errGSC));
    }
  });
}; //


var sshOperations = function sshOperations(argConfig) {
  //
  var sshTransmit = function sshTransmit(argFiles2Transmit) {
    return new Promise(function (respOk, respRech) {
      try {
        //
        var argArrayFiles = argFiles2Transmit.files || [];

        for (var posFF = 0; posFF < argArrayFiles.length; posFF++) {
          var fileElem = argArrayFiles[posFF];
          console.log('...(A) fileElem: ', fileElem);
          fileElem.log = [];
          fileElem.localFullFilePath = _path["default"].join(fileElem.localPath, fileElem.fileName);
          fileElem.remoteFullFilePath = argConfig.remoteTempPath + fileElem.fileName; //fileElem.command            = ` tso -t "delete '${fileElem.remoteDataset}' "  && cp ${fileElem.remoteFullFilePath} "//'${fileElem.remoteDataset}'" `

          if (!fileElem.dsnDcb) {
            fileElem.dsnDcb = "";
          }

          fileElem.command = " cp -vvv -W \"seqparms='".concat(fileElem.dsnDcb, "'\" ").concat(fileElem.remoteFullFilePath, " \"//'").concat(fileElem.remoteDataset, "'\" ") + " && rm ".concat(fileElem.remoteFullFilePath, " ");
          argArrayFiles[posFF] = fileElem;
          console.log('...(B) fileElem: ', fileElem);
        } //


        var sshConnection = {};
        getSShConnection(_objectSpread({}, argConfig)).then(function (respConn) {
          sshConnection = respConn;
          return getSftpConn(sshConnection);
        }).then(function (sftpConn) {
          var arrayPromises = [];

          for (var posF = 0; posF < argArrayFiles.length; posF++) {
            var objFile = argArrayFiles[posF];
            arrayPromises.push(sftpFastPut(sftpConn, objFile, options));
          }

          return Promise.all(arrayPromises);
        }).then(function (resuPut) {
          // console.log('......resuPut: ',resuPut) ;
          var promisesCopy = [];

          for (var posF = 0; posF < argArrayFiles.length; posF++) {
            argArrayFiles[posF].log.push(resuPut);
            var objFile = argArrayFiles[posF];
            promisesCopy.push(sshCommand(sshConnection, objFile, 'command'));
          }

          return Promise.all(promisesCopy);
        }).then(function (resCP) {
          console.log('......resCP: ', resCP);
          var promisesETT = [];
          var ettExecuted = {};

          for (var posF = 0; posF < argArrayFiles.length; posF++) {
            argArrayFiles[posF].log.push(resCP);
            var objFile = argArrayFiles[posF];

            if (objFile.postTransferJclOk && !ettExecuted[objFile.postTransferJclOk]) {
              objFile.submitCommand = " submit \"//'".concat(objFile.postTransferJclOk, "'\" ");
              promisesETT.push(sshCommand(sshConnection, objFile, 'submitCommand'));
              ettExecuted[objFile.postTransferJclOk] = true;
            }
          }

          return Promise.all(promisesETT);
        }).then(function (sftpEnds) {
          sshConnection.end();
          respOk(argArrayFiles);
        })["catch"](function (errSFTP) {
          try {
            sshConnection.end();
          } catch (errEND) {
            /* no hago nada */
          }

          respRech(errSFTP);
        }); //
      } catch (errSFD) {
        console.log('...errSFD: ', errSFD);
        respRech(errSFD);
      }
    });
  }; //


  return {
    transmit: sshTransmit
  }; //
}; //


exports.sshOperations = sshOperations;