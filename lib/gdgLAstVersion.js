/*
*
*/
import { GDG_VERSION_INCREMENTAL }           from "./static" ;
import { GDG_VERSION_MINUTES_SECONDS }       from "./static" ;
import { GDG_VERSION_HARDCODED       }       from "./static" ;
//
const log      = require('debug')('ZOS-SSH-SFTP:GDG_UTIL') ;
//
export const gdgLAstVersion = (argArr,argFile,argGDGformat) => {
    try {
        //
        const  regexFile     = /NONVSAM ---- (.*)/g;
        const  regexVersion  = /.G(.*)V/g;
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
        if ( currentVersion && currentVersion.length>1 ){
            outNewVersion = currentVersion[1] ;
            if ( typeof outNewVersion=="string" ){ outNewVersion=parseInt(outNewVersion.trim()); }
            outNewVersion = outNewVersion + 1 ;
        } else {
            currentVersion = 1 ;
        } ;
        //
        outNewVersion = "0000" + outNewVersion ;
        //
        switch(argGDGformat){
            case GDG_VERSION_INCREMENTAL:
                outNewVersion = outNewVersion.substr( (outNewVersion.length-4), 4 ) ;
            break ;
            case GDG_VERSION_MINUTES_SECONDS:
                outNewVersion = outNewVersion.substr( (outNewVersion.length-4), 4 ) ;
            break ;
            case GDG_VERSION_HARDCODED:
                //
                if ( argFile.gdgVersionHardcode==undefined ){
                    console.log("***ERROR: Missing the gdg version hardcoded ***") ;
                    throw new Error("***ERROR: Missing the gdg version hardcoded ***") ;
                } ;
                outNewVersion = "0000"+String(argFile.gdgVersionHardcode) ;
                outNewVersion = outNewVersion.trim() ;
                //
                if ( outNewVersion.length>4 ){
                    outNewVersion = outNewVersion.substr((outNewVersion.length-4),4) ;
                } ;
                //
            break ;
            default:
                console.log(`***\n***ERROR: Argument -> format of GDG version is unknown: 'argGDGformat'\n***`);
                throw new Error(`***\n***ERROR: Argument -> format of GDG version is unknown: 'argGDGformat'\n***`);
            break ;
        } ;
        //
        outFileLastVersion = outFileLastVersion.replace(currentVersion[0],`.G${outNewVersion}V`)
        //
        return outFileLastVersion ;
        //
    } catch(errGDG){
        throw errGDG ;
    }
} ;
//