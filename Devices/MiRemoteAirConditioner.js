var Service, Characteristic;

MiRemoteAirConditioner = function(platform, config) {
  this.platform = platform;
  this.config = config;

  this.platform.log.debug(
    "[MiRemoteAirConditioner]Initializing MiRemoteAirConditioner: " +
      this.config["ip"]
  );

  return new MiRemoteAirConditionerService(this);
};

MiRemoteAirConditionerService = function(dThis) {
  this.name = dThis.config["Name"];
  this.token = dThis.config["token"];
  this.data = dThis.config["data"];
  this.platform = dThis.platform;

  this.readydevice = false;
  var configarray = {
    address: dThis.config["ip"],
    token: dThis.config["token"]
  };
  this.device = dThis.platform.getMiioDevice(configarray, this);

  Service = dThis.platform.HomebridgeAPI.hap.Service;
  Characteristic = dThis.platform.HomebridgeAPI.hap.Characteristic;

  this.MiRemoteAirConditionerService;
  (this.minTemperature = dThis.config["MinTemperature"] || 16),
    (this.maxTemperature = dThis.config["MaxTemperature"] || 30),
    (this.defaultTemperature = dThis.config["DefaultTemperature"] || 26);
  this.targettem = dThis.config["DefaultTemperature"] || 26;
  this.onoffstate = 0;
  var mThis = this;
  setInterval(function() {
    dThis.platform.log.debug("AirConditioner keep alive");
    mThis.device
      .call("miIO.ir_play", { freq: 38400, code: "dummy" })
      .then(result => {
        dThis.platform.log.debug("AirConditioner SUCCESS");
      })
      .catch(res => {
        dThis.platform.log.debug("AirConditioner FAIL");
      });
  }, 30 * 1000);
};

MiRemoteAirConditionerService.prototype.getServices = function() {
  var that = this;
  var services = [];
  var tokensan = this.token.substring(this.token.length - 8);
  var infoService = new Service.AccessoryInformation();
  infoService
    .setCharacteristic(Characteristic.Manufacturer, "XiaoMi")
    .setCharacteristic(Characteristic.Model, "MiIRRemote-AirConditioner")
    .setCharacteristic(Characteristic.SerialNumber, tokensan);
  services.push(infoService);
  var MiRemoteAirConditionerServices = (this.MiRemoteAirConditionerService = new Service.Thermostat(
    this.name,
    "MiRemoteAirConditioner"
  ));
  MiRemoteAirConditionerServices.getCharacteristic(
    Characteristic.TargetTemperature
  ).setProps({
    minValue: this.minTemperature,
    maxValue: this.maxTemperature,
    minStep: 1
  });
  MiRemoteAirConditionerServices.getCharacteristic(
    Characteristic.TemperatureDisplayUnits
  ).on("get", callback =>
    callback(Characteristic.TemperatureDisplayUnits.CELSIUS)
  );
  MiRemoteAirConditionerServices.getCharacteristic(
    Characteristic.CurrentHeatingCoolingState
  ).on(
    "get",
    function(callback) {
      callback(null, this.onoffstate);
    }.bind(this)
  );
  MiRemoteAirConditionerServices.getCharacteristic(
    Characteristic.TargetHeatingCoolingState
  )
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
        that.platform.log.debug(
          "[" +
            this.name +
            "]AirConditioner: Status " +
            this.getStatusFrCha(sstatus)
        );
        callback(null, sstatus);
      }.bind(this)
    );
  MiRemoteAirConditionerServices.getCharacteristic(
    Characteristic.CurrentTemperature
  ).on(
    "get",
    function(callback) {
      callback(null, this.targettem);
    }.bind(this)
  );
  MiRemoteAirConditionerServices.getCharacteristic(
    Characteristic.TargetTemperature
  )
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
          tem = tem["tem"];
        } else {
          tem = value;
        }
        this.targettem = tem;
        this.MiRemoteAirConditionerService.setCharacteristic(
          Characteristic.CurrentTemperature,
          tem
        );
        that.platform.log.debug(
          "[" + this.name + "]AirConditioner: Temperature " + tem
        );
        callback(null, tem);
      }.bind(this)
    );

  services.push(MiRemoteAirConditionerServices);
  return services;
};

MiRemoteAirConditionerService.prototype.SendData = function(state, value) {
  if (value === null) {
    value = this.defaultTemperature;
  }
  var that = this;
  var sstatus = this.getStatusFrCha(state);
  var datas = { tem: value };
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
          this.MiRemoteAirConditionerService.setCharacteristic(
            Characteristic.CurrentHeatingCoolingState,
            0
          );
          this.MiRemoteAirConditionerService.setCharacteristic(
            Characteristic.TargetHeatingCoolingState,
            0
          );
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
      .call("miIO.ir_play", { freq: 38400, code: datay })
      .then(result => {
        that.platform.log.debug(
          "[" + this.name + "]AirConditioner: Send Success"
        );
      })
      .catch(function(err) {
        that.platform.log.error(
          "[" + this.name + "][ERROR]AirConditioner Error: " + err
        );
        state = this.onoffstate;
        callback(err);
      });
  } else {
    that.platform.log.info("[" + this.name + "]AirConditioner: Unready");
  }
  var temm = datas["tem"] || value;
  return { state: state, tem: temm };
};

MiRemoteAirConditionerService.prototype.GetDataString = function(dataa, value) {
  var that = this;
  var returnkey = this.targettem;
  if (dataa[value]) {
    returnkey = value;
  } else {
    var min = this.minTemperature;
    var max = this.maxTemperature;
    for (var i = value; i > this.minTemperature; i--) {
      if (dataa[i]) {
        min = i;
        i = -1;
      }
    }
    for (var i = value; i <= this.maxTemperature; i++) {
      if (dataa[i]) {
        max = i;
        i = 101;
      }
    }
    if (min > this.minTemperature && max < this.maxTemperature) {
      vmin = value - min;
      vmax = max - value;
      if (vmin > vmax) {
        returnkey = min;
      } else {
        returnkey = max;
      }
      that.platform.log.error(
        "[" +
          this.name +
          "]AirConditioner: Illegal Temperature, Unisset: " +
          value +
          " Use " +
          returnkey +
          " instead"
      );
    } else {
      returnkey = this.defaultTemperature;
      that.platform.log.error(
        "[" +
          this.name +
          "]AirConditioner: Illegal Temperature, Unisset: " +
          value +
          " Use " +
          returnkey +
          " instead"
      );
    }
  }
  return { data: dataa[returnkey], tem: returnkey };
};

MiRemoteAirConditionerService.prototype.getStatusFrCha = function(state) {
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
};
