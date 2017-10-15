# homebridge-mi-ir-remote
[![npm version](https://badge.fury.io/js/homebridge-mi-ir-remote.svg)](https://badge.fury.io/js/homebridge-mi-ir-remote)

ChuangMi IR Remote plugin for HomeBridge.   
   
Thanks for [nfarina](https://github.com/nfarina)(the author of [homebridge](https://github.com/nfarina/homebridge)), [OpenMiHome](https://github.com/OpenMiHome/mihome-binary-protocol), [aholstenson](https://github.com/aholstenson)(the author of [miio](https://github.com/aholstenson/miio)), all other developer and testers.   

## Supported Types
1.Switch
2.LightBulb
3.Projector
4.Airconditioner

## Installation
1. Install HomeBridge, please follow it's [README](https://github.com/nfarina/homebridge/blob/master/README.md).   
If you are using Raspberry Pi, please read [Running-HomeBridge-on-a-Raspberry-Pi](https://github.com/nfarina/homebridge/wiki/Running-HomeBridge-on-a-Raspberry-Pi).   
2. Make sure you can see HomeBridge in your iOS devices, if not, please go back to step 1.   
3. Install packages.   
```
npm install -g miio homebridge-mi-ir-remote
```
## Configuration
```
"platforms": [
    {
        "platform": "ChuangmiIRPlatform",
        "hidelearn": false,
        "learnconfig":{
            "ip": "192.168.31.xx",
            "token": "xxxxxxx"
        },
        "deviceCfgs": [{
            "type": "Switch",
            "ip": "192.168.31.xx",
            "token": "xxxxxxx",
            "Name": "IR Switch",
            "data": {
                "on" : "xxxxxxx",
                "off": "xxxxxxx"
            }
        },{
                "type": "Projector",
                "ip": "192.168.31.xx",
                "token": "xxxxxxxx",
                "Name": "IR Projector",
                "interval": 1,
                "data": {
                    "on" : "xxxxxxxxxxxxx",
                    "off": "xxxxxxxxxxxxx"
                }
        },{
                "type": "Light",
                "ip": "192.168.31.xx",
                "token": "xxx",
                "Name": "IR LightBulb",
                "data": {
                    "100" : "xxxx",
                    "75" : "xxxxx",
                    "50" : "xxxxx",
                    "25" : "xxxxx",
                    "off" : "xxxx"
                }
         },{
                "type": "AirConditioner",
                "ip": "192.168.31.xx",
                "token": "xxx",
                "Name": "IR AC",
                "DefaultTemperature": 25,
                "MinTemperature": 16,
                "MaxTemperature": 30,
                "data": {
                    "Cool":{
                        "30" : "xxx",
                        "25" : "xxx",
                        "20" : "xxx",
                        "16" : "xxx"
                    },
                    "Heat":{
                        "30" : "xxx",
                        "25" : "xxx",
                        "20" : "xxx",
                        "16" : "xxx"
                    },
                    "off" : "xxxx"
                }
            }]
    }]
```
## Get token
Open command prompt or terminal. Run following command:
```
miio --discover
```
Wait until you get output similar to this:
```
Device ID: xxxxxxxx   
Model info: Unknown   
Address: 192.168.88.xx   
Token: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx via auto-token   
Support: Unknown   
```
"xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" is token.   
If token is "???", then reset device and connect device created Wi-Fi hotspot.   
Run following command:   
```
miio --discover --sync
```
Wait until you get output.   
For more information about token, please refer to [OpenMiHome](https://github.com/OpenMiHome/mihome-binary-protocol) and [miio](https://github.com/aholstenson/miio).   
## Version Logs  
### 0.0.1
1.support for Switch and IRlearn.  
