import vscode = require('vscode');
import { FileTree } from './files';

export const fileTree = new FileTree();
export const fileTreeView = vscode.window.createTreeView('cloud.storage.list', { treeDataProvider: fileTree });
export const treeRefresh = () => fileTree.refresh();