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
exports.CPostgres = void 0;
var mod_postgre = require("pg").Pool;
/**
* 	Perform PostgreSQL access
*/
var CPostgres = /** @class */ (function () {
    function CPostgres() {
    }
    /**
    *   Initialize class
    *
    *   params
    *       p_strUserId: PosteGre User ID
    *       p_strHost:
    *       p_strDatabase;
    *           - database
    *           - password
    *           - port
    *           - tab_temp_hum
    *
    *   return
    *       NONE
    */
    CPostgres.init = function (p_strHost, p_numPort, p_strDatabase, p_strUserId, p_strPassword) {
        this.m_PostgrePool = new mod_postgre({
            user: p_strUserId,
            host: p_strHost,
            database: p_strDatabase,
            password: p_strPassword,
            port: p_numPort
        });
    };
    /**
    *   Insert sensor's measures' values value into database table. String values are converted into Float ones
    *
    *   params
    *       p_strAPIClientID: client ID
    *       p_strDeviceAddr: device ID
    *       p_strTemperatureValue: temperature string value
    *       p_strHumidityValue: humidy string value
    *       p_strPartialPressureValue:  partial pressure string value
    *       p_strDewPointTemperatureValue: dew point temperature string value
    *
    *   return
    *       Promise resolving or rejection; TRUE if succeeded, otherwise error message
    */
    CPostgres.insertMeasuresValues = function (p_strAPIClientID, p_strDeviceAddr, p_strTemperatureValue, p_strHumidityValue, p_strPartialPressureValue, p_strDewPointTemperatureValue) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var l_strQuery = 'insert into "tb_sensor_values" ("client_id", "device_id", "temperature", "humidity", "partial_pressure", "dew_point_temperature", "date_time") '
                + 'select "tb_clients"."id", "tb_devices"."id", ' + parseFloat(p_strTemperatureValue) + ',' + parseFloat(p_strHumidityValue) + ',' + parseFloat(p_strPartialPressureValue) + ',' + parseFloat(p_strDewPointTemperatureValue) + ', now() '
                + 'from "tb_clients" inner join "tb_devices" on "tb_devices"."client_id" = "tb_clients"."id" where "tb_clients"."api_client_id" = \'' + p_strAPIClientID + '\' and "tb_devices"."device_addr" = ' + parseInt(p_strDeviceAddr);
            _this.m_PostgrePool.query(l_strQuery, function (p_error, p_result) {
                if (p_error) {
                    reject({ error: p_error, query: l_strQuery });
                }
                else {
                    if (p_result.rows.length !== 0) {
                        resolve(true);
                    }
                }
            });
        });
    };
    /**
    *   Insert or update last keep-alive of a device
    *
    *   params
    *       p_strAPIClientId: client ID
    *       p_strDeviceAddr: device ID
    *
    *   return
    *       Promise resolving or rejection; TRUE if succeeded, otherwise error message
    */
    CPostgres.insertDeviceKeepAlive = function (p_strAPIClientId, p_strDeviceAddr) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var l_strQuery = 'do $$\
                                    declare\
                                        _client_id integer;\
                                        _device_id integer;\
                                    begin\
                                        select "tb_clients"."id", "tb_devices"."id" into _client_id, _device_id from tb_clients\
                                        inner join "tb_devices" on "tb_devices"."device_addr" = ' + parseInt(p_strDeviceAddr) + ' \
                                        where "tb_devices"."client_id" = "tb_clients"."id" and "tb_clients"."api_client_id" = \'' + p_strAPIClientId + '\';\
                                        if exists\
                                            (select "client_id", "device_id" from "tb_devices_keepalive" where "client_id" = _client_id and "device_id" = _device_id)\
                                        then\
                                            update "tb_devices_keepalive" set "date_time" = now() where "client_id" = _client_id and device_id = _device_id;\
                                        else\
                                            insert into "tb_devices_keepalive" ("client_id", "device_id", "date_time") values (_client_id, _device_id, now());\
                                        end if;\
                                end\
                                $$;';
            _this.m_PostgrePool.query(l_strQuery, function (p_error, p_result) {
                if (p_error) {
                    reject({ error: p_error, query: l_strQuery });
                }
                else {
                    if (p_result.rows.length !== 0) {
                        resolve(true);
                    }
                }
            });
        });
    };
    /**
    *   Insert or update last keep-alive of a client (in other words, the devices server)
    *
    *   params
    *       p_strAPIClientId: client ID
    *
    *   return
    *       Promise resolving or rejection; TRUE if succeeded, otherwise error message
    */
    CPostgres.insertClientKeepAlive = function (p_strAPIClientId) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var l_strQuery = 'do $$\
                                    declare\
                                        _client_id integer;\
                                        begin\
                                        select "id" into _client_id from tb_clients where "tb_clients"."api_client_id" = \'' + p_strAPIClientId + '\';\
                                        if exists\
                                            (select "client_id" from "tb_clients_keepalive" where "client_id" = _client_id)\
                                        then\
                                            update "tb_clients_keepalive" set "date_time" = now() where "client_id" = _client_id;\
                                        else\
                                            insert into "tb_clients_keepalive" ("client_id", "date_time") values (_client_id, now());\
                                        end if;\
                                end\
                                $$;';
            _this.m_PostgrePool.query(l_strQuery, function (p_error, p_result) {
                if (p_error) {
                    reject({ error: p_error, query: l_strQuery });
                }
                else {
                    if (p_result.rows.length !== 0) {
                        resolve(true);
                    }
                }
            });
        });
    };
    /**
    *   retreive last values of all devices belonging to a client
    *
    *   params
    *       p_strClientID: client ID
    *
    *   return
    *       Promise resolving or rejection; TRUE if succeeded, otherwise error message
    *       ARRAY:
    *       [
    *           date_time: date&time of the measure
    *           name: name of the device
    *           device_adde: local address of the device
    *           temperature: temperature value
    *           humidity: humidity value
    *           partial_pressure: partial pressure value
    *           dew_point_temperature: dew point temperature value
    *       ], ....
    */
    CPostgres.getClientLastValuesFromId = function (p_strClientId) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var l_strQuery = 'select distinct on ("tb_sensor_values"."device_id") "tb_sensor_values"."device_id", "tb_sensor_values"."date_time", "tb_devices"."name", "tb_sensor_values"."temperature", "tb_sensor_values"."humidity", "tb_sensor_values"."partial_pressure", "tb_sensor_values"."dew_point_temperature", "tb_devices"."device_addr" from "tb_sensor_values"'
                + ' inner join "tb_devices" on "tb_devices"."id" = "tb_sensor_values"."device_id"'
                + ' inner join "tb_clients" on "tb_clients"."id" = "tb_sensor_values"."client_id" where "tb_clients"."api_client_id" = \'' + p_strClientId
                + '\' order by "tb_sensor_values"."device_id", "tb_sensor_values"."date_time" desc';
            _this.m_PostgrePool.query(l_strQuery, function (p_error, p_result) {
                if (p_error) {
                    reject({ error: p_error, query: l_strQuery });
                }
                else {
                    resolve(p_result.rows);
                }
            });
        });
    };
    /**
    *   retreive clients list
    *
    *   params
    *       NONE
    *
    *   return
    *       Promise resolving or rejection; TRUE if succeeded, otherwise error message
    *       ARRAY:
    *       [
    *           api_client_id: client ID
    *           nickname: client nickname
    *       ]
    */
    CPostgres.getClientsList = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var l_strQuery = 'select "tb_clients"."api_client_id", "tb_clients"."nickname" from "tb_clients"';
            _this.m_PostgrePool.query(l_strQuery, function (p_error, p_result) {
                if (p_error) {
                    reject(p_error);
                }
                else {
                    resolve(p_result.rows);
                }
            });
        });
    };
    /**
    *   Retreive sensor's measures range (date-to-date) regarding a device belonging to a client
    *
    *   params:
    *       p_strAPIClientId: client ID
    *       p_strDeviceAddr: device address
    *       p_strDateForm: start date of the measures to retreive
    *       p_strDateTo: end date of the measures to retreive
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
    CPostgres.getClientDeviceValues = function (p_strAPIClientId, p_strDeviceAddr, p_strDateForm, p_strDateTo) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var l_strQuery = 'select "tb_sensor_values"."date_time", "tb_sensor_values"."temperature", "tb_sensor_values"."humidity", "tb_sensor_values"."partial_pressure", "tb_sensor_values"."dew_point_temperature", "tb_devices"."name" from "tb_sensor_values"'
                + ' inner join "tb_clients" on "tb_clients"."id" = "tb_sensor_values"."client_id" inner join "tb_devices"  on "tb_devices"."id" = "tb_sensor_values"."device_id"'
                + ' where "tb_devices"."device_addr"=' + parseInt(p_strDeviceAddr) + ' and "tb_clients"."api_client_id" = \'' + p_strAPIClientId + '\' and "tb_sensor_values"."date_time" between \'' + p_strDateForm + '\' and \' ' + p_strDateTo + '\''
                + ' order by "date_time"';
            _this.m_PostgrePool.query(l_strQuery, function (p_error, p_result) {
                if (p_error) {
                    reject({ error: p_error, query: l_strQuery });
                }
                else {
                    resolve(p_result.rows);
                }
            });
        });
    };
    /**
    *   Retreive App token normally used by a client App (web or mobile app) to access data
    *
    *   params:
    *       p_strAPIClientId: client ID
    *
    * return:
    *      ARRAY: (normaly size = 1)
    *      [
    *          client_token: clien token
    *      ]
    */
    CPostgres.getClientAppToken = function (p_strAPIClientId) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var l_strQuery = 'select "tb_clients"."client_token" from "tb_clients" where "tb_clients"."api_client_id" = \'' + p_strAPIClientId + '\'';
            _this.m_PostgrePool.query(l_strQuery, function (p_error, p_result) {
                if (p_error) {
                    reject({ error: p_error, query: l_strQuery });
                }
                else {
                    resolve(p_result.rows);
                }
            });
        });
    };
    /**
    *   Retreive device token normally used by a bridge/server-sensor device to push new data
    *
    *   params:
    *       p_strAPIClientId: client ID
    *
    * return:
    *      ARRAY: (normaly size = 1)
    *      [
    *          device_token: clien token
    *      ]
    */
    CPostgres.getClientDeviceToken = function (p_strAPIClientId) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var l_strQuery = 'select "tb_clients"."device_token" from "tb_clients" where "tb_clients"."api_client_id" = \'' + p_strAPIClientId + '\'';
            _this.m_PostgrePool.query(l_strQuery, function (p_error, p_result) {
                if (p_error) {
                    reject({ error: p_error, query: l_strQuery });
                }
                else {
                    resolve(p_result.rows);
                }
            });
        });
    };
    return CPostgres;
}());
exports.CPostgres = CPostgres;
;
