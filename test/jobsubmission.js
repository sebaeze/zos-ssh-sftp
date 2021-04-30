/*
*
*/
require('dotenv').config() ;
//
const { zosSSH }         = require("../lib/index") ;
const path               = require("path") ;
//
const configSSH = {
    host:           process.env.HOST ,
    port:           '22' ,
    username:       process.env.USERNAME ,
    pathPrivateKey: path.join( __dirname, `./certs/${process.env.CERT}` ),
    passphrase:     process.env.PASSPHRASE
} ;
//
const zosSSHutil      = zosSSH( configSSH ) ;
const files2Transmit   = { 
    jobs: [
        {   localPath:           __dirname,
            jobname:             'HFBTS44',
            jobDescription:      'Test job submission from String in node.js',
            fullPathJclTemplate: path.join( __dirname, '/template/jobjcl.txt' ) ,
            remoteTempPath:      process.env.REMOTE_PATH
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