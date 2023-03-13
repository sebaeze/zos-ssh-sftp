/*
*
*/
import { mainZosSSH }                   from "./mainZosSSH"; 
//
export declare const GDG_VERSION_INCREMENTAL:string     = "GDG_VERSION_INCREMENTAL" ;
export declare const GDG_VERSION_MINUTES_SECONDS:string = "GDG_VERSION_MINUTES_SECONDS" ;
export declare const GDG_VERSION_HARDCODED:string       = "GDG_VERSION_HARDCODED"       ;
//
export type configProps = {
    host:                 string ;
    username:             string ;
    port:                 number ;
    privateKey?:          string ;
    passphrase?:          string ;
    remoteTempPath?:      string ;
    gdgVersionFormat?:    string ;
    remoteCodePage?:      string ;
    localCodePage?:       string ;
} & 
( 
    | { password:  string ; pathPrivateKey?:  never  } 
    | { password?: never  ; pathPrivateKey:   string }
) ;
//
export type ssh2Options = {
    keepaliveInterval?: number ;
    keepaliveCountMax?: number ;
    host:              string ;
    port:              string | number ;
    username:          string ;
    privateKey?:       string ;
    passphrase?:       string ;
    password?:         string ;
    debug?:            (any)=>any
} ;
//
export type configFileTransmit = {
    gdgVersionHardcode?: number ,
    localPath:           string ,
    fileName:            string ,
    remoteTempPath:      string ,
    remoteDataset:       string , 
} ;
//
export type configJobSubmit = {
    jobname?:              string ;
    jobDescription?:       string ;
    remoteFullFilePath?:   string ;
    stringDataToTransfer?: string ;
    fullPathJclTemplate?:  string ;
    submitCommand?:        string ;
    sleep?:                string ;
    localPath:          string ;
    remoteTempPath:     string ;
    filename:           string ;
    remoteDataset:      string ;
    log?:               any[]  ;
    filesToDelete?:     string[] ;
} ;
//
export type configTransmit = {
    files?: [ configFileTransmit ] ;
    jobs?:  [ configJobSubmit ]    ;
} ;
export type outFileTransmit = configFileTransmit & {
    log:                  Array<any> ;
    dsnDcb?:              string   ;
    localFullFilePath?:   string   ;
    remoteFullFilePath?:  string   ;
    preExecGDG?:          string   ;
    command?:             string   ;
    postTransferJclOk?:   string   ;
    submitCommand?:       string   ;
    GDG_BASE?:            string   ;
} ;
/*
export interface zosSSH {
    submitJob: (any)=>any ,
    transmit:  (any)=>any
} ;
*/
//
export interface IsshOperations {
    (props:configProps): {
        transmit:  (props:configTransmit) => Promise<any> ,
        submitJob: (props:configTransmit) => Promise<any>
    }
} ;
//
export type IKeyValuePair ={
    [key:string]: string | number | undefined
} ;
//
export {
    mainZosSSH
} ;
//