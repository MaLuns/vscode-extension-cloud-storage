
import vscode = require('vscode');
import { FileTree } from './files';

export const fileTree = new FileTree();

vscode.window.createTreeView('cloud.storage.list', { treeDataProvider: fileTree });

