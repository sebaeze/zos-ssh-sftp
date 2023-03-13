//
const { defaults }    = require("jest-config") ;
//
module.exports = {
    preset: 'ts-jest' ,
    moduleFileExtensions: [...defaults.moduleFileExtensions, 'ts' ,'d.ts' ,'mts', 'cts'],
};
//