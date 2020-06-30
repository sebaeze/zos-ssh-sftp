/*
*
*/
const  regexFile     = /NONVSAM ---- (.*)/g;
const  regexVersion  = /.G(.*)V/g;
//
export const gdgLAstVersion = (argArr,argFile) => {
    try {
        //
        let outNewVersion      = 1  ;
        let outFileLastVersion = "" ;
        let fileInterface  = argArr.find((fileEnc)=>{ return fileEnc.localFullFilePath==argFile.localFullFilePath ; }) ;
        // console.log('...fileInterface: ',fileInterface) ;
        if ( !fileInterface | fileInterface.log.length==0 ){ return "" ; }
        //
        outFileLastVersion = regexFile.exec(fileInterface.log) ;
        // console.log('...regex::  fileInterface.log: ',fileInterface.log,' outFileLastVersion: ',outFileLastVersion);
        if ( outFileLastVersion.length<2 ){ console.log('...ERROR en regex::  fileInterface.log: ',fileInterface.log,' outFileLastVersion: ',outFileLastVersion); throw new Error("ERROR: regex GDG entry");}
        outFileLastVersion = String(outFileLastVersion[1]).trim() ;
        //
        let currentVersion = regexVersion.exec(fileInterface.log) ;
        if ( currentVersion && currentVersion.length>1 ){
            outNewVersion = currentVersion[1] ;
            if ( typeof outNewVersion=="string" ){ outNewVersion=parseInt(outNewVersion.trim()); }
            outNewVersion = outNewVersion + 1 ;
        }
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