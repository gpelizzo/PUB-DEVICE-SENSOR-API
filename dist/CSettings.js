"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CSettings = void 0;
var mod_fs = require("fs");
/**
 *	Retreive App settings from settings.json file
 *  and serve params requests
 */
var CSettings = /** @class */ (function () {
    function CSettings() {
    }
    /**
    *   Init CSettings class: open settings.jon file and
    *   retreive all parameters
    *   params:
    *       p_strSettingsFilePath: full path of settings.json file
    *   return:
    *       NONE
    */
    CSettings.init = function (p_strSettingsFilePath) {
        var _this = this;
        return new Promise(function (p_Resolve, p_Reject) {
            try {
                _this.m_Settings = JSON.parse(mod_fs.readFileSync(p_strSettingsFilePath, "utf8"));
                p_Resolve(null);
            }
            catch (p_error) {
                p_Reject(p_error);
            }
        });
    };
    /**
    *   Return REST API port listened by express
    *   params:
    *       NONE
    *   return:
    *       REST API port number
    */
    CSettings.getRestAPIPort = function () {
        return this.m_Settings.rest_api_port;
    };
    /**
    *   Return PostgreSQL server hostname
    *   params:
    *       NONE
    *   return:
    *       PostegreSQL server hostname
    */
    CSettings.getPostgreHost = function () {
        return this.m_Settings.postgre_host;
    };
    /**
    *   Return PostgreSQL port server
    *   params:
    *       NONE
    *   return:
    *       PostegreSQL server port number
    */
    CSettings.getPostgrePort = function () {
        return this.m_Settings.postgre_port;
    };
    /**
    *   Return PostgreSQL login user name
    *   params:
    *       NONE
    *   return:
    *       PostegreSQL login user name
    */
    CSettings.getPostgreUser = function () {
        return this.m_Settings.postgre_user;
    };
    /**
    *   Return PostgreSQL login user passwword
    *   params:
    *       NONE
    *   return:
    *       PostegreSQL login user passwword
    */
    CSettings.getPostgrePassword = function () {
        return this.m_Settings.postgre_password;
    };
    /**
    *   Return PostgreSQL database nme
    *   params:
    *       NONE
    *   return:
    *       PostegreSQL database name
    */
    CSettings.getPostgreDataBase = function () {
        return this.m_Settings.postgre_database;
    };
    /**
    *   Return App logfile full path
    *   params:
    *       NONE
    *   return:
    *       App logfile full path
    */
    CSettings.getLogsPath = function () {
        return this.m_Settings.logs_path;
    };
    /**
    *   Return App logfile level
    *   params:
    *       NONE
    *   return:
    *       App logfile level: 0:silent, 1:error, 2:info, 3:debug
    */
    CSettings.getVerboseLevel = function () {
        return this.m_Settings.verbose_level;
    };
    return CSettings;
}());
exports.CSettings = CSettings;
