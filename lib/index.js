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
        return sshOperations(argConfig) ;
        //
    } catch(errinit){
        throw errinit ;
    }
} ;
//