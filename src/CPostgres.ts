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

const mod_postgre = require("pg").Pool;

/**
* 	Perform PostgreSQL access
*/
export class CPostgres {
    private static m_PostgrePool: any;

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
    public static init(p_strHost: String, p_numPort: number, p_strDatabase: String, p_strUserId: String, p_strPassword: String) {
        this.m_PostgrePool = new mod_postgre({
            user: p_strUserId,
            host: p_strHost,
            database: p_strDatabase,
            password: p_strPassword,
            port: p_numPort
        });
    }

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
    public static insertMeasuresValues(p_strAPIClientID: string, p_strDeviceAddr: string, p_strTemperatureValue: string, p_strHumidityValue: string, p_strPartialPressureValue: string, p_strDewPointTemperatureValue: string) {
        return new Promise((resolve, reject) => {
            const l_strQuery: string = 'insert into "tb_sensor_values" ("client_id", "device_id", "temperature", "humidity", "partial_pressure", "dew_point_temperature", "date_time") ' 
                                    + 'select "tb_clients"."id", "tb_devices"."id", ' +  parseFloat(p_strTemperatureValue) + ',' + parseFloat(p_strHumidityValue) + ',' + parseFloat(p_strPartialPressureValue) + ',' + parseFloat(p_strDewPointTemperatureValue) + ', now() '
                                    + 'from "tb_clients" inner join "tb_devices" on "tb_devices"."client_id" = "tb_clients"."id" where "tb_clients"."api_client_id" = \'' + p_strAPIClientID + '\' and "tb_devices"."device_addr" = ' + parseInt(p_strDeviceAddr);
    
            this.m_PostgrePool.query(l_strQuery, (p_error: any, p_result: any) => {
                if (p_error) {
                    reject({error: p_error, query: l_strQuery});
                } else {
                    if (p_result.rows.length !== 0) {
                        resolve(true);
                    }
                }
            });
        });
    }

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
    public static insertDeviceKeepAlive(p_strAPIClientId: string, p_strDeviceAddr: string) {
        return new Promise((resolve, reject) => {
            const l_strQuery: string = 
                                    'do $$\
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

            this.m_PostgrePool.query(l_strQuery, (p_error: any, p_result: any) => {
                if (p_error) {
                    reject({error: p_error, query: l_strQuery});
                } else {
                    if (p_result.rows.length !== 0) {
                        resolve(true);
                    }
                }
            });
        });
    }

    /**
	*   Insert or update last keep-alive of a client (in other words, the devices server)
    * 
    *   params
    *       p_strAPIClientId: client ID
    * 
    *   return
    *       Promise resolving or rejection; TRUE if succeeded, otherwise error message   
    */
   public static insertClientKeepAlive(p_strAPIClientId: string) {
        return new Promise((resolve, reject) => {
            const l_strQuery: string = 
                                    'do $$\
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

            this.m_PostgrePool.query(l_strQuery, (p_error: any, p_result: any) => {
                if (p_error) {
                    reject({error: p_error, query: l_strQuery});
                } else {
                    if (p_result.rows.length !== 0) {
                        resolve(true);
                    }
                }
            });
        });
    }

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
   public static getClientLastValuesFromId(p_strClientId: string) {
        return new Promise((resolve, reject) => {
            const l_strQuery: string = 'select distinct on ("tb_sensor_values"."device_id") "tb_sensor_values"."device_id", "tb_sensor_values"."date_time", "tb_devices"."name", "tb_sensor_values"."temperature", "tb_sensor_values"."humidity", "tb_sensor_values"."partial_pressure", "tb_sensor_values"."dew_point_temperature", "tb_devices"."device_addr" from "tb_sensor_values"' 
                                    + ' inner join "tb_devices" on "tb_devices"."id" = "tb_sensor_values"."device_id"' 
                                    + ' inner join "tb_clients" on "tb_clients"."id" = "tb_sensor_values"."client_id" where "tb_clients"."api_client_id" = \'' + p_strClientId 
                                    + '\' order by "tb_sensor_values"."device_id", "tb_sensor_values"."date_time" desc';

            this.m_PostgrePool.query(l_strQuery, (p_error: any, p_result: any) => {
                if (p_error) {
                    reject({error: p_error, query: l_strQuery});
                } else {
                    resolve(p_result.rows);
                }
            });
        });
    }

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
    public static getClientsList() {
        return new Promise((resolve, reject) => {
            const l_strQuery = 'select "tb_clients"."api_client_id", "tb_clients"."nickname" from "tb_clients"';
            
            this.m_PostgrePool.query(l_strQuery, (p_error: any, p_result: any) => {
                if (p_error) {
                    reject(p_error);
                } else {
                    resolve(p_result.rows);
                }
            });
        });
    }


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
    public static getClientDeviceValues(p_strAPIClientId: string, p_strDeviceAddr: string, p_strDateForm: string, p_strDateTo: string) {
        return new Promise((resolve, reject) => {
            const l_strQuery = 'select "tb_sensor_values"."date_time", "tb_sensor_values"."temperature", "tb_sensor_values"."humidity", "tb_sensor_values"."partial_pressure", "tb_sensor_values"."dew_point_temperature", "tb_devices"."name" from "tb_sensor_values"'
                                +' inner join "tb_clients" on "tb_clients"."id" = "tb_sensor_values"."client_id" inner join "tb_devices"  on "tb_devices"."id" = "tb_sensor_values"."device_id"'
                                + ' where "tb_devices"."device_addr"=' + parseInt(p_strDeviceAddr) + ' and "tb_clients"."api_client_id" = \'' + p_strAPIClientId + '\' and "tb_sensor_values"."date_time" between \'' + p_strDateForm + '\' and \' ' + p_strDateTo + '\''
                                + ' order by "date_time"';

            this.m_PostgrePool.query(l_strQuery, (p_error: any, p_result: any) => {
                if (p_error) {
                    reject({error: p_error, query: l_strQuery});
                } else {
                    resolve(p_result.rows);
                }
            });
        });
    }

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
    public static getClientAppToken(p_strAPIClientId: string) {
        return new Promise((resolve, reject) => {
            const l_strQuery = 'select "tb_clients"."client_token" from "tb_clients" where "tb_clients"."api_client_id" = \'' + p_strAPIClientId + '\'';

            this.m_PostgrePool.query(l_strQuery, (p_error: any, p_result: any) => {
                if (p_error) {
                    reject({error: p_error, query: l_strQuery});
                } else {
                    resolve(p_result.rows);
                }
            });
        });
    }

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
    public static getClientDeviceToken(p_strAPIClientId: string) {
        return new Promise((resolve, reject) => {
            const l_strQuery = 'select "tb_clients"."device_token" from "tb_clients" where "tb_clients"."api_client_id" = \'' + p_strAPIClientId + '\'';

            this.m_PostgrePool.query(l_strQuery, (p_error: any, p_result: any) => {
                if (p_error) {
                    reject({error: p_error, query: l_strQuery});
                } else {
                    resolve(p_result.rows);
                }
            });
        });

    }
};