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
exports.CLogger = void 0;
var winston = require('winston');
var moment = require('moment');
//require('winston-daily-rotate-file');
var VERBOSE_LOG_SILENT = 0;
var VERBOSE_LOG_ERROR = 1;
var VERBOSE_LOG_INFO = 2;
var VERBOSE_LOG_DEBUG = 3;
/**
 *	Global looger
 */
var CLogger = /** @class */ (function () {
    function CLogger() {
    }
    /**
    *   Init CLogger class: set logs rules
    *   params:
    *       p_strLoggerPath: full path of the logger file
    *       p_numVerboseLevel: level of logs: 0:silent, 1:error, 2:info, 3:debug
    *   return:
    *       NONE
    */
    CLogger.init = function (p_strLoggerPath, p_numVerboseLevel) {
        //set global logger level
        this.m_numVerboseLevel = p_numVerboseLevel;
        //init logger for a file transport
        this.m_logger = winston.createLogger({
            transports: [
                //new winston.transports.DailyRotateFile({
                new winston.transports.File({
                    filename: p_strLoggerPath,
                    timestamp: true,
                    level: "silly",
                    format: winston.format.combine(winston.format.colorize(), winston.format.timestamp(), winston.format.printf(function (msg) {
                        return moment().format("YYYY-MM-DD:HH:mm:ss") + " " + msg.level + " => " + msg.message;
                    })),
                    maxFiles: '10',
                    maxSize: '5m'
                })
            ]
        });
    };
    /**
    *  Log info message
    *   params:
    *       p_strMessageLog: message to log
    *   return:
    *       NONE
    */
    CLogger.logInfo = function (p_strMessageLog) {
        if (this.m_numVerboseLevel >= VERBOSE_LOG_INFO) {
            this.m_logger.log('info', p_strMessageLog);
        }
    };
    /**
    *  Log error message
    *   params:
    *       p_strMessageLog: message to log
    *   return:
    *       NONE
    */
    CLogger.logError = function (p_strMessageLog) {
        if (this.m_numVerboseLevel >= VERBOSE_LOG_ERROR) {
            this.m_logger.log('error', p_strMessageLog);
        }
    };
    /**
    *  Log debug message
    *   params:
    *       p_strMessageLog: message to log
    *   return:
    *       NONE
    */
    CLogger.logDebug = function (p_strMessageLog) {
        if (this.m_numVerboseLevel >= VERBOSE_LOG_DEBUG) {
            this.m_logger.log('debug', p_strMessageLog);
        }
    };
    return CLogger;
}());
exports.CLogger = CLogger;
