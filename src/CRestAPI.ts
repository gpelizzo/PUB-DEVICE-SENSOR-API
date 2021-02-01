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

import mod_express from "express";
import mod_body_parser = require('body-parser'); 
const mod_cors = require("cors");

import { CPostgres } from './CPostgres'
import { CLogger } from './CLogger';

/**
 * DEVICE URI
 */
const URL_DEVICE_PREFIX: string = '/device';
const URL_DEVICE_POST_SENSOR_VALUES: string = '/sensor-values';
const URL_DEVICE_POST_KEEPALIVE_SERVER: string = '/keep-alive-server';
const URL_DEVICE_POST_KEEPALIVE_DEVICE: string = '/keep-alive-device';

/**
 * CLIENT URI
 */
const URL_CLIENT_PREFIX: string = '/client';
const URL_CLIENT_GET_CLIENT_LAST_DEVICES_VALUES: string = '/last-sensors-values';
const URL_CLIENT_GET_CLIENTS_LIST: string = '/clients';
const URL_CLIENT_GET_CLIENT_RANGE_DEVICE_VALUES: string = '/range-device-values';


export class CRestAPI {
    private static m_moduleExpress = mod_express();

    /**
    *   Init CRestAPI class: initialize Express module and add-ons
    *   params: 
    *       p_numRestApiPort: Port number of the REST API to listent to
    *   return:
    *       NONE
    */
    public static init(p_numRestApiPort: number) {
        //add JSON body parser to Express
        this.m_moduleExpress.use(mod_body_parser.json());
        //add CORS to Express in order to allow development
        this.m_moduleExpress.use(mod_cors());
        //check token to each request
        this.m_moduleExpress.use(this.verifyToken);

        //start Express module and listen RESt API port
        this.m_moduleExpress.listen(p_numRestApiPort, () => {
            CLogger.logInfo('CRestAPI:init => Server started on port: ' + p_numRestApiPort);
        });
    }

    /**
    *   Init CRestAPI class: initialize Express module and add-ons
    *   params: 
    *       req: request headers
    *       res: response headers
    *       next: callback in order to go ahead if token is correct
    *   return:
    *       Next() callback if token is correct, otherwise, send an error message to the requester
    */
    private static verifyToken(req: any, res: any, next: any) {
        //if request comes from a bridge/server-device-sensor, verify the device token
        if (req.url.startsWith(URL_DEVICE_PREFIX)) {
            CPostgres.getClientDeviceToken(req.body.api_client_id).then((result: any) => {
                if (result[0].device_token === req.header('Authorization')) {
                    next();
                } else {
                    CLogger.logError('CRestAPI:verifyToken (DEVICE) - TOKEN ERROR APIClientID: ' + req.body.api_client_id + ' => expected: ' + result[0].device_token + ', but received: ' + req.header('Authorization'));
                }
            }).catch((p_error: any) => {
                CLogger.logError(JSON.stringify(p_error));
                res.set('Connection', 'close');
                res.send({status: 'ERROR_TOKEN'});
            });
        }
    
        //if request comes from a web/app client, verify the client token
        if (req.url.startsWith(URL_CLIENT_PREFIX)) {
            if (req.query.hasOwnProperty('clientID')) {
                CPostgres.getClientAppToken(req.query.clientID).then((result: any) => {
                    //if (result[0].client_token === req.header('Authorization')) {
                        next();
                    /*} else {
                        CLogger.logError('CRestAPI:verifyToken (CLIENT) - TOKEN ERROR APIClientID: ' + req.query.clientID + ' => expected: ' + result[0].client_token + ', but received: ' + req.header('Authorization'));
                    }*/
                }).catch((err: any) => {
                    CLogger.logError(err);
                    res.set('Connection', 'close');
                    res.send({status: 'ERROR_TOKEN'});
                });
            } else {
                next();
            }
        }
    }

    /**
    *   Express's requests management
    * 
    *   params: 
    *       NONE
    *   return:
    *       Response to the requester
    */
    public static run() {

        /**
         * DEVICES request: an immediate response to the device is mandatory in order to avoid blocking device task
         */

        /** 
         * POST: bride/server_sensor device pots sensor measures either for itself or for a simple-sensor device
         * Store measures values into the database
         * 
         * params:
         *      JSON:
         *      {
         *          api_client_id: id of the client
         *          device_addr: local address of the device
         *          temperature_value: tempearture value
         *          humidity_value: humidity value
         *          partial_pressure_value: partial pressure value
         *          dew_point_value: dew point temperature value
         *      }
         * 
         *  return:
         *      NONE
         */
        this.m_moduleExpress.post(URL_DEVICE_PREFIX + URL_DEVICE_POST_SENSOR_VALUES, (req: any, res: any) => { 
            CLogger.logDebug(URL_DEVICE_POST_SENSOR_VALUES + ': ' + JSON.stringify(req.body));

            CPostgres.insertMeasuresValues(req.body.api_client_id, req.body.device_addr,  req.body.temperature_value, req.body.humidity_value, req.body.partial_pressure_value, req.body.dew_point_value).then((result: any) => {
            }).catch((error: any) => {
                CLogger.logError('CRestAPI:run => POST-TEMP-HUM: api_api_client_id=' + req.body.api_client_id + ' | device_addr=' + req.body.device_addr + ' | temp=' + req.body.temperature_value + ' | hum=' + req.body.humidity_value + ' | temp=' + req.body.partial_pressure_value + ' | hum=' + req.body.dew_point_value + ' | error=' +  error.error + ' | query=' + error.query);
            });

            res.set('Connection', 'close');
            res.send({status: 'SUCCESS'});
        });

         /** 
         * POST: keep alive pulse in order to ensure that the client-site is still connected and alive. This message
         *       is manage by bridge/server-sensor device
         * 
         * Store date and client ID into the database
         * 
         * params:
         *      JSON:
         *      {
         *          api_client_id: id of the client
         *      }
         * 
         *  return:
         *      NONE
         */
        this.m_moduleExpress.post(URL_DEVICE_PREFIX + URL_DEVICE_POST_KEEPALIVE_SERVER, (req: any, res: any) => {
            CPostgres.insertClientKeepAlive(req.body.api_client_id).then((result: any) => {
                CLogger.logDebug(URL_DEVICE_POST_KEEPALIVE_SERVER + ': ' + JSON.stringify(req.body));
            }).catch((error: any) => {
                CLogger.logError('CRestAPI:run => POST-KEEPALIVE-CLIENT: api_api_client_id=' + req.body.api_client_id + ' | error=' +  error.error + ' | query=' + error.query);
            });

            res.set('Connection', 'close');
            res.send({status: 'SUCCESS'});
        });

        /** 
         * POST: keep alive pulse in order to ensure that a device is still connected and alive. This message
         *       is relayed by bridge/server-sensor device.
         * 
         * Store date, client ID and device ID into the database
         * 
         * params:
         *      JSON:
         *      {
         *          api_client_id: id of the client
         *          device_addr: local address of the device
         *      }
         *  
         * return:
         *      NONE
         */
        this.m_moduleExpress.post(URL_DEVICE_PREFIX + URL_DEVICE_POST_KEEPALIVE_DEVICE, (req: any, res: any) => {

            CPostgres.insertDeviceKeepAlive(req.body.api_client_id, req.body.device_addr).then((result: any) => {
                CLogger.logDebug(URL_DEVICE_POST_KEEPALIVE_DEVICE + ': ' + JSON.stringify(req.body));
            }).catch((error: any) => {
                CLogger.logError('POST-KEEPALIVE-DEVICE: api_api_client_id=' + req.body.api_client_id + ' | device_addr=' + req.body.device_addr + ' | error=' +  error.error + ' | query=' + error.query);
            });

            res.set('Connection', 'close');
            res.send({status: 'SUCCESS'});
        });


        /**
         * CLIENTS
         */

        /* GET: Retreive the last measures of all devices belonging to a client
        * 
        * params:
        *      Query:
        *       APIclientID: id of the client
        *  
        * return:
        *      ARRAY:
        *       [
        *           date_time: date&time of the measure
        *           name: name of the device
        *           device_addr: local address of the device
        *           temperature: temperature value
        *           humidity: humidity value
        *           partial_pressure: partial pressure value
        *           dew_point_temperature: dew point temperature value
        *       ], ....
        */
        this.m_moduleExpress.get(URL_CLIENT_PREFIX + URL_CLIENT_GET_CLIENT_LAST_DEVICES_VALUES, (req: any, res: any) => {
            CPostgres.getClientLastValuesFromId(req.query.APIclientID).then((result: any) => {
                CLogger.logDebug(URL_CLIENT_GET_CLIENT_LAST_DEVICES_VALUES + ': ' + JSON.stringify(req.query));
                res.send({status: 'SUCCESS', data: result});
            }).catch((error: any) => {
                res.send({status: 'FAILURE', msg: error});
            });
        });

        /** 
         * GET: Retreive the list of all the clients
         * 
         * params:
         *      NONE
         *  
         * return:
         *      ARRAY:
         *      [
         *          tech_id: client ID
         *          name: client name
         *      ]
         */
        this.m_moduleExpress.get(URL_CLIENT_PREFIX + URL_CLIENT_GET_CLIENTS_LIST, (req: any, res: any) => {
            CPostgres.getClientsList().then((result: any) => {
                CLogger.logDebug(URL_CLIENT_GET_CLIENTS_LIST + ': ' + JSON.stringify(req.query));
                res.send({status: 'SUCCESS', data: result});
            }).catch((error: any) => {
                res.send({status: 'FAILURE', msg: error});
            });
        });

        /** 
         * GET: Retreive sensor's measures range (date-to-date) regarding a device belonging to a client
         * 
         * params:
         *      QUERY:
         *          APIclientID: client ID
         *          deviceAddr: address of the device
         *          dateFrom: start date of the measures to retreive
         *          dateTo: end date of the measures to retreive
         * 
         * return:
         *      ARRAY:
         *      [
         *          name: name of the device
         *          date_time: date&time of the measure
         *          temperature: temperature value
         *          humidity: humidity value
         *          partial_pressure: partial pressure value
         *          dew_point_temperature: dew point temperature value
         *      ]
         */
        this.m_moduleExpress.get(URL_CLIENT_PREFIX + URL_CLIENT_GET_CLIENT_RANGE_DEVICE_VALUES, (req: any, res: any) => {
            CPostgres.getClientDeviceValues(req.query.APIclientID, req.query.deviceAddr, req.query.dateFrom, req.query.dateTo).then((result: any) => {
                CLogger.logDebug(URL_CLIENT_GET_CLIENTS_LIST + ': ' + JSON.stringify(req.query));
                res.send({status: 'SUCCESS', data: result});
            }).catch((error: any) => {
                res.send({status: 'FAILURE', msg: error});
            });
        });
    }
}