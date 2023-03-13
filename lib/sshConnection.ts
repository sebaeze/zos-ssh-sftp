/*
*
*/
import { configProps, IKeyValuePair, ssh2Options } from "./index" ;
import fs                                          from "fs" ;
import { Client }                                  from 'ssh2' ;
import { ConnectConfig }                           from "ssh2" ;
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
            let configConnection:ConnectConfig = {
                keepaliveInterval : 2000,
                keepaliveCountMax : 40,
                host:      argConfig.host,
                port:      argConfig.port || 22 ,
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
            for ( keyC in configKeyValue ){
                (configConnection as Record<keyof ssh2Options,any>)[keyC] = configKeyValue[keyC] ;
            } ;
            log('...configConnection: ',configConnection) ; 
            //
            const sshConnection:Client   = new Client() ;
            sshConnection
                .on('ready', ()=>{
                    log('.....On.Ready: ') ;
                    respOk( sshConnection ) ;
                })
                .on('error', (argErr)=>{
                    console.log('error: ',argErr,';');
                    respRech(argErr) ;
                })
                .on('timeout', ()=> {
                    console.log('...timeout::: ') ;
                })
                .connect( configConnection ) ;
            //
        } catch(errGSC){
            console.log('...ERROR: ',errGSC) ;
            respRech(errGSC) ;
        } ;
    }) ;
} ;
//