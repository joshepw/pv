const process = require('process');
const mqtt = require('mqtt');
const fs = require('fs');
const ads1x15 = require('ads1x15');
const sqlite3 = require('sqlite3');
const Config = require('./config');
const Helpers = require('./helpers');
const ModbusRTU = require('modbus-serial');
const Models = require('./models');

let lapsedSeconds = 0;
let consumption = 0;
let systemFault = null;

String.prototype.hashCode = function () {
	var hash = 0,
		i, chr;
	if (this.length === 0) return hash;
	for (i = 0; i < this.length; i++) {
		chr = this.charCodeAt(i);
		hash = ((hash << 5) - hash) + chr;
		hash |= 0; // Convert to 32bit integer
	}
	return Buffer.from(`${hash}`).toString('base64');
}

const db = new sqlite3.Database('historical.db');

const client = mqtt.connect(`mqtt://${Config.MQTT.host}`, {
	username: Config.MQTT.user,
	password: Config.MQTT.pass,
});

const client_status = {
	mqtt_connected: false,
	mbus_connected: false,
};

/**
 * Send data to services
 * 
 * @param {Models.Values} values 
 */
const onSendData = (values) => {
	if (values.DeviceSystemFault != 'None') {
		systemFault = values.DeviceSystemFault;
	}

	consumption = (values.OutputPower / (3600 / Config.Serial.interval)) + consumption;

	if (lapsedSeconds > 59) {
		onLapsedMinute(values);

		lapsedSeconds = 0;
		consumption = 0;
		systemFault = null;
	} else {
		lapsedSeconds++;
	}

	Object.keys(Models.ValuesConfig).forEach(key => {
		sendProbeSensorConfig(key);
		client.publish(`homeassistant/sensor/must-inverter/${key}`, `${values[key]}`);
	});
};

/**
 * Get ADC converter values 
 */
const readADCValues = async () => {
	const adc = new ads1x15(0x01);
	await adc.openBus(1);

	// measure / 1e3
	const measure_adc_current = (await adc.readSingleEnded({ channel: 0 })) / 1e3;
	const measure_adc_vcc = (await adc.readSingleEnded({ channel: 1 })) / 1e3;
	const measure_adc_voltage = (await adc.readSingleEnded({
		channelPositive: 2,
		channelNegative: 3,
	})) / 1e3;

	const voltage = measure_adc_voltage * 100;
	const current = (measure_adc_current - measure_adc_vcc) * 100;
	const power = (voltage * current) / 2;

	return {
		voltage,
		current: current > 1 ? current : 0,
		power: power > 1 ? power : 0
	};
};

/**
 * Connect to serial port
 */
const connectToSerial = () => {
	(async () => {
		while (!client_status.mbus_connected) {
			try {
				const modbus = new ModbusRTU();
				const interval = Config.Serial.interval * 1000;

				if (!fs.existsSync(Config.Serial.port)) {
					throw new Error(`The port is not available, will be try again in ${Config.Serial.timeout}s ...`);
				}

				console.log(`[MBUS] ${new Date()} - Connected to ${Config.Serial.port}`);
				client_status.mbus_connected = true;

				modbus.connectRTUBuffered(Config.Serial.port, Config.Serial.config);
				modbus.setTimeout(Config.Serial.timeout * 1000);
				modbus.setID(10);

				setInterval(async () => {
					try {
						const config = (await modbus.readHoldingRegisters(30000, 27)).data;
						const values = (await modbus.readHoldingRegisters(30030, 30)).data;
						const pv = await readADCValues();

						onSendData(new Models.Values(config, values, pv));
					} catch (error) {
						console.warn(`[MBUS] ${new Date()} - ${error}`);
					}
				}, interval);
			} catch (error) {
				client_status.mbus_connected = false;
				console.warn(`[MBUS] ${new Date()} - ${error}`);

				await Helpers.Sleep(Config.Serial.timeout * 1000);
			}
		}
	})();
};

/**
 * @param {Models.Values} values 
 */
const onLapsedMinute = function (values) {
	if (systemFault != 'None') {
		db.run(`INSERT INTO faults (message) VALUES ("${systemFault}")`);
	}

	db.run(`INSERT INTO consumption (power, state) VALUES (${consumption}, "${values.DeviceWorkState}")`);
	db.run(`INSERT INTO battery (percent, temp, state) VALUES (${values.BatterySocPercent}, ${values.BatteryTemperature}, "${values.BatteryState}")`);
};

/**
 * Send MQTT Probe sensor config
 * 
 * @param {string} key 
 */
const sendProbeSensorConfig = (key) => {
	const payload = {
		device: {
			identifiers: ['must-inverter_PV3300TLV'],
			manufacturer: 'Must',
			model: 'PV3300TLV',
			name: 'Hybrid Solar Inverter',
		},
		name: key.split(/(?=[A-Z])/).join(' '),
		state_topic: `homeassistant/sensor/must-inverter/${key}`,
		unique_id: `must-inverter_${key}_${key.hashCode()}`,
		...Models.ValuesConfig[key],
	};

	client.publish(`homeassistant/sensor/must-inverter/${key}/config`, JSON.stringify(payload));
};

client.on('connect', () => {
	client_status.mqtt_connected = true;
	console.log(`[MQTT] ${new Date()} - Connected to ${Config.MQTT.host}`);

	Object.keys(Models.ValuesConfig).forEach(key => {
		sendProbeSensorConfig(key);
	});

	try {
		db.run('CREATE TABLE IF NOT EXISTS "battery" ("id" integer,"percent" int,"temp" int,"state" varchar, "timestamp" DATE DEFAULT (datetime(\'now\',\'localtime\')), PRIMARY KEY (id));');
		db.run('CREATE TABLE IF NOT EXISTS "consumption" ("id" integer,"power" int,"state" varchar,"timestamp" DATE DEFAULT (datetime(\'now\',\'localtime\')), PRIMARY KEY (id));');
		db.run('CREATE TABLE IF NOT EXISTS "faults" ("id" integer,"message" varchar, "timestamp" DATE DEFAULT (datetime(\'now\',\'localtime\')), PRIMARY KEY (id));');

		connectToSerial();
	} catch (e) {
		console.log(e)
	}
});

client.on('close', () => {
	client_status.mqtt_connected = false;
	process.exit(1);
});