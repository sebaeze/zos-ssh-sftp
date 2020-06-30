/*
*
*/
import fs                 from 'fs' ;
import path               from 'path' ;
import { Client }         from 'ssh2' ;
//
const log    = require('debug')('ZOS-SSH-SFTP:sshOperations') ;
const logSSH = require('debug')('ZOS-SSH-SFTP:SSH') ;
//
const options = {
    mode: 0o777,
    chunkSize: 32768,
    concurrency: 64,
    step: function(total_transferred, chunk, total) {
        log(
            `Total Transferred: ${total_transferred} Chunk: ${chunk}` +
            ` Total: ${total}`
        );
    }
};
//
const fileCert2String = (argFile) => {
    try {
        //
        let outStrCert = fs.readFileSync(argFile,'utf-8').trim() ;
        //
        return outStrCert ;
        //
    } catch(errGSC){
        log('...ERROR: ',errGSC) ;
        throw errGSC ;
    } ;
} ;
//
const getSShConnection = (argConfig) => {
    return new Promise(function(respOk,respRech){
        try {
            //
            let configConnection = {
                /*
                keepaliveInterval : 2000,
                keepaliveCountMax : 20,
                */
                keepaliveInterval : 200,
                keepaliveCountMax : 60,
                //
                host: argConfig.host,
                port: argConfig.port || "22",
                username: argConfig.username ,
                debug: logSSH
            } ;
            //
            if ( argConfig.pathPrivateKey ){
                configConnection.privateKey = fileCert2String(argConfig.pathPrivateKey) ;
                if ( argConfig.passphrase ){
                    configConnection.passphrase = argConfig.passphrase ;
                }
            } else {
                configConnection.password = argConfig.password ;
            }
            //
            log('...configConnection: ',configConnection) ;
            //
            const sftpConn   = new Client() ;
            sftpConn.on('ready', function() {
                respOk( sftpConn ) ;
            }.bind(this))
            .on('error',function(argErr){
                log('error: ',argErr,';');
                respRech(argErr) ;
            }.bind(this))
            .on('rekey',function(){
                log('...rekey ') ;
            }.bind(this))
            .connect( configConnection ) ;
            //
        } catch(errGSC){
            log('...ERROR: ',errGSC) ;
            respRech(errGSC) ;
        }
    }) ;
} ;
//
const getSftpConn = (argSSHconn) => {
    return new Promise(function(respOk,respRech){
        try {
            argSSHconn.sftp(function(err, sftpConn ) {
                if (err) {
                    respRech( err ) ;
                } else {
                    respOk( sftpConn ) ;
                }
            }.bind(this)) ;
        } catch(errGSC){
            log('...ERROR: ',errGSC) ;
            respRech(errGSC) ;
        }
    }) ;
} ;
//
const sftpFastPut = (argSftp,argFile,argOpt) => {
    return new Promise(function(respOk,respRech){
        try {
            //
            log('...sftpFastPut:: argFile: ',argFile.localFullFilePath,' argSftp.fastPut: ',argSftp.fastPut) ;
            log('.....EXISTE:: ',( fs.existsSync(argFile.localFullFilePath) ),';') ;
            //
            argSftp.fastPut(argFile.localFullFilePath, argFile.remoteFullFilePath , argOpt, function(err) {
                if (err) {
                    log('....ERROR EN FASTPUT:: ',err) ;
                    respRech({
                        resultCode: 1001,
                        ...argFile,
                        ...err
                    }) ;
                } else {
                    log('File uploaded:: local: ',argFile.fileName,' remote: ',argFile.remoteFullFilePath,';');
                    respOk({resultCode: 0, ...argFile, msg:'file uploaded'}) ;
                }
            });
            //
        } catch(errGSC){
            log('...ERROR: ',errGSC) ;
            respRech({
                resultCode: 1000,
                ...argFile,
                ...errGSC
            }) ;
        }
    }) ;
} ;
//
const sshCommand = (argSSHconn,argFile,argCmd) => {
    return new Promise(function(respOk,respRech){
        try {
            //
            let strLog = "" ;
            argSSHconn.exec(argFile[argCmd], function(errCmd,stream) {
                if (errCmd) {
                    respRech({
                        resultCode: 1003,
                        ...argFile,
                        ...errCmd
                    }) ;
                } else {
                    stream.on('data', function (data, extended) {
                        log('......RESULTADO: '+data.toString().trim());
                        if ( strLog.length>0 ){ strLog=strLog+"\n"; }
                        strLog = strLog + data.toString().trim() ;
                    }.bind(this))
                    .stderr.on('data', function(data) {
                        log('STDERR: type: ',(typeof data),' data: ',data) ;
                        respRech({
                            resultCode: 1005,
                            message: `ERROR ejecutando '${argFile[argCmd]}'  `,
                            ...argFile,
                            errorSSH: typeof data=="string" ? data : data.toString('utf8')
                        }) ;
                    }.bind(this));
                    stream.on('exit',function(){ log('....Ono exit') ; });
                    stream.on('end',function(){
                        respOk({resultCode: 0, ...argFile, msg:'command executed', log: strLog}) ;
                    }.bind(this)) ;
                    //
                }
            }.bind(this));
            //
        } catch(errGSC){
            log('...ERROR: ',errGSC) ;
            respRech({
                resultCode: 1004,
                ...argFile,
                ...errGSC
            }) ;
        }
    }) ;
} ;
//
export const sshOperations = (argConfig) => {
    //
    const sshTransmit = (argFiles2Transmit) => {
        return new Promise(function(respOk,respRech){
            try {
                //
                let argArrayFiles = argFiles2Transmit.files || [] ;
                for ( let posFF=0; posFF<argArrayFiles.length; posFF++ ){
                    let fileElem                = argArrayFiles[posFF] ;
                    log('...(A) fileElem: ',fileElem) ;
                    fileElem.log = [] ;
                    fileElem.localFullFilePath  = path.join( fileElem.localPath , fileElem.fileName ) ;
                    fileElem.remoteFullFilePath = argConfig.remoteTempPath + fileElem.fileName ;
                    //fileElem.command            = ` tso -t "delete '${fileElem.remoteDataset}' "  && cp ${fileElem.remoteFullFilePath} "//'${fileElem.remoteDataset}'" `
                    if ( !fileElem.dsnDcb ){ fileElem.dsnDcb=""; }
                    let seqparms = fileElem.dsnDcb.length==0 ? '' : ` -W "seqparms='${fileElem.dsnDcb}'" ` ;
                    fileElem.command            = ` cp -vvv ${seqparms}  ${fileElem.remoteFullFilePath} "//'${fileElem.remoteDataset}'" `
                                                + ` && rm ${fileElem.remoteFullFilePath} ` ;
                    argArrayFiles[posFF] = fileElem ;
                    log('...(B) fileElem: ',fileElem) ;
                }
                //
                let sshConnection = {} ;
                getSShConnection({...argConfig})
                    .then((respConn)=>{
                        sshConnection = respConn ;
                        return getSftpConn(sshConnection) ;
                    })
                    .then((sftpConn)=>{
                        let arrayPromises = [] ;
                        for ( let posF=0; posF<argArrayFiles.length; posF++ ){
                            let objFile = argArrayFiles[posF] ;
                            arrayPromises.push( sftpFastPut( sftpConn, objFile, options ) ) ;
                        }
                        return Promise.all( arrayPromises ) ;
                    })
                    .then((resuPut)=>{
                        // log('......resuPut: ',resuPut) ;
                        let promisesCopy = [] ;
                        for ( let posF=0; posF<argArrayFiles.length; posF++ ){
                            argArrayFiles[posF].log.push( resuPut ) ;
                            let objFile = argArrayFiles[posF] ;
                            promisesCopy.push( sshCommand( sshConnection, objFile, 'command'  ) ) ;
                        }
                        return Promise.all( promisesCopy ) ;
                    })
                    .then((resCP)=>{
                        log('......resCP: ',resCP) ;
                        let promisesETT = [] ;
                        let ettExecuted = {} ;
                        for ( let posF=0; posF<argArrayFiles.length; posF++ ){
                            argArrayFiles[posF].log.push( resCP ) ;
                            let objFile = argArrayFiles[posF] ;
                            if ( objFile.postTransferJclOk && !ettExecuted[objFile.postTransferJclOk] ){
                                objFile.submitCommand = ` submit "//'${objFile.postTransferJclOk}'" ` ;
                                promisesETT.push( sshCommand( sshConnection, objFile, 'submitCommand' ) ) ;
                                ettExecuted[objFile.postTransferJclOk] = true ;
                            }
                        }
                        return Promise.all( promisesETT ) ;
                    })
                    .then((sftpEnds)=>{
                        sshConnection.end() ;
                        respOk( argArrayFiles ) ;
                    })
                    .catch((errSFTP)=>{
                        try { sshConnection.end() ; } catch(errEND){ /* no hago nada */ }
                        respRech(errSFTP) ;
                    }) ;
                //
            } catch(errSFD){
                log('...errSFD: ',errSFD) ;
                respRech(errSFD) ;
            }
        }) ;
    } ;
    //
    return {
        transmit: sshTransmit
    }
    //
} ;
//