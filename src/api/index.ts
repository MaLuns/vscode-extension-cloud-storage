import * as vscode from 'vscode';
import cloudBase = require("@cloudbase/manager-node");

const { storage } = new cloudBase({
    secretId: vscode.workspace.getConfiguration().get('cloud.storage.secretId'),
    secretKey: vscode.workspace.getConfiguration().get('cloud.storage.secretKey'),
    envId: vscode.workspace.getConfiguration().get('cloud.storage.envId')
});

export const getListDirectoryFiles = async (path: string = '') => {
    return storage.listDirectoryFiles(path);
};

export const getTemporaryUrl = async (urls: string[]) => {
    return storage.getTemporaryUrl(urls);
};