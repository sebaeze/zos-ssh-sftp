/*
*
*/
import "dotenv/config" ;
import path                          from "path";
import { mainZosSSH }                from "../lib/mainZosSSH" ;
import { configTransmit }            from "../lib/index";
import { configProps  }              from "../lib/index";
import { describe, it, expect }      from "@jest/globals" ;
//
const configSSH:configProps = {
    host:           process.env.HOST||"" ,
    port:           22 ,
    username:       process.env.SSH_USERNAME||"" ,
    pathPrivateKey: path.join( __dirname, `./certs/${process.env.CERT}` ),
    passphrase:     process.env.PASSPHRASE
} ;
//
console.log("...typ:" ,typeof mainZosSSH," zosSSH: ",mainZosSSH,";") ;
//
const zosSSHutil      = mainZosSSH( configSSH ) ;
const files2Transmit:configTransmit = { 
    jobs: [
        {   localPath:           __dirname,
            remoteTempPath:      process.env.REMOTE_PATH||"" ,
            filename:            path.join( __dirname, "file2gdg.txt") ,
            remoteDataset:       `${process.env.GDG_BASE}(+1)`
        }
    ] } ;
//
describe( "Test zos ssh sftp", () => {
    //
    it("(01) Test job submit:: ", () =>{
        zosSSHutil.submitJob( files2Transmit )
            .then((resOk:any)=>{
                console.log('...Result of submitJob: ',resOk) ;
                expect(resOk).toBe(Object) ;
            })
            .catch((resErr:any)=>{
                console.log('...Error during submitJob: ',resErr) ;
            }) ;
    }) ;
    //
}) ;