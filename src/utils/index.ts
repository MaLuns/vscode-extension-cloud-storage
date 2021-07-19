
import * as vscode from 'vscode';
import path = require('path');
import fs = require('fs');
import { spawn } from 'child_process';
import { tmpdir } from 'os';
const pak = require('../../package.json');

/**
 * 保存剪贴板图片
 * @param imagePath 图片保存地址
 * @returns 
 */
export const getPasteImage = (imagePath: string): Promise<string[]> => {
    return new Promise((resolve, reject) => {
        if (!imagePath) { return; }

        let platform = process.platform;
        if (platform === 'win32') {
            // Windows
            const scriptPath = path.join(__dirname, '..', 'asserts/pc.ps1');
            console.log(scriptPath, __dirname);

            let command = "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe";
            let powershellExisted = fs.existsSync(command);
            let output = '';
            if (!powershellExisted) {
                command = "powershell";
            }

            const powershell = spawn(command, [
                '-noprofile',
                '-noninteractive',
                '-nologo',
                '-sta',
                '-executionpolicy', 'unrestricted',
                '-windowstyle', 'hidden',
                '-file', scriptPath,
                imagePath
            ]);
            // the powershell can't auto exit in windows 7 .
            let timer = setTimeout(() => powershell.kill(), 2000);

            powershell.on('error', (e: any) => {
                if (e.code === 'ENOENT') {
                    vscode.window.showErrorMessage('Powershell 不在你的 PATH 环境变量中。请添加把他加进去之后重试。');
                } else {
                    vscode.window.showErrorMessage(e);
                }
            });

            powershell.on('exit', function (code, signal) {
                // console.debug('exit', code, signal);
            });
            powershell.stdout.on('data', (data) => {
                data.toString().split('\n').forEach((d: string | string[]) => output += (d.indexOf('Active code page:') < 0 ? d + '\n' : ''));
                clearTimeout(timer);
                timer = setTimeout(() => powershell.kill(), 2000);
            });
            powershell.on('close', (code) => {
                resolve(output.trim().split('\n').map(i => i.trim()));
            });
        }
        else if (platform === 'darwin') {
            // Mac
            let scriptPath = path.join(__dirname, '..', 'asserts/mac.applescript');

            let ascript = spawn('osascript', [scriptPath, imagePath]);
            ascript.on('error', (e: any) => {
                vscode.window.showErrorMessage(e);
            });
            ascript.on('exit', (code, signal) => {
                // console.debug('exit', code, signal);
            });
            ascript.stdout.on('data', (data) => {
                resolve(data.toString().trim().split('\n'));
            });
        } else {
            // Linux 

            let scriptPath = path.join(__dirname, '..', 'asserts/linux.sh');

            let ascript = spawn('sh', [scriptPath, imagePath]);
            ascript.on('error', (e: any) => {
                vscode.window.showErrorMessage(e);
            });
            ascript.on('exit', (code, signal) => {
                // console.debug('exit',code,signal);
            });
            ascript.stdout.on('data', (data) => {
                let result = data.toString().trim();
                if (result === "no xclip") {
                    vscode.window.showInformationMessage('您需要先安装 xclip 命令。');
                    return;
                }
                let match = decodeURI(result).trim().match(/((\/[^\/]+)+\/[^\/]*?\.(jpg|jpeg|gif|bmp|png))/g);
                resolve(match || []);
            });
        }
    });
};

// 获取临时文件地址
export const getTmpFolder = () => {
    let savePath = path.join(tmpdir(), pak.name);
    if (!fs.existsSync(savePath)) { fs.mkdirSync(savePath); }
    return savePath;
};