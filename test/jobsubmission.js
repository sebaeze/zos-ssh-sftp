/*
*
*/
const { zosSSH }         = require("../lib/index") ;
const path               = require("path") ;
//
const configSSH = {
    host: 'riosys2.boulder.ibm.com',
    port: '22' ,
    username: 'bill04',
    pathPrivateKey: path.join( __dirname, './certs/bill04_riosys2_ascii_rsa_priv.key' ),
    passphrase: 'qaz11qaz'
} ;
//
const zosSSHutil      = zosSSH( configSSH ) ;
const files2Transmit   = { jobs: [ { localPath: __dirname,
    jobname:'HFBTS44',
    jobDescription: 'Test job submission from String in node.js',
    fullPathJclTemplate: path.join( __dirname, '/template/jobjcl.txt' ) ,
    remoteTempPath: '/u/bill04' }], } ;
//
zosSSHutil.submitJob( files2Transmit )
    .then((resOk)=>{
        console.log('...Result of submitJob: ',resOk) ;
    })
    .catch((resErr)=>{
        console.log('...Error during submitJob: ',resErr) ;
    }) ;
//