import path = require('path');
import fs = require('fs');
import { commands, env, Uri, window, workspace } from 'vscode';
import { storage } from '../cloud';
import { fileTree, fileTreeView } from '../tree';
import { FileTreeItem } from '../tree/files';
import { TreeModel } from '../models';
import { appendMDLink, getPasteImage, getTmpFolder } from '../utils';

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
    let directoryName = await window.showInputBox({
        prompt: '请输入文件夹名',
        placeHolder: "请输入文件夹名",
        validateInput(value) {
            if (!/^[A-Za-z][a-zA-Z0-9_]*$/.test(value)) {
                return '文件夹名由英文字母组成';
            }
        }
    });
    if (directoryName) {
        let cloudPath = getTreeSelectionPathOrParentPath({ fileTreeItem }) + directoryName;
        await storage.createCloudDirectroy(cloudPath);
        fileTree.refresh();
    }
};

// 上传文件
export const uploadFile = async (fileTreeItem: FileTreeItem | undefined) => {
    let uri = await window.showOpenDialog({
        canSelectMany: true,
        title: "选择上传文件",
        openLabel: "上传文件"
    });
    if (uri) {
        let files = uri.map(item => ({
            localPath: item.fsPath,
            cloudPath: getTreeSelectionPathOrParentPath({ fileTreeItem }) + path.basename(item.fsPath),
        }));

        await storage.uploadFiles({
            files,
            onFileFinish(error: Error, res: any, fileData: any) {
                if (error) { return window.showErrorMessage(error.stack); }
                if (res.statusCode === 200) {
                    let fileName = path.basename(fileData.FilePath);
                    window.showInformationMessage('文件 ' + fileName + ' 上传成功');;
                }
            }
        });
        fileTree.refresh();
    }
};

// 上传文件夹
export const uploadDirectory = async (fileTreeItem: FileTreeItem) => {
    let uri = await window.showOpenDialog({
        canSelectFiles: false,
        canSelectFolders: true,
        title: "选择上传文件夹",
        openLabel: "上传文件夹"
    });
    if (uri) {
        let localPath = uri[0].fsPath;
        let cloudPath = getTreeSelectionPathOrParentPath({ fileTreeItem }) + localPath.substr(localPath.lastIndexOf(path.sep) + 1, localPath.length);

        storage.createCloudDirectroy(cloudPath).then(() => {
            storage.uploadDirectory({
                localPath,
                cloudPath,
                onFileFinish(error: Error, res: any, fileData: any) {
                    if (error) { return window.showErrorMessage(error.stack); }
                    if (res.statusCode === 200) {
                        let fileName = path.basename(fileData.FilePath);
                        window.showInformationMessage('文件 ' + fileName + ' 上传成功');;
                    }
                }
            }).then(() => fileTree.refresh());
        });
    }
};

// 删除文件
export const deleteFile = async (item: FileTreeItem) => {
    await storage.deleteFile([item.element.Key]);
    fileTree.refresh();
};

// 删除文件夹
export const deleteDirectory = async (item: FileTreeItem) => {
    await storage.deleteDirectory(item.element.Key);
    fileTree.refresh();
};

// 复制连接
export const copyFileLink = async (item: FileTreeItem) => {
    storage.getTemporaryUrl([item.element.Key]).then(res => {
        env.clipboard.writeText(res[0].url).then(() => {
            window.showInformationMessage('外链已复制');
        });
    });
};

// 预览图片
export const previewView = async (item: TreeModel) => {
    let res = await storage.getTemporaryUrl([item.Key]);
    let uri = Uri.parse(res[0].url);
    try {
        commands.executeCommand("vscode.open", uri, {
            preview: false,
        });
    } catch (error) {
    }
};

// 获取剪贴板图片信息
export const pasteImage = async (fileTreeItem: FileTreeItem) => {
    let tmpPath = getTmpFolder();
    let res = await getPasteImage(path.join(tmpPath, `pic_${new Date().getTime()}.png`));
    let imgs = res.filter(img => ['.jpg', '.jpeg', '.gif', '.bmp', '.png', '.webp', '.svg'].find(ext => img.endsWith(ext)));

    if (imgs.length > 0) {
        let bool = workspace.getConfiguration().get('cloud.storage.pasteImage');
        let cloudPath = '';
        if (fileTreeItem) {
            cloudPath = getTreeSelectionPathOrParentPath({ fileTreeItem });
        } else if (bool && fileTree.folder.length) {
            cloudPath = await window.showQuickPick(['', ...fileTree.folder]) || '';
        }

        // 上传
        await storage.uploadFiles({
            files: imgs.map(item => ({ localPath: item, cloudPath: cloudPath + path.basename(item) })),
            onFileFinish(error: Error, res: any, fileData: any) {
                if (error) { return window.showErrorMessage(error.stack); }
                if (res.statusCode === 200) {
                    let fileName = path.basename(fileData.FilePath);
                    window.showInformationMessage('文件 ' + fileName + ' 上传成功');
                    storage.getTemporaryUrl([fileData.Key]).then(res => {
                        appendMDLink(res[0].url);
                    });
                }
            }
        });

        // 清除临时文件
        if (imgs[0].indexOf(tmpPath) > -1) {
            fs.rmdir(tmpPath, { recursive: true }, (err) => {
                console.log(err);
            });
        }
        fileTree.refresh();
    } else {
        window.showWarningMessage('未找到剪贴板文件');
    }
};