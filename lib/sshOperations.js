/*
*
*/
import fs                 from 'fs' ;
import path               from 'path' ;
import { Client }         from 'ssh2' ;
import { gdgLAstVersion } from './gdgLAstVersion' ;
import { OPERATIONS     } from './operations'     ;
//
const log      = require('debug')('ZOS-SSH-SFTP:sshOperations') ;
const logSSH   = require('debug')('BORRAR_ZOS-SSH-SFTP:SSH') ;
const logEvent = require('debug')('ZOS-SSH-SFTP:EVENTS') ;
//
const VALID_CONFIGURATION = {keepaliveInterval:true, keepaliveCountMax: true, host: true, port: true, username: true, debug: true, privateKey: true, passphrase: true, password: true} ;
const options = {
    mode: 0o777,
    /*
    chunkSize: 32768,
    concurrency: 64,
    */
    chunkSize: 3276,
    concurrency: 4,
    //
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
            // Defaults
            let configConnection = {
                keepaliveInterval : 2000,
                keepaliveCountMax : 40,
                host: argConfig.host,
                port: argConfig.port || "22",
                username: argConfig.username ,
                debug: logSSH
            } ;
            //
            if ( argConfig.pathPrivateKey ){
                argConfig.privateKey = fileCert2String(argConfig.pathPrivateKey) ;
                if ( argConfig.passphrase ){
                    configConnection.passphrase = argConfig.passphrase ;
                }
            } else {
                configConnection.password = argConfig.password ;
            }
            //
            for ( let keyC in argConfig ){
                if ( VALID_CONFIGURATION[keyC] && VALID_CONFIGURATION[keyC]==true  ){
                    configConnection[keyC] = argConfig[keyC] ;
                }
            }
            //
            log('...configConnection: ',configConnection) ;
            //
            const sftpConn   = new Client() ;
            sftpConn
                .on('ready', function() {
                    log('.....On.Ready: ') ;
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
            //
            argSSHconn.sftp(function(err, sftpConn ) {
                if (err) {
                    respRech( err ) ;
                } else {
                    respOk( sftpConn ) ;
                }
            }.bind(this)) ;
            //
            argSSHconn
            .on('error',function(argErr){
                log('ERROR:: getSftpConn: ',argErr,';');
                respRech(argErr) ;
            }.bind(this))
            .on('end',function(){
                log('...ON::END::getSftpConn... ');
            }.bind(this))
            .on('WRITE',function(reqID, handle, offset, data){
                log('...ON::WRITE::getSftpConn...reqID: ',reqID,' offset: ',offset,';');
            }.bind(this))
            .on('CLOSE',function(reqID){
                log('...ON::CLOSE::getSftpConn...reqID: ',reqID);
            }.bind(this))
            //
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
            if ( argOpt.transferOption==undefined ){ argOpt.transferOption=OPERATIONS.PUT_FILE_TO_FILE; } ;
            //
            switch( argOpt.transferOption ){
                case OPERATIONS.PUT_FILE_TO_FILE:
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
                break ;
                case OPERATIONS.PUT_STRING_TO_FILE:
                    // writeFile(remotePath: string, data: string | Buffer, options: WriteFileOptions, callback?: (err: any) => void): void;
                    log("....voy a writeFile...remote: ",argFile.remoteFullFilePath,";") ;
                    argSftp.writeFile( argFile.remoteFullFilePath, argFile.stringDataToTransfer , argOpt, function(err) {
                        if (err) {
                            log('....ERROR EN writeFile:: ',err) ;
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
                break ;
                default:
                    respRech({
                        error: `Error: invalid operation in sftpFastPut: '${argOpt.transferOption}.`
                    }) ;
                break ;
            } ;
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
const sshCommand = (argSSHconn,argFile,argCmd,argOpt={flagRejectOnStderr:true}) => {
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
                    .on('close', function(code, signal) {
                        log('Stream: CLOSE: code: ',code,' signal: ',signal,';') ;
                        // conn.end();
                    }.bind(this))
                    .stderr.on('data', function(data) {
                        log('STDERR: error: ',(typeof data=="string" ? data : data.toString('utf8')),';') ;
                        if ( argOpt.flagRejectOnStderr==true ){
                            respRech({
                                resultCode: 1005,
                                message: `ERROR ejecutando '${argFile[argCmd]}'  `,
                                ...argFile,
                                errorSSH: typeof data=="string" ? data : data.toString('utf8')
                            }) ;
                        }
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
                let sshConnection = {} ;
                let argArrayFiles = argFiles2Transmit.files || [] ;
                //
                for ( let posFF=0; posFF<argArrayFiles.length; posFF++ ){
                    let fileElem                = argArrayFiles[posFF] ;
                    fileElem.log = [] ;
                    fileElem.localFullFilePath  = path.join( fileElem.localPath , fileElem.fileName ) ;
                    let remotePath              = fileElem.remoteTempPath ? fileElem.remoteTempPath : ( argConfig.remoteTempPath ? argConfig.remoteTempPath : "" ) ;
                    //let separator               = remotePath.length>0 ? ( (remotePath.indexOf("/")!=-1) ? "/" : "\"  ) : "/" ;
                    fileElem.remoteFullFilePath = remotePath.length>0 ? remotePath+fileElem.fileName : fileElem.fileName ;
                    //fileElem.command            = ` tso -t "delete '${fileElem.remoteDataset}' "  && cp ${fileElem.remoteFullFilePath} "//'${fileElem.remoteDataset}'" `
                    fileElem.preExecGDG = "" ;
                    if ( fileElem.remoteDataset.indexOf("(")!=-1 && fileElem.remoteDataset.indexOf(")")!=-1  ){
                        let gdgBase = fileElem.remoteDataset.substr(0, (fileElem.remoteDataset.indexOf("(")) ) ;
                        fileElem.GDG_BASE   = gdgBase ;
                        fileElem.preExecGDG = `tso -t "LISTC ENT('${gdgBase}') NAME " | grep "NONVSAM " | sort | tail -1 ` ;
                    } ;
                    //
                    argArrayFiles[posFF] = fileElem ;
                    //
                }
                //
                getSShConnection({...argConfig})
                    .then((respConn)=>{
                        sshConnection = respConn ;
                        let promisesGDG = [] ;
                        for ( let posF=0; posF<argArrayFiles.length; posF++ ){
                            // argArrayFiles[posF].log.push( resuPut ) ;
                            let objFile = argArrayFiles[posF] ;
                            promisesGDG.push( sshCommand( sshConnection, objFile, 'preExecGDG',{flagRejectOnStderr: false}  ) ) ;
                        }
                        return Promise.all( promisesGDG ) ;
                    })
                    .then((resGDGs)=>{
                        for ( let posF=0; posF<argArrayFiles.length; posF++ ){
                            if ( !argArrayFiles[posF].log ){ argArrayFiles[posF].log=[]; }
                            argArrayFiles[posF].log.push( resGDGs ) ;
                            let objFile = argArrayFiles[posF] ;
                            //
                            if ( !objFile.dsnDcb ){ objFile.dsnDcb=""; }
                            let seqparms = objFile.dsnDcb.length==0 ? '' : ` -W "seqparms='${objFile.dsnDcb}'" ` ;
                            //
                            if ( resGDGs.length>0 ){
                                let lastGDGversion    = gdgLAstVersion(resGDGs,objFile) ; // resGDGs.find((fileEnc)=>{ return fileEnc.localFullFilePath==objFile.fileEnc.localFullFilePath ; })
                                if ( lastGDGversion.length>0 ){
                                    objFile.remoteDataset = lastGDGversion ;
                                }
                            } ;
                            objFile.command = ` cp -vvv ${seqparms}  ${objFile.remoteFullFilePath} "//'${objFile.remoteDataset}'" `
                                            + ` && rm ${objFile.remoteFullFilePath} ` ;
                            log('....(b) objFile.command: ',objFile.command) ;
                            //
                            argArrayFiles[posF] = objFile ;
                        }
                        //
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
                    })
                    .finally((resFFF)=>{
                        try { sshConnection.end() ; } catch(errEND){ /* no hago nada */ }
                    }) ;
                //
            } catch(errSFD){
                log('...errSFD: ',errSFD) ;
                try { sshConnection.end() ; } catch(errEND){ /* no hago nada */ }
                respRech(errSFD) ;
            }
        }) ;
    } ;
    //
    const sshSubmitJob = (argFiles2Transmit) => {
        return new Promise(function(respOk,respRech){
            try {
                //
                let sshConnection = {} ;
                let argJobs       = argFiles2Transmit.jobs || [] ;
                //
                for ( let posFF=0; posFF<argJobs.length; posFF++ ){
                    let jobElem = argJobs[posFF] ;
                    let { jobname, jobDescription } = jobElem ;
                    jobElem.log           = [] ;
                    jobElem.filesToDelete = [] ;
                    //
                    if ( jobElem.remoteTempPath.substr((jobElem.remoteTempPath.length-1),1)!="/" ){ jobElem.remoteTempPath=jobElem.remoteTempPath+"/"; } ;
                    jobElem.remoteFullFilePath = jobElem.remoteTempPath + jobname + ( new Date().getTime() ) ;
                    log("...jobElem.remoteFullFilePath: ",jobElem.remoteFullFilePath,";");
                    jobElem.stringDataToTransfer = "" ;
                    if ( jobElem.fullPathJclTemplate!=undefined ){
                        try {
                            jobElem.stringDataToTransfer = fs.readFileSync( jobElem.fullPathJclTemplate, "utf-8" ) ;
                            if ( jobDescription==undefined ){ jobDescription=""; } ;
                            jobElem.stringDataToTransfer = eval( "`"+jobElem.stringDataToTransfer+"`" ) ;
                            log("...jobElem.stringDataToTransfer: \n",jobElem.stringDataToTransfer,";") ;
                        } catch(errRead){
                            respRech({
                                error: errRead ,
                                description: `Error reading jcl template file: '${jobElem.fullPathJclTemplate}'.`
                            }) ;
                        } ;
                    } ;
                    //
                } ;
                //
                getSShConnection({...argConfig})
                    .then((respConn)=>{
                        sshConnection = respConn ;
                        return getSftpConn(sshConnection) ;
                    })
                    .then((sftpConn)=>{
                        let arrayPromises = [] ;
                        for ( let posF=0; posF<argJobs.length; posF++ ){
                            let objFile = argJobs[posF] ;
                            arrayPromises.push( sftpFastPut( sftpConn, objFile, {...options, transferOption:OPERATIONS.PUT_STRING_TO_FILE} ) ) ;
                        }
                        return Promise.all( arrayPromises ) ;
                    })
                    .then((resuPut)=>{
                        // log('......resuPut: ',resuPut) ;
                        let arrayPromises = [] ;
                        for ( let posF=0; posF<argJobs.length; posF++ ){
                            let jobElem = argJobs[posF] ;
                            jobElem.submitCommand = 
                                    ` iconv -f utf-8 -t ibm-1047 "${jobElem.remoteFullFilePath}" > "${jobElem.remoteFullFilePath}.ibm1047" `
                                    +` ; sleep ${jobElem.sleep||"1s"}  `
                                    +` ; submit "${jobElem.remoteFullFilePath}.ibm1047" `
                                    +` ; sleep ${jobElem.sleep||"1s"}  `
                                    +` ; rm "${jobElem.remoteFullFilePath}" "${jobElem.remoteFullFilePath}.ibm1047" `
                                    ;
                            argJobs[posF] = jobElem ;
                            arrayPromises.push( sshCommand( sshConnection, jobElem , 'submitCommand' ) ) ;
                        } ;
                        return Promise.all( arrayPromises ) ;
                    })
                    .then((sftpEnds)=>{
                        sshConnection.end() ;
                        respOk( sftpEnds||argJobs ) ;
                    })
                    .catch((errSFTP)=>{
                        try { sshConnection.end() ; } catch(errEND){ }
                        log("ERROR: ",errSFTP) ;
                        respRech(errSFTP) ;
                    })
                    .finally((resFFF)=>{
                        try { sshConnection.end() ; } catch(errEND){ }
                    }) ;
                //
            } catch(errSFD){
                log('...errSFD: ',errSFD) ;
                try { sshConnection.end() ; } catch(errEND){}
                respRech(errSFD) ;
            }
        }) ;
    } ;
    //
    return {
        transmit:  sshTransmit ,
        submitJob: sshSubmitJob
    }
    //
} ;
//