/*
*
*/
require('dotenv').config() ;
//
const { zosSSH }         = require("../lib/index") ;
const { GDG_VERSION_HARDCODED }  = require("../lib/static") ;
const path               = require("path") ;
//
const configSSH = {
    localCodePage:  "utf-8" ,
    remoteCodePage: "ibm-1047",
    host:           process.env.HOST ,
    port:           '22' ,
    username:       process.env.SSH_USERNAME ,
    pathPrivateKey: path.join( __dirname, `./certs/${process.env.CERT}` ),
    passphrase:     process.env.PASSPHRASE ,
    gdgVersionFormat: GDG_VERSION_HARDCODED
} ;
//
const zosSSHutil      = zosSSH( configSSH ) ;
let files2Transmit = {
    files: [
        { gdgVersionHardcode: 43 ,localPath: __dirname, fileName: "file1gdg.txt" , remoteTempPath: process.env.REMOTE_PATH ,remoteDataset:`${process.env.GDG_BASE}(+1)`} ,
        { gdgVersionHardcode: 71 ,localPath: __dirname, fileName: "file2gdg.txt" , remoteTempPath: process.env.REMOTE_PATH ,remoteDataset:`${process.env.GDG_BASE}(+1)`} ,
        { gdgVersionHardcode: 85 ,localPath: __dirname, fileName: "file3gdg.txt" , remoteTempPath: process.env.REMOTE_PATH ,remoteDataset:`${process.env.GDG_BASE}(+1)`}
    ],
    //postTransferJclOk:    'MY.DATA.PDS(JOBOK)',
    //postTransferJclError: 'MY.DATA.PDS(JOBERROR)'
} ;
//
zosSSHutil.transmit( files2Transmit )
    .then((resOk)=>{
        console.log('...Result: ',resOk) ;
    })
    .catch((resErr)=>{
        console.log('...ERROR_TEST_GDG: ',resErr) ;
        if ( resErr.log!=undefined && Array.isArray(resErr.log) ){
            resErr.log.forEach((elemLog)=>{
                console.log("...elemLog: ",elemLog,";") ;
            }) ;
        } ;
    }) ;
//