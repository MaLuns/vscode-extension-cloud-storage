import * as vscode from "vscode";
import { storage } from '../cloud';
import { TreeModel } from "../models";

export class FileTreeItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public command?: vscode.Command,
        public element?: TreeModel
    ) {
        super(label, collapsibleState);
    }
}

export class FileTree implements vscode.TreeDataProvider<FileTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<FileTreeItem | undefined | void> = new vscode.EventEmitter<FileTreeItem | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<FileTreeItem | undefined | void> = this._onDidChangeTreeData.event;

    private data: TreeModel[] = [];
    public folder: string[] = [];

    constructor() {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }

    refresh() {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: FileTreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }

    async getChildren(element?: FileTreeItem): Promise<FileTreeItem[]> {
        if (element) {
            return element.element.children.sort(this._sort)
                .map((item: TreeModel) => this.createTreeItem(item));
        } else {
            let files = await storage.listDirectoryFiles('') as TreeModel[];
            this.folder = files.filter(item => item.Key.endsWith('/')).map(item => item.Key);
            this.data = this.arrayToTree(files);
            return this.data.map((item: TreeModel): FileTreeItem => this.createTreeItem(item));
        }
    }

    createTreeItem(item: TreeModel): FileTreeItem {
        let treeItem = new FileTreeItem(
            item.name,
            item.type === 'folder' ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None
        );
        treeItem.element = item;
        treeItem.contextValue = item.type;
        treeItem.iconPath = new vscode.ThemeIcon(item.type);
        if (item.type === 'file') {
            treeItem.command = {
                command: "cloud.storage.previewView",
                title: "text",
                arguments: [item]
            };
        }
        return treeItem;
    }

    arrayToTree(data: TreeModel[]) {
        const result: TreeModel[] = [];
        const itemMap: any = {};
        for (const item of data) {
            let keys = item.Key.split('/').filter((item: string) => item !== '');
            item.name = keys.pop() || '';
            item.pid = keys.join('');
            item.type = item.Key.endsWith('/') ? 'folder' : 'file';
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
        return result.sort(this._sort);
    }

    _sort(a: TreeModel, b: TreeModel) {
        if (a.type === b.type) {
            return 0;
        } else if (a.type === 'folder') {
            return -1;
        } else {
            return 1;
        }
    }
}

