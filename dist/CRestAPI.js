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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CRestAPI = void 0;
var express_1 = __importDefault(require("express"));
var mod_body_parser = require("body-parser");
var mod_cors = require("cors");
var CPostgres_1 = require("./CPostgres");
var CLogger_1 = require("./CLogger");
/**
 * DEVICE URI
 */
var URL_DEVICE_PREFIX = '/device';
var URL_DEVICE_POST_SENSOR_VALUES = '/sensor-values';
var URL_DEVICE_POST_KEEPALIVE_SERVER = '/keep-alive-server';
var URL_DEVICE_POST_KEEPALIVE_DEVICE = '/keep-alive-device';
/**
 * CLIENT URI
 */
var URL_CLIENT_PREFIX = '/client';
var URL_CLIENT_GET_CLIENT_LAST_DEVICES_VALUES = '/last-sensors-values';
var URL_CLIENT_GET_CLIENTS_LIST = '/clients';
var URL_CLIENT_GET_CLIENT_RANGE_DEVICE_VALUES = '/range-device-values';
var CRestAPI = /** @class */ (function () {
    function CRestAPI() {
    }
    /**
    *   Init CRestAPI class: initialize Express module and add-ons
    *   params:
    *       p_numRestApiPort: Port number of the REST API to listent to
    *   return:
    *       NONE
    */
    CRestAPI.init = function (p_numRestApiPort) {
        //add JSON body parser to Express
        this.m_moduleExpress.use(mod_body_parser.json());
        //add CORS to Express in order to allow development
        this.m_moduleExpress.use(mod_cors());
        //check token to each request
        this.m_moduleExpress.use(this.verifyToken);
        //start Express module and listen RESt API port
        this.m_moduleExpress.listen(p_numRestApiPort, function () {
            CLogger_1.CLogger.logInfo('CRestAPI:init => Server started on port: ' + p_numRestApiPort);
        });
    };
    /**
    *   Init CRestAPI class: initialize Express module and add-ons
    *   params:
    *       req: request headers
    *       res: response headers
    *       next: callback in order to go ahead if token is correct
    *   return:
    *       Next() callback if token is correct, otherwise, send an error message to the requester
    */
    CRestAPI.verifyToken = function (req, res, next) {
        //if request comes from a bridge/server-device-sensor, verify the device token
        if (req.url.startsWith(URL_DEVICE_PREFIX)) {
            CPostgres_1.CPostgres.getClientDeviceToken(req.body.api_client_id).then(function (result) {
                if (result[0].device_token === req.header('Authorization')) {
                    next();
                }
                else {
                    CLogger_1.CLogger.logError('CRestAPI:verifyToken (DEVICE) - TOKEN ERROR APIClientID: ' + req.body.api_client_id + ' => expected: ' + result[0].device_token + ', but received: ' + req.header('Authorization'));
                }
            }).catch(function (p_error) {
                CLogger_1.CLogger.logError(JSON.stringify(p_error));
                res.set('Connection', 'close');
                res.send({ status: 'ERROR_TOKEN' });
            });
        }
        //if request comes from a web/app client, verify the client token
        if (req.url.startsWith(URL_CLIENT_PREFIX)) {
            if (req.query.hasOwnProperty('clientID')) {
                CPostgres_1.CPostgres.getClientAppToken(req.query.clientID).then(function (result) {
                    //if (result[0].client_token === req.header('Authorization')) {
                    next();
                    /*} else {
                        CLogger.logError('CRestAPI:verifyToken (CLIENT) - TOKEN ERROR APIClientID: ' + req.query.clientID + ' => expected: ' + result[0].client_token + ', but received: ' + req.header('Authorization'));
                    }*/
                }).catch(function (err) {
                    CLogger_1.CLogger.logError(err);
                    res.set('Connection', 'close');
                    res.send({ status: 'ERROR_TOKEN' });
                });
            }
            else {
                next();
            }
        }
    };
    /**
    *   Express's requests management
    *
    *   params:
    *       NONE
    *   return:
    *       Response to the requester
    */
    CRestAPI.run = function () {
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
        this.m_moduleExpress.post(URL_DEVICE_PREFIX + URL_DEVICE_POST_SENSOR_VALUES, function (req, res) {
            CLogger_1.CLogger.logDebug(URL_DEVICE_POST_SENSOR_VALUES + ': ' + JSON.stringify(req.body));
            CPostgres_1.CPostgres.insertMeasuresValues(req.body.api_client_id, req.body.device_addr, req.body.temperature_value, req.body.humidity_value, req.body.partial_pressure_value, req.body.dew_point_value).then(function (result) {
            }).catch(function (error) {
                CLogger_1.CLogger.logError('CRestAPI:run => POST-TEMP-HUM: api_api_client_id=' + req.body.api_client_id + ' | device_addr=' + req.body.device_addr + ' | temp=' + req.body.temperature_value + ' | hum=' + req.body.humidity_value + ' | temp=' + req.body.partial_pressure_value + ' | hum=' + req.body.dew_point_value + ' | error=' + error.error + ' | query=' + error.query);
            });
            res.set('Connection', 'close');
            res.send({ status: 'SUCCESS' });
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
        this.m_moduleExpress.post(URL_DEVICE_PREFIX + URL_DEVICE_POST_KEEPALIVE_SERVER, function (req, res) {
            CPostgres_1.CPostgres.insertClientKeepAlive(req.body.api_client_id).then(function (result) {
                CLogger_1.CLogger.logDebug(URL_DEVICE_POST_KEEPALIVE_SERVER + ': ' + JSON.stringify(req.body));
            }).catch(function (error) {
                CLogger_1.CLogger.logError('CRestAPI:run => POST-KEEPALIVE-CLIENT: api_api_client_id=' + req.body.api_client_id + ' | error=' + error.error + ' | query=' + error.query);
            });
            res.set('Connection', 'close');
            res.send({ status: 'SUCCESS' });
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
        this.m_moduleExpress.post(URL_DEVICE_PREFIX + URL_DEVICE_POST_KEEPALIVE_DEVICE, function (req, res) {
            CPostgres_1.CPostgres.insertDeviceKeepAlive(req.body.api_client_id, req.body.device_addr).then(function (result) {
                CLogger_1.CLogger.logDebug(URL_DEVICE_POST_KEEPALIVE_DEVICE + ': ' + JSON.stringify(req.body));
            }).catch(function (error) {
                CLogger_1.CLogger.logError('POST-KEEPALIVE-DEVICE: api_api_client_id=' + req.body.api_client_id + ' | device_addr=' + req.body.device_addr + ' | error=' + error.error + ' | query=' + error.query);
            });
            res.set('Connection', 'close');
            res.send({ status: 'SUCCESS' });
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
        this.m_moduleExpress.get(URL_CLIENT_PREFIX + URL_CLIENT_GET_CLIENT_LAST_DEVICES_VALUES, function (req, res) {
            CPostgres_1.CPostgres.getClientLastValuesFromId(req.query.APIclientID).then(function (result) {
                CLogger_1.CLogger.logDebug(URL_CLIENT_GET_CLIENT_LAST_DEVICES_VALUES + ': ' + JSON.stringify(req.query));
                res.send({ status: 'SUCCESS', data: result });
            }).catch(function (error) {
                res.send({ status: 'FAILURE', msg: error });
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
        this.m_moduleExpress.get(URL_CLIENT_PREFIX + URL_CLIENT_GET_CLIENTS_LIST, function (req, res) {
            CPostgres_1.CPostgres.getClientsList().then(function (result) {
                CLogger_1.CLogger.logDebug(URL_CLIENT_GET_CLIENTS_LIST + ': ' + JSON.stringify(req.query));
                res.send({ status: 'SUCCESS', data: result });
            }).catch(function (error) {
                res.send({ status: 'FAILURE', msg: error });
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
        this.m_moduleExpress.get(URL_CLIENT_PREFIX + URL_CLIENT_GET_CLIENT_RANGE_DEVICE_VALUES, function (req, res) {
            CPostgres_1.CPostgres.getClientDeviceValues(req.query.APIclientID, req.query.deviceAddr, req.query.dateFrom, req.query.dateTo).then(function (result) {
                CLogger_1.CLogger.logDebug(URL_CLIENT_GET_CLIENTS_LIST + ': ' + JSON.stringify(req.query));
                res.send({ status: 'SUCCESS', data: result });
            }).catch(function (error) {
                res.send({ status: 'FAILURE', msg: error });
            });
        });
    };
    CRestAPI.m_moduleExpress = express_1.default();
    return CRestAPI;
}());
exports.CRestAPI = CRestAPI;
