/*
*
*/
const  regexFile     = /NONVSAM ---- (.*)/g;
const  regexVersion  = /.G(.*)V/g;
//
const log      = require('debug')('ZOS-SSH-SFTP:GDG_UTIL') ;
//
export const gdgLAstVersion = (argArr,argFile) => {
    try {
        //
        let outNewVersion      = 1  ;
        let outFileLastVersion = "" ;
        let fileInterface  = argArr.find((fileEnc)=>{ return fileEnc.localFullFilePath==argFile.localFullFilePath ; }) ;
        if ( !fileInterface ){ return "" ; }
        //
        let logListcat     = fileInterface.log || "" ;
        outFileLastVersion = regexFile.exec(logListcat||"  ") ;
        if ( outFileLastVersion===null ){
            outFileLastVersion = [] ;
        } ;
        if ( outFileLastVersion.length<2 ){
            console.log('...ERROR:: Probably It is not a GDG or there is no entry:: log: ',logListcat,' outFileLastVersion: ',outFileLastVersion);
            outFileLastVersion = fileInterface.GDG_BASE + `.G0000V00` ;
            if ( logListcat.length===0 ){
                logListcat = outFileLastVersion ;
            } ;
            // throw new Error("ERROR: regex GDG entry");
        } else {
            outFileLastVersion = String(outFileLastVersion[1]).trim() ;
        } ;
        //
        let dsnLastPart    = logListcat.split(".") ;
        dsnLastPart        = dsnLastPart[ (dsnLastPart.length-1) ] ;
        let currentVersion = regexVersion.exec( `.${dsnLastPart}` ) ;
        //log("..currentVersion: ",currentVersion," logListcat: ",logListcat,";") ;
        if ( currentVersion && currentVersion.length>1 ){
            outNewVersion = currentVersion[1] ;
            if ( typeof outNewVersion=="string" ){ outNewVersion=parseInt(outNewVersion.trim()); }
            outNewVersion = outNewVersion + 1 ;
        } else {
            log("....no existe currentVersion:: ") ;
            currentVersion = 1 ;
        } ;
        //
        outNewVersion = "0000" + outNewVersion ;
        outNewVersion = outNewVersion.substr( (outNewVersion.length-4), 4 ) ;
        outFileLastVersion = outFileLastVersion.replace(currentVersion[0],`.G${outNewVersion}V`)
        //
        return outFileLastVersion ;
        //
    } catch(errGDG){
        throw errGDG ;
    }
} ;
//