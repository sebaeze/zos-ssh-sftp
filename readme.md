# z/OS SSH SFTP

This package is intended to facility the transmition of files to z/OS ( mainframe ) systems and the submission of JCL
jobs using node.js

## Installation

#### npm
```bash
npm i --save  zos-ssh-sftp
```
## Usage

1- Import the component into your project


```js
import { zosSSH }      from 'zos-ssh-sftp' ;

```

2- Initilize the component passing the credentials

```js
const zosSSHutil      = zosSSH({ host: 'xxx', port:'22', username:'xxxx', password: 'xxxxx', pathPrivateKey: 'xxxx', passphrase:'xxx' }) ;
```

### Config the format of the GDG version to be created

There are 2 ways to create a new GDG version, which can be configured using the following options:
#### Incremental version: This is the default. It will create a new version using (+1)
```js
import { GDG_VERSION_INCREMENTAL }                    from "zos-ssh-sftp/dist/static" ;

const zosSSHutil      = zosSSH({ gdgVersionFormat: GDG_VERSION_INCREMENTAL, host: 'xxx', port:'22', username:'xxxx', password: 'xxxxx', pathPrivateKey: 'xxxx', passphrase:'xxx' }) ;
```

#### Pre-defined with minutes+seconds. The new version number will have the minutes+seconds embebed in the dsn name.
```js
import { GDG_VERSION_MINUTES_SECONDS }                    from "zos-ssh-sftp/dist/static" ;

const zosSSHutil      = zosSSH({ gdgVersionFormat: GDG_VERSION_MINUTES_SECONDS, host: 'xxx', port:'22', username:'xxxx', password: 'xxxxx', pathPrivateKey: 'xxxx', passphrase:'xxx' }) ;
```


3- Execute it

Supported TSO datasets: PS, PDS and  GDG

```js
let files2Transmit = {
    files: [{ localPath: __dirname, fileName:'test.txt' , remoteTempPath: '/userid/home/temp' ,remoteDataset:'MY.GDG.BASE(+1)'}],
    postTransferJclOk: 'MY.DATA.PDS(JOBOK)',
    postTransferJclError: 'MY.DATA.PDS(JOBERROR)'
} ;
zosSSHutil.transmit( files2Transmit )
    .then((resOk)=>{
        console.log('...Result of transmition: ',resOk) ;
    })
    .catch((resErr)=>{
        console.log('...Error during : ',resErr) ;
    }) ;
```
4- Submit JCL only

* Indicate jobname and use local template

```js
let files2Transmit = {
    jobs: [
     { localPath: __dirname,
            jobname:'HFBTEST',
            jobDescription: 'Test job submission from String in node.js',
            fullPathJclTemplate: '/home/user/template/jclTemplate.txt',
            remoteTempPath: '/userid/home/temp' }],
} ;
zosSSHutil.submitJob( files2Transmit )
    .then((resOk)=>{
        console.log('...Result of submitJob: ',resOk) ;
    })
    .catch((resErr)=>{
        console.log('...Error during submitJob: ',resErr) ;
    }) ;
```


5- Options:

*   Debug
Set environment variable 'DEBUG' to 'ZOS-SSH-SFTP:*' for debug display:

Windows:
```js
SET DEBUG=ZOS-SSH-SFTP:*
```

Linux:
```js
export DEBUG=ZOS-SSH-SFTP:*
```