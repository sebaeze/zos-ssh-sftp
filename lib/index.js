/*
*
*/
import { validaConfiguration }     from './validations'   ;
import { sshOperations }           from './sshOperations' ;
//
export const zosSSH = (argConfig) => {
    try {
        //
        let errors = validaConfiguration( argConfig ) ;
        if ( errors.length>0 ){ throw new Error({error: errors}) ; }
        //
        const { submitJob , transmit } = sshOperations(argConfig) ;
        //
        return {
            submitJob ,
            transmit
        } ;
        //
    } catch(errinit){
        throw errinit ;
    }
} ;
//