/*
*
*/
import { configProps }             from './index';
import { sshOperations }           from './sshOperations' ;
//
export const mainZosSSH = (argConfig:configProps) => {
    try {
        //
        console.log("...mainZosSSH:: ") ;
        const { submitJob , transmit } = sshOperations(argConfig) ;
        //
        return {
            submitJob ,
            transmit
        } ;
        //
    } catch(errinit){
        throw errinit ;
    } ;
} ;
//