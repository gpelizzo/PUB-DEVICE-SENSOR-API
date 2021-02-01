/**	This is free software: you can redistribute it and/or modify
*	it under the terms of the GNU General Public License as published by
*	the Free Software Foundation, either version 3 of the License, or
*	(at your option) any later version.
*
*	This software is distributed in the hope that it will be useful,
*	but WITHOUT ANY WARRANTY; without even the implied warranty of
*	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
*	GNU General Public License for more details.
*
*	You should have received a copy of the GNU General Public License
*	along with Foobar.  If not, see <https://www.gnu.org/licenses/>.
*
*
*	Author: Gilles PELIZZO
*	Date: January 25th, 2021.
*/
import { CSettings } from './CSettings';
import { CPostgres } from './CPostgres'
import { CRestAPI } from './CRestAPI';
import { CLogger } from './CLogger';

const mod_appRoot = require('app-root-path');

export class CMain {

    public static init() {
        //first retreive global settings from settings.json file
        CSettings.init(mod_appRoot + '/settings.json').then(() => {
            
            //init logger
            CLogger.init(CSettings.getLogsPath(), CSettings.getVerboseLevel());

            //init postegreSQL access class
            CPostgres.init(CSettings.getPostgreHost(), CSettings.getPostgrePort(), CSettings.getPostgreDataBase(), CSettings.getPostgreUser(), CSettings.getPostgrePassword());

            //init REST API static class based on Express
            CRestAPI.init(CSettings.getRestAPIPort());

            //Run REST API static class and listen for HTTPS REST requests
            CRestAPI.run();
            }).catch((p_error: any) => {
                //trace the issue to open the settings.json file
                console.log(JSON.stringify(p_error));
        });   
    }     
}

CMain.init();
           