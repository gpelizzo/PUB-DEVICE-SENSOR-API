"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CMain = void 0;
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
var CSettings_1 = require("./CSettings");
var CPostgres_1 = require("./CPostgres");
var CRestAPI_1 = require("./CRestAPI");
var CLogger_1 = require("./CLogger");
var mod_appRoot = require('app-root-path');
var CMain = /** @class */ (function () {
    function CMain() {
    }
    CMain.init = function () {
        //first retreive global settings from settings.json file
        CSettings_1.CSettings.init(mod_appRoot + '/settings.json').then(function () {
            //init logger
            CLogger_1.CLogger.init(CSettings_1.CSettings.getLogsPath(), CSettings_1.CSettings.getVerboseLevel());
            //init postegreSQL access class
            CPostgres_1.CPostgres.init(CSettings_1.CSettings.getPostgreHost(), CSettings_1.CSettings.getPostgrePort(), CSettings_1.CSettings.getPostgreDataBase(), CSettings_1.CSettings.getPostgreUser(), CSettings_1.CSettings.getPostgrePassword());
            //init REST API static class based on Express
            CRestAPI_1.CRestAPI.init(CSettings_1.CSettings.getRestAPIPort());
            //Run REST API static class and listen for HTTPS REST requests
            CRestAPI_1.CRestAPI.run();
        }).catch(function (p_error) {
            //trace the issue to open the settings.json file
            console.log(JSON.stringify(p_error));
        });
    };
    return CMain;
}());
exports.CMain = CMain;
CMain.init();
