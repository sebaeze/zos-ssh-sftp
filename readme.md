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

4- Options:

*   Debug

```js
    
```