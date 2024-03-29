/*
*
*/
require('dotenv').config() ;
//
const { zosSSH }         = require("../lib/index") ;
const { GDG_VERSION_MINUTES_SECONDS }  = require("../lib/static") ;
const path               = require("path") ;
//
const configSSH = {
    host:           process.env.HOST ,
    port:           '22' ,
    username:       process.env.SSH_USERNAME ,
    pathPrivateKey: path.join( __dirname, `./certs/${process.env.CERT}` ),
    passphrase:     process.env.PASSPHRASE
} ;
//
const zosSSHutil      = zosSSH( configSSH ) ;
const files2Transmit   = { 
    jobs: [
        {   localPath:           __dirname,
            //jobname:             'TESTJOB',
            //jobDescription:      'Test job submission from String in node.js',
            //fullPathJclTemplate: path.join( __dirname, '/template/jobjcl.txt' ) ,
            remoteTempPath:      process.env.REMOTE_PATH ,
            filename:            path.join( __dirname, "file2gdg.txt") ,
            remoteDataset:       `${process.env.GDG_BASE}(+1)`
        }
    ] } ;
//
zosSSHutil.submitJob( files2Transmit )
    .then((resOk)=>{
        console.log('...Result of submitJob: ',resOk) ;
    })
    .catch((resErr)=>{
        console.log('...Error during submitJob: ',resErr) ;
    }) ;
//