require("./Base");

const inherits = require("util").inherits;
const miio = require("miio");

var Accessory, PlatformAccessory, Service, Characteristic, UUIDGen;
MiAirConditioner = function(platform, config) {
  this.init(platform, config);

  Accessory = platform.Accessory;
  PlatformAccessory = platform.PlatformAccessory;
  Service = platform.Service;
  Characteristic = platform.Characteristic;
  UUIDGen = platform.UUIDGen;

  this.device = new miio.Device({
    address: this.config["ip"],
    token: this.config["token"]
  });

  this.accessories = {};
  if (this.config["Name"] && this.config["Name"] != "") {
    this.accessories["AirConditionerAccessory"] = new AirConditionerService(
      this
    );
  }
  var accessoriesArr = this.obj2array(this.accessories);

  this.platform.log.debug(
    "[MiIRRemote][DEBUG]Initializing " +
      this.config["type"] +
      " device: " +
      this.config["ip"] +
      ", accessories size: " +
      accessoriesArr.length
  );

  return accessoriesArr;
};
inherits(MiAirConditioner, Base);

AirConditionerService = function(dThis) {
  this.device = dThis.device;
  this.name = dThis.config["Name"];
  this.token = dThis.config["token"];
  this.data = dThis.config["data"];
  this.platform = dThis.platform;
  this.AirConditionerService;
  (this.minTemperature = dThis.config["MinTemperature"] || 16),
    (this.maxTemperature = dThis.config["MaxTemperature"] || 30),
    (this.defaultTemperature = dThis.config["DefaultTemperature"] || 26);
  this.targettem = dThis.config["DefaultTemperature"] || 26;
  this.onoffstate = 0;
};

AirConditionerService.prototype.getServices = function() {
  var that = this;
  var services = [];
  var tokensan = this.token.substring(this.token.length - 8);
  var infoService = new Service.AccessoryInformation();
  infoService
    .setCharacteristic(Characteristic.Manufacturer, "XiaoMi")
    .setCharacteristic(Characteristic.Model, "MiIRRemote-AirConditioner")
    .setCharacteristic(Characteristic.SerialNumber, tokensan);
  services.push(infoService);
  var AirConditionerServices = (this.AirConditionerService = new Service.Thermostat(
    this.name,
    "MiAirConditioner"
  ));
  AirConditionerServices.getCharacteristic(
    Characteristic.TargetTemperature
  ).setProps({
    minValue: this.minTemperature,
    maxValue: this.maxTemperature,
    minStep: 1
  });
  AirConditionerServices.getCharacteristic(
    Characteristic.TemperatureDisplayUnits
  ).on("get", callback =>
    callback(Characteristic.TemperatureDisplayUnits.CELSIUS)
  );
  AirConditionerServices.getCharacteristic(
    Characteristic.CurrentHeatingCoolingState
  ).on(
    "get",
    function(callback) {
      callback(null, this.onoffstate);
    }.bind(this)
  );
  AirConditionerServices.getCharacteristic(
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
          "[MiIRRemote][" +
            this.name +
            "]AirConditioner: Status " +
            this.getStatusFrCha(sstatus)
        );
        callback(null, sstatus);
      }.bind(this)
    );
  AirConditionerServices.getCharacteristic(
    Characteristic.CurrentTemperature
  ).on(
    "get",
    function(callback) {
      callback(null, this.targettem);
    }.bind(this)
  );
  AirConditionerServices.getCharacteristic(Characteristic.TargetTemperature)
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
        this.AirConditionerService.setCharacteristic(
          Characteristic.CurrentTemperature,
          tem
        );
        that.platform.log.debug(
          "[MiIRRemote][" + this.name + "]AirConditioner: Temperature " + tem
        );
        callback(null, tem);
      }.bind(this)
    );

  services.push(AirConditionerServices);
  return services;
};

AirConditionerService.prototype.SendData = function(state, value) {
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
          this.AirConditionerService.setCharacteristic(
            Characteristic.CurrentHeatingCoolingState,
            0
          );
          this.AirConditionerService.setCharacteristic(
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
  if (datay !== "") {
    this.device
      .call("miIO.ir_play", { freq: 38400, code: datay })
      .then(result => {
        that.platform.log.debug(
          "[MiIRRemote][" + this.name + "]AirConditioner: Send Success"
        );
      })
      .catch(function(err) {
        that.platform.log.error(
          "[MiIRRemote][ERROR]AirConditioner Error: " + err
        );
        state = this.onoffstate;
      });
  }
  var temm = datas["tem"] || value;
  return { state: state, tem: temm };
};

AirConditionerService.prototype.GetDataString = function(dataa, value) {
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
        "[MiIRRemote][" +
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
        "[MiIRRemote][" +
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
AirConditionerService.prototype.getStatusFrCha = function(state) {
  switch (state) {
    case Characteristic.TargetHeatingCoolingState.AUTO:
      console.log("I was here", this.onoffstate);
      return this.onoffstate ? "Auto" : "AutoOn";
    case Characteristic.TargetHeatingCoolingState.COOL:
      console.log("I was here", this.onoffstate);
      return this.onoffstate ? "Cool" : "CoolOn";
    case Characteristic.TargetHeatingCoolingState.HEAT:
      console.log("I was here", this.onoffstate);
      return this.onoffstate ? "Heat" : "HeatOn";
    default:
      console.log("I was here", this.onoffstate);
      return "off";
  }
};
