"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.sshOperations = void 0;

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

var _ssh = require("ssh2");

var _gdgLAstVersion = require("./gdgLAstVersion");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

//
var log = require('debug')('ZOS-SSH-SFTP:sshOperations');

var logSSH = require('debug')('BORRAR_ZOS-SSH-SFTP:SSH');

var logEvent = require('debug')('ZOS-SSH-SFTP:EVENTS'); //


var VALID_CONFIGURATION = {
  keepaliveInterval: true,
  keepaliveCountMax: true,
  host: true,
  port: true,
  username: true,
  debug: true,
  privateKey: true,
  passphrase: true,
  password: true
};
var options = {
  mode: 511,

  /*
  chunkSize: 32768,
  concurrency: 64,
  */
  chunkSize: 3276,
  concurrency: 4,
  //
  step: function step(total_transferred, chunk, total) {
    log("Total Transferred: ".concat(total_transferred, " Chunk: ").concat(chunk) + " Total: ".concat(total));
  }
}; //

var fileCert2String = function fileCert2String(argFile) {
  try {
    //
    var outStrCert = _fs["default"].readFileSync(argFile, 'utf-8').trim(); //


    return outStrCert; //
  } catch (errGSC) {
    log('...ERROR: ', errGSC);
    throw errGSC;
  }

  ;
}; //


var getSShConnection = function getSShConnection(argConfig) {
  return new Promise(function (respOk, respRech) {
    try {
      // Defaults
      var configConnection = {
        keepaliveInterval: 2000,
        keepaliveCountMax: 40,
        host: argConfig.host,
        port: argConfig.port || "22",
        username: argConfig.username,
        debug: logSSH
      }; //

      if (argConfig.pathPrivateKey) {
        argConfig.privateKey = fileCert2String(argConfig.pathPrivateKey);

        if (argConfig.passphrase) {
          configConnection.passphrase = argConfig.passphrase;
        }
      } else {
        configConnection.password = argConfig.password;
      } //


      for (var keyC in argConfig) {
        if (VALID_CONFIGURATION[keyC] && VALID_CONFIGURATION[keyC] == true) {
          configConnection[keyC] = argConfig[keyC];
        }
      } //


      log('...configConnection: ', configConnection); //

      var sftpConn = new _ssh.Client();
      sftpConn.on('ready', function () {
        log('.....On.Ready: ');
        respOk(sftpConn);
      }.bind(this)).on('error', function (argErr) {
        log('error: ', argErr, ';');
        respRech(argErr);
      }.bind(this)).on('rekey', function () {
        log('...rekey ');
      }.bind(this)).connect(configConnection); //
    } catch (errGSC) {
      log('...ERROR: ', errGSC);
      respRech(errGSC);
    }
  });
}; //


var getSftpConn = function getSftpConn(argSSHconn) {
  return new Promise(function (respOk, respRech) {
    try {
      //
      argSSHconn.sftp(function (err, sftpConn) {
        if (err) {
          respRech(err);
        } else {
          respOk(sftpConn);
        }
      }.bind(this)); //

      argSSHconn.on('error', function (argErr) {
        log('ERROR:: getSftpConn: ', argErr, ';');
        respRech(argErr);
      }.bind(this)).on('end', function () {
        log('...ON::END::getSftpConn... ');
      }.bind(this)).on('WRITE', function (reqID, handle, offset, data) {
        log('...ON::WRITE::getSftpConn...reqID: ', reqID, ' offset: ', offset, ';');
      }.bind(this)).on('CLOSE', function (reqID) {
        log('...ON::CLOSE::getSftpConn...reqID: ', reqID);
      }.bind(this)); //
    } catch (errGSC) {
      log('...ERROR: ', errGSC);
      respRech(errGSC);
    }
  });
}; //


var sftpFastPut = function sftpFastPut(argSftp, argFile, argOpt) {
  return new Promise(function (respOk, respRech) {
    try {
      //
      log('...sftpFastPut:: argFile: ', argFile.localFullFilePath, ' argSftp.fastPut: ', argSftp.fastPut);
      log('.....EXISTE:: ', _fs["default"].existsSync(argFile.localFullFilePath), ';'); //

      argSftp.fastPut(argFile.localFullFilePath, argFile.remoteFullFilePath, argOpt, function (err) {
        if (err) {
          log('....ERROR EN FASTPUT:: ', err);
          respRech(_objectSpread(_objectSpread({
            resultCode: 1001
          }, argFile), err));
        } else {
          log('File uploaded:: local: ', argFile.fileName, ' remote: ', argFile.remoteFullFilePath, ';');
          respOk(_objectSpread(_objectSpread({
            resultCode: 0
          }, argFile), {}, {
            msg: 'file uploaded'
          }));
        }
      }); //
    } catch (errGSC) {
      log('...ERROR: ', errGSC);
      respRech(_objectSpread(_objectSpread({
        resultCode: 1000
      }, argFile), errGSC));
    }
  });
}; //


var sshCommand = function sshCommand(argSSHconn, argFile, argCmd) {
  var argOpt = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {
    flagRejectOnStderr: true
  };
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
            log('......RESULTADO: ' + data.toString().trim());

            if (strLog.length > 0) {
              strLog = strLog + "\n";
            }

            strLog = strLog + data.toString().trim();
          }.bind(this)).on('close', function (code, signal) {
            log('Stream: CLOSE: code: ', code, ' signal: ', signal, ';'); // conn.end();
          }.bind(this)).stderr.on('data', function (data) {
            log('STDERR: error: ', typeof data == "string" ? data : data.toString('utf8'), ';');

            if (argOpt.flagRejectOnStderr == true) {
              respRech(_objectSpread(_objectSpread({
                resultCode: 1005,
                message: "ERROR ejecutando '".concat(argFile[argCmd], "'  ")
              }, argFile), {}, {
                errorSSH: typeof data == "string" ? data : data.toString('utf8')
              }));
            }
          }.bind(this));
          stream.on('exit', function () {
            log('....Ono exit');
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
      log('...ERROR: ', errGSC);
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
        var _sshConnection = {};
        var argArrayFiles = argFiles2Transmit.files || []; //

        for (var posFF = 0; posFF < argArrayFiles.length; posFF++) {
          var fileElem = argArrayFiles[posFF];
          log('...(A) fileElem: ', fileElem);
          fileElem.log = [];
          fileElem.localFullFilePath = _path["default"].join(fileElem.localPath, fileElem.fileName);
          var remotePath = fileElem.remoteTempPath ? fileElem.remoteTempPath : argConfig.remoteTempPath ? argConfig.remoteTempPath : ""; //let separator               = remotePath.length>0 ? ( (remotePath.indexOf("/")!=-1) ? "/" : "\"  ) : "/" ;

          fileElem.remoteFullFilePath = remotePath.length > 0 ? remotePath + fileElem.fileName : fileElem.fileName; //fileElem.command            = ` tso -t "delete '${fileElem.remoteDataset}' "  && cp ${fileElem.remoteFullFilePath} "//'${fileElem.remoteDataset}'" `

          fileElem.preExecGDG = "";

          if (fileElem.remoteDataset.indexOf("(") != -1 && fileElem.remoteDataset.indexOf(")") != -1) {
            var gdgBase = fileElem.remoteDataset.substr(0, fileElem.remoteDataset.indexOf("("));
            log('.....gdgBase: ', gdgBase);
            fileElem.preExecGDG = "tso -t \"LISTC ENT('".concat(gdgBase, "') NAME \" | grep \"NONVSAM \" | sort | tail -1 ");
          } //


          argArrayFiles[posFF] = fileElem;
          log('...(B) fileElem: ', fileElem);
        } //


        getSShConnection(_objectSpread({}, argConfig)).then(function (respConn) {
          _sshConnection = respConn;
          var promisesGDG = [];

          for (var posF = 0; posF < argArrayFiles.length; posF++) {
            // argArrayFiles[posF].log.push( resuPut ) ;
            var objFile = argArrayFiles[posF];
            promisesGDG.push(sshCommand(_sshConnection, objFile, 'preExecGDG', {
              flagRejectOnStderr: false
            }));
          }

          return Promise.all(promisesGDG);
        }).then(function (resGDGs) {
          for (var posF = 0; posF < argArrayFiles.length; posF++) {
            if (!argArrayFiles[posF].log) {
              argArrayFiles[posF].log = [];
            }

            argArrayFiles[posF].log.push(resGDGs);
            var objFile = argArrayFiles[posF]; //

            if (!objFile.dsnDcb) {
              objFile.dsnDcb = "";
            }

            var seqparms = objFile.dsnDcb.length == 0 ? '' : " -W \"seqparms='".concat(objFile.dsnDcb, "'\" "); //

            if (resGDGs.length > 0) {
              var lastGDGversion = (0, _gdgLAstVersion.gdgLAstVersion)(resGDGs, objFile); // resGDGs.find((fileEnc)=>{ return fileEnc.localFullFilePath==objFile.fileEnc.localFullFilePath ; })

              if (lastGDGversion.length > 0) {
                objFile.remoteDataset = lastGDGversion;
              }
            }

            objFile.command = " cp -vvv ".concat(seqparms, "  ").concat(objFile.remoteFullFilePath, " \"//'").concat(objFile.remoteDataset, "'\" ") + " && rm ".concat(objFile.remoteFullFilePath, " ");
            log('....(b) objFile.command: ', objFile.command); //

            argArrayFiles[posF] = objFile;
          } //


          return getSftpConn(_sshConnection);
        }).then(function (sftpConn) {
          var arrayPromises = [];

          for (var posF = 0; posF < argArrayFiles.length; posF++) {
            var objFile = argArrayFiles[posF];
            arrayPromises.push(sftpFastPut(sftpConn, objFile, options));
          }

          return Promise.all(arrayPromises);
        }).then(function (resuPut) {
          // log('......resuPut: ',resuPut) ;
          var promisesCopy = [];

          for (var posF = 0; posF < argArrayFiles.length; posF++) {
            argArrayFiles[posF].log.push(resuPut);
            var objFile = argArrayFiles[posF];
            promisesCopy.push(sshCommand(_sshConnection, objFile, 'command'));
          }

          return Promise.all(promisesCopy);
        }).then(function (resCP) {
          log('......resCP: ', resCP);
          var promisesETT = [];
          var ettExecuted = {};

          for (var posF = 0; posF < argArrayFiles.length; posF++) {
            argArrayFiles[posF].log.push(resCP);
            var objFile = argArrayFiles[posF];

            if (objFile.postTransferJclOk && !ettExecuted[objFile.postTransferJclOk]) {
              objFile.submitCommand = " submit \"//'".concat(objFile.postTransferJclOk, "'\" ");
              promisesETT.push(sshCommand(_sshConnection, objFile, 'submitCommand'));
              ettExecuted[objFile.postTransferJclOk] = true;
            }
          }

          return Promise.all(promisesETT);
        }).then(function (sftpEnds) {
          _sshConnection.end();

          respOk(argArrayFiles);
        })["catch"](function (errSFTP) {
          try {
            _sshConnection.end();
          } catch (errEND) {
            /* no hago nada */
          }

          respRech(errSFTP);
        })["finally"](function (resFFF) {
          try {
            _sshConnection.end();
          } catch (errEND) {
            /* no hago nada */
          }
        }); //
      } catch (errSFD) {
        log('...errSFD: ', errSFD);

        try {
          sshConnection.end();
        } catch (errEND) {
          /* no hago nada */
        }

        respRech(errSFD);
      }
    });
  }; //


  return {
    transmit: sshTransmit
  }; //
}; //


exports.sshOperations = sshOperations;