import * as vscode from 'vscode';
import { storage } from '../cloud';
import { fileTree, fileTreeView } from '../tree';
import path = require('path');
import { FileTreeItem } from '../tree/files';
import { TreeModel } from '../models';
import { getPasteImage, getTmpFolder } from '../utils';

/**
 * 获取树 当前选中项的 路径
 * @param isParent 是否获取父级路径
 * @returns 
 */
export const getTreeSelectionPathOrParentPath = ({ fileTreeItem, isParent = true }: {
    fileTreeItem?: FileTreeItem
    isParent?: Boolean
} = {}) => {
    if (!fileTreeItem && fileTreeView.selection.length > 0) {
        fileTreeItem = fileTreeView.selection[0];
    }
    if (fileTreeItem) {
        let path = fileTreeItem.element.Key;
        if (isParent) {
            let parentPath = path.substr(0, path.lastIndexOf('/'));
            if (parentPath !== '') {
                return parentPath + '/';
            }
        } else {
            return path;
        }
    }
    return '';
};

// 创建文件夹
export const createDirectory = async (fileTreeItem: FileTreeItem | undefined) => {
    let directoryName = await vscode.window.showInputBox({
        prompt: '请输入文件夹名',
        placeHolder: "请输入文件夹名",
        validateInput(value) {
            if (!/^[A-Za-z][a-zA-Z0-9]*$/.test(value)) {
                return '文件夹名由英文字母组成';
            }
        }
    });
    if (directoryName) {
        let cloudPath = getTreeSelectionPathOrParentPath({ fileTreeItem }) + directoryName;
        storage.createCloudDirectroy(cloudPath).then(res => {
            fileTree.refresh();
        });
    }
};

// 上传文件
export const uploadFile = async (fileTreeItem: FileTreeItem | undefined) => {
    let uri = await vscode.window.showOpenDialog({
        canSelectMany: true,
        title: "选择上传文件",
        openLabel: "上传文件"
    });
    if (uri) {
        let files = uri.map(item => {
            let fileName = path.basename(item.path);
            return {
                localPath: item.path,
                cloudPath: getTreeSelectionPathOrParentPath({ fileTreeItem }) + fileName,
            };
        });
        storage.uploadFiles({
            files,
            /* onProgress(progressData) {
                console.log(progressData);
            }, */
            onFileFinish(error: Error, res: any, fileData: any) {
                if (error) { return vscode.window.showErrorMessage(error.stack); }
                if (res.statusCode === 200) {
                    let fileName = path.basename(fileData.FilePath);
                    vscode.window.showInformationMessage('文件 ' + fileName + ' 上传成功');;
                }
            }
        }).then(res => {
            fileTree.refresh();
        });
    }
};

// 上传文件夹
export const uploadDirectory = async (fileTreeItem: FileTreeItem) => {
    let uri = await vscode.window.showOpenDialog({
        canSelectFiles: false,
        canSelectFolders: true,
        title: "选择上传文件夹",
        openLabel: "上传文件夹"
    });
    if (uri) {
        let dirPath = uri[0].path;
        let dirName = dirPath.substr(dirPath.lastIndexOf(path.sep) + 1, dirPath.length);
        storage.createCloudDirectroy(getTreeSelectionPathOrParentPath() + dirName).then(() => {
            storage.uploadDirectory({
                localPath: dirPath,
                cloudPath: getTreeSelectionPathOrParentPath() + dirName,
                onFileFinish(error: Error, res: any, fileData: any) {
                    if (error) { return vscode.window.showErrorMessage(error.stack); }
                    if (res.statusCode === 200) {
                        let fileName = path.basename(fileData.FilePath);
                        vscode.window.showInformationMessage('文件 ' + fileName + ' 上传成功');;
                    }
                }
            }).then(() => fileTree.refresh());
        });
    }
};

// 删除文件
export const deleteFile = async (item: FileTreeItem) => {
    storage.deleteFile([item.element.Key]).then(res => {
        fileTree.refresh();
    });
};

// 删除文件夹
export const deleteDirectory = async (item: FileTreeItem) => {
    storage.deleteDirectory(item.element.Key).then(res => {
        fileTree.refresh();
    });
};

// 复制连接
export const copyFileLink = async (item: FileTreeItem) => {
    // storage.getUploadMetadata(item.element.Key).then(console.log);
    storage.getTemporaryUrl([item.element.Key]).then(res => {
        vscode.env.clipboard.writeText(res[0].url).then(() => {
            vscode.window.showInformationMessage('连接已复制');
        });
    });
};

// 预览图片
export const previewView = async (item: TreeModel) => {
    let res = await storage.getTemporaryUrl([item.Key]);
    let uri = vscode.Uri.parse(res[0].url);
    try {
        vscode.commands.executeCommand("vscode.open", uri, {
            preview: false,
        });
    } catch (error) {
    }
};

// 粘贴图片
export const pasteImage = async () => {
    getPasteImage(path.join(getTmpFolder(), `pic_${new Date().getTime()}.png`)).then(res => {
        let imgs = res.filter(img => ['.jpg', '.jpeg', '.gif', '.bmp', '.png', '.webp', '.svg'].find(ext => img.endsWith(ext)));
        if (imgs.length > 0) {

            let bool = vscode.workspace.getConfiguration().get('cloud.storage.pasteImage');
            if (bool) { 
               
            }
            let files = imgs.map(item => {
                let fileName = path.basename(item);
                return {
                    localPath: item,
                    cloudPath: fileName,
                };
            });

            storage.uploadFiles({
                files,
                onFileFinish(error: Error, res: any, fileData: any) {
                    if (error) { return vscode.window.showErrorMessage(error.stack); }
                    if (res.statusCode === 200) {
                        let fileName = path.basename(fileData.FilePath);
                        vscode.window.showInformationMessage('文件 ' + fileName + ' 上传成功');;
                    }
                }
            }).then(() => {
                fileTree.refresh();
            });
        }
    });
};