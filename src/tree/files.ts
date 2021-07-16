import * as vscode from "vscode";
import { IListFileInfo } from "@cloudbase/manager-node/types/interfaces";
import { getListDirectoryFiles } from '../api';
import { TreeModel } from "../models";

export class FileTreeItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public command?: vscode.Command,
        public element?: any
    ) {
        super(label, collapsibleState);
    }
}

export class FileTree implements vscode.TreeDataProvider<FileTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<FileTreeItem | undefined | void> = new vscode.EventEmitter<FileTreeItem | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<FileTreeItem | undefined | void> = this._onDidChangeTreeData.event;

    public isLoading = false;
    private data: TreeModel[] = [];

    constructor() {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }

    getTreeItem(element: FileTreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }

    async getChildren(element?: FileTreeItem): Promise<FileTreeItem[]> {
        if (element) {
            return element.element.children.map((item: TreeModel) => this.createTreeItem(item));
        } else {
            let files = await getListDirectoryFiles() as TreeModel[];
            this.data = this.arrayToTree(files);
            return this.data.map((item: TreeModel): FileTreeItem => this.createTreeItem(item));
        }
    }

    createTreeItem(item: TreeModel): FileTreeItem {
        let treeItem = new FileTreeItem(
            item.name,
            item.Size === '0' ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None,
        );
        treeItem.element = item;
        treeItem.iconPath = item.Size === '0' ? new vscode.ThemeIcon('folder') : new vscode.ThemeIcon('file');
        return treeItem;
    }

    arrayToTree(data: TreeModel[]) {
        const result = [];
        const itemMap: any = {};
        for (const item of data) {
            let keys = item.Key.split('/').filter((item: string) => item !== '');
            item.name = keys.pop() || '';
            item.pid = keys.join('');
            item.id = item.Key.replace(/\//g, '');
            itemMap[item.id] = {
                ...item,
                children: []
            };
        }
        for (const item of data) {
            const id = item.id;
            const pid = item.pid;
            const treeItem = itemMap[id];
            if (pid === '') {
                result.push(treeItem);
            } else {
                if (!itemMap[pid]) {
                    itemMap[pid] = {
                        children: [],
                    };
                }
                itemMap[pid].children.push(treeItem);
            }
        }
        return result;
    }

}

