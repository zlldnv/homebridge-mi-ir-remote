let Service, Characteristic;

MiRemoteAirConditioner = function(platform, config) {
  this.platform = platform;
  this.config = config;

  this.platform.log.debug(`[MiRemoteAirConditioner]Initializing MiRemoteAirConditioner: ${this.config["ip"]}`);

  return new MiRemoteAirConditionerService(this);
};

class MiRemoteAirConditionerService {
  constructor({config, platform}) {
    const {Name, token, data, ip, MinTemperature = "16", MaxTemperature = "30", DefaultTemperature = "26"} = config;
    this.name = Name;
    this.token = token;
    this.data = data;
    this.platform = platform;
    this.readydevice = false;
    this.device = platform.getMiioDevice(
      {
        address: ip,
        token
      },
      this
    );

    Service = platform.HomebridgeAPI.hap.Service;
    Characteristic = platform.HomebridgeAPI.hap.Characteristic;

    this.MiRemoteAirConditionerService;
    (this.minTemperature = MinTemperature),
      (this.maxTemperature = MaxTemperature),
      (this.defaultTemperature = DefaultTemperature);
    this.targettem = DefaultTemperature;
    this.onoffstate = 0;
    const halfMinute = 30 * 1000;
    this.startPingingDevice(halfMinute);
  }

  startPingingDevice(period) {
    setInterval(() => {
      platform.log.debug("AirConditioner keep alive");
      this.device
        .call("miIO.ir_play", {freq: 38400, code: "dummy"})
        .then(() => {
          platform.log.debug("AirConditioner SUCCESS");
        })
        .catch(() => {
          platform.log.debug("AirConditioner FAIL");
        });
    }, period);
  }

  getServices() {
    const self = this;
    const services = [];
    const tokensan = this.token.substring(this.token.length - 8);
    const infoService = new Service.AccessoryInformation();
    infoService
      .setCharacteristic(Characteristic.Manufacturer, "XiaoMi")
      .setCharacteristic(Characteristic.Model, "MiIRRemote-AirConditioner")
      .setCharacteristic(Characteristic.SerialNumber, tokensan);
    services.push(infoService);
    const MiRemoteAirConditionerServices = (this.MiRemoteAirConditionerService = new Service.Thermostat(
      this.name,
      "MiRemoteAirConditioner"
    ));
    MiRemoteAirConditionerServices.getCharacteristic(Characteristic.TargetTemperature).setProps({
      minValue: this.minTemperature,
      maxValue: this.maxTemperature,
      minStep: 1
    });
    MiRemoteAirConditionerServices.getCharacteristic(Characteristic.TemperatureDisplayUnits).on("get", callback =>
      callback(Characteristic.TemperatureDisplayUnits.CELSIUS)
    );
    MiRemoteAirConditionerServices.getCharacteristic(Characteristic.CurrentHeatingCoolingState).on(
      "get",
      function(callback) {
        callback(null, this.onoffstate);
      }.bind(this)
    );
    MiRemoteAirConditionerServices.getCharacteristic(Characteristic.TargetHeatingCoolingState)
      .on(
        "get",
        function(callback) {
          callback(null, this.onoffstate);
        }.bind(this)
      )
      .on(
        "set",
        function(value, callback) {
          var sstatus = this.SendData(value, this.targettem);
          sstatus = sstatus["state"];
          this.onoffstate = sstatus;
          self.platform.log.debug(`[${this.name}] AirConditioner: Status ${this.getStatusFrCha(sstatus)}`);
          callback(null, sstatus);
        }.bind(this)
      );
    MiRemoteAirConditionerServices.getCharacteristic(Characteristic.CurrentTemperature).on(
      "get",
      function(callback) {
        callback(null, this.targettem);
      }.bind(this)
    );
    MiRemoteAirConditionerServices.getCharacteristic(Characteristic.TargetTemperature)
      .on(
        "get",
        function(callback) {
          callback(null, this.targettem);
        }.bind(this)
      )
      .on(
        "set",
        function(value, callback) {
          if (this.onoffstate !== 0) {
            var tem = this.SendData(this.onoffstate, value);
          }
          this.targettem = this.onoffstate !== 0 ? tem["tem"] : value;
          this.MiRemoteAirConditionerService.setCharacteristic(Characteristic.CurrentTemperature, this.targettem);
          self.platform.log.debug("[" + this.name + "]AirConditioner: Temperature " + this.targettem);
          callback(null, tem);
        }.bind(this)
      );

    services.push(MiRemoteAirConditionerServices);
    return services;
  }

  SendData(state, value) {
    if (value === null) {
      value = this.defaultTemperature;
    }
    const self = this;
    const sstatus = this.getStatusFrCha(state);
    let datas = {tem: value};
    if (sstatus == "off") {
      datay = this.data["off"];
    } else if (sstatus == "Auto") {
      if (this.data["Auto"] != null) {
        datas = this.GetDataString(this.data[sstatus], value);
        var datay = datas["data"];
      } else {
        datay = this.data["off"];
        state = 0;
        setTimeout(
          function() {
            this.MiRemoteAirConditionerService.setCharacteristic(Characteristic.CurrentHeatingCoolingState, 0);
            this.MiRemoteAirConditionerService.setCharacteristic(Characteristic.TargetHeatingCoolingState, 0);
          }.bind(this),
          0.6 * 1000
        );
      }
    } else {
      datas = this.GetDataString(this.data[sstatus], value);
      var datay = datas["data"];
    }
    if (datay !== "" && this.readydevice) {
      this.device
        .call("miIO.ir_play", {freq: 38400, code: datay})
        .then(() => {
          self.platform.log.debug(`[${this.name}]AirConditioner: Send Success`);
        })
        .catch(function(err) {
          self.platform.log.error(`[this.name][ERROR]AirConditioner Error: ${err}`);
          state = this.onoffstate;
          callback(err);
        });
    } else {
      self.platform.log.info(`[${this.name}] AirConditioner: Unready`);
    }
    var temm = datas["tem"] || value;
    return {state: state, tem: temm};
  }

  GetDataString(dataa, value) {
    let returnkey = this.targettem;
    if (dataa[value]) {
      returnkey = value;
    } else {
      var min = this.minTemperature;
      var max = this.maxTemperature;
      for (let i = value; i > this.minTemperature; i--) {
        if (dataa[i]) {
          min = i;
          i = -1;
        }
      }
      for (let i = value; i <= this.maxTemperature; i++) {
        if (dataa[i]) {
          max = i;
          i = 101;
        }
      }
      if (min > this.minTemperature && max < this.maxTemperature) {
        vmin = value - min;
        vmax = max - value;
        returnkey = vmin > vmax ? min : max;
        this.platform.log.error(
          `[${this.name}]AirConditioner: Illegal Temperature, Unisset: ${value} Use ${returnkey} instead`
        );
      } else {
        returnkey = this.defaultTemperature;
        this.platform.log.error(
          `[${this.name}]AirConditioner: Illegal Temperature, Unisset: ${value} Use ${returnkey} instead`
        );
      }
    }
    return {data: dataa[returnkey], tem: returnkey};
  }

  getStatusFrCha(state) {
    switch (state) {
      case Characteristic.TargetHeatingCoolingState.AUTO:
        return this.onoffstate === 0 ? "Auto" : "AutoOn";
      case Characteristic.TargetHeatingCoolingState.COOL:
        return this.onoffstate === 0 ? "Cool" : "CoolOn";
      case Characteristic.TargetHeatingCoolingState.HEAT:
        return this.onoffstate === 0 ? "Heat" : "HeatOn";
      default:
        return this.onoffstate === 0 ? "doNothing" : "off";
    }
  }
}
