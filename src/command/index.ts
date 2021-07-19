import * as vscode from 'vscode';
import { createDirectory, uploadFile, deleteFile, deleteDirectory, copyFileLink, previewView, uploadDirectory, pasteImage } from './opt';
import { treeRefresh } from '../tree';

const commands = {
    createDirectory,
    uploadFile,
    deleteFile,
    deleteDirectory,
    copyFileLink,
    previewView,
    uploadDirectory,
    pasteImage,
    treeRefresh
};

export const registered = Object.keys(commands).map((commandName: string) => {
    const callCommand = (...arg: any[]) => commands[commandName](...arg);
    return vscode.commands.registerCommand(
        `cloud.storage.${commandName}`,
        callCommand
    );
});