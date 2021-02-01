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

const winston = require('winston');
const moment = require('moment');

//require('winston-daily-rotate-file');

const VERBOSE_LOG_SILENT: number = 0;
const VERBOSE_LOG_ERROR: number = 1;
const VERBOSE_LOG_INFO: number = 2;
const VERBOSE_LOG_DEBUG: number = 3;

/**	
 *	Global looger
 */
export class CLogger {
    private static m_logger: any;
    private static m_numVerboseLevel: number;

    /**
    *   Init CLogger class: set logs rules
    *   params: 
    *       p_strLoggerPath: full path of the logger file
    *       p_numVerboseLevel: level of logs: 0:silent, 1:error, 2:info, 3:debug
    *   return:
    *       NONE
    */
    public static init(p_strLoggerPath: String, p_numVerboseLevel: number) {
        //set global logger level
        this.m_numVerboseLevel = p_numVerboseLevel;

        //init logger for a file transport
        this.m_logger  = winston.createLogger({
            transports: [
                //new winston.transports.DailyRotateFile({
                new winston.transports.File({
                    filename: p_strLoggerPath,
                    timestamp: true,
                    level: "silly",
                    format: winston.format.combine(
                        winston.format.colorize(),
                        winston.format.timestamp(),
                        winston.format.printf((msg: any) => {
                            return moment().format("YYYY-MM-DD:HH:mm:ss") + " " + msg.level + " => " + msg.message;
                        })
                    ),
                    maxFiles: '10',
                    maxSize: '5m'
                })
            ]
        });
    }

    /**
    *  Log info message
    *   params: 
    *       p_strMessageLog: message to log
    *   return:
    *       NONE
    */
    public static logInfo(p_strMessageLog: String) {
        if (this.m_numVerboseLevel >= VERBOSE_LOG_INFO) {
            this.m_logger.log('info', p_strMessageLog);
        }
    }

    /**
    *  Log error message
    *   params: 
    *       p_strMessageLog: message to log
    *   return:
    *       NONE
    */
    public static logError(p_strMessageLog: String) {
        if (this.m_numVerboseLevel >= VERBOSE_LOG_ERROR) {
            this.m_logger.log('error', p_strMessageLog);
        }
    }

    /**
    *  Log debug message
    *   params: 
    *       p_strMessageLog: message to log
    *   return:
    *       NONE
    */
    public static logDebug(p_strMessageLog: String) {
        if (this.m_numVerboseLevel >= VERBOSE_LOG_DEBUG) {
            this.m_logger.log('debug', p_strMessageLog);
        }
    }
}