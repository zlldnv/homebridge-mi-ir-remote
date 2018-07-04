var Service,Characteristic;

MiRemoteLight = function(platform, config) {
    this.platform = platform;
    this.config = config;

    this.platform.log.debug("[MiRemoteLight]Initializing MiRemoteLight: " + this.config["ip"]);
    
    return new MiRemoteLightService(this);
}

MiRemoteLightService = function(dThis) {
    this.name = dThis.config['Name'];
    this.token = dThis.config['token'];
    this.data = dThis.config['data'];
    this.platform = dThis.platform;

    this.readydevice = false;
    var configarray = {
        address: dThis.config['ip'],
        token: dThis.config['token']
    };
    this.device = dThis.platform.getMiioDevice(configarray,this);

    Service = dThis.platform.HomebridgeAPI.hap.Service;
    Characteristic = dThis.platform.HomebridgeAPI.hap.Characteristic;

    this.onoffstate = false;
    this.brightness = 100;
}

MiRemoteLightService.prototype.getServices = function() {
    var that = this;
    var services = [];
    var tokensan = this.token.substring(this.token.length-8);
    var infoService = new Service.AccessoryInformation();
    infoService
        .setCharacteristic(Characteristic.Manufacturer, "XiaoMi")
        .setCharacteristic(Characteristic.Model, "MiIRRemote-Light")
        .setCharacteristic(Characteristic.SerialNumber, tokensan);
    services.push(infoService);   
    var MiRemoteLightServices = new Service.Lightbulb(this.name);
    var MiRemoteLightServicesCharacteristic = MiRemoteLightServices.getCharacteristic(Characteristic.On);
    MiRemoteLightServicesCharacteristic
        .on('set',function(value, callback) {
            if(this.readydevice){
                if(this.onoffstate == "on" && value){
                    that.platform.log.debug("[" + this.name + "]Light: Already On");
                    callback(null);
                }else if(this.onoffstate == "off" && value){
                    this.onoffstate = value ? "on" : "off";
                    this.device.call("miIO.ir_play", {"freq":38400,"code":this.data["100"]}).then(result => {
                        that.platform.log.debug("[" + this.name + "]Light: 100");
                        callback(null);
                    }).catch(function(err) {
                        that.platform.log.error("[ERROR]Light Error: " + err);
                        callback(err);
                    });
                }else{   
                    this.onoffstate = value ? "on" : "off";
                    this.device.call("miIO.ir_play", {"freq":38400,"code":this.data["off"]}).then(result => {
                        that.platform.log.debug("[" + this.name + "]Light: Off");
                        callback(null);
                    }).catch(function(err) {
                        that.platform.log.error("[ERROR]Light Error: " + err);
                        callback(err);
                    });
                }
            }else{
                that.platform.log.info("[" + this.name + "]Light: Unready");
                callback(null);
            }
        }.bind(this))
        .on('get', function(callback) {
            callback(null,this.onoffstate);
        }.bind(this))
    MiRemoteLightServices
        .addCharacteristic(Characteristic.Brightness)
        .on('get', function(callback) {
            callback(null, this.brightness);
        }.bind(this))
        .on('set', function(value, callback) {
            var brightne;
            if(this.data[value]){
                this.brightness = brightne = value;
            }else if(value == 0){
                this.brightness = 0;
                brightne = "off";
            }else{
                var min = 0;
                var max = 100;
                for(var i = value; i > 0; i--) {
                    if(this.data[i]){
                        min = i;
                        i = -1;
                    }
                }
                for(var i = value; i <= 100; i++) {
                    if(this.data[i]){
                        max = i;
                        i = 101;
                    }
                }
                if(min > 0 && max < 100){
                    vmin = value - min;
                    vmax = max - value;
                    if(vmin > vmax){
                        this.brightness = brightne = min;
                    }else{
                        this.brightness = brightne = max;
                    }
                    that.platform.log.error("[" + this.name + "]Light: Illegal Brightness, Unisset: " + value + " Use " + brightne + " instead"); 
                }else{ 
                    this.brightness = brightne = 100;
                    that.platform.log.error("[" + this.name + "]Light: Illegal Brightness, Unisset: " + value + " Use " + brightne + " instead");      
                }
            }
            if(this.readydevice){
                this.device.call("miIO.ir_play", {"freq":38400,"code":this.data[brightne]}).then(result => { 
                    that.platform.log.debug("[" + this.name + "]Light: Set to " + this.brightness);
                    callback(null, this.brightness);
                }).catch(function(err) {
                    that.platform.log.error("[" + this.name + "][ERROR]Light Error: " + err);
                    callback(err);
                });
            }else{
                that.platform.log.info("[" + this.name + "]Light: Unready");
                callback(null);
            } 
        }.bind(this));
    
    services.push(MiRemoteLightServices);
    return services;
}