/*
*
*/
export const validaConfiguration = (argConf) => {
    try {
        let outErrors = [] ;
        //
        if ( !argConf.host || typeof argConf.host!="string" ){
            outErrors.push( ` 'host' is invalid` ) ;
        }
        //
        if ( !argConf.username || typeof argConf.username!="string" ){
            outErrors.push( ` 'username' is invalid` ) ;
        }
        //
        if ( (!argConf.password || typeof argConf.password!="string") && (!argConf.pathPrivateKey || typeof argConf.pathPrivateKey!="string") ){
            outErrors.push( ` 'password' or 'pathPrivateKey' should be valid` ) ;
        } else {
            if ( typeof argConf.password=="string" && typeof argConf.pathPrivateKey=="string" ){
                outErrors.push( ` Use only one parameter: or 'password' or 'pathPrivateKey'.` ) ;
            }
        }
        //
        return outErrors ;
    } catch(errVal){
        throw errVal ;
    }
} ;
//