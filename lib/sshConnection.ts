/*
*
*/
import { configProps, ssh2Options } from "./index" ;
import fs              from "fs" ;
//
const logSSH   = require('debug')('BORRAR_ZOS-SSH-SFTP:getSShConnection') ;
const VALID_CONFIGURATION = {keepaliveInterval:true, keepaliveCountMax: true, host: true, port: true, username: true, debug: true, privateKey: true, passphrase: true, password: true} ;
//
const fileCert2String = (argFile:string) => {
    try {
        //
        let outStrCert = fs.readFileSync(argFile,'utf-8').trim() ;
        //
        return outStrCert ;
        //
    } catch(errGSC){
        logSSH('...ERROR: ',errGSC) ;
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