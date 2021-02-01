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

const mod_fs = require("fs");

/**	
 *	Retreive App settings from settings.json file 
 *  and serve params requests
 */
export class CSettings {
    private static m_Settings: any;

    /**
    *   Init CSettings class: open settings.jon file and
    *   retreive all parameters 
    *   params: 
    *       p_strSettingsFilePath: full path of settings.json file
    *   return:
    *       NONE
    */
    public static init(p_strSettingsFilePath: String) {
        return new Promise((p_Resolve, p_Reject) => {
            try {
                this.m_Settings = JSON.parse(mod_fs.readFileSync(p_strSettingsFilePath, "utf8"));
                p_Resolve(null);
            } catch (p_error: any) {
                p_Reject(p_error);
            }
        });
    }

    /**
    *   Return REST API port listened by express
    *   params: 
    *       NONE
    *   return:
    *       REST API port number
    */
    public static getRestAPIPort(): number {
        return this.m_Settings.rest_api_port;
    }  
    
    /**
    *   Return PostgreSQL server hostname
    *   params: 
    *       NONE
    *   return:
    *       PostegreSQL server hostname
    */
    public static getPostgreHost(): String {
        return this.m_Settings.postgre_host;
    }   

    /**
    *   Return PostgreSQL port server
    *   params: 
    *       NONE
    *   return:
    *       PostegreSQL server port number
    */
    public static getPostgrePort(): number {
        return this.m_Settings.postgre_port;
    }  
    
    /**
    *   Return PostgreSQL login user name
    *   params: 
    *       NONE
    *   return:
    *       PostegreSQL login user name
    */
    public static getPostgreUser(): String {
        return this.m_Settings.postgre_user;
    }  

    /**
    *   Return PostgreSQL login user passwword
    *   params: 
    *       NONE
    *   return:
    *       PostegreSQL login user passwword
    */
    public static getPostgrePassword(): String {
        return this.m_Settings.postgre_password;
    }  

    /**
    *   Return PostgreSQL database nme
    *   params: 
    *       NONE
    *   return:
    *       PostegreSQL database name
    */
    public static getPostgreDataBase(): String {
        return this.m_Settings.postgre_database;
    }  

    /**
    *   Return App logfile full path
    *   params: 
    *       NONE
    *   return:
    *       App logfile full path
    */
    public static getLogsPath(): String {
        return this.m_Settings.logs_path;
    }

    /**
    *   Return App logfile level
    *   params: 
    *       NONE
    *   return:
    *       App logfile level: 0:silent, 1:error, 2:info, 3:debug
    */
    public static getVerboseLevel(): number {
        return this.m_Settings.verbose_level;
    } 
}