/*
*
*/
import { configProps, IKeyValuePair, ssh2Options } from "./index" ;
import fs              from "fs" ;
//
const log   = require('debug')('ZOS-SSH-SFTP:getSShConnection') ;
const fileCert2String = (argFile:string) => {
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
export const getSShConnection:any = (argConfig:configProps) => {
    return new Promise(function(respOk,respRech){
        try {
            // Defaults
            let configConnection:ssh2Options = {
                keepaliveInterval : 2000,
                keepaliveCountMax : 40,
                host:      argConfig.host,
                port:      argConfig.port || "22",
                username:  argConfig.username ,
                debug:     log
            } ;
            //
            if ( argConfig.pathPrivateKey ){
                argConfig.privateKey = fileCert2String(argConfig.pathPrivateKey) ;
                if ( argConfig.passphrase ){
                    configConnection.passphrase = argConfig.passphrase ;
                }
            } else {
                configConnection.password = argConfig.password ;
            } ;
            //
            const configKeyValue:ssh2Options = argConfig as ssh2Options ;
            let keyC: keyof ssh2Options ;
            for ( let keyC in configKeyValue ){
                configConnection[keyC] = configKeyValue[keyC] ;
            } ;
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