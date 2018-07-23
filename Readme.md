# Android Remote Debugger

This package can be used to facilitate the process of debugging android applications by providing automatic installation and running of the application remotely.

Usage:

### Installing:

`npm install -g android-remote-debugger`

### Run Debugger:

`remote-debugger <path_to_config_file> [--debug] [--ip]`

### Config File:
`config.js:`

> module.exports =
> {
>    ADBPort: 9123,
>    deviceIP:'192.168.1.7',
>    packageName: 'com.phonegap.helloworld',
>    packageAbsolutePath: './test/android-debug.apk',
> };

`packageName`: The name of your package (**required**)
`packagePath`: The path of your package apk file (**required**)
`deviceIP`: The IP address of the device, in order to use this IP for connecting to device you have to run the command with `--p` (**Optional**)
`ADBPort`: The port which adb server connected to (**Optional**)

### Basic Usage:

First run the debugger:
> remote-debugger ./config.js

Then connect the device via USB cable and enter the following command to start connection:
> connect

Now disconnect the device from usb cable, your device is still connected over WIFI. Then enter the following command to install your package.

> install

Finally you can start your application on the device with following command:

> restart

After each build you can simply enter the following command to install and restart it:
> ir

### Watch Mode:

You can use the following command to enter watch mode:
> watch
In this mode if any changes occurs in the apk file pass the installation, restarting and logging cycles automatically.
To exit from watch mode enter the following command:
> end watch
